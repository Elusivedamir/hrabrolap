#!/usr/bin/env python3
"""v0.5g, isolated MCP capstan concept, FDM-friendly shape and stock Ø3 pin.

No full hand, IP actuation, full cable joint connection, continuous strength,
validated sealing, real motor, or wearable hardware. The ideal rope path is a
separate analytic path with a fixed tangency and moving endpoint; it does not
model a physical anchor knot nor prove cable wrap contact or running friction.
"""
from __future__ import annotations
import json, math, platform, time
from pathlib import Path
from itertools import combinations
import cadquery as cq
import numpy as np
P = Path(__file__).resolve().parent
RADIUS = 5.2                 # 3D rim, mm
CABLE_RADIUS = .6            # candidate 1.2mm cable, mm
CABLE_CENTER_RADIUS = RADIUS + CABLE_RADIUS  # ideal tangent radius 5.8
CABLE_Z=9.6
ANGLE_MAX=60
BOOT = {'x':[-16.,7.], 'y':[-7.,7.], 'z':[-10.,12.]}


def box(x0,x1,y0,y1,z0,z1):
    return cq.Workplane('XY').box(x1-x0,y1-y0,z1-z0).translate(((x0+x1)/2,(y0+y1)/2,(z0+z1)/2)).val()

def cyl(r,h,z):
    return cq.Solid.makeCylinder(r,h,cq.Vector(0,0,z),cq.Vector(0,0,1))

def capsule(x0,x1,r,z0,z1):
    a=cq.Solid.makeCylinder(r,z1-z0,cq.Vector(x0,0,z0),cq.Vector(0,0,1))
    b=cq.Solid.makeCylinder(r,z1-z0,cq.Vector(x1,0,z0),cq.Vector(0,0,1))
    return box(x0,x1,-r,r,z0,z1).fuse(a,b).clean()


def rigid_parts(angle_deg: float):
    # Same local MCP fork eye and stock pin as v0.5d/v0.5f.
    low=capsule(-10,0,4,-6.5,-2.2)
    high=capsule(-10,0,4,2.2,6.5)
    bridge=box(-13,-9,-4,4,-6.5,6.5)
    fixed=low.fuse(high,bridge).cut(cyl(1.6,20,-10)).clean()
    # Standard unmachined stub or screw with proper bearing shoulder still to be chosen.
    pin=cyl(1.5,15.7,-7.2).fuse(cyl(2.6,1.1,-8.3)).clean()
    clip=cyl(2.6,.5,7.65).cut(cyl(1.25,.7,7.55)).cut(box(0,4,-.6,.6,7.5,8.3)).clean()
    # Printed guide boss with a true through bore: not a sealing feedthrough.
    guide=box(-14,-10,4.3,7.0,7.9,11.4).cut(
        cq.Solid.makeCylinder(.75,5,cq.Vector(-14.5,5.8,CABLE_Z),cq.Vector(1,0,0))).clean()
    mount=box(-13,-10,3.2,5.1,6.1,8.7)
    fixed=fixed.fuse(mount,guide).clean()
    # One-print FDM geometry: eye, rib and drum on an external axial plane.
    prox=capsule(0,33,6.25,-1.65,1.65).cut(cyl(1.6,5,-2.5)).clean()
    spine=box(10,14,-1.6,1.6,1.2,9.5)
    plate=box(4.7,14,-1.6,1.6,8.1,10.1)
    drum=cyl(RADIUS,2.0,8.6)
    # Hole at fixed local polar angle 90° to make a visible planned knot/stop
    # location; continuous groove, knot retention and attachment not modeled.
    anchor_hole=cq.Solid.makeCylinder(.75,2.4,cq.Vector(0,3.8,8.4),cq.Vector(0,0,1))
    moving=prox.fuse(spine,plate,drum).cut(anchor_hole).clean().rotate((0,0,0),(0,0,1),angle_deg)
    return {'fork_guide':fixed,'prox_drum':moving,'pin_mock':pin,'retainer_envelope':clip}


def ideal_path(angle_deg:float, n=31):
    """Ideal cord centerline (fixed guide + wrap). Not a checked 3D rope body."""
    q=math.radians(angle_deg)
    line=[(-12.,CABLE_CENTER_RADIUS,CABLE_Z),(-6.,CABLE_CENTER_RADIUS,CABLE_Z),(0.,CABLE_CENTER_RADIUS,CABLE_Z)]
    arc=[(CABLE_CENTER_RADIUS*math.cos(math.pi/2+q*i/(n-1)),
          CABLE_CENTER_RADIUS*math.sin(math.pi/2+q*i/(n-1)),CABLE_Z) for i in range(n)]
    return line,arc


def bboxes_overlap(a,b):
    aa,bb=a.BoundingBox(),b.BoundingBox()
    return all(min(getattr(aa,d+'max'),getattr(bb,d+'max'))>max(getattr(aa,d+'min'),getattr(bb,d+'min')) for d in 'xyz')


