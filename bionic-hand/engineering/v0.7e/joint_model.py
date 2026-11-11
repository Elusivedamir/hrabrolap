"""v0.7e distal release: a captive tangential gate with a jammed drive sector."""
from dataclasses import dataclass
from math import asin, cos, degrees, pi, radians, sin
from pathlib import Path
import json

HERE = Path(__file__).resolve().parent


@dataclass(frozen=True)
class Geometry:
    radius_mm: float = 12.0
    maximum_deg: float = 60.0
    follower_diameter_mm: float = 4.0
    screw_diameter_mm: float = 4.0
    pitch_mm: float = 0.7
    brake_min_Nm: float = 0.020
    brake_max_Nm: float = 0.035


DESIGN = Geometry()


def follower(delta_deg, design=DESIGN):
    if not 0 <= delta_deg <= design.maximum_deg:
        raise ValueError("Relative angle is outside the studied interval")
    phi = radians(delta_deg - design.maximum_deg / 2)
    return design.radius_mm * sin(phi), design.radius_mm * cos(phi)


def stroke(delta_deg, design=DESIGN):
    return follower(delta_deg, design)[0] - follower(0, design)[0]


def angle_from_stroke(travel_mm, design=DESIGN):
    maximum_mm = stroke(design.maximum_deg, design)
    if not 0 <= travel_mm <= maximum_mm + 1e-9:
        raise ValueError("Gate travel is outside its limit")
    x = follower(0, design)[0] + min(travel_mm, maximum_mm)
    return degrees(asin(x / design.radius_mm)) + design.maximum_deg / 2


def open_with_jam(jammed_deg, turns, design=DESIGN):
    if not 0 <= jammed_deg <= design.maximum_deg or turns < 0:
        raise ValueError("Invalid jam angle or turn count")
    travel = min(turns * design.pitch_mm, stroke(design.maximum_deg, design))
    permitted_deg = angle_from_stroke(travel, design)
    # Ground/hinge stop prevents extension past neutral.
    return max(0.0, jammed_deg - permitted_deg)


def gate_force(moment_Nm, delta_deg, design=DESIGN):
    if moment_Nm < 0:
        raise ValueError("Opening torque must be nonnegative")
    lever_mm = follower(delta_deg, design)[1]
    return moment_Nm * 1000 / lever_mm


def backdrive_Nm(force_N, design=DESIGN):
    return force_N * design.pitch_mm / (2000 * pi)


def stress_screen(force_N, design=DESIGN):
    # Side-loaded follower modeled as a cantilever in the finger plate.
    # Unsupported length and contact patch require physical verification.
    diameter = design.follower_diameter_mm
    assumed_load_offset_mm = 2.5
    bending = 32 * force_N * assumed_load_offset_mm / (pi * diameter**3)
    shear = force_N / (pi * diameter**2 / 4)
    return {"pin_nominal_bending_MPa": bending, "pin_average_shear_MPa": shear,
            "assumed_pin_load_offset_mm": assumed_load_offset_mm}


def analyze(design=DESIGN):
    equal_moment = (10 * 9.80665 / 4) * 0.040
    scenarios = {"bench_screen_only": 0.10, "equal_10kg_one_finger": equal_moment,
                 "full_10kg_one_finger": 4 * equal_moment, "full_10kg_one_finger_x2": 8 * equal_moment}
    results = {}
    for name, torque in scenarios.items():
        force = max(gate_force(torque, a, design) for a in (0, design.maximum_deg))
        bd = backdrive_Nm(force, design)
        results[name] = {"assumed_mcp_moment_Nm": torque, "max_ideal_gate_force_N": force,
                         "frictionless_backdrive_Nm": bd,
                         "margin_if_brake_min_measured_Nm": design.brake_min_Nm - bd,
                         "pin": stress_screen(force, design)}
    angles = (0, 15, 30, 45, 60)
    jam = [{"frozen_drive_deg": a, "stroke_to_open_mm": stroke(a, design),
            "turns_to_open": stroke(a, design) / design.pitch_mm,
            "final_finger_deg": open_with_jam(a, stroke(a, design) / design.pitch_mm, design)}
           for a in angles]
    sizing = []
    for r in (8, 10, 12, 14):
        alternative = Geometry(radius_mm=r)
        sizing.append({"radius_mm": r, "full_stroke_mm": stroke(60, alternative),
                       "full_10kg_one_finger_force_N": gate_force(equal_moment * 4, 60, alternative)})
    return {"status": "ANALYTICAL_SCREEN_NO_LOAD_RATING", "design": vars(design),
            "jam_is_a_frozen_drive_sector_not_seized_main_pivot": True,
            "candidate_brake_setpoint_is_unmeasured": True,
            "jam_cases": jam, "radius_tradeoff": sizing, "scenarios": results}


if __name__ == "__main__":
    (HERE / "joint_results.json").write_text(json.dumps(analyze(), indent=2) + "\n")
