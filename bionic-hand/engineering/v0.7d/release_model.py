"""v0.7d bench concept: idealized power screw, load and guide sensitivity."""
from dataclasses import dataclass
from itertools import product
import json
import math
from pathlib import Path

HERE = Path(__file__).resolve().parent


@dataclass(frozen=True)
class Design:
    stroke_mm: float = 8.0
    pitch_mm: float = 1.0
    screw_diameter_mm: float = 6.0
    thread_half_angle_deg: float = 30.0
    collar_radius_mm: float = 4.8
    handle_radius_mm: float = 19.0
    pin_radius_mm: float = 12.0
    pin_diameter_mm: float = 4.0
    plate_thickness_mm: float = 4.0
    index_positions: int = 6
    cable_offset_mm: float = 12.0
    guide_spacing_mm: float = 22.0
    guide_side_clearance_mm: float = 0.4
    brake_radius_mm: float = 17.0
    brake_target_min_Nm: float = 0.035
    brake_target_max_Nm: float = 0.060


DESIGN = Design()


def screw_torque_Nm(force_N, thread_mu, collar_mu, *, payout=True, design=DESIGN):
    """Signed torque in direction of payout (positive requires input).

    Axial cable tension assists payout. The ISO 60° V-thread flank angle is
    accounted for via mu*sec(30°). Flat collar friction is additive. Guide
    friction is deliberately omitted from this drive/holding equation.
    """
    if min(force_N, thread_mu, collar_mu) < 0:
        raise ValueError("Force and friction coefficients must be nonnegative")
    pitch_diameter_mm = design.screw_diameter_mm - 0.649519 * design.pitch_mm
    tangent = design.pitch_mm / (math.pi * pitch_diameter_mm)
    effective_mu = thread_mu / math.cos(math.radians(design.thread_half_angle_deg))
    if payout:
        factor = (effective_mu - tangent) / (1 + effective_mu * tangent)
    else:
        denominator = 1 - effective_mu * tangent
        if denominator <= 0:
            raise ValueError("The idealized rewind model is outside its range")
        factor = (effective_mu + tangent) / denominator
    return force_N * (pitch_diameter_mm / 2 * factor + design.collar_radius_mm * collar_mu) / 1000


def tendon_payout_mm(turns, *, distal_jam=False, design=DESIGN):
    """Ideal geometric upper estimate for an aligned, sliding cable."""
    commanded = max(0.0, min(design.stroke_mm, design.pitch_mm * turns))
    return 0.0 if distal_jam else commanded


def guide_case(force_N, guide_mu, design=DESIGN):
    offset_Nmm = force_N * design.cable_offset_mm
    normal_each_N = offset_Nmm / design.guide_spacing_mm
    return {
        "yaw_moment_Nm": offset_Nmm / 1000,
        "nominal_normal_each_N": normal_each_N,
        "nominal_drag_N": 2 * guide_mu * normal_each_N,
    }


def brake_case(force_N, design=DESIGN):
    worst_ideal_torque = -screw_torque_Nm(force_N, 0.0, 0.0, design=design)
    return {
        "brake_target_min_Nm": design.brake_target_min_Nm,
        "margin_if_target_min_measured_Nm": design.brake_target_min_Nm - worst_ideal_torque,
        "shoe_normal_N_if_mu_0_2": design.brake_target_min_Nm / (0.2 * design.brake_radius_mm / 1000),
    }


def parking_pin_case(force_N, design=DESIGN):
    ideal_backdrive_Nm = -screw_torque_Nm(force_N, 0.0, 0.0, design=design)
    pin_force_N = ideal_backdrive_Nm / (design.pin_radius_mm / 1000)
    return {
        "frictionless_backdrive_Nm": ideal_backdrive_Nm,
        "ideal_pin_tangent_N": pin_force_N,
        "ideal_single_shear_MPa": pin_force_N / (math.pi * design.pin_diameter_mm**2 / 4),
        "ideal_plate_bearing_MPa": pin_force_N / (design.pin_diameter_mm * design.plate_thickness_mm),
    }


def build_report(design=DESIGN):
    weight_N = 10 * 9.80665
    equal_tendon_N = (weight_N / 4) * 0.040 / (0.0058 * 0.6)
    reference_stroke_mm = 5.8 * math.radians(60)
    minimum_mu = math.cos(math.radians(design.thread_half_angle_deg)) * (
        design.pitch_mm / (math.pi * (design.screw_diameter_mm - 0.649519 * design.pitch_mm))
    )
    force_cases = {
        "guarded_fixture_instrument_range_candidate_only": 50.0,
        "10kg_equal_one_of_four": equal_tendon_N,
        "10kg_one_of_four_x1": equal_tendon_N * 4,
        "10kg_one_of_four_x2": equal_tendon_N * 8,
    }
    cases = {}
    for name, force_N in force_cases.items():
        friction = []
        for thread_mu, collar_mu in product((0.0, 0.03, 0.06, 0.12, 0.25), (0.0, 0.05, 0.15)):
            torque = screw_torque_Nm(force_N, thread_mu, collar_mu, design=design)
            friction.append({
                "thread_mu": thread_mu,
                "collar_mu": collar_mu,
                "payout_torque_Nm": torque,
                "payout_tangential_handle_N_no_brake": torque / (design.handle_radius_mm / 1000),
                "payout_tangential_handle_N_with_max_brake": (torque + design.brake_target_max_Nm) / (design.handle_radius_mm / 1000),
                "can_backdrive_ideal": torque < 0,
            })
        cases[name] = {
            "input_tendon_N": force_N,
            "work_J_if_constant_over_reference_stroke": force_N * reference_stroke_mm / 1000,
            "work_J_if_constant_over_full_stop": force_N * design.stroke_mm / 1000,
            "guide_at_mu_0_25": guide_case(force_N, 0.25, design),
            "pin": parking_pin_case(force_N, design),
            "brake": brake_case(force_N, design),
            "screw_nominal_tension_MPa_at_20_1mm2": force_N / 20.1,
            "payout_friction_sweep": friction,
        }
    return {
        "status": "CALCULATION_ONLY_NO_PHYSICAL_QUALIFICATION",
        "design": vars(design),
        "reference_load_N": weight_N,
        "reference_payout_mm": reference_stroke_mm,
        "extra_geometric_stroke_mm": design.stroke_mm - reference_stroke_mm,
        "full_travel_turns": design.stroke_mm / design.pitch_mm,
        "index_increment_mm_if_catch_engages": design.pitch_mm / design.index_positions,
        "thread_mu_threshold_collar_mu_0": minimum_mu,
        "equal_four_fingers_work_J_if_constant": 4 * equal_tendon_N * reference_stroke_mm / 1000,
        "distal_jam_payout_at_joint_mm": tendon_payout_mm(8, distal_jam=True, design=design),
        "cases": cases,
    }


if __name__ == "__main__":
    report = build_report()
    (HERE / "release_results.json").write_text(json.dumps(report, indent=2) + "\n")
