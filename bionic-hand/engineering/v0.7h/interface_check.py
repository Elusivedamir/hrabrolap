"""Conservative cartridge envelope against the retained single-finger v0.7e joint."""
import argparse
import importlib
from itertools import product
import json
from pathlib import Path
import sys

from local_cad import box, overlap

HERE=Path(__file__).resolve().parent


def examine(baseline):
    sys.path.insert(0,str(baseline))
    try:
        joint=importlib.import_module("joint_cad")
    finally:
        sys.path.pop(0)
    bounds=json.loads((HERE/"cad_results.json").read_text())["limits_xyz_mm"]
    cartridge=box(*[x for pair in bounds for x in pair])
    # Remove the v0.7e screw, gate, guide rails and screw support. Keep the
    # skeleton, drive link, captive arc and shaft/finger bodies.
    removed_prefixes=("gate_","screw_","brake_","drive_rail","drive_far_screw")
    poses=((0,0),(30,0),(60,0),(60,30),(60,60))
    retained={state:{k:v for k,v in joint.pose(*state).items() if not k.startswith(removed_prefixes)}
              for state in poses}
    rows=[]
    # x=-5.95 aligns the front of the home rack with the original gate face.
    # Other offsets screen alternatives without claiming a linkage.
    for x,y,z in product((-8.0,-5.95,-3.5),(9.4,11.4,13.4),(-4.0,-2.0,0,2.0)):
        stand_in=cartridge.translate((x,y,z))
        hits=[]
        for state,parts in retained.items():
            moving_box=joint.rotate(stand_in,state[0])
            bb=moving_box.BoundingBox()
            for k,body in parts.items():
                if overlap(bb,body.BoundingBox()):
                    volume=moving_box.intersect(body).Volume()
                    if volume>.01:
                        hits.append({"joint_pose_deg":state,"part":k,"volume_mm3":round(volume,4)})
        rows.append({"mount_offset_xyz_mm":[x,y,z],"hits":hits})
    return {"scope":"rigid swept cartridge box, 5 isolated MCP poses, alternative mounts; no load linkage",
            "isolated_mounts":len(rows),"mcp_poses_per_mount":len(poses),
            "without_penetration":sum(not row["hits"] for row in rows),
            "reserve_left_in_axial_18_85mm_target_mm":18.85-cartridge.BoundingBox().zlen,
            "mounts":rows}


if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--baseline",type=Path,default=HERE.parent/"v0.7e")
    result=examine(p.parse_args().baseline.resolve())
    print(json.dumps({k:v for k,v in result.items() if k!="mounts"},indent=2))
    (HERE/"interface_results.json").write_text(json.dumps(result,indent=2)+"\n")
