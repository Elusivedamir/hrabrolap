"""Two-stop local shuttle and nonqueued command screening for v0.7h."""
from dataclasses import dataclass, replace
import json
from math import cos, isfinite, pi, radians
from pathlib import Path

HERE = Path(__file__).resolve().parent
PITCH_MM = 1.5
TOTAL_MM = 12.0
SEAT_MM = 2.2
WITHDRAW_MM = 2.4
TAB_GAP_MM = 2.45
TONGUE_X_MM = 0.8
SLOT_X_MM = 0.98
TONGUE_Y_MM = 3.2
RACK_THICK_MM = 2.8
STOP_ALLOWANCE_MM = 0.10
TOLERANCE_MM = 0.10


def detent(position):
    return abs(position/PITCH_MM-round(position/PITCH_MM)) < 1e-9


def pair_overlap_screen(seat_mm, tab_gap_mm):
    """When a+b<=gap, at least one rectangular tongue overlaps the rack by this much."""
    return max(0.0, seat_mm-tab_gap_mm/2)


def clearance_budget():
    return SLOT_X_MM-TONGUE_X_MM+STOP_ALLOWANCE_MM


@dataclass(frozen=True)
class LocalStop:
    """At most one outstanding stroke, blocked at its end by a captive shuttle."""

    position_mm: float = 0.0
    origin_mm: float | None = None
    held_input: bool = False

    def pulse_on(self, available_mm):
        if not isfinite(available_mm) or not 0 <= available_mm <= TOTAL_MM:
            raise ValueError("Available travel is outside the physical range")
        if self.held_input:
            return self
        if self.origin_mm is not None or self.position_mm >= TOTAL_MM:
            return replace(self, held_input=True)
        if available_mm+1e-9 < self.position_mm+PITCH_MM:
            return replace(self, held_input=True)
        return replace(self, origin_mm=self.position_mm, held_input=True)

    def advance(self, available_mm, jam_mm=None, opening_force=True):
        if not isfinite(available_mm) or not 0 <= available_mm <= TOTAL_MM:
            raise ValueError("Available travel is outside the physical range")
        if jam_mm is not None and (not isfinite(jam_mm) or not self.position_mm <= jam_mm <= TOTAL_MM):
            raise ValueError("Jam stop must be at or beyond the current position")
        if self.origin_mm is None or not opening_force:
            return self
        end = self.origin_mm+PITCH_MM
        if jam_mm is not None:
            end = min(end, jam_mm)
        new = max(self.position_mm, min(end, available_mm))
        origin = None if not self.held_input and detent(new) else self.origin_mm
        return replace(self, position_mm=new, origin_mm=origin)

    def pulse_off(self):
        origin = None if detent(self.position_mm) else self.origin_mm
        return replace(self, origin_mm=origin, held_input=False)


def command(state, available_mm, jam_mm=None):
    return state.pulse_on(available_mm).advance(available_mm, jam_mm=jam_mm).pulse_off()


def stress(force_N, overlap_mm):
    # Ideal uniform face pressure. Tooth ligament with two parallel shear paths
    # is a very simple screen; actual edge loading and material are unresolved.
    ligament = PITCH_MM-SLOT_X_MM
    return {"load_N":force_N,
            "nominal_face_pressure_MPa":force_N/(TONGUE_Y_MM*overlap_mm),
            "nominal_single_tooth_two_path_shear_MPa":force_N/(2*ligament*RACK_THICK_MM)}


def evaluate():
    case_end = command(LocalStop(3.0),12,jam_mm=3.0)
    case_middle = command(LocalStop(3.0),12,jam_mm=3.7)
    for _ in range(20):
        case_end = command(case_end,12,jam_mm=3.0)
        case_middle = command(case_middle,12,jam_mm=3.7)
    aligned = case_end.advance(12)
    between = case_middle.advance(12)
    # Reuse v0.7g's kinematics at the 12 terminal index positions; issuing
    # the pulse only after enough travel is present is a control assumption.
    table = []
    state = LocalStop()
    for i in range(13):
        yoke = 6*(1-cos(i*pi/12))
        state = command(state,yoke)
        table.append({"central_index":i,"central_mm":yoke,"local_mm":state.position_mm})
    nominal_min = pair_overlap_screen(SEAT_MM,TAB_GAP_MM)
    adverse_min = pair_overlap_screen(SEAT_MM-TOLERANCE_MM,TAB_GAP_MM+TOLERANCE_MM)
    gate_force = 10*9.80665*.040/(.012*cos(radians(30)))
    return {"status":"BENCH_CAD_AND_QUASISTATIC_SCREEN",
            "pitch_mm":PITCH_MM, "max_nominal_one_stroke_mm":PITCH_MM,
            "conditional_one_stroke_with_play_mm":PITCH_MM+clearance_budget(),
            "nominal_simultaneous_minimum_overlap_mm":nominal_min,
            "conditional_adverse_minimum_overlap_mm":adverse_min,
            "load_screen_at_adverse_overlap":{"bench_one_MCP":stress(.1/(.012*cos(radians(30))),adverse_min),
                                              "10kg_one_finger":stress(gate_force,adverse_min),
                                              "10kg_one_finger_x2":stress(2*gate_force,adverse_min)},
            "aligned_jam_3mm":{"after_clearing_mm":aligned.position_mm,"uncommanded_nominal_mm":aligned.position_mm-3.0},
            "between_jam_3_7mm":{"after_clearing_mm":between.position_mm,"uncommanded_nominal_mm":between.position_mm-3.7,
                                  "with_play_mm":between.position_mm-3.7+clearance_budget()},
            "first_fresh_pulse_after_settling_mm":command(between,12).position_mm,
            "common_nominal_schedule":table}


if __name__=="__main__":
    (HERE/"local_results.json").write_text(json.dumps(evaluate(),indent=2)+"\n")
