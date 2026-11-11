"""Check a hand-operated, unloaded single-finger assembly in discrete poses."""
from itertools import combinations
from pathlib import Path
import json

import cadquery as cq

from geometry import (BASE_X, BASE_Y, CHEEK_X, CHEEK_Y, CORD_R_MM, FINGER_X,
                      GUIDE_XY, MAX_ANGLE_DEG, MOUNTS_X, PIN_HOLE_R_MM,
                      SHEET_THICK_MM, STUD_GAP_MM, TIE_HOLE_R_MM, TIE_X,
                      anchor, cord_measure)

HERE = Path(__file__).resolve().parent


def block(xs, ys, z, thickness):
    return cq.Solid.makeBox(xs[1]-xs[0], ys[1]-ys[0], thickness, cq.Vector(xs[0], ys[0], z))


def rod(radius, z, length, x=0):
    return cq.Solid.makeCylinder(radius, length, cq.Vector(x, 0, z))


def collar(x, z, length, radius=3.1):
    return rod(radius, z, length, x).cut(rod(PIN_HOLE_R_MM, z-.1, length+.2, x))


def cheek(z):
    return block(CHEEK_X, CHEEK_Y, z, SHEET_THICK_MM).cut(
        *(rod(PIN_HOLE_R_MM, z-.1, SHEET_THICK_MM+.2, x) for x in (0,*MOUNTS_X)))


def finger():
    z=21
    return (block((0,FINGER_X[1]-8),(-8,8),z,SHEET_THICK_MM)
            .fuse(rod(8,z,SHEET_THICK_MM),rod(8,z,SHEET_THICK_MM,FINGER_X[1]-8))
            .cut(rod(PIN_HOLE_R_MM,z-.1,SHEET_THICK_MM+.2),
                 *(rod(TIE_HOLE_R_MM,z-.1,SHEET_THICK_MM+.2,x) for x in TIE_X)).clean())


def stationary():
    parts={"board":block(BASE_X,BASE_Y,0,8),"lower_cheek":cheek(16),"upper_cheek":cheek(26),
           "pivot_shank":rod(1.50,15.3,15.6),"lower_washer":collar(0,20.1,.8),
           "upper_washer":collar(0,25.1,.8)}
    for i,x in enumerate(MOUNTS_X):
        parts[f"bench_foot_{i}"]=collar(x,8,8,4)
        parts[f"spacer_{i}"]=collar(x,20,STUD_GAP_MM)
        parts[f"mount_shank_{i}"]=rod(1.5,8,23,x)
    return parts


def cable(radius, angle):
    p=cq.Vector(*anchor(radius,angle),25.55)
    q=cq.Vector(*GUIDE_XY,25.55)
    direction=q-p
    return cq.Solid.makeCylinder(CORD_R_MM,direction.Length,p,direction.normalized())


def intersects_bounds(a,b):
    return all(min(getattr(a,k+"max"),getattr(b,k+"max"))-
               max(getattr(a,k+"min"),getattr(b,k+"min"))>1e-6 for k in "xyz")


def audit():
    fixed=stationary()
    proxy=finger()
    errors=[]
    body_states=pairs=exact=0
    tracks={r:[] for r in TIE_X}
    for angle in range(MAX_ANGLE_DEG+1):
        moving=proxy.rotate((0,0,0),(0,0,1),-angle)
        for radius in TIE_X:
            parts={**fixed,"finger":moving,"cord":cable(radius,angle)}
            bounds={k:v.BoundingBox() for k,v in parts.items()}
            body_states+=sum(v.isValid() and len(v.Solids())==1 for v in parts.values())
            for a,b in combinations(parts,2):
                pairs+=1
                if intersects_bounds(bounds[a],bounds[b]):
                    exact+=1
                    volume=parts[a].intersect(parts[b]).Volume()
                    if volume>.005:
                        errors.append([angle,radius,a,b,volume])
            tracks[radius].append(cord_measure(radius,angle))
    return {"status":"UNLOADED_JIG_MODEL_ONLY","angles_per_anchor":MAX_ANGLE_DEG+1,
            "anchors":len(TIE_X),"valid_body_states":body_states,"pairs":pairs,
            "brep_candidates":exact,"overlap_limit_mm3":.005,"errors":errors,
            "cord_proxy":{"guide_xy_mm":GUIDE_XY,"radius_mm":CORD_R_MM,
                "tracks":[{"anchor_mm":r,"payout_mm":p[0][0]-p[-1][0],
                           "minimum_closing_moment_arm_mm":min(-arm for _,arm in p)}
                          for r,p in tracks.items()]}}


def export():
    fixed=stationary()
    body=finger()
    for angle in (0,MAX_ANGLE_DEG):
        a=cq.Assembly(name=f"unloaded_finger_{angle}_deg")
        parts={**fixed,"finger":body.rotate((0,0,0),(0,0,1),-angle),"cord":cable(23,angle)}
        for name,part in parts.items():
            a.add(part,name=name)
        a.export(str(HERE/f"finger_{angle:02}deg.step"))


if __name__=="__main__":
    result=audit()
    (HERE/"finger_results.json").write_text(json.dumps(result,indent=2)+"\n")
    print(json.dumps(result,indent=2))
    if not result["errors"] and result["valid_body_states"]==(MAX_ANGLE_DEG+1)*len(TIE_X)*(len(stationary())+2):
        export()
    else:
        raise SystemExit(1)
