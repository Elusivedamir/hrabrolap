"""Parametric CadQuery reference of the v0.7d single-channel bench mechanism.

Thread and purchased part geometry are simplified. x increases toward the digit,
y is lateral and z points outward. The distal guide remains fixed. No STL or
STEP export from this model is a qualified load-bearing part.
"""
import argparse
from itertools import combinations
import json
import math
from pathlib import Path

import cadquery as cq

from release_model import DESIGN

HERE = Path(__file__).resolve().parent
SCREW_Y, SCREW_Z, CABLE_Y = -6.0, 14.0, 6.0
PIN_Y, PIN_Z = SCREW_Y, SCREW_Z + DESIGN.pin_radius_mm
COLORS = {
    "frame": "#65788a", "guide": "#70869a", "stop": "#9c5a35",
    "guard": "#6d8797", "carriage": "#218a98", "anchor": "#3b9b7e",
    "screw": "#263c54", "collar": "#8e8379", "nut": "#a6763e",
    "wheel": "#df9942", "pin": "#bb4847", "spring": "#a66caa", "brake": "#646b30",
    "tendon": "#191c28",
}


def box(x0, x1, y0, y1, z0, z1):
    return cq.Solid.makeBox(x1 - x0, y1 - y0, z1 - z0, cq.Vector(x0, y0, z0))


def rod(x0, x1, y, z, radius):
    return cq.Solid.makeCylinder(radius, x1 - x0, cq.Vector(x0, y, z), cq.Vector(1, 0, 0))


def y_rod(y0, y1, x, z, radius):
    return cq.Solid.makeCylinder(radius, y1 - y0, cq.Vector(x, y0, z), cq.Vector(0, 1, 0))


def ring(x0, x1, y, z, inner_r, outer_r):
    return rod(x0, x1, y, z, outer_r).cut(rod(x0 - 1, x1 + 1, y, z, inner_r))


def hexagon(x0, x1, y, z, across_flats):
    radius = across_flats / math.sqrt(3)
    points = [
        cq.Vector(x0, y + radius * math.sin(i * math.tau / 6), z + radius * math.cos(i * math.tau / 6))
        for i in range(6)
    ]
    return cq.Solid.extrudeLinear(cq.Wire.makePolygon(points, close=True), [], cq.Vector(x1 - x0, 0, 0))


def cheek(x0, x1, screw_clearance, cable_clearance):
    return box(x0, x1, -14, 14, 5.4, 22).cut(
        rod(x0 - 1, x1 + 1, SCREW_Y, SCREW_Z, screw_clearance),
        rod(x0 - 1, x1 + 1, CABLE_Y, SCREW_Z, cable_clearance),
    )


def static_parts():
    fixed = {
        "frame_base": box(4, 69, -18, 18, 0, 5),
        "frame_thrust_bridge": box(9, 14, -14.4, 14.4, 5, 23).cut(
            rod(8, 15, SCREW_Y, SCREW_Z, 3.30),
            rod(8, 15, PIN_Y, PIN_Z, 3.30),
        ),
        "frame_tendon_guide": box(64, 69, -14.4, 14.4, 5, 23).cut(
            rod(63, 70, CABLE_Y, SCREW_Z, 1.25)
        ),
        "guard_fixed_cable_cover": box(25, 69, -18, 18, 25.4, 27.9).cut(
            box(24, 29.6, -10.5, -1.5, 25, 28.5)
        ),
        "guard_index_ring": ring(-4, 1, SCREW_Y, SCREW_Z, 17.75, 20.5).cut(
            box(-5, 2, 10, 16, 10.5, 17.5)
        ),
        "guard_pin_guide": ring(2, 9, PIN_Y, PIN_Z, 2.15, 4.1),
        "guard_pin_spring_cap": ring(19, 22, PIN_Y, PIN_Z, 2.15, 4.1),
        "guard_pin_mount": box(1, 22, -10.1, -1.9, 30.1, 32.6),
        "guard_pin_standoff": box(9, 14, -10.1, -1.9, 23, 30.1),
    }
    # Leave the pin and its moving collar free at the center of the standoff.
    fixed["guard_pin_standoff"] = fixed["guard_pin_standoff"].cut(
        rod(8, 15, PIN_Y, PIN_Z, 3.30)
    )
    # Adjustable constant-drag brake independent of the parking pin.
    # The spring is an envelope. Shoe lining, preload and torque are not rated.
    fixed["brake_bracket"] = box(-4.75, 1, 13.6, 25, 10.5, 17.5).cut(
        box(-4.12, 0.12, 13.5, 15.35, 11.7, 16.3),
        y_rod(14.9, 25.1, -2, 14, 2.18),
    )
    fixed["brake_shoe"] = box(-3.95, -0.05, 10.0, 15.3, 11.9, 16.1).cut(
        rod(-5, 1, SCREW_Y, SCREW_Z, 17)
    )
    fixed["brake_spring_envelope"] = y_rod(15.3, 21, -2, 14, 2.0).cut(y_rod(15, 21.5, -2, 14, 1.05))
    fixed["brake_adjuster_proxy"] = y_rod(21, 27, -2, 14, 2.0)
    for side, (outer, lip, pad) in {
        "left": ((-18, -14.4), (-18, -12.5), (-14.4, -10.5)),
        "right": ((14.4, 18), (12.5, 18), (10.5, 14.4)),
    }.items():
        fixed[f"guide_{side}_wall"] = box(14, 64, *outer, 5, 22.4)
        fixed[f"guide_{side}_lip"] = box(14, 64, *lip, 22.4, 25.4)
        fixed[f"stop_{side}_home"] = box(21, 25, *pad, 5.4, 22)
        fixed[f"stop_{side}_payout"] = box(61, 64, *pad, 5.4, 22)
    return fixed


