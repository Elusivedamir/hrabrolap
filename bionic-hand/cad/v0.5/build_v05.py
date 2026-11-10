#!/usr/bin/env python3
"""Bionic hand v0.5: CAD ANATOMICAL LAYOUT, not a functional/approved prosthesis.
2026-11-10. Requires cadquery, trimesh, numpy, vtk (for animation, separate script).
Coordinate frame: x distal, y palmar normal (flexion towards +y), z lateral; index on +z side.
Palm nominal -122 <= x <= 0, -42.5 <= z <= 42.5. Thumb may extend beyond palm width.
"""
from pathlib import Path
import numpy as np, math, json
import cadquery as cq
import trimesh
ROOT=Path(__file__).resolve().parent
OUT=ROOT/'parts';OUT.mkdir(exist_ok=True)
# Geometry: prototype hinge-clevis envelopes, metal bearing pins have NOT been designed.
# Approximate interphalangeal ratios informed by Hamilton & Dunsmuir (2002), J Hand Surg Br: 
# MCP-to-PIP ≈ PIP-to-tip and (PIP-to-DIP)/(DIP-to-tip) ≈ 1.3 for long fingers, ~1 for little finger.
# These are NOT anthropometric personal measurements.
DIGITS=[
 {'name':'pinky','z':-30.75,'base_x':-10,'lengths':[30.5,15.25,15.25],'width':11.5},
 {'name':'ring','z':-10.25,'base_x':-3,'lengths':[39,22,17],'width':14.0},
 {'name':'middle','z':10.25,'base_x':0,'lengths':[42,23.7,18.3],'width':15.0},
 {'name':'index','z':30.75,'base_x':-6,'lengths':[37.5,21.2,16.3],'width':14.0},
]
THUMB={'name':'thumb','base':[-53,11,34.5],'lengths':[33,25], 'width':12.5,
 'base_yaw_open_deg':-32, 'base_yaw_closed_deg':-20, 'base_yaw_opposed_deg':30}

# CAD helper: 2D capsule along local x extruded to z layer.
def cyl(x,r,z0,z1):
 return cq.Solid.makeCylinder(r,z1-z0,cq.Vector(x,0,z0),cq.Vector(0,0,1))
def box(x0,x1,y0,y1,z0,z1):
 return cq.Workplane('XY').box(x1-x0,y1-y0,z1-z0).translate(((x0+x1)/2,(y0+y1)/2,(z0+z1)/2)).val()
def capsule(xa,xb,r,z0,z1):
 if xa>xb: xa,xb=xb,xa
 b=box(xa,xb,-r,r,z0,z1) if xb-xa>1e-6 else cyl(xa,r,z0,z1)
 return b.fuse(cyl(xa,r,z0,z1)).fuse(cyl(xb,r,z0,z1)).clean()
def bore(s,x,h=22):
 return s.cut(cq.Solid.makeCylinder(1.60,h,cq.Vector(x,0,-h/2),cq.Vector(0,0,1))).clean()
def seg_solid(L,W,kind):
 # Central hinge eye at x=0 fits between the previous segment's fork z=+-2.5.
 eye=capsule(0,8,3.8,-1.65,1.65)
 if kind in ('prox','middle'):
  if L<18:  # little-finger middle: compact hinge geometry avoids interference
   eye=capsule(0,7,3.1,-1.65,1.65)
   body=capsule(7,8,2.0,-W/2,W/2)
   fork_a=capsule(L-4,L,3.0,-W/2,-2.4)
   fork_b=capsule(L-4,L,3.0,2.4,W/2)
  else:
   body=capsule(10.5,max(10.5,L-11),4.5,-W/2,W/2)
   fork_a=capsule(L-9,L,4.0,-W/2,-2.4)
   fork_b=capsule(L-9,L,4.0,2.4,W/2)
  s=eye.fuse(body).fuse(fork_a).fuse(fork_b).clean()
  s=bore(bore(s,0),L)
 else:
  # Distal cap, rounded fingertip.
  body=capsule(9,max(9,L-4.0),4.0,-W/2,W/2)
  s=bore(eye.fuse(body).clean(),0)
 if not s.isValid(): raise ValueError('invalid BRep '+kind)
 return s

