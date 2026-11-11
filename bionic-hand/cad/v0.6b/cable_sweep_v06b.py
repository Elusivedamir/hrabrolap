#!/usr/bin/env python3
"""v0.6b independent cable-vs-reel CAD sweep, based on v0.5h.
Previously OMITTED cable modeled as segmented 3D cylinders.
NOT true rope/groove contact, validated mechanical drive or load test.
Run from cad/v0.6b, with sibling cad/v0.5h checked out.
"""
from pathlib import Path
import sys, math, json
import cadquery as cq
from cadquery import Vector

HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'v0.5h'))
from build_reinforced_mcp import box, cylinder

CABLE_R=0.6       # Ø1.2 nominal, material not selected
R_CENTER=5.8      # radius of drum 5.2 + half rope diameter
Z=10.2
SAMPLES=list(range(0,61,5))
HALF_WIDTHS=(5.2,2.4)

def cable_segments(deg):
    q=math.radians(deg)
    # Through static guide -> tangent -> wrap from 90deg to 90+MCP.
    # This is a CHORD APPROXIMATION, max angular step 3 degrees.
    pts=[(-14.,R_CENTER,Z),(-12.,R_CENTER,Z),(-10.,R_CENTER,Z),
         (-7.,R_CENTER,Z),(0.,R_CENTER,Z)]
    if deg:
        n=max(1,math.ceil(deg/3))
        pts.extend((R_CENTER*math.cos(math.pi/2+q*j/n),
                    R_CENTER*math.sin(math.pi/2+q*j/n),Z)
                   for j in range(1,n+1))
    solids=[]
    for a,b in zip(pts,pts[1:]):
        v,w=Vector(*a),Vector(*b)
        if (w-v).Length>1e-9:
            solids.append(cq.Solid.makeCylinder(CABLE_R,(w-v).Length,v,(w-v).normalized()))
    return solids

def reel(deg,half_width):
    cap=cylinder(5.2,9,2.4).fuse(box(2.5,16,-half_width,half_width,9,11.4))
    cap=cap.cut(cylinder(1.65,8.8,3)).clean()
    cap=cap.cut(cq.Solid.makeTorus(5.2,.65,Vector(0,0,Z),Vector(0,0,1))).clean()
    for x in (7.5,14):
        cap=cap.cut(cylinder(1.65,8.8,3,x=x)).clean()
    return cap.rotate((0,0,0),(0,0,1),deg)

def intersection_sum(segments,solid):
    bb=solid.BoundingBox();out=0.
    for seg in segments:
        b=seg.BoundingBox()
        if all(min(getattr(b,k+'max'),getattr(bb,k+'max'))>max(getattr(b,k+'min'),getattr(bb,k+'min')) for k in 'xyz'):
            out+=seg.intersect(solid).Volume()
    return out

def audit(export=True):
    rows=[]
    for deg in SAMPLES:
        tubes=cable_segments(deg)
        row={'mcp_deg':deg,'cable_segment_count':len(tubes)}
        for width in HALF_WIDTHS:
            cap=reel(deg,width)
            row['w'+str(width)]={
                'shape_valid':cap.isValid() and len(cap.Solids())==1,
                'penetration_sum_mm3':round(intersection_sum(tubes,cap),5)}
        rows.append(row)
    result={
      'version':'v0.6b','date':'2026-11-11',
      'reference':'v0.5h isolated geometry; NOT complete hand',
      'method':'CadQuery cylindrical cable chords, radius 0.6mm, arc segments ≤3 degrees; intentional groove contact not separately load-modelled',
      'sampled_mcp_degrees':SAMPLES,'cable_center_radius_mm':R_CENTER,
      'original_arm_full_width_mm':10.4,'test_arm_full_width_mm':4.8,
      'rows':rows,
      'old_variant_collides':any(x['w5.2']['penetration_sum_mm3']>.02 for x in rows),
      'slim_geometric_candidate_passes_samples':all(
          x['w2.4']['shape_valid'] and x['w2.4']['penetration_sum_mm3']<=.02 for x in rows),
      'critical_blocker':'trial 4.8mm web leaves only 0.75mm nominal side wall per Ø3.3 bolt hole, NOT load-worthy',
      'not_proved':['cable/winch end anchor','strand wear or friction',
      'functional automatic return and power-off release','fastener loads or preload',
      'full 5 finger CAD','dynamic forces','FEA and fatigue','IP','safe on-body use'],
      'status':'ORIGINAL_FAILED_WITH_CABLE; SLIM_VARIANT_GEOMETRIC_ONLY'
    }
    assert result['old_variant_collides'] and result['slim_geometric_candidate_passes_samples']
    (HERE/'cable_sweep_v06b.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    if export:
        cq.exporters.export(reel(0,2.4),str(HERE/'FDM_SHAPE_ONLY_NARROW_CAPSTAN.stl'),tolerance=.1,angularTolerance=.1)
        cq.exporters.export(reel(0,2.4),str(HERE/'FDM_SHAPE_ONLY_NARROW_CAPSTAN.step'))
    print(result['status'])
    for row in rows:print(row['mcp_deg'],row['w5.2']['penetration_sum_mm3'],row['w2.4']['penetration_sum_mm3'])
    return result

if __name__=='__main__':audit()
