"""Discrete CAD audit for a single MCP joint with a frozen drive sector."""
import argparse
from functools import lru_cache
from itertools import combinations
import json
from math import ceil, cos, hypot, radians, sin
from pathlib import Path

import cadquery as cq

from joint_model import DESIGN, follower

HERE = Path(__file__).resolve().parent
AXIS_Y, AXIS_Z = 11.4, 5.35
CABLE_Z, CABLE_R, DRUM_PATH_R = -5.15, 0.6, 5.8
COLORS = {"frame": "#8497a6", "drive": "#388a91", "finger": "#58825b", "pin": "#24394b",
          "gate": "#db9342", "screw": "#9d4b44", "brake": "#7460a0", "cable": "#333842"}


def box(x0, x1, y0, y1, z0, z1):
    return cq.Solid.makeBox(x1 - x0, y1 - y0, z1 - z0, cq.Vector(x0, y0, z0))


def rod_z(radius, z0, z1, x=0, y=0):
    return cq.Solid.makeCylinder(radius, z1 - z0, cq.Vector(x, y, z0))


def rod_x(radius, x0, x1, y=AXIS_Y, z=AXIS_Z):
    return cq.Solid.makeCylinder(radius, x1 - x0, cq.Vector(x0, y, z), cq.Vector(1, 0, 0))


def strip(a, b, width, z0, z1):
    dx, dy = b[0] - a[0], b[1] - a[1]
    r = width / 2
    length = hypot(dx, dy)
    nx, ny = -dy * r / length, dx * r / length
    points = [cq.Vector(x, y, z0) for x, y in
              [(a[0]+nx, a[1]+ny), (b[0]+nx, b[1]+ny), (b[0]-nx, b[1]-ny), (a[0]-nx, a[1]-ny)]]
    web = cq.Solid.extrudeLinear(cq.Wire.makePolygon(points, close=True), [], cq.Vector(0, 0, z1-z0))
    return web.fuse(rod_z(r, z0, z1, *a), rod_z(r, z0, z1, *b)).clean()


def polar(radius, angle_deg):
    q = radians(angle_deg)
    return radius * cos(q), radius * sin(q)


def annular_arc(inner, outer, start, end, z0, z1):
    mid = (start + end) / 2
    return (cq.Workplane("XY", origin=(0, 0, z0)).moveTo(*polar(outer, start))
            .threePointArc(polar(outer, mid), polar(outer, end)).lineTo(*polar(inner, end))
            .threePointArc(polar(inner, mid), polar(inner, start)).close().extrude(z1-z0).val())


def rotate(solid, angle):
    return solid.rotate((0, 0, 0), (0, 0, 1), angle)


@lru_cache(maxsize=1)
def static_bodies():
    axle_bore = rod_z(2.65, -10, 12)
    return {
        "frame_lower_ear": strip((-30.6, 0), (0, 0), 8.3, -8.3, -6.55).cut(axle_bore),
        "frame_upper_ear": strip((-30.6, 0), (0, 0), 8.3, 8.95, 10.55).cut(axle_bore, box(-33.5, -12, -5, 5, 8.8, 9.28)),
        "frame_proximal_block": box(-33, -29.4, -3.3, 3.3, -6.55, 8.95),
        "pin_pivot": rod_z(2.5, -8.8, 10.8),
    }


