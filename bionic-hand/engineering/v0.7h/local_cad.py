"""Local rack and opposed retaining tongues with an actual geometric interlock."""
from functools import lru_cache
from itertools import combinations, product
from pathlib import Path
import argparse
import json

import cadquery as cq

from local_hold import PITCH_MM, SLOT_X_MM, TAB_GAP_MM, TONGUE_X_MM, TONGUE_Y_MM, TOTAL_MM, WITHDRAW_MM

HERE=Path(__file__).resolve().parent
COLORS={"frame":"#7890a1","rack":"#338891","park":"#aa5149","travel":"#bd8740","shuttle":"#5a7a98"}


def box(x0,x1,y0,y1,z0,z1):
    return cq.Solid.makeBox(x1-x0,y1-y0,z1-z0,cq.Vector(x0,y0,z0))


@lru_cache(maxsize=1)
def rack():
    slots=[]
    for i in range(9):
        x=-i*PITCH_MM
        for y in (-3,3):
            slots.append(box(x-SLOT_X_MM/2,x+SLOT_X_MM/2,y-1.75,y+1.75,5.3,8.5))
    return box(-13.0,2.1,-5.9,5.9,5.5,8.3).cut(*slots).clean()


def rack_rail(x0,x1,side):
    if side == "left":
        wall=(-6.75,-6.05)
        lip=(-6.75,-5.68)
    else:
        wall=(6.05,6.75)
        lip=(5.68,6.75)
    return box(x0,x1,*wall,0,8.45).fuse(
        box(x0,x1,*lip,5.15,5.35),
        box(x0,x1,*lip,8.45,8.74),
    ).clean()


def shuttle_rail(wall,lip):
    return box(-.75,2.25,*wall,3.86,5.30).fuse(
        box(-.75,2.25,*lip,3.68,3.86),
        box(-.75,2.25,*lip,5.30,5.43),
    ).clean()


@lru_cache(maxsize=1)
def fixed():
    upper=box(-1.15,1.15,-7,-.35,12,13.5).cut(box(-.5,.5,-4.7,-1.3,11.8,13.7))
    return {
        "frame_base":box(-13.5,14.6,-7.25,8.55,-.5,0),
        "frame_post_upper":box(-1.15,1.15,-7.25,-7,0,13.5),
        "frame_park_guide":upper,
        "frame_rack_rail_left_rear":rack_rail(-13,-2,"left"),
        "frame_rack_rail_right_rear":rack_rail(-13,-2,"right"),
        "frame_rack_rail_left_front":rack_rail(3.2,14.1,"left"),
        "frame_rack_rail_right_front":rack_rail(3.2,14.1,"right"),
        "frame_rack_endstop":box(14.1,14.6,-5.9,5.9,0,8.45),
        "frame_shuttle_rail_inner":shuttle_rail((.54,.84),(.54,1.15)),
        "frame_shuttle_rail_outer":shuttle_rail((5.55,5.86),(5.22,5.86)),
        "frame_shuttle_origin_stop":box(-1.20,-.75,.5,5.90,0,5.43),
        "frame_shuttle_travel_stop":box(2.25,2.70,.5,5.90,0,5.43),
    }


@lru_cache(maxsize=1)
def moving():
    half=TONGUE_X_MM/2
    width=TONGUE_Y_MM/2
    return {
        "park_tongue":box(-half,half,-3-width,-3+width,6.1,13.35),
        "park_bridge":box(-half,half,-3.65,6.62,9.0,9.55),
        "park_side":box(-half,half,6.02,6.62,3.4,9.55),
        "park_interlock_tab":box(-.55,2.15,6.15,7.35,3.4,4.05),
        "travel_tongue":box(-half,half,3-width,3+width,3.05,7.7),
        "travel_bridge":box(-half,half,2.4,8.08,2.55,3.18),
        "travel_side":box(-half,half,7.55,8.08,2.55,7.15),
        "travel_interlock_tab":box(-.45,.45,6.72,8.08,6.50,7.15),
        "shuttle_guide":box(-.75,.75,.90,5.50,3.92,5.22).cut(box(-.50,.50,1.30,4.70,3.8,5.4)),
    }


def lock_piece(prefix):
    parts=[v for name,v in moving().items() if name.startswith(prefix)]
    return parts[0].fuse(*parts[1:]).clean()


@lru_cache(maxsize=1)
def park():
    return lock_piece("park_")


@lru_cache(maxsize=1)
def travel():
    return lock_piece("travel_")


def pose(position,shuttle,park_withdraw,travel_withdraw):
    return {
        **fixed(),
        "rack_channel":rack().translate((position,0,0)),
        "park_latch":park().translate((0,0,park_withdraw)),
        "travel_latch":travel().translate((shuttle,0,-travel_withdraw)),
        "shuttle_guide":moving()["shuttle_guide"].translate((shuttle,0,0)),
    }


