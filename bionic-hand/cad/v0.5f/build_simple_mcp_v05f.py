#!/usr/bin/env python3
"""v0.5f: isolated 3D MCP demo, copied v0.5d local dimensions.
NOT the full hand. The cable terminals, return spring, CMC transfer,
real boot, actuators, 8 grasps and real strength are NOT modeled.
"""
import math, json
from pathlib import Path
from itertools import combinations
import cadquery as cq
P=Path(__file__).resolve().parent
ROUTES=[2.5,3.0,3.5,4.0,7.0]
CABLE_Z=9.5
CABLE_R=.6
BOOT={'x':[-16,7],'y':[-7,7],'z':[-10,12]} # only a proposed +2mm LOCAL boot reservation

def box(x0,x1,y0,y1,z0,z1):
    return cq.Workplane('XY').box(x1-x0,y1-y0,z1-z0).translate(((x0+x1)/2,(y0+y1)/2,(z0+z1)/2)).val()
def cyl(r,h,z):
    return cq.Solid.makeCylinder(r,h,cq.Vector(0,0,z),cq.Vector(0,0,1))
def capsule(x0,x1,r,z0,z1):
    c1=cq.Solid.makeCylinder(r,z1-z0,cq.Vector(x0,0,z0),cq.Vector(0,0,1))
    c2=cq.Solid.makeCylinder(r,z1-z0,cq.Vector(x1,0,z0),cq.Vector(0,0,1))
    return box(x0,x1,-r,r,z0,z1).fuse(c1,c2).clean()
def segment(a,b,r,trim=0):
    av,bv=cq.Vector(*a),cq.Vector(*b);d=bv-av;v=d.normalized()
    return cq.Solid.makeCylinder(r,d.Length-2*trim,av+v.multiply(trim),v)
def parts(angle,y):
    fork=capsule(-10,0,4,-6.5,-2.2).fuse(capsule(-10,0,4,2.2,6.5),box(-13,-9,-4,4,-6.5,6.5)).cut(cyl(1.6,20,-10)).clean()
    prox=capsule(0,33,6.25,-1.65,1.65).cut(cyl(1.6,5,-2.5)).clean()
    guide=box(-13.6,-10.5,y-2.5,y+2.5,5,11.5)
    guide=guide.cut(cq.Solid.makeCylinder(1.2,5,cq.Vector(-14,y,CABLE_Z),cq.Vector(1,0,0)))
    anchor=box(10,14,y-2.5,y+2.5,.6,11.5)
    anchor=anchor.cut(cq.Solid.makeCylinder(1.2,6,cq.Vector(9,y,CABLE_Z),cq.Vector(1,0,0)))
    fork=fork.fuse(guide).clean();prox=prox.fuse(anchor).clean().rotate((0,0,0),(0,0,1),angle)
    pin=cyl(1.5,15.7,-7.2).fuse(cyl(2.6,1.1,-8.3)).clean()
    clip=cyl(2.6,.5,7.65).cut(cyl(1.25,.7,7.55)).cut(box(0,4,-.6,.6,7.5,8.3)).clean()
    a=(-12,y,CABLE_Z);q=math.radians(angle)
    b=(12*math.cos(q)-y*math.sin(q),12*math.sin(q)+y*math.cos(q),CABLE_Z)
    # 2.8mm free-end trim avoids claiming an unmodeled cable attachment as a checked contact.
    return {'fixed':fork,'moving':prox,'pin':pin,'clip_envelope':clip,
            'free_cable':segment(a,b,CABLE_R,2.8)},a,b

def volume_if_AABB_overlaps(a,b):
    aa,bb=a.BoundingBox(),b.BoundingBox()
    if any(min(getattr(aa,k+'max'),getattr(bb,k+'max'))<=max(getattr(aa,k+'min'),getattr(bb,k+'min')) for k in 'xyz'):
        return 0.
    return a.intersect(b).Volume()

