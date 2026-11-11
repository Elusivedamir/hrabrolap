"""Screen one unloaded finger's candidate bench actuator from measured CSV data."""
import argparse
import csv
from dataclasses import dataclass
import json
from math import isfinite, pi
from pathlib import Path

HERE = Path(__file__).resolve().parent
KGF_CM_TO_NM = 0.0980665
TORQUE_FRACTION = 0.25  # Pololu's general continuous-load rule of thumb
RESERVE_FACTOR = 1.5
NO_LOAD_SPEED_LOW_FACTOR = 0.8
RADIUS_MM = (6.0, 8.0)
TARGET_S = 1.5
V07I_TRAVEL_MM = 21.7613901229636
FIELDS = ("run", "stroke_mm", "peak_force_N", "duration_s")


@dataclass(frozen=True)
class Motor:
    model: str
    no_load_rpm: float
    stall_kgf_cm: float
    idle_A: float = 0.070
    stall_A: float = 0.670

    @property
    def stall_Nm(self):
        return self.stall_kgf_cm * KGF_CM_TO_NM


MOTORS = (Motor("Pololu 5139 (100:1 MP 6V)", 220, .94),
          Motor("Pololu 5141 (150:1 MP 6V)", 150, 1.3))


def positive(value, name, allow_zero=False):
    x = float(value)
    if not isfinite(x) or x < 0 or (not allow_zero and x == 0):
        raise ValueError(f"Invalid {name}: {value!r}")
    return x


def screen(stroke_mm, force_N, target_s=TARGET_S):
    stroke = positive(stroke_mm, "stroke")
    force = positive(force_N, "peak force", allow_zero=True)
    duration = positive(target_s, "target duration")
    rows = []
    for radius in RADIUS_MM:
        average_rpm = 60 * stroke / (duration * 2*pi*radius)
        design_torque = force * (radius/1000) * RESERVE_FACTOR
        for motor in MOTORS:
            fraction = design_torque/motor.stall_Nm
            conservative_rpm = motor.no_load_rpm*NO_LOAD_SPEED_LOW_FACTOR*max(0.0, 1-fraction)
            torque_ok = fraction <= TORQUE_FRACTION
            speed_ok = conservative_rpm >= 2*average_rpm
            rows.append({
                "radius_mm":radius, "motor":motor.model,
                "mean_rpm":average_rpm, "peak_rpm_triangle_profile":2*average_rpm,
                "torque_with_reserve_Nm":design_torque,
                "torque_screen_limit_Nm":motor.stall_Nm*TORQUE_FRACTION,
                "max_force_under_torque_rule_N":motor.stall_Nm*TORQUE_FRACTION/(radius/1000*RESERVE_FACTOR),
                "conservative_linear_full_voltage_rpm":conservative_rpm,
                "linear_current_at_screen_torque_A":(
                    motor.idle_A+(motor.stall_A-motor.idle_A)*fraction if fraction<=1 else None),
                "torque_screen":torque_ok, "speed_screen":speed_ok, "conditional_pass":torque_ok and speed_ok,
            })
    return rows


def read_trials(path):
    with path.open(newline="", encoding="utf-8-sig") as source:
        reader = csv.DictReader(source)
        if tuple(reader.fieldnames or ()) != FIELDS:
            raise ValueError("Expected columns: " + ", ".join(FIELDS))
        runs = []
        labels = set()
        for row in reader:
            if None in row:
                raise ValueError(f"Line {reader.line_num}: unexpected CSV column")
            values = [row[name].strip() if row[name] is not None else "" for name in FIELDS]
            if not any(values[1:]):
                continue
            if not all(values):
                raise ValueError(f"Line {reader.line_num}: fill every value for a used trial")
            if values[0] in labels:
                raise ValueError(f"Line {reader.line_num}: duplicate run")
            labels.add(values[0])
            runs.append({"run":values[0],
                         "stroke_mm":positive(values[1], "stroke"),
                         "peak_force_N":positive(values[2], "peak force", allow_zero=True),
                         "duration_s":positive(values[3], "duration")})
    if len(runs) < 3:
        raise ValueError("Record at least three completed trials on the same configuration")
    return runs


def analyze_trials(path):
    runs = read_trials(path)
    stroke = max(r["stroke_mm"] for r in runs)
    force = max(r["peak_force_N"] for r in runs)
    return {"status":"USER_INPUT_SCREEN_NOT_HARDWARE_VALIDATION", "runs":runs,
            "max_stroke_mm":stroke, "max_peak_force_N":force,
            "max_stroke_spread_mm":stroke-min(r["stroke_mm"] for r in runs),
            "trial_duration_range_s":[min(r["duration_s"] for r in runs),max(r["duration_s"] for r in runs)],
            "runs_at_or_faster_than_target":sum(r["duration_s"]<=TARGET_S for r in runs),
            "target_duration_s":TARGET_S, "candidates":screen(stroke, force)}


def example():
    return {"status":"SIMULATED_FORCE_ONLY_NO_PHYSICAL_MEASUREMENTS",
            "cad_stroke_mm":V07I_TRAVEL_MM, "target_duration_s":TARGET_S,
            "cases":[{"hypothetical_force_N":f,"candidates":screen(V07I_TRAVEL_MM, f)}
                     for f in (1.0,2.0,3.0,4.0)]}


if __name__ == "__main__":
    p=argparse.ArgumentParser()
    source=p.add_mutually_exclusive_group(required=True)
    source.add_argument("--measurements",type=Path)
    source.add_argument("--example",action="store_true")
    p.add_argument("--output",type=Path)
    args=p.parse_args()
    try:
        data=example() if args.example else analyze_trials(args.measurements)
    except (OSError,ValueError) as exc:
        p.exit(2,f"{exc}\n")
    result=json.dumps(data,indent=2)+"\n"
    if args.output:
        args.output.write_text(result)
    else:
        print(result,end="")
