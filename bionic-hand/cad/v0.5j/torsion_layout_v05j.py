#!/usr/bin/env python3
"""v0.5j: space-only model for a possible stock torsion spring around longer Ø3 pin.
This solid annulus is NOT a helically wound spring. Legs, mounts, safe return,
metal strength, retention and IP are not modeled. No use on body.
"""
import sys,json
from pathlib import Path
import cadquery as cq
HERE=Path(__file__).parent
sys.path.insert(0,str(HERE.parent/'v0.5h'))
from build_reinforced_mcp import components
def cyl(r,z,h):
 return cq.Solid.makeCylinder(r,h,cq.Vector(0,0,z),cq.Vector(0,0,1))
def layout(deg):
 s=components(deg)
 del s['pivot_mock']
 s['LONGER_PIVOT_MOCK']=cyl(1.5,-11.5,20.3).fuse(cyl(2.6,-12.6,1.1)).clean()
 s['TORSION_COIL_ENVELOPE']=cyl(3.3,-10.8,2.3).cut(cyl(1.85,-10.9,2.5)).clean()
 return s
def intersect(a,b):
 aa,bb=a.BoundingBox(),b.BoundingBox()
 if any(min(getattr(aa,k+'max'),getattr(bb,k+'max'))<=max(getattr(aa,k+'min'),getattr(bb,k+'min')) for k in 'xyz'):return 0.
 return a.intersect(b).Volume()
def audit():
 rep={'version':'v0.5j','model':'solid coil envelope and longer stock-pin envelope; not actual spring or rated catalogue part',
      'angles_deg':list(range(61)),'body_checks':0,'coil_other_body_checks':0,
      'invalid':[],'coil_collisions':[],'coil_ID_OD_length_mm':[3.7,6.6,2.3],
      'coil_z_bounds_mm':[-10.8,-8.5], 'pin_z_bounds_including_head_mm':[-12.6,8.8],
      'old_boot_z_min_mm':-10,'axial_head_below_old_boot_mm':2.6,
      'unverified':['actual off-the-shelf coil ID/OD/leg stiffness','bent legs & attachments','pin head retention and bearing surfaces',
                   'full shell and 85mm palm','tendon & emergency disconnect','motor backdrive after loss of power','strength/fatigue/physical tests']}
 for a in rep['angles_deg']:
  sh=layout(a)
  for name,p in sh.items():
   rep['body_checks']+=1
   if not p.isValid() or len(p.Solids())!=1:rep['invalid'].append((a,name))
  coil=sh['TORSION_COIL_ENVELOPE']
  for name,p in sh.items():
   if name in ('TORSION_COIL_ENVELOPE','LONGER_PIVOT_MOCK'):continue
   rep['coil_other_body_checks']+=1
   v=intersect(coil,p)
   if v>.02:rep['coil_collisions'].append((a,name,round(v,4)))
 rep['status']='SAMPLED_COIL_VOLUME_ONLY_PASS' if not rep['invalid'] and not rep['coil_collisions'] else 'REWORK'
 (HERE/'torsion_coil_screen_v05j.json').write_text(json.dumps(rep,indent=2,ensure_ascii=False)+'\n')
 for a in (0,30,60):
  cq.exporters.export(cq.Compound.makeCompound(list(layout(a).values())),str(HERE/f'torsion_envelope_{a:02d}.step'))
 print(rep['status'],rep['body_checks'],rep['coil_other_body_checks'],len(rep['coil_collisions']))
 return rep
if __name__=='__main__':audit()