def boot_yz_ok(a,b):
    # Only the fraction inside the boot X slab: finger exit gets its own separate sleeve.
    ts=[0.,1.]+[(x-a[0])/(b[0]-a[0]) for x in BOOT['x']]
    ts=[t for t in ts if 0<=t<=1 and BOOT['x'][0]<=a[0]+t*(b[0]-a[0])<=BOOT['x'][1]]
    return all(min(a[i]+(b[i]-a[i])*t for t in ts)-CABLE_R>=BOOT[axis][0]
               and max(a[i]+(b[i]-a[i])*t for t in ts)+CABLE_R<=BOOT[axis][1]
               for i,axis in ((1,'y'),(2,'z')))

def audit():
    report={'version':'v0.5f','scope':'isolated MCP only, not 25-/36-body full hand',
            'proposed_boot_z_plus_mm':2,'data':[],
            'known_missing':['Full-hand assembly','real Bowden sheath and cable clamps',
                             'return spring','actuator','CMC cable crossing','emergency release',
                             'IP','FEA','physical tests','8 grips','10kg','1.5s under load']}
    for y in ROUTES:
        row={'route_y_mm':y,'sampled_deg':list(range(21)),'invalid':[], 'interferences':[],
             'boot_out':[],'hole_axis_rubbing_risk':[]}
        for a in range(21):
            shapes,start,end=parts(a,y)
            for n,solid in shapes.items():
                if not solid.isValid() or len(solid.Solids())!=1:row['invalid'].append([a,n])
            # No counting intended pin/eye toleranced fits or nonexistent cable-terminal interfaces.
            for x,z in [('fixed','moving'),('fixed','free_cable'),('moving','free_cable'),
                        ('pin','free_cable'),('clip_envelope','free_cable')]:
                vol=volume_if_AABB_overlaps(shapes[x],shapes[z])
                if vol>.02:row['interferences'].append([a,x,z,round(vol,4)])
            if not boot_yz_ok(start,end):row['boot_out'].append(a)
            theta=math.atan2(end[1]-start[1],end[0]-start[0])
            # Two simple straight holes Ø2.4; worst angular deviation across half hole lengths.
            if max(1.55*abs(math.tan(theta)),2*abs(math.tan(theta-math.radians(a))))>1.2-CABLE_R-.2:
                row['hole_axis_rubbing_risk'].append(a)
        L0=math.dist(*parts(0,y)[1:]);L20=math.dist(*parts(20,y)[1:])
        row['cable_travel_0to20_mm']=round(L0-L20,4)
        # Torque assumes F_tip 0.5N, 58mm moment arm, drum r=3mm, efficiency 0.6;
        # it is NOT a continuous servo capability or a demonstrated thumb force.
        row['torque_0p5N_tip_hypothesis_Nm']=round(.5*58/y*.003/.6,4)
        report['data'].append(row)
    for angle in (0,10,20):
        shapes,_,_=parts(angle,3.)
        cq.exporters.export(cq.Compound.makeCompound(list(shapes.values())),str(P/f'mcp_v05f_{angle:02d}.step'))
        if angle==0:
            for n in ('fixed','moving'):
                cq.exporters.export(shapes[n],str(P/f'FDM_SHAPE_ONLY_{n}.stl'),tolerance=.10,angularTolerance=.15)
    (P/'audit_simple_v05f.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    for row in report['data']:
        print(row['route_y_mm'],'invalid',len(row['invalid']),'intersections',len(row['interferences']),
              'boot_fail',len(row['boot_out']),'skew_fail',len(row['hole_axis_rubbing_risk']))
    s=[x for x in report['data'] if x['route_y_mm']==3][0]
    assert not (s['invalid'] or s['interferences'] or s['boot_out'] or s['hole_axis_rubbing_risk']), '3mm route failed'
    return report
if __name__=='__main__':audit()