def rotating_parts(angle_deg):
    # Six Ø4.3 holes on Ø24 PCD. The central hex transmits torque to the
    # bolt head. The knob and the head/disc retention hardware are proxies.
    index_wheel = rod(-4, 0, SCREW_Y, SCREW_Z, 17).cut(hexagon(-5, 1, SCREW_Y, SCREW_Z, 10.20))
    for i in range(DESIGN.index_positions):
        angle = i * math.tau / DESIGN.index_positions
        y = SCREW_Y + DESIGN.pin_radius_mm * math.sin(angle)
        z = SCREW_Z + DESIGN.pin_radius_mm * math.cos(angle)
        index_wheel = index_wheel.cut(rod(-5, 1, y, z, 2.15))
    rotating = {
        "screw_shank": rod(0, 60, SCREW_Y, SCREW_Z, 3),
        "screw_hex_head": hexagon(-4, 0, SCREW_Y, SCREW_Z, 10.0),
        "wheel_index": index_wheel,
        "wheel_knob": rod(-10, -4, SCREW_Y, SCREW_Z, DESIGN.handle_radius_mm),
        "collar_proximal_washer": ring(7, 8.9, SCREW_Y, SCREW_Z, 3.2, 6),
        "collar_distal_washer": ring(14.1, 16, SCREW_Y, SCREW_Z, 3.2, 6),
        "collar_proximal_lock": hexagon(2, 7, SCREW_Y, SCREW_Z, 10).cut(rod(1, 8, SCREW_Y, SCREW_Z, 3)),
        "collar_distal_lock": hexagon(16, 21, SCREW_Y, SCREW_Z, 10).cut(rod(15, 22, SCREW_Y, SCREW_Z, 3)),
    }
    axis = (0, SCREW_Y, SCREW_Z)
    end = (1, SCREW_Y, SCREW_Z)
    return {name: solid.rotate(axis, end, angle_deg) for name, solid in rotating.items()}


def carriage_parts(payout_mm):
    translating = {
        "carriage_rear_plate": cheek(25, 30, 3.30, 1.0),
        "carriage_front_plate": cheek(48, 53, 3.30, 2.8),
        "carriage_left_web": box(30, 48, -14, -11.1, 5.4, 22),
        "carriage_right_web": box(30, 48, 11.1, 14, 5.4, 22),
        "nut_captive_coupling": hexagon(30, 48, SCREW_Y, SCREW_Z, 10).cut(
            rod(29, 49, SCREW_Y, SCREW_Z, 3)
        ),
        "carriage_nut_keeper_lower": box(30, 48, -11.1, -0.25, 5.4, 8.15),
        "carriage_nut_keeper_upper": box(30, 48, -11.1, -0.25, 19.85, 22),
        "carriage_nut_keeper_side": box(30, 48, -0.90, -0.25, 8.15, 19.85),
        "anchor_locked_output_proxy": box(30, 48, 0.7, 11.0, 8.5, 19.5),
        "anchor_captive_tendon_eye_proxy": ring(48, 53, CABLE_Y, SCREW_Z, 0.7, 2.65),
    }
    return {name: solid.translate((payout_mm, 0, 0)) for name, solid in translating.items()}


def pin_parts(offset):
    return {
        "pin_shank": rod(-3 + offset, 23 + offset, PIN_Y, PIN_Z, DESIGN.pin_diameter_mm / 2),
        "pin_spring_shoulder": ring(10 + offset, 12 + offset, PIN_Y, PIN_Z, 2.0, 3.1),
        "pin_pull_pad": ring(22 + offset, 25 + offset, PIN_Y, PIN_Z, 2.0, 3.9),
        "spring_travel_envelope": ring(12 + offset, 19, PIN_Y, PIN_Z, 2.15, 3.1),
    }


