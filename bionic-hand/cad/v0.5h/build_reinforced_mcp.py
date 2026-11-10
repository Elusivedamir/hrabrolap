#!/usr/bin/env python3
"""v0.5h: bench-only removable capstan/steel-flat-strip interface.
3 mm commercial pivot, M3 standard fasteners, stock strip; no CNC.
The load-path is still a concept, not a medically cleared part.
"""
import json, math, time
from pathlib import Path
from itertools import combinations
import cadquery as cq

HERE=Path(__file__).parent
PIN_R=1.5; BORE_R=1.65
BOLT_XS=[7.5,14.,23.]
PLATE_WIDTH=12.; PLATE_THICK=2.0
PLATE_Z=(7.0,9.0)
CAPSTAN_Z=(9.0,11.4)
TIP_STUD_R=3.45
STUD_BASE_Z=1.0
MCP_MAX=60

def box(a,b,c,d,e,f):
    return cq.Workplane('XY').box(b-a,d-c,f-e).translate(((a+b)/2,(c+d)/2,(e+f)/2)).val()
def cylinder(r,z,h,x=0,y=0):
    return cq.Solid.makeCylinder(r,h,cq.Vector(x,y,z),cq.Vector(0,0,1))
def capsule(x0,x1,r,z0,z1):
    q0=cylinder(r,z0,z1-z0,x0);q1=cylinder(r,z0,z1-z0,x1)
    return q0.fuse(q1,box(x0,x1,-r,r,z0,z1)).clean()

def components(deg=0):
    fixed=capsule(-10,0,4,-6.5,-2.2).fuse(capsule(-10,0,4,2.2,6.5),box(-13,-9,-4,4,-6.5,6.5)).clean()
    fixed=fixed.cut(cylinder(1.6,-10,20)).clean()
    guide=box(-14,-10,4.3,7.0,7.9,11.8)
    guide=guide.cut(cq.Solid.makeCylinder(.8,5,cq.Vector(-14.5,5.8,10.2),cq.Vector(1,0,0)))
    fixed=fixed.fuse(guide,box(-13,-10,3.2,5.1,6.1,8.7)).clean()

    prox=capsule(0,33,6.25,-1.65,1.65).cut(cylinder(1.6,-2.5,5)).clean()
    for x in BOLT_XS:
        prox=prox.fuse(cylinder(TIP_STUD_R,STUD_BASE_Z,6.0,x=x)).clean()
        prox=prox.cut(cylinder(BORE_R,-2.4,11,x=x)).clean()
    # Plain metal sheet; manually drill holes; not an approved strength design.
    plate=box(-5,29,-PLATE_WIDTH/2,PLATE_WIDTH/2,*PLATE_Z)
    for x in [0.]+BOLT_XS:
        plate=plate.cut(cylinder(BORE_R,6.5,3,x=x)).clean()

    drum=cylinder(5.2,CAPSTAN_Z[0],CAPSTAN_Z[1]-CAPSTAN_Z[0])
    arm=box(2.5,16.,-5.2,5.2,*CAPSTAN_Z)
    cap=drum.fuse(arm).cut(cylinder(BORE_R,CAPSTAN_Z[0]-.2,3)).clean()
    groove=cq.Solid.makeTorus(5.2,.65,cq.Vector(0,0,10.2),cq.Vector(0,0,1))
    cap=cap.cut(groove).clean()
    for x in BOLT_XS[:2]:cap=cap.cut(cylinder(BORE_R,8.8,3.,x=x)).clean()

    bolt_solids={}
    for i,x in enumerate(BOLT_XS):
        top=11.4 if i<2 else 9.0
        shaft=cylinder(1.5,-4.5,top+4.5,x=x)
        head=cylinder(2.7,top,.9,x=x)
        bolt_solids['m3_bolt_%d'%(i+1)]=shaft.fuse(head).clean()
        nut=(cq.Workplane('XY').polygon(6,6.35).extrude(2.4).translate((x,0,-4.25)).val()
             .cut(cylinder(1.65,-4.35,2.6,x=x)).clean())
        bolt_solids['m3_nut_%d'%(i+1)]=nut

    pin=cylinder(1.5,-7.2,16.0).fuse(cylinder(2.6,-8.3,1.1)).clean()
    moving={'phalanx_print':prox,'steel_strip':plate,'capstan_print':cap,**bolt_solids}
    moving={name:p.rotate((0,0,0),(0,0,1),deg) for name,p in moving.items()}
    return {'clevis_guide':fixed,'pivot_mock':pin,**moving}