def mount(MCP,W):
 # Temporary mount clevis, M3 pin axis z. Engineering interface to chassis unresolved.
 shoe=box(-31,MCP-10,-13.5,-7.6,-W/2,W/2)
 forks=[]
 for z0,z1 in [(-W/2,-2.4),(2.4,W/2)]:
  # frame base under fork connects to shoe at distal end
  forks.append(capsule(MCP-14,MCP,4.0,z0,z1).translate((0,-2.0,0)))
 # This mount extension is a spatial placeholder, no assembled fastener head.
 s=shoe.fuse(*forks).clean()
 # Mount pin centre at (MCP,-2); note provisional offset relative to finger MCP y=0!
 # Avoid using this as a final assembled mechanical hinge: mount will be redesigned in v0.6.
 return s

def Rz(angle):
 a=np.deg2rad(angle)
 return np.array([[np.cos(a),-np.sin(a),0],[np.sin(a),np.cos(a),0],[0,0,1]])
def Ry(angle):
 a=np.deg2rad(angle)
 return np.array([[np.cos(a),0,np.sin(a)],[0,1,0],[-np.sin(a),0,np.cos(a)]])
def rigid(s,R,p):
 t=cq.Matrix([[float(R[i,j]) for j in range(3)]+[float(p[i])] for i in range(3)]+[[0,0,0,1]])
 return s.transformGeometry(t)
def kinematics(t):
 # v0.5 prescribed angles, NOT a solved mechanism or actuator linkage.
 # Relative PIP/DIP ratios from prior 75mm prototype are approximate only.
 return [80*t,77.4*t,59.7*t]
def finger_solid_parts(d,t):
 ang=kinematics(t);P=np.array([d['base_x'],0.,d['z']],dtype=float)
 solids=[]
 total=0.
 for i,(L,angle) in enumerate(zip(d['lengths'],ang)):
  total+=angle
  name=['prox','middle','dist'][i];base=seg_solid(L,d['width']*(1-.10*i),name)
  S=rigid(base,Rz(total),P)
  solids.append((d['name']+'_'+name,S))
  P=P+Rz(total)@np.array([L,0.,0.])
 return solids,P

def thumb_parts(t, yaw_override=None, flex_override=None):
 # Thumb has CMC yaw in x-z plane and 2 planar joints. No tendon, saddle or opposition solver yet.
 yaw=(THUMB['base_yaw_open_deg']*(1-t)+THUMB['base_yaw_closed_deg']*t) if yaw_override is None else yaw_override
 flex_t=t if flex_override is None else flex_override
 flex1=35*flex_t; flex2=48*flex_t
 Rcmc=Ry(yaw)
 P=np.array(THUMB['base'],dtype=float)
 solids=[]
 for i,(L,flex) in enumerate(zip(THUMB['lengths'],[flex1,flex2])):
  localR=Rcmc@Rz(flex1+(flex2 if i else 0))
  name='prox' if i==0 else 'dist'
  solid=seg_solid(L,THUMB['width']*(1-.08*i), 'prox' if i==0 else 'dist')
  # Note: thumb distal intended fork from proximal; no third thumb phalanx.
  solids.append(('thumb_'+name,rigid(solid,localR,P)))
  P=P+localR@np.array([L,0.,0.])
 return solids,P

def reference_palm():
 # Import real v0.4 frame CAD, does not yet support changed finger MCP positions.
 p=ROOT/'baseline_v04_chassis.step'
 if not p.exists(): p=Path('/mnt/data/palm_v04_parts/palm_chassis_122x85_v04.step')
 if not p.exists():raise FileNotFoundError('missing baseline v0.4 frame: '+str(p))
 s=cq.importers.importStep(str(p)).val()
 # Prototype mounting standoff for relocated thumb, non-load-rated
 stub=box(-59,-47,0.2,6.8,30,39.5)
 s=s.fuse(stub).clean()
 assert s.isValid()
 return s

