#!/usr/bin/env python3
"""v0.5i: cheap extension spring path exploration around isolated v0.5h.
Straight 2mm tube only, EXCLUDES hooks, coils, anchors, end attachments.
No user-safe emergency release / return is proved.
"""
import sys,math,json
from pathlib import Path
from itertools import product
import cadquery as cq
HERE=Path(__file__).parent
sys.path.insert(0,str(HERE.parent/'v0.5h'))
from build_reinforced_mcp import components
def rotated(x,y,z,deg):
 a=math.radians(deg)
 return (x*math.cos(a)-y*math.sin(a),x*math.sin(a)+y*math.cos(a),z)
def tube(f,p,r=1.,trim=3.):
 v,w=cq.Vector(*f),cq.Vector(*p);d=w-v;unit=d.normalized()
 return cq.Solid.makeCylinder(r,d.Length-2*trim,v+unit.multiply(trim),unit)
def intersection(a,b):
 aa,bb=a.BoundingBox(),b.BoundingBox()
 if any(min(getattr(aa,k+'max'),getattr(bb,k+'max'))<=max(getattr(aa,k+'min'),getattr(bb,k+'min')) for k in 'xyz'):return 0.
 return a.intersect(b).Volume()
def run():
 angles=range(0,61,10)
 obstacles={angle:components(angle) for angle in angles}
 rep={'version':'v0.5i','scope':'spring LINE feasibility only on ISOLATED MCP',
      'tube_diameter_assumed_mm':2.,'trimmed_ends_each_mm':3.,
      'angle_sample_deg':list(angles),'candidates':[],
      'warnings':['No actual spring coil, hooks or attachment bosses modelled',
          'No shell integration or full hand','Spring stiffness/force/torque not measured',
          'Even a path without collision does NOT prove automatic opening',
          'Self-locking gearbox can block spring return','No physical spring or quick release tested']}
 for fx,fy,mx,z in product((-4.,-6.),(-11.,-14.),(12.,16.),
                           (-11.5,-9.5,-8.8,-8.,-7.,-5.,-1.9,3.)):
  f=(fx,fy,z)
  lengths=[math.dist(f,rotated(mx,0.,z,a)) for a in range(61)]
  if not all(lengths[i+1]>=lengths[i]-1e-9 for i in range(60)):continue
  hits=[]
  for angle in angles:
   t=tube(f,rotated(mx,0,z,angle))
   for name,solid in obstacles[angle].items():
    v=intersection(t,solid)
    if v>.02:hits.append({'angle':angle,'part':name,'volume_mm3':round(v,3)})
  outside=z-1 < -10 or z+1 >12
  rep['candidates'].append({'fixed_xyz':f,'moving_xyz_in_base_frame':[mx,0,z],
    'extension_0to60_mm':round(lengths[-1]-lengths[0],3),
    'extension_monotonic_61_samples':True,
    'interference_count_7_poses':len(hits),'first_hits':hits[:4],
    'outside_old_local_z_keepout':outside})
 rep['summary']={'total_monotonic_candidates':len(rep['candidates']),
    'outside_boot_collision_free_7_poses':sum(c['outside_old_local_z_keepout'] and c['interference_count_7_poses']==0 for c in rep['candidates']),
    'inside_boot_collision_free_7_poses':sum((not c['outside_old_local_z_keepout']) and c['interference_count_7_poses']==0 for c in rep['candidates']),
    'inside_boot_interfering_7_poses':sum((not c['outside_old_local_z_keepout']) and c['interference_count_7_poses']>0 for c in rep['candidates'])}
 rep['status']='REWORK: no candidate both collision-free and within OLD z reserve; housing and attachment choices unresolved'
 (HERE/'spring_screen_v05i.json').write_text(json.dumps(rep,indent=2,ensure_ascii=False)+'\n')
 print(rep['summary'],rep['status'])
 return rep
if __name__=='__main__':run()
