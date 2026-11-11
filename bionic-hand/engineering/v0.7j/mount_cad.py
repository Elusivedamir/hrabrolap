"""Nominal envelope for a replaceable motor block on the v0.7i bench base."""
import argparse
import importlib
from itertools import combinations
import json
from pathlib import Path
import sys

import cadquery as cq

HERE = Path(__file__).resolve().parent
AXLE_X, AXLE_Z = -56.0, 19.55
CORD_Y, CORD_Z = -38.0, 25.55
GUIDE_X = 11.0
MOTOR_FACE_Y = -34.5
ENVELOPE_MM = (10, 32.5, 12)


def load_base(path):
    sys.path.insert(0,str(path))
    try:
        return importlib.import_module("finger_cad")
    finally:
        sys.path.pop(0)


def yrod(radius,y0,y1):
    return cq.Solid.makeCylinder(radius,y1-y0,cq.Vector(AXLE_X,y0,AXLE_Z),cq.Vector(0,1,0))


def mock_parts(prior):
    return {
        "board":prior.block((-67,91),(-49,36),0,8),
        "motor_shim_block":prior.block((-65,-47),(-33,-5),8,5.55),
        "motor_proxy_10x12":prior.block((-61,-51),(MOTOR_FACE_Y,MOTOR_FACE_Y+ENVELOPE_MM[1]),13.55,12),
        "strap_top_proxy":prior.block((-65,-47),(-25,-17),25.55,1.0),
        "strap_left_proxy":prior.block((-62.5,-61),(-25,-17),13.55,12),
        "strap_right_proxy":prior.block((-51,-49.5),(-25,-17),13.55,12),
        "shaft_proxy":yrod(1.5,-43.5,MOTOR_FACE_Y),
        "spool_core_proxy":yrod(5.55,-39.7,-36.3).cut(yrod(1.55,-39.8,-36.2)),
        "spool_flange_front":yrod(7.45,-40.45,-39.7).cut(yrod(1.55,-40.55,-39.6)),
        "spool_flange_back":yrod(7.45,-36.3,-35.55).cut(yrod(1.55,-36.4,-35.45)),
        "cord_motor_side":cq.Solid.makeCylinder(.45,GUIDE_X-AXLE_X,cq.Vector(AXLE_X,CORD_Y,CORD_Z),cq.Vector(1,0,0)),
    }


def pose(prior,angle,anchor_mm=23,static=None):
    fixed={**prior.stationary(),**mock_parts(prior)} if static is None else static
    return {**fixed,"finger":prior.finger().rotate((0,0,0),(0,0,1),-angle),
            "cord_finger_side":prior.cable(anchor_mm,angle)}


def audit(prior):
    fixed={**prior.stationary(),**mock_parts(prior)}
    collisions=[]
    total=exact=states=0
    for angle in range(61):
        parts=pose(prior,angle,static=fixed)
        bbs={k:s.BoundingBox() for k,s in parts.items()}
        for key,body in parts.items():
            states+=1
            if not body.isValid() or len(body.Solids())!=1:
                collisions.append({"angle":angle,"invalid":key})
        for a,b in combinations(parts,2):
            if {a,b}=={"cord_motor_side","cord_finger_side"}:
                continue  # same cord at the ideal corner in the guide
            total+=1
            if prior.intersects_bounds(bbs[a],bbs[b]):
                exact+=1
                vol=parts[a].intersect(parts[b]).Volume()
                if vol>.005:
                    collisions.append({"angle":angle,"pair":[a,b],"volume_mm3":vol})
    return {"status":"MOTOR_ENVELOPE_AND_UNPOWERED_ROUTING_ONLY","poses":61,"body_states":states,
            "pairs":total,"exact_brep_checks":exact,"overlap_limit_mm3":.005,"collisions":collisions,
            "base_mm":[158,85,8],"motor_body_proxy_mm":ENVELOPE_MM,
            "spool_effective_radius_mm":6,"guide_xy_mm":[GUIDE_X,CORD_Y],
            "omitted":["actual connector and wiring", "mounting hardware", "winding width and knots",
                       "return spring", "guard, pulley bearing and emergency release"]}


def export(prior):
    for angle in (0,60):
        assembly=cq.Assembly(name=f"motor_placeholder_{angle}_deg")
        for name,shape in pose(prior,angle).items():
            assembly.add(shape,name=name)
        assembly.export(str(HERE/f"mount_{angle:02}deg.step"))


if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--baseline",type=Path,default=HERE.parent/"v0.7i")
    args=p.parse_args()
    prior=load_base(args.baseline.resolve())
    result=audit(prior)
    (HERE/"mount_results.json").write_text(json.dumps(result,indent=2)+"\n")
    print(json.dumps(result,indent=2))
    if result["collisions"]:
        raise SystemExit(1)
    export(prior)
