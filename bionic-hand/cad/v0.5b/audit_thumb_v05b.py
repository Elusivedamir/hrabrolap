#!/usr/bin/env python3
"""Sampled exact OCC collision checks. Run: python audit_thumb_v05b.py <batch>.
Each batch checks the thumb against the original palm and 4 fingers; it is not
continuous collision detection and is NOT a load safety analysis.
"""
import sys,json,time,numpy as np
from pathlib import Path
from thumb_corrected_v05b import frame,thumb_parts,DIGITS,finger_solid_parts
ROOT=Path(__file__).resolve().parent
sequences={
 'swing': [('swing',.1,float(q),0.) for q in np.linspace(0,1,9)],
 'pinch':[('pinch',float(f),1.,float((f-.1)/(.63-.1))) for f in np.linspace(.1,.63,9)],
 'power':[('power',float(f),.5,.4) for f in np.linspace(.1,1.,9)],
 'retract':[('retract',.1,float(q),0.) for q in np.linspace(1,.5,7)]
}
label=sys.argv[1] if len(sys.argv)>1 else 'swing'
assert label in sequences
out=[];ts=time.time()
for typ,f,q,ip in sequences[label]:
 thumb=thumb_parts(q,ip)[0]
 others=[('palm_frame',frame)]+[pair for d in DIGITS for pair in finger_solid_parts(d,f)[0]]
 collisions=[];tested=0
 for n,s in thumb:
  a=s.BoundingBox()
  for n2,s2 in others:
   b=s2.BoundingBox();ov=[min(getattr(a,z+'max'),getattr(b,z+'max'))-max(getattr(a,z+'min'),getattr(b,z+'min')) for z in 'xyz']
   if min(ov)<=.001: continue
   tested+=1
   vol=s.intersect(s2).Volume()
   if vol>.002:collisions.append([n,n2,round(vol,3)])
 result={'mode':typ,'f':round(f,4),'q':round(q,4),'ip':round(ip,4),'tested':tested,'collisions':collisions}
 out.append(result)
 print(result,flush=True)
report={'batch':label,'sampled_poses':len(out),'broadphase_candidate_pairs':sum(x['tested'] for x in out),'violations':[x for x in out if x['collisions']],'poses':out,'runtime_seconds':round(time.time()-ts,2)}
(ROOT/f'audit_{label}.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('RESULT',label,'violations',len(report['violations']),'candidate pairs',report['broadphase_candidate_pairs'],flush=True)
