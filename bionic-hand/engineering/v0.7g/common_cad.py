"""CadQuery model of a common rocker, two pins, crank, yoke and eight cable proxies."""
from functools import lru_cache
from itertools import combinations
from math import cos, radians, sin
from pathlib import Path
import argparse
import json

import cadquery as cq

from common_release import CRANK_R_MM, DRIVE_R_MM, PARK_R_MM, STEP_DEG, STEPS, STOP_R_MM, payout

HERE = Path(__file__).resolve().parent
CABLE_YS = (-18.35, -15.65, -11.60, -9.10, 5.65, 8.35, 14.65, 17.35)
COLORS = {"frame": "#788e9d", "rotor": "#318494", "shaft": "#333e54", "lever": "#c18c45",
          "park": "#9f4b45", "drive": "#4f7c59", "yoke": "#537795", "tether": "#303440"}


def box(x0, x1, y0, y1, z0, z1):
    return cq.Solid.makeBox(x1-x0, y1-y0, z1-z0, cq.Vector(x0, y0, z0))


def zrod(r, z0, z1, x=0, y=0):
    return cq.Solid.makeCylinder(r, z1-z0, cq.Vector(x, y, z0))


def xrod(r, x0, x1, y, z=7.0):
    return cq.Solid.makeCylinder(r, x1-x0, cq.Vector(x0, y, z), cq.Vector(1, 0, 0))


def polar(radius, angle):
    theta = radians(angle)
    return radius*cos(theta), radius*sin(theta)


def rotate(shape, angle):
    return shape.rotate((0, 0, 0), (0, 0, 1), angle)


def slot_arc(radius, clearance_r, a0, a1, z0, z1):
    lo, hi = radius-clearance_r, radius+clearance_r
    am = (a0+a1)/2
    sector = (cq.Workplane("XY", origin=(0, 0, z0)).moveTo(*polar(hi, a0))
              .threePointArc(polar(hi, am), polar(hi, a1)).lineTo(*polar(lo, a1))
              .threePointArc(polar(lo, am), polar(lo, a0)).close().extrude(z1-z0).val())
    return sector.fuse(*(zrod(clearance_r, z0, z1, *polar(radius, a)) for a in (a0, a1)))


@lru_cache(maxsize=1)
def fixed():
    stop_cut = slot_arc(STOP_R_MM, 2.15, 90, 105, 20.5, 24.5)
    axle_hole = zrod(2.65, 23.5, 27)
    park_hole = zrod(1.65, 13, 29, PARK_R_MM)
    return {
        "frame_base": box(-31, 31, -26, 46, 0, 4),
        "frame_upright_left": box(-31, -27, -4, 4, 4, 24),
        "frame_upright_right": box(27, 31, -4, 4, 9, 24),
        "frame_bridge": box(-31, 31, -4, 4, 24, 26.5).cut(axle_hole, park_hole),
        "frame_park_pin_guide": zrod(3.1, 14.5, 24, PARK_R_MM).cut(park_hole),
        "frame_slot_stop": box(-15, 10, 33, 45, 21, 24).cut(stop_cut),
        "frame_slot_stop_mount": box(6, 10, 42, 45, 4, 21),
        "frame_left_yoke_rail": box(-13, 13, -24, -21.25, 4, 9.25),
        "frame_right_yoke_rail": box(-13, 13, 21.25, 24, 4, 9.25),
        "frame_tether_outlets": box(25, 31, -21, 21, 4, 9).cut(
            *(xrod(.90, 24, 32, y) for y in CABLE_YS)),
        "shaft_axle": zrod(2.50, 10, 27.25),
    }