def pose(payout_mm, engaged=False):
    if not 0.0 <= payout_mm <= DESIGN.stroke_mm:
        raise ValueError("Carriage is outside the 8 mm end-stop range")
    return {
        **static_parts(),
        **rotating_parts(360 * payout_mm / DESIGN.pitch_mm),
        **carriage_parts(payout_mm),
        **pin_parts(0.0 if engaged else 4.0),
        "tendon_axis": rod(53 + payout_mm, 70, CABLE_Y, SCREW_Z, 0.6),
    }


def bbox_overlap(a, b):
    return all(
        min(getattr(a, axis + "max"), getattr(b, axis + "max"))
        - max(getattr(a, axis + "min"), getattr(b, axis + "min")) > 1e-6
        for axis in "xyz"
    )


def audit():
    """Sweep an entire first screw turn, full travel, and every parked detent."""
    free_positions = sorted({round(i / 72, 8) for i in range(73)} | {i / 4 for i in range(33)})
    parked_positions = [i / DESIGN.index_positions for i in range(49)]
    positions = [(p, 4.0) for p in free_positions]
    positions += [(p, 0.0) for p in parked_positions]
    positions += [(p, offset) for p in (0, 1/6, 4, 8) for offset in (0.5, 1, 2, 3, 3.5)]
    errors, tested, exact, states = [], 0, 0, 0
    # Static bodies are cached per run. The OCC engine still checks each
    # candidate intersection against the transformed pose's actual shapes.
    fixed = static_parts()
    for p, pin_offset in positions:
        parts = {
            **fixed,
            **rotating_parts(360 * p / DESIGN.pitch_mm),
            **carriage_parts(p),
            **pin_parts(pin_offset),
            "tendon_axis": rod(53 + p, 70, CABLE_Y, SCREW_Z, 0.6),
        }
        bounds = {name: solid.BoundingBox() for name, solid in parts.items()}
        for name, solid in parts.items():
            states += 1
            if not solid.isValid() or len(solid.Solids()) != 1:
                errors.append({"payout_mm": p, "pin_offset_mm": pin_offset, "invalid_body": name})
        for a, b in combinations(parts, 2):
            tested += 1
            if not bbox_overlap(bounds[a], bounds[b]):
                continue
            exact += 1
            volume = parts[a].intersect(parts[b]).Volume()
            if volume > 0.01:
                errors.append({"payout_mm": p, "pin_offset_mm": pin_offset, "pair": [a, b], "volume_mm3": round(volume, 5)})
    envelope = cq.Compound.makeCompound(list(pose(0, True).values())).BoundingBox()
    return {
        "cadquery_version": cq.__version__,
        "bodies_per_pose": len(pose(0, True)),
        "poses_pin_withdrawn": len(free_positions),
        "poses_pin_engaged": len(parked_positions),
        "poses_pin_transition": len(positions) - len(free_positions) - len(parked_positions),
        "misaligned_pin_negative_control_mm3": pose(1/12, True)["pin_shank"].intersect(
            pose(1/12, True)["wheel_index"]
        ).Volume(),
        "body_states": states,
        "pairs": tested,
        "brep_candidates": exact,
        "overlap_limit_mm3": 0.01,
        "errors": errors,
        "envelope_home_mm": [envelope.xlen, envelope.ylen, envelope.zlen],
    }


def export(output):
    output.mkdir(parents=True, exist_ok=True)
    for payout in (0, 8):
        assembly = cq.Assembly(name=f"v07d_payout_{payout}_mm")
        for name, solid in pose(payout, True).items():
            assembly.add(solid, name=name, color=cq.Color(COLORS[name.split("_")[0]]))
        assembly.export(str(output / f"release_{payout}mm.step"))
    cq.exporters.export(pose(0, True)["wheel_knob"], str(output / "knob_fit_only.stl"))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--export", type=Path, help="Output directory for geometry exports")
    parser.add_argument("--audit", action="store_true", help="Run all discrete BRep collision checks")
    args = parser.parse_args()
    if args.export:
        export(args.export)
    if args.audit:
        report = audit()
        print(json.dumps({key: value for key, value in report.items() if key != "errors"}, indent=2))
        print(f"errors: {len(report['errors'])}")
        (HERE / "cad_results.json").write_text(json.dumps(report, indent=2) + "\n")
        raise SystemExit(bool(report["errors"]) or report["misaligned_pin_negative_control_mm3"] <= 0.01)