# v0.5 geometry records
report={'version':'v0.5 anatomy layout concept','date':'2026-11-10',
 'description':'Revised length/knuckle arc and opposition layout; NOT a validated linkage, strength design or wearable assembly',
 'palm_mm':[122,85], 'wrist_reserved_mm':50,
 'digits':{},'thumb':THUMB,
 'inspection_status':{'part_brep':'to be checked','digit_lengths':'to be checked','continuous_motion':'visual prescribed angles ONLY','full_boolean_assembly':'NOT COMPLETED','FEA':'NOT PERFORMED','motor_fit':'NOT PERFORMED','10kg':'NOT VERIFIED','eight_grips':'NOT VERIFIED','emg':'architecture-only'},
 'warnings':['Finger pivot mounts in v0.5 are spatial placeholders; old v0.4 frame must be redesigned for new x offsets and thumb.',
 'Hinge barrels/eyes model clearances but need bolt heads, fastening, bearing retention and material selection.',
 'Prescribed joint motion in video is not derived from actuator or linkage.',
 'Palm frontal boundary x=0 and width ±42.5; natural finger tips and thumb extend beyond the palm envelope.',
 'Do not wear or load this concept on the body.']}
for d in DIGITS:
 parts,P=finger_solid_parts(d,0)
 T=sum(d['lengths']);report['digits'][d['name']]={'target_mm':T,'segments_mm':d['lengths'],'base_mm':[d['base_x'],0,d['z']],'tip_straight_mm':[float(x) for x in P], 'width_mm':d['width']}
 assert T in [75,84,78,61]
# create export neutral static 3D assembly with all parts as separate STEP components
s0=[]
frame=reference_palm()
s0.append(('existing_v04_chassis_reference',frame))
for d in DIGITS:
 s0.extend(finger_solid_parts(d,0)[0])
 # NOTE do not add fabricated mount which hasn't valid coaxial location
s0.extend(thumb_parts(0)[0])
# STEP exports for all movable parts, reference frame and assembly by compound
for name,s in s0:
 cq.exporters.export(s,str(OUT/f'{name}.step'))
# Export a multi-solid STEP reference assembly; individual solid names in manifest.
cq.exporters.export(cq.Compound.makeCompound([s for _,s in s0]), str(ROOT/'hand_v05_straight_reference.step'))
# Mesh / GLB animation scene at 3 poses, keeps components separated.
colors={'frame':[56,79,103,255],'prox':[187,207,223,255],'middle':[112,165,208,255], 'dist':[67,120,170,255],'thumb':[198,143,68,255]}
def mesh_part(s):
 m=trimesh.Trimesh(*s.tessellate(0.13),process=False) if False else None
 # use STL export through CAD engine
 import tempfile
 with tempfile.NamedTemporaryFile(suffix='.stl') as f:
  cq.exporters.export(s, f.name, tolerance=0.12, angularTolerance=0.12)
  return trimesh.load(f.name,force='mesh')

def scene_for(t,thumb_yaw=None,thumb_flex=None):
 sc=trimesh.Scene()
 def add(n,s):
  m=mesh_part(s)
  key='frame' if n.startswith('existing') else 'thumb' if n.startswith('thumb') else ('prox' if n.endswith('prox') else 'middle' if n.endswith('middle') else 'dist')
  m.visual.face_colors=colors[key]
  sc.add_geometry(m,node_name=n,geom_name=n)
 add('existing_v04_chassis_reference',frame)
 for d in DIGITS:
  for n,s in finger_solid_parts(d,t)[0]:add(n,s)
 for n,s in thumb_parts(t,thumb_yaw,thumb_flex)[0]:add(n,s)
 return sc

if __name__=='__main__':
 for t,tag in [(0,'open'),(.5,'mid'),(1,'closed'),(.25,'opposition')]:
  sc=scene_for(t, 30 if tag=='opposition' else None, 1 if tag=='opposition' else None);f=ROOT/f'hand_v05_{tag}.glb';sc.export(str(f));print(f.name, f.stat().st_size, 'nodes',len(sc.geometry))
 for name,s in s0:
  report.setdefault('geometry',{})[name]={'is_valid':bool(s.isValid()),'volume_mm3':round(s.Volume(),1), 'bbox_mm':[[round(v,2) for v in p] for p in [[s.BoundingBox().xmin,s.BoundingBox().ymin,s.BoundingBox().zmin],[s.BoundingBox().xmax,s.BoundingBox().ymax,s.BoundingBox().zmax]]]}
 report['inspection_status']['part_brep']='PASS individually: CadQuery OCC isValid on 15 solids'
 (ROOT/'report_v05.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 print('targets:',{d['name']:sum(d['lengths']) for d in DIGITS}, 'thumb',sum(THUMB['lengths']),'mm')