@lru_cache(maxsize=1)
def rotor_neutral():
    holes = [zrod(1.60, 9, 15, *polar(r, i*STEP_DEG)) for r in (PARK_R_MM, DRIVE_R_MM)
             for i in range(360//STEP_DEG)]
    return {
        "rotor_index_plate": zrod(25.6, 10, 14).cut(zrod(2.60, 9, 15), *holes).clean(),
        "rotor_hub": zrod(4.9, 14, 16.55).cut(zrod(2.60, 13, 17)),
        "rotor_crank_follower": zrod(2.0, 6.0, 10, -CRANK_R_MM),
    }


@lru_cache(maxsize=1)
def lever_neutral():
    pin_hole = zrod(1.65, 16.5, 20.5, 0, DRIVE_R_MM)
    axle_hole = zrod(2.65, 16.5, 20.5)
    return {
        "lever_handle": zrod(5, 17, 20).fuse(box(-3.15, 3.15, 0, 55, 17, 20))
        .cut(pin_hole, axle_hole).clean(),
        "lever_stop_follower": zrod(2, 20, 24, 0, STOP_R_MM),
    }


@lru_cache(maxsize=1)
def yoke_neutral():
    slot = box(-2.15, 2.15, -6, 0, 4.8, 9.2).fuse(
        zrod(2.15, 4.8, 9.2, 0, -6), zrod(2.15, 4.8, 9.2))
    return box(-3.5, 3.5, -21, 21, 4.75, 8.9).cut(
        slot, *(xrod(.85, -4, 4, y) for y in CABLE_YS)).clean()


def pose(rotor_deg, lever_deg, park, drive):
    x = payout(rotor_deg) - CRANK_R_MM
    drive_x, drive_y = polar(DRIVE_R_MM, 90+lever_deg)
    return {
        **fixed(),
        **{name: rotate(shape, rotor_deg) for name, shape in rotor_neutral().items()},
        **{name: rotate(shape, lever_deg) for name, shape in lever_neutral().items()},
        "park_pin": zrod(1.50, 11 if park else 14.20, 23.8 if park else 27, PARK_R_MM),
        "drive_pin": zrod(1.50, 11 if drive else 14.20, 20.8 if drive else 24, drive_x, drive_y),
        "yoke_anchor_bar": yoke_neutral().translate((x, 0, 0)),
        **{f"tether_{i}": xrod(.6, x+3.5, 32, y) for i, y in enumerate(CABLE_YS)},
    }


def overlap(a, b):
    return all(min(getattr(a, axis+"max"), getattr(b, axis+"max"))
               -max(getattr(a, axis+"min"), getattr(b, axis+"min")) > 1e-6 for axis in "xyz")


def states():
    for i in range(STEPS):
        start = i*STEP_DEG
        end = start+STEP_DEG
        yield start, 0, True, False
        yield start, 0, True, True
        for swing in (0, 3, 6, 9, 12, 15):
            yield start+swing, swing, False, True
        yield end, STEP_DEG, True, True
        for swing in (15, 10, 5, 0):
            yield end, swing, True, False


def audit():
    positions = list(dict.fromkeys(states()))
    errors, pairs, candidates, valid = [], 0, 0, 0
    bounds = [[float("inf"), -float("inf")] for _ in "xyz"]
    for state in positions:
        parts = pose(*state)
        bbox = {name: solid.BoundingBox() for name, solid in parts.items()}
        for a, interval in zip("xyz", bounds):
            interval[0] = min(interval[0], *(getattr(bb, a+"min") for bb in bbox.values()))
            interval[1] = max(interval[1], *(getattr(bb, a+"max") for bb in bbox.values()))
        for name, solid in parts.items():
            if len(solid.Solids()) != 1 or not solid.isValid():
                errors.append({"state": state, "invalid": name})
            else:
                valid += 1
        for a, b in combinations(parts, 2):
            pairs += 1
            if overlap(bbox[a], bbox[b]):
                candidates += 1
                volume = parts[a].intersect(parts[b]).Volume()
                if volume > .01:
                    errors.append({"state": state, "pair": [a,b], "overlap_mm3": round(volume, 5)})
    improper = pose(7.5, 7.5, True, True)
    bad_park_volume = improper["park_pin"].intersect(improper["rotor_index_plate"]).Volume()
    return {"cadquery": cq.__version__, "states": len(positions), "valid_solid_states": valid,
            "pairs": pairs, "brep_candidates": candidates, "limits_xyz_mm": bounds,
            "envelope_xyz_mm": [b-a for a,b in bounds], "volume_limit_mm3": .01,
            "negative_control_midstep_park_mm3": bad_park_volume, "errors": errors}


def export(output):
    output.mkdir(parents=True, exist_ok=True)
    for name, state in {"home": (0,0,True,False), "moving": (82.5,7.5,False,True),
                        "full": (180,0,True,False)}.items():
        assembly = cq.Assembly(name=name)
        for key, solid in pose(*state).items():
            assembly.add(solid, name=key, color=cq.Color(COLORS[key.split("_")[0]]))
        assembly.export(str(output / f"rocker_{name}.step"))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--export", type=Path)
    args = parser.parse_args()
    report = audit()
    (HERE/"cad_results.json").write_text(json.dumps(report, indent=2)+"\n")
    print(json.dumps({k:v for k,v in report.items() if k != "errors"}, indent=2))
    print("Errors:", len(report["errors"]))
    if args.export and not report["errors"]:
        export(args.export)
    raise SystemExit(bool(report["errors"]) or report["negative_control_midstep_park_mm3"] <= .01)