def isolated_audit():
    start=time.monotonic()
    # Exclude intended contacts of pin-to-joint and cable-to-guide;
    # include unintended interference of stationary and moving structure.
    tested=[('fork_guide','prox_drum'), ('fork_guide','retainer_envelope'),
            ('prox_drum','retainer_envelope'), ('prox_drum','pin_mock')]
    report={'version':'v0.5g','scope':'ISOLATED MCP capstan mock ONLY',
            'angles_deg':list(range(ANGLE_MAX+1)),'cadquery':cq.__version__,
            'python':platform.python_version(), 'part_count':4,'pair_tests_per_pose':len(tested),
            'validity_checks':0,'pair_checks':0,'exact_intersection_candidates':0,
            'threshold_overlap_mm3':.02,'invalid_parts':[],'collisions':[],
            'dimension_mm':{'rim_radius':RADIUS,'cable_radius':CABLE_RADIUS,
                'cable_center_radius':CABLE_CENTER_RADIUS,'cable_height_z':CABLE_Z,
                'proposed_local_boot':BOOT},
            'excluded_intentional_contacts':['fork_guide / pin_mock', 'pin_mock / retainer_envelope'],
            'missing':['physical wrap cable and knot','wall strength and print orientation',
                'return spring','actual motor','Bowden path through rotated CMC','IP movement',
                'entire hand collision sweep','dust-water seal','impact and fatigue','10kg','EMG']}
    for angle in range(ANGLE_MAX+1):
        pieces=rigid_parts(angle)
        for name,body in pieces.items():
            report['validity_checks']+=1
            if not body.isValid() or len(body.Solids()) != 1:
                report['invalid_parts'].append([angle,name,len(body.Solids()),body.isValid()])
        for a,b in tested:
            report['pair_checks']+=1
            if bboxes_overlap(pieces[a],pieces[b]):
                report['exact_intersection_candidates']+=1
                vol=pieces[a].intersect(pieces[b]).Volume()
                if vol>.02: report['collisions'].append([angle,a,b,round(vol,4)])
    path_checks=[]
    for angle in range(0,61):
        line,arc=ideal_path(angle)
        # Straight guide-to-rim cable lies in boot. Moving arc is fully x in +-5.8,
        # y in [-2.9,+5.8], and z=9.6, within the proposed boot boundaries.
        samples=line+arc
        inside=all(BOOT['x'][0]+CABLE_RADIUS <= x <= BOOT['x'][1]-CABLE_RADIUS and
                   BOOT['y'][0]+CABLE_RADIUS <= y <= BOOT['y'][1]-CABLE_RADIUS and
                   BOOT['z'][0]+CABLE_RADIUS <= z <= BOOT['z'][1]-CABLE_RADIUS for x,y,z in samples)
        path_checks.append({'angle':angle,'inside_proposed_boot':inside})
    report['path_samples']=path_checks
    report['ideal_stroke_mm_60deg']=round(CABLE_CENTER_RADIUS*math.radians(60),5)
    report['ideal_spool_turn_deg_for_r3']=round(CABLE_CENTER_RADIUS*60/3,5)
    report['ideal_required_spool_rpm_1p5s_r3']=round((CABLE_CENTER_RADIUS*math.radians(60)/3)/(2*math.pi)/1.5*60,5)
    report['motor_study']={}
    for tipforce in (1,2,5):
        joint=tipforce*.058
        cableforce=joint/(CABLE_CENTER_RADIUS/1000)
        motor=cableforce*.003/.6
        report['motor_study'][str(tipforce)+'N_tip']={'ideal_mcp_Nm':round(joint,5),
              'ideal_tendon_force_N':round(cableforce,4),'motor_torque_scenario_Nm':round(motor,5)}
    report['duration_s']=round(time.monotonic()-start,2)
    report['status']='SAMPLED_LOCAL_PASS' if not report['invalid_parts'] and not report['collisions'] and all(x['inside_proposed_boot'] for x in path_checks) else 'FAIL_OR_REWORK'
    (P/'audit_capstan_v05g.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    for angle in (0,20,40,60):
        pieces=rigid_parts(angle)
        cq.exporters.export(cq.Compound.makeCompound(list(pieces.values())),str(P/f'capstan_demo_{angle:02d}.step'))
    for k,shape in rigid_parts(0).items():
        if k in ('fork_guide','prox_drum'):
            cq.exporters.export(shape,str(P/f'FDM_SHAPE_ONLY_{k}.stl'),tolerance=.1,angularTolerance=.15)
    print('audit:',report['status'],report['validity_checks'],'body checks,',report['pair_checks'],'pair checks,',len(report['collisions']),'collisions,',report['duration_s'],'s')
    return report

if __name__=='__main__':
    r=isolated_audit()
    raise SystemExit(0 if r['status']=='SAMPLED_LOCAL_PASS' else 1)