@lru_cache(maxsize=1)
def drive_bodies():
    axle_bore = rod_z(2.65, -9, 10)
    slot = annular_arc(9.82, 14.18, 60, 120, -1.1, 0.8).fuse(
        *(rod_z(2.18, -1.1, 0.8, *polar(12, angle)) for angle in (60, 120))
    )
    arc_plate = annular_arc(8.8, 15.55, 45, 135, -0.60, 0.40)
    arc_plate = arc_plate.fuse(box(-13, -8.3, 10.5, 13, -.60, .40)).cut(slot).clean()
    groove = cq.Solid.makeTorus(5.2, .65, cq.Vector(0, 0, CABLE_Z), cq.Vector(0, 0, 1))
    return {
        "drive_drum": rod_z(5.2, -6.45, -3.75).cut(axle_bore, groove).clean(),
        "drive_link": strip((0, 0), (-13.6, 11.6), 7.2, -3.75, -1.95).cut(axle_bore),
        "drive_proximal_post": box(-15.6, -13, 7.4, 16.5, -1.95, 8.25).cut(rod_x(2.20, -16, -12)),
        "drive_far_screw_support": box(12.25, 14, 7.4, 16.5, 3, 8.25).cut(rod_x(2.20, 11, 15)),
        "drive_rail_low": box(-13, 12.25, 6.6, 8.25, 3, 8.25),
        "drive_rail_high": box(-13, 12.25, 14.7, 16.5, 3, 8.25),
        "drive_slot_captive": arc_plate,
        "screw_shank": rod_x(2.0, -17.25, 13.5),
        "screw_head_reference": rod_x(3.5, -21.25, -17.25),
        "brake_spring_reserve": rod_x(3.8, -17.25, -16.2).cut(rod_x(2.1, -18, -16)),
        "brake_friction_ring": rod_x(3.55, -16.2, -15.6).cut(rod_x(2.1, -17, -15)),
        "screw_axial_collar": rod_x(2.7, -13, -11.8).cut(rod_x(2.01, -14, -11)),
    }


@lru_cache(maxsize=1)
def finger_bodies():
    x, y = follower(0)
    carrier = strip((0, 0), (32, 0), 7, -1.75, -.75)
    carrier = carrier.fuse(strip((0, 0), (x, y), 5.4, -1.75, -.75)).cut(rod_z(2.65, -2, 1)).clean()
    return {"finger_carrier": carrier, "pin_follower": rod_z(2, -.75, 3.10, x, y)}


def gate_bodies(delta_deg, error_mm):
    x = follower(delta_deg)[0] + DESIGN.follower_diameter_mm / 2 + 0.15 + error_mm
    nut = box(x, x+4, 8.5, 14.45, 3.2, 7.85).cut(rod_x(2.00, x-1, x+5))
    tip = box(x, x+3.5, 8.45, 13.9, .55, 3.2)
    return {"gate_slider_and_face": nut.fuse(tip).clean()}


@lru_cache(maxsize=16)
def cable_bodies(alpha_deg):
    # Nominal cylindrical chords, matching the v0.6b style of sweep.
    points = [(-18, DRUM_PATH_R, CABLE_Z), (0, DRUM_PATH_R, CABLE_Z)]
    if alpha_deg:
        n = ceil(alpha_deg / 5)
        points += [(*polar(DRUM_PATH_R, 90 + alpha_deg*i/n), CABLE_Z) for i in range(1, n+1)]
    segments = []
    for a, b in zip(points, points[1:]):
        v, w = cq.Vector(*a), cq.Vector(*b)
        segments.append(cq.Solid.makeCylinder(CABLE_R, (w-v).Length, v, (w-v).normalized()))
    return segments


@lru_cache(maxsize=16)
def rotated_drive(alpha_deg):
    return {name: rotate(body, alpha_deg) for name, body in drive_bodies().items()}


@lru_cache(maxsize=16)
def rotated_finger(angle_deg):
    return {name: rotate(body, angle_deg) for name, body in finger_bodies().items()}


def pose(alpha_deg, delta_deg, *, gate_error_mm=0.0):
    if not 0 <= delta_deg <= alpha_deg <= DESIGN.maximum_deg:
        raise ValueError("Expected 0 <= relative release <= drive angle <= 60")
    return {
        **static_bodies(),
        **rotated_drive(alpha_deg),
        **{k: rotate(v, alpha_deg) for k, v in gate_bodies(delta_deg, gate_error_mm).items()},
        **rotated_finger(alpha_deg-delta_deg),
    }