def overlap(a,b):
    return all(min(getattr(a,d+"max"),getattr(b,d+"max"))
               -max(getattr(a,d+"min"),getattr(b,d+"min"))>1e-6 for d in "xyz")


def cases():
    for i in range(9):
        x=i*PITCH_MM
        yield x,0,0,WITHDRAW_MM
        for b in (1.8,1.2,.6,0):
            yield x,0,0,b
        for a in (.6,1.2,1.8,WITHDRAW_MM):
            yield x,0,a,0
        if i==8:
            continue
        for s in (.15,.45,.75,1.05,1.35,1.5):
            yield x+s,s,WITHDRAW_MM,0
            yield x+s,s,2.20,.24
        for a in (1.8,1.2,.6,0):
            yield x+1.5,1.5,a,0
        for b in (.6,1.2,1.8,WITHDRAW_MM):
            yield x+1.5,1.5,0,b
        for s in (1.2,.9,.6,.3,0):
            yield x+1.5,s,0,WITHDRAW_MM
    for a,b in product((0,.3,.6,.9,1.2,1.5,1.8,2.1,2.4),repeat=2):
        if a+b<=TAB_GAP_MM:
            yield 6,0,a,b


def audit():
    states=list(dict.fromkeys(cases()))
    bounds=[[float("inf"),-float("inf")] for _ in "xyz"]
    errors=[]; pairs=checked=valid=0
    for state in states:
        parts=pose(*state)
        bbs={k:s.BoundingBox() for k,s in parts.items()}
        for axis,span in zip("xyz",bounds):
            span[0]=min(span[0],*(getattr(bb,axis+"min") for bb in bbs.values()))
            span[1]=max(span[1],*(getattr(bb,axis+"max") for bb in bbs.values()))
        for name,part in parts.items():
            if len(part.Solids())!=1 or not part.isValid():
                errors.append({"state":state,"invalid":name})
            else:
                valid+=1
        for a,b in combinations(parts,2):
            pairs+=1
            if overlap(bbs[a],bbs[b]):
                checked+=1
                volume=parts[a].intersect(parts[b]).Volume()
                if volume>.005:
                    errors.append({"state":state,"pair":[a,b],"overlap_mm3":round(volume,5)})

    # Every continuous route from a+b<=2.45 to both withdrawn has to
    # cross a+b=2.55. Opposed tabs overlap in x/y throughout shuttle travel.
    boundary=TAB_GAP_MM+.10
    barrier=[pose(6+s,s,a,boundary-a)
             for s,a in product((0,.25,.5,.75,1.0,1.25,1.5),(.15,.6,1.275,1.95,2.4))]
    volumes=[p["park_latch"].intersect(p["travel_latch"]).Volume() for p in barrier]
    overtravel=pose(7.65,1.65,2.4,0)
    stop_volume=overtravel["shuttle_guide"].intersect(overtravel["frame_shuttle_travel_stop"]).Volume()
    off=pose(6.75,.75,0,0)
    off_detent=off["rack_channel"].intersect(off["park_latch"]).Volume()
    return {"cadquery":cq.__version__,"poses":len(states),"valid_bodies":valid,"pairs":pairs,
            "brep_candidates":checked,"envelope_mm":[b-a for a,b in bounds],"limits_xyz_mm":bounds,
            "volume_threshold_mm3":.005,"barrier_sample_count":len(volumes),
            "minimum_barrier_collision_mm3":min(volumes),"blocked_shuttle_overtravel_mm3":stop_volume,
            "blocked_park_at_non_indexed_position_mm3":off_detent,"errors":errors}


def export(output):
    output.mkdir(parents=True,exist_ok=True)
    for name,state in {"park":(3,0,0,2.4),"jam_between":(3.7,.7,2.4,0),
                       "next_stop":(4.5,1.5,0,0)}.items():
        assembly=cq.Assembly(name=name)
        for key,solid in pose(*state).items():
            assembly.add(solid,name=key,color=cq.Color(COLORS[key.split("_")[0]]))
        assembly.export(str(output/f"local_{name}.step"))


if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--export",type=Path)
    args=parser.parse_args()
    result=audit()
    (HERE/"cad_results.json").write_text(json.dumps(result,indent=2)+"\n")
    print(json.dumps({k:v for k,v in result.items() if k!="errors"},indent=2))
    print("Errors:",len(result["errors"]))
    if args.export and not result["errors"]:
        export(args.export)
    raise SystemExit(bool(result["errors"]) or result["minimum_barrier_collision_mm3"]<=.005
                     or result["blocked_shuttle_overtravel_mm3"]<=.005
                     or result["blocked_park_at_non_indexed_position_mm3"]<=.005)