INTENTIONAL={frozenset(x) for x in [
    ('pivot_mock','clevis_guide'),('pivot_mock','steel_strip'),('pivot_mock','capstan_print'),
    ('pivot_mock','phalanx_print'),('phalanx_print','steel_strip'),
    ('steel_strip','capstan_print'),('phalanx_print','capstan_print'),
] + [(b,c) for b in ('m3_bolt_1','m3_bolt_2','m3_bolt_3') for c in ('phalanx_print','steel_strip','capstan_print')] + [
    ('m3_bolt_'+str(i),'m3_nut_'+str(i)) for i in (1,2,3)
]}

def overlap(a,b):
    aa,bb=a.BoundingBox(),b.BoundingBox()
    if any(min(getattr(aa,k+'max'),getattr(bb,k+'max'))<=max(getattr(aa,k+'min'),getattr(bb,k+'min')) for k in 'xyz'):
        return 0.0
    return a.intersect(b).Volume()

def audit(angles=range(0,61,2),export=True):
    start=time.monotonic()
    rep={'version':'v0.5h','scope':'isolated MCP replaceable printed spool + flat metal strap',
         'poses_deg':list(angles),'body_checks':0,'pair_checks':0,'exact_brep_candidates':0,
         'intentional_joint_pairs_excluded':sorted([sorted(s) for s in INTENTIONAL]),
         'invalid':[],'unintended_penetrations':[],'all_touch_and_load_tests':'NOT PERFORMED',
         'manufacturability':{'flat_bar_mm':[34,12,2],'holes_x_mm':[0]+BOLT_XS,'nominal_hole_diameter_mm':3.3,
          'method':'off-the-shelf strip cut/file/drill, PETG printed bench-only shell and drum, commercial M3 bolts'},
         'limitations':['Physical cable knot/capstan coupling unbuilt','no verification of all intentional mating/contact loads',
          'Steel grade and tolerance unspecified','axial retention unresolved',
          'bolt threads and washer interfaces not modeled; standard nut envelopes only',
          'no return spring or emergency release','no FEA/fatigue/physical assembly',
          'no CMC/global hand integration','no tested 1.5s / EMG / IP / 8 grasps / 10kg']}
    for angle in rep['poses_deg']:
        sh=components(angle)
        for name,p in sh.items():
            rep['body_checks']+=1
            if not p.isValid() or len(p.Solids())!=1:
                rep['invalid'].append({'deg':angle,'part':name,'solids':len(p.Solids()),'valid':p.isValid()})
        for a,b in combinations(sh,2):
            if frozenset((a,b)) in INTENTIONAL:continue
            rep['pair_checks']+=1
            aa,bb=sh[a].BoundingBox(),sh[b].BoundingBox()
            if all(min(getattr(aa,k+'max'),getattr(bb,k+'max'))>max(getattr(aa,k+'min'),getattr(bb,k+'min')) for k in 'xyz'):
                rep['exact_brep_candidates']+=1
                vol=sh[a].intersect(sh[b]).Volume()
                if vol>.02: rep['unintended_penetrations'].append({'deg':angle,'a':a,'b':b,'mm3':round(vol,5)})
    rep['status']='SAMPLED_LOCAL_PASS' if not rep['invalid'] and not rep['unintended_penetrations'] else 'REWORK'
    rep['elapsed_s']=round(time.monotonic()-start,2)
    (HERE/'audit_v05h.json').write_text(json.dumps(rep,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    if export:
        for a in [0,20,40,60]:
            cq.exporters.export(cq.Compound.makeCompound(list(components(a).values())),str(HERE/f'mcp_reinforced_{a:02d}.step'))
        for name in ['clevis_guide','phalanx_print','capstan_print']:
            cq.exporters.export(components(0)[name],str(HERE/f'FDM_SHAPE_ONLY_{name}.stl'),
                                tolerance=.12,angularTolerance=.1)
        cq.exporters.export(components(0)['steel_strip'],str(HERE/'plate_drilling_REFERENCE.step'))
    print('AUDIT',rep['status'],'invalid',len(rep['invalid']),'collisions',len(rep['unintended_penetrations']),
          'bodies',rep['body_checks'],'pairs',rep['pair_checks'],'BRep candidates',rep['exact_brep_candidates'])
    return rep

if __name__=='__main__': audit(range(61))
