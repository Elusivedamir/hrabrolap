#!/usr/bin/env python3
"""CAD v0.5 sampled BRep collision audit (no mechanical strength verification)."""
from build_v05 import *
from itertools import combinations
import json, numpy as np, time
START=time.time()
SAMPLES=[(float(t),None,None,"standard") for t in np.linspace(0,1,5)]
SAMPLES.append((0.25,30,1,"opposition"))
issues=[]; checked=0; rejected=0
for t,yaw,flex,mode in SAMPLES:
    shapes={"palm_chassis":frame}
    for d in DIGITS:
        shapes.update(finger_solid_parts(d,t)[0])
    shapes.update(thumb_parts(t,yaw,flex)[0])
    for (a,sa),(b,sb) in combinations(shapes.items(),2):
        A,B=sa.BoundingBox(),sb.BoundingBox()
        dx=min(A.xmax,B.xmax)-max(A.xmin,B.xmin)
        dy=min(A.ymax,B.ymax)-max(A.ymin,B.ymin)
        dz=min(A.zmax,B.zmax)-max(A.zmin,B.zmin)
        if min(dx,dy,dz)<=.002:
            rejected+=1
            continue
        checked+=1
        v=sa.intersect(sb).Volume()
        if v>.002:
            issues.append({"phase":t,"mode":mode,"a":a,"b":b,"volume_mm3":v})
    print(t,mode,"intersections",len(issues),flush=True)
report={
 "date":"2026-11-10", "method":"CadQuery/OCC BRep solid intersection after AABB",
 "poses":SAMPLES, "checked_pairs":checked, "aabb_rejected":rejected, "issues":issues,
 "elapsed_seconds":time.time()-START,
 "limitations":[
   "Only discrete sampled poses are checked, not a continuous sweep.",
   "Omitted parts include motors, fastener heads, wiring, sealings, skin, new MCP mounts.",
   "No FEA, fatigue, real electrical safety or 10kg mechanical proof.",
   "A one-run script may exceed time limits; partial output cannot be called a full pass."
 ]
}
(ROOT/"boolean_spotcheck_v05.json").write_text(json.dumps(report,ensure_ascii=False,indent=2))
print("DONE",checked,"tested, collisions",len(issues))
