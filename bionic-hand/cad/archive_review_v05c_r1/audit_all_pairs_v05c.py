#!/usr/bin/env python3
"""Audit every modeled pair; report intended envelope overlaps separately.
Finite BRep snapshots only. Missing fasteners/wires/seals are not validated.
"""
import json, time, platform
from itertools import combinations
import cadquery as cq
from build_thumb_motor_v05c import all_parts, OUT

SAMPLES=[('rest',0,0,0),('swing25',.1,.25,0),('swing50',.1,.5,0),
         ('swing75',.1,.75,0),('opposed',.1,1,0),('pinch',.63,1,1),('power',1,.5,.4)]
# These are unresolved geometry interfaces, not verified bolted connections.
INTERFACES={frozenset(('thumb_prox','thumb_rotor')):'unresolved rotor-to-proximal attachment',
            frozenset(('bearing_bridge_concept','frame_v04_reference')):'unresolved bridge-to-frame bolted interface'}

def run():
    report={'version':'v0.5c audit revision 1','cadquery':cq.__version__,
            'python':platform.python_version(),'samples':SAMPLES,'volume_threshold_mm3':.02,
            'pair_checks':0,'brep_intersections':0,'overlaps':[],'interface_overlaps':[],
            'validity':{},'limits':['finite snapshots; no continuous sweep',
            'no real spline, screw heads, wires, flexion motor, seals or socket',
            'zero volume does not prove clearance or assembled connection']}
    start=time.monotonic()
    for label,f,q,ip in SAMPLES:
        parts,_=all_parts(f,q,ip)
        for n,s in parts.items():
            report['validity'][label+':'+n]={'valid':s.isValid(),'solids':len(s.Solids())}
        for a,b in combinations(parts,2):
            report['pair_checks']+=1
            sa,sb=parts[a],parts[b];ba,bb=sa.BoundingBox(),sb.BoundingBox()
            if any(min(getattr(ba,d+'max'),getattr(bb,d+'max'))-max(getattr(ba,d+'min'),getattr(bb,d+'min'))<=0 for d in 'xyz'):
                continue
            report['brep_intersections']+=1
            vol=sa.intersect(sb).Volume()
            if vol>.02:
                row={'pose':label,'a':a,'b':b,'volume_mm3':round(vol,5)}
                reason=INTERFACES.get(frozenset((a,b)))
                if reason:
                    row['reason']=reason;report['interface_overlaps'].append(row)
                else:report['overlaps'].append(row)
        print(label,'unresolved overlaps',len(report['overlaps']),flush=True)
    report['duration_s']=round(time.monotonic()-start,2)
    bad=[n for n,v in report['validity'].items() if not v['valid'] or v['solids']!=1]
    report['invalid_or_multisolid_parts']=bad
    report['status']='FAIL' if report['overlaps'] or bad else 'NO_UNCLASSIFIED_OVERLAPS_IN_VALID_SAMPLED_BREP'
    (OUT/'all_pairs_audit.json').write_text(json.dumps(report,indent=2))
    print(report['status'],'pair checks',report['pair_checks'],'BRep',report['brep_intersections'],flush=True)
    return report

if __name__=='__main__':
    result=run()
    raise SystemExit(1 if result['status']=='FAIL' else 0)