def overlaps(a, b):
    return all(min(getattr(a, axis+"max"), getattr(b, axis+"max"))
               - max(getattr(a, axis+"min"), getattr(b, axis+"min")) > 1e-6 for axis in "xyz")


def audit():
    states = [(alpha, delta) for alpha in range(0, 61, 5) for delta in range(0, alpha+1, 5)]
    errors, pair_count, solid_candidates, cable_candidates, body_count = [], 0, 0, 0, 0
    samples = []
    minmax = [[float("inf"), -float("inf")] for _ in "xyz"]
    for alpha, delta in states:
        parts = pose(alpha, delta)
        bounds = {k: v.BoundingBox() for k, v in parts.items()}
        for axis, extent in zip("xyz", minmax):
            extent[0] = min(extent[0], *(getattr(v, axis+"min") for v in bounds.values()))
            extent[1] = max(extent[1], *(getattr(v, axis+"max") for v in bounds.values()))
        for name, body in parts.items():
            body_count += 1
            if not body.isValid() or len(body.Solids()) != 1:
                errors.append({"pose_deg": [alpha, delta], "invalid_body": name})
        for a, b in combinations(parts, 2):
            pair_count += 1
            if overlaps(bounds[a], bounds[b]):
                solid_candidates += 1
                volume = parts[a].intersect(parts[b]).Volume()
                if volume > 0.01:
                    errors.append({"pose_deg": [alpha, delta], "pair": [a, b], "volume_mm3": round(volume, 5)})
        for cable in cable_bodies(alpha):
            bound = cable.BoundingBox()
            for name, solid in parts.items():
                if overlaps(bound, bounds[name]):
                    cable_candidates += 1
                    volume = cable.intersect(solid).Volume()
                    if volume > 0.01:
                        errors.append({"pose_deg": [alpha, delta], "pair": ["cable_chord", name], "volume_mm3": round(volume, 5)})
        if delta == alpha:
            samples.append({"drive_frozen_deg": alpha, "finger_deg": alpha-delta, "gate_relative_deg": delta})

    bad = pose(60, 30, gate_error_mm=-.35)
    interference = bad["pin_follower"].intersect(bad["gate_slider_and_face"]).Volume()
    return {"cadquery": cq.__version__, "pose_count": len(states), "solid_states": body_count,
            "solid_pairs": pair_count, "solid_brep_candidates": solid_candidates,
            "cable_brep_candidates": cable_candidates, "axis_bounds_mm": minmax,
            "adjacent_lane_pitch_mm": 20.5, "bare_axial_width_mm": minmax[2][1]-minmax[2][0],
            "negative_control_gate_follower_mm3": interference, "frozen_drive_open_samples": samples,
            "volume_threshold_mm3": .01, "errors": errors}


def export(output):
    output.mkdir(parents=True, exist_ok=True)
    for delta in (0, 60):
        assembly = cq.Assembly(name=f"frozen_drive_60_release_{delta}")
        for key, solid in pose(60, delta).items():
            assembly.add(solid, name=key, color=cq.Color(COLORS[key.split("_")[0]]))
        for i, cable in enumerate(cable_bodies(60)):
            assembly.add(cable, name=f"cable_{i:02}", color=cq.Color(COLORS["cable"]))
        assembly.export(str(output/f"frozen_60_release_{delta:02}.step"))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--export", type=Path)
    args = parser.parse_args()
    report = audit()
    (HERE/"cad_results.json").write_text(json.dumps(report, indent=2)+"\n")
    print(json.dumps({k: v for k, v in report.items() if k not in ("errors", "frozen_drive_open_samples")}, indent=2))
    print(f"Errors: {len(report['errors'])}")
    if args.export and not report["errors"]:
        export(args.export)
    raise SystemExit(bool(report["errors"]) or report["negative_control_gate_follower_mm3"] <= .01)
