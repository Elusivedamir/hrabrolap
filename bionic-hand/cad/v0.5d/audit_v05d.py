#!/usr/bin/env python3
"""All modeled body pairs, no overlap exemptions. Finite samples, not a sweep."""
import json, platform, time
from itertools import combinations
import cadquery as cq
from build_v05d import ROOT, all_parts

POSES=[('rest',0,0,0,0),('swing25',.1,.25,0,0),('swing50',.1,.5,0,0),
       ('swing75',.1,.75,0,0),('opposed',.1,1,0,0),('pinch',.63,1,1,0),('power',1,.5,.4,0),
       ('mcp20_unopposed',.1,0,0,20),('mcp20_half',.1,.5,0,20),
       ('mcp5_opposed',.1,1,0,5),('mcp10_opposed',.1,1,0,10),
       ('mcp15_opposed',.1,1,0,15),('mcp20_opposed',.1,1,0,20)]

def overlap(a,b):
    aa,bb=a.BoundingBox(),b.BoundingBox()
    return all(min(getattr(aa,d+'max'),getattr(bb,d+'max'))>max(getattr(aa,d+'min'),getattr(bb,d+'min')) for d in 'xyz')

def run():
    start=time.monotonic()
    report={'version':'v0.5d','cadquery':cq.__version__,'python':platform.python_version(),
            'poses':POSES,'pair_checks':0,'brep_candidates':0,'validity':{},'intersections':[],
            'threshold_mm3':.02,'exemptions':[],
            'limits':['finite sampled poses, not continuous collision proof',
                      'retainer is a geometric envelope, not selected hardware',
                      'no force/strength/EMG/ingress validation']}
    for label,f,q,ip,mcp in POSES:
        pieces,_=all_parts(f,q,ip,mcp)
        for name,s in pieces.items():
            report['validity'][label+':'+name]={'valid':s.isValid(),'solids':len(s.Solids())}
        for a,b in combinations(pieces,2):
            report['pair_checks']+=1
            if not overlap(pieces[a],pieces[b]):continue
            report['brep_candidates']+=1
            vol=pieces[a].intersect(pieces[b]).Volume()
            if vol>.02:report['intersections'].append({'pose':label,'a':a,'b':b,'volume_mm3':round(vol,5)})
        print(label,'intersections',len(report['intersections']),flush=True)
    report['invalid']=[n for n,v in report['validity'].items() if not v['valid'] or v['solids']!=1]
    report['duration_s']=round(time.monotonic()-start,2)
    report['status']='FAIL' if report['invalid'] or report['intersections'] else 'SAMPLED_GEOMETRY_PASS'
    (ROOT/'audit_v05d.json').write_text(json.dumps(report,indent=2))
    print(report['status'],'pairs',report['pair_checks'],'BRep',report['brep_candidates'],flush=True)
    return report

if __name__=='__main__':
    r=run();raise SystemExit(0 if r['status']=='SAMPLED_GEOMETRY_PASS' else 1)
