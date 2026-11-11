"""Bench architecture: indexed common yoke and independent retained tethers."""
from dataclasses import dataclass
from math import asin, cos, pi, radians, sin
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
STEP_DEG = 15
CRANK_R_MM = 6
HANDLE_R_MM = 55
STOP_R_MM = 40
STOP_RADIAL_CLEARANCE_MM = 0.15
PARK_R_MM = 18
DRIVE_R_MM = 22.5
PIN_DIAMETER_MM = 3
DISK_THICK_MM = 4
STEPS = 180 // STEP_DEG


def payout(angle_deg):
    if not 0 <= angle_deg <= 180:
        raise ValueError("Rotor angle outside the monotonic 180 degree range")
    return CRANK_R_MM * (1 - cos(radians(angle_deg)))


def on_detent(angle_deg):
    return abs(angle_deg / STEP_DEG - round(angle_deg / STEP_DEG)) < 1e-9


@dataclass(frozen=True)
class Transfer:
    index: int = 0
    swing_deg: float = 0.0
    park: bool = True
    drive: bool = False

    @property
    def rotor_deg(self):
        return self.index * STEP_DEG + (self.swing_deg if self.drive else 0.0)

    def valid(self):
        if not 0 <= self.swing_deg <= STEP_DEG or not 0 <= self.rotor_deg <= 180:
            return False
        return (self.park or self.drive) and (not self.park or on_detent(self.rotor_deg))

    def latch_drive(self):
        if not self.park or self.drive or self.swing_deg or self.index >= STEPS:
            raise ValueError("The drive pin seats only at reset with the park pin seated")
        return Transfer(self.index, 0, True, True)

    def unlatch_park(self):
        if not self.park or not self.drive:
            raise ValueError("The drive pin must carry the rotor before park withdrawal")
        return Transfer(self.index, self.swing_deg, False, True)

    def swing(self, angle_deg):
        if self.park or not self.drive or not 0 <= angle_deg <= STEP_DEG:
            raise ValueError("Hard-limited motion requires the drive pin and an open park pin")
        return Transfer(self.index, angle_deg, False, True)

    def latch_park(self):
        if not self.drive or self.park or not on_detent(self.rotor_deg):
            raise ValueError("Parking requires alignment with a physical index")
        return Transfer(self.index, self.swing_deg, True, True)

    def unlatch_drive(self):
        if not self.park or not self.drive:
            raise ValueError("Drive pin remains captive until park has fully seated")
        return Transfer(round(self.rotor_deg / STEP_DEG), self.swing_deg, True, False)

    def reset(self):
        if not self.park or self.drive:
            raise ValueError("Lever reset requires the park pin to hold the rotor")
        return Transfer(self.index)


@dataclass(frozen=True)
class Channel:
    jam_at_mm: float | None = None
    lost_tethers: int = 0
    backup_lash_mm: float = 0.0
    opening_bias: bool = True

    def travel_mm(self, commanded_mm):
        if not 0 <= commanded_mm <= 12 or self.lost_tethers not in (0, 1, 2):
            raise ValueError("Invalid commanded travel or tether count")
        if not 0 <= self.backup_lash_mm <= 12 or (self.jam_at_mm is not None and not 0 <= self.jam_at_mm <= 12):
            raise ValueError("Invalid jam or backlash travel")
        if not self.opening_bias:
            return 0.0
        free = 12.0 if self.lost_tethers == 2 else commanded_mm
        if self.lost_tethers == 1:
            free = min(12.0, free + self.backup_lash_mm)
        return free if self.jam_at_mm is None else min(free, self.jam_at_mm)


def max_step_mm(stop_clearance=False):
    extra = 2 * asin(STOP_RADIAL_CLEARANCE_MM / (2 * STOP_R_MM)) * 180 / pi if stop_clearance else 0.0
    return max(payout(min(180, (i+1)*STEP_DEG+extra))-payout(max(0, i*STEP_DEG-extra))
               for i in range(STEPS))


def load_screen(total_force_N):
    shaft_torque_Nm = total_force_N * CRANK_R_MM / 1000
    pin_force_N = shaft_torque_Nm / (PARK_R_MM / 1000)
    return {"total_gate_N": total_force_N, "max_shaft_Nm": shaft_torque_Nm,
            "max_ideal_handle_N": shaft_torque_Nm / (HANDLE_R_MM / 1000),
            "park_pin_force_N": pin_force_N,
            "park_pin_average_single_shear_MPa": pin_force_N / (pi*PIN_DIAMETER_MM**2/4),
            "park_hole_nominal_bearing_MPa": pin_force_N/(PIN_DIAMETER_MM*DISK_THICK_MM),
            "step_work_J_bound_geometric": total_force_N*max_step_mm(True)/1000,
            "full_stroke_work_J": total_force_N*payout(180)/1000}


def report():
    gates_10kg_N = 10 * 9.80665 * 0.040 / (0.012 * cos(radians(30)))
    jam_set = [Channel(jam_at_mm=3.0), Channel(), Channel(), Channel()]
    jam_travel = [channel.travel_mm(12) for channel in jam_set]
    return {
        "status": "BENCH_CONCEPT_NO_HARDWARE_QUALIFICATION",
        "payout_mm": [payout(i*STEP_DEG) for i in range(STEPS+1)],
        "lever_step_deg": STEP_DEG, "step_count": STEPS, "handle_radius_mm": HANDLE_R_MM,
        "nominal_max_one_step_mm": max_step_mm(),
        "stop_clearance_only_max_one_step_mm": max_step_mm(True),
        "loads": {"bench_reference": load_screen(4 * 0.1/(0.012*cos(radians(30)))),
                  "10kg_combined_or_one_finger": load_screen(gates_10kg_N),
                  "10kg_combined_x2": load_screen(2*gates_10kg_N)},
        "one_jam_at_3mm_gate_travel": jam_travel,
        "if_jam_clears_after_full_command_local_uncontrolled_mm": 12 - jam_travel[0],
        "if_jam_clears_constant_force_upper_scenario_J": gates_10kg_N * (12-jam_travel[0])/1000,
        "if_one_of_two_tethers_fails_at_rest_with_0_3mm_lash_mm":
            Channel(lost_tethers=1, backup_lash_mm=0.3).travel_mm(0),
        "if_both_tethers_fail_at_rest_mm": Channel(lost_tethers=2).travel_mm(0),
        "assumptions": ["controlled rotor and parking state transitions are ideal",
                        "outputs are tension-only and open with a return spring or applied torque",
                        "one live tether is assumed able to hold all load in its lane",
                        "mechanical interlock, dynamic damping and protected routing require hardware"],
    }


if __name__ == "__main__":
    (HERE / "common_results.json").write_text(json.dumps(report(), indent=2) + "\n")
