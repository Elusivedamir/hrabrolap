#!/usr/bin/env python3
"""v0.5b thumb motion correction, geometric study only; not a functional hinged prototype.

The CMC rest-to-opposition change is modeled as a two-axis coupled position
(angle in palm plane plus palmar abduction) and passive pronation about thumb's
own proximal axis. The IP joint flexes AFTER the CMC orientation transform.
Original 4 fingers and baseline frame from v0.5 are reused.  No powered CMC
mechanism, socket attachment, real tendons, load approval or safe-use claim.
"""
from pathlib import Path
import sys, numpy as np
import cadquery as cq
import trimesh
from scipy.spatial.transform import Rotation as Rot
V05_DIR=Path(__file__).resolve().parent.parent/'v0.5'
if not V05_DIR.exists(): V05_DIR=Path('/mnt/data/bionic_hand_v05')  # local testing fallback
sys.path.insert(0,str(V05_DIR))
from build_v05 import DIGITS, finger_solid_parts, seg_solid, rigid, Rz, Ry, box, mesh_part, reference_palm

ROOT=Path(__file__).resolve().parent
PARTS=ROOT/'parts';PARTS.mkdir(exist_ok=True)
THUMB={"base":[-35.0,12.0,42.0],"proximal":33.0,"distal":25.0,"width":12.5,
       "open":{"yaw_deg":-50.0,"elevation_deg":5.0,"pronation_deg":0.0,"ip_deg":0.0},
       "opposed":{"yaw_deg":22.0,"elevation_deg":45.0,"pronation_deg":30.0,"ip_deg":25.0}}
def Rx(deg):
 a=np.deg2rad(deg);return np.array([[1,0,0],[0,np.cos(a),-np.sin(a)],[0,np.sin(a),np.cos(a)]])
def mix(a,b,q):return a+(b-a)*q

def pose(q=0.,ip_phase=None):
 q=float(q)
 if not 0<=q<=1:raise ValueError('opposition phase 0..1')
 o=THUMB['open'];d=THUMB['opposed']
 ip=q if ip_phase is None else ip_phase
 return {k:mix(o[k],d[k],q if k!='ip_deg' else ip) for k in o}

# A single, FIXED oblique CMC axis connects rest and opposed orientations.
# Unlike independently interpolated Euler angles, this can be made as ONE manual swivel.
R_OPEN=Rz(THUMB['open']['elevation_deg'])@Ry(THUMB['open']['yaw_deg'])@Rx(THUMB['open']['pronation_deg'])
R_OPPOSED=Rz(THUMB['opposed']['elevation_deg'])@Ry(THUMB['opposed']['yaw_deg'])@Rx(THUMB['opposed']['pronation_deg'])
ROT_VEC=Rot.from_matrix(R_OPPOSED@R_OPEN.T).as_rotvec()
SWIVEL_AXIS=ROT_VEC/np.linalg.norm(ROT_VEC)
SWIVEL_DEGREES=np.linalg.norm(ROT_VEC)*180/np.pi

def thumb_parts(q,ip_phase=None):
 angles=pose(q,ip_phase)
 Rc=Rot.from_rotvec(q*ROT_VEC).as_matrix()@R_OPEN
 base=np.array(THUMB['base'])
 L1,L2=THUMB['proximal'],THUMB['distal']
 proximal=rigid(seg_solid(L1,THUMB['width'],'prox'), Rc, base)
 joint=base+Rc@np.array([L1,0.,0.])
 Rd=Rc@Rz(angles['ip_deg'])
 distal=rigid(seg_solid(L2,THUMB['width']*.92,'dist'),Rd,joint)
 tip=joint+Rd@np.array([L2,0.,0.])
 return [('thumb_prox',proximal),('thumb_dist',distal)],{'base':base,'joint':joint,'tip':tip,'angles':angles,'prox_R':Rc,'dist_R':Rd,'swivel_axis':SWIVEL_AXIS, 'swivel_deg':SWIVEL_DEGREES}

def frame_v05b():
 # v0.4 chassis rebuilt without old erroneous thumb support.
 p=V05_DIR/'baseline_v04_chassis.step'
 if not p.exists(): p=Path('/mnt/data/palm_v04_parts/palm_chassis_122x85_v04.step')
 if not p.exists():raise FileNotFoundError('Run ../v0.5/rebuild_baseline_v04.py first; baseline missing '+str(p))
 original=cq.importers.importStep(str(p)).val()
 # Place a conceptual mounting bracket to approach CMC joint from existing radial rim.
 # It is NOT a designed structural fixing: no pin seat, bearing or load path validated.
 base1=box(-53,-41,-0.0,6.0,36.0,40.0)
 base2=box(-44,-40,4.0,9.5,37.0,40.0)
 res=original.fuse(base1,base2).clean()
 assert res.isValid()
 return res

frame=frame_v05b()

def all_shapes(t_four,q_thumb,ip_phase=None):
 pieces=[('frame_reference',frame)]
 for d in DIGITS:pieces+=finger_solid_parts(d,t_four)[0]
 pieces+=thumb_parts(q_thumb,ip_phase)[0]
 return pieces

def export_pose(t_four,q_thumb,ip_phase,label):
 pieces=all_shapes(t_four,q_thumb,ip_phase)
 scene=trimesh.Scene()
 for name,solid in pieces:
  m=mesh_part(solid)
  if name=='frame_reference':col=[54,76,101,255]
  elif name.startswith('thumb'):col=[231,153,65,255] if name.endswith('prox') else [247,184,90,255]
  elif name.endswith('prox'):col=[192,210,227,255]
  elif name.endswith('middle'):col=[110,163,214,255]
  else:col=[58,116,180,255]
  m.visual.face_colors=col
  scene.add_geometry(m,node_name=name,geom_name=name)
 scene.export(str(ROOT/f'hand_v05b_{label}.glb'))
 return pieces

if __name__=='__main__':
 for name,t,q,ip in [('rest',0,0,0),('swivel',.1,.5,0),('opposed',.35,1,0),('pinch',.63,1,1),('closed',1,.5,.4)]:
  pieces=export_pose(t,q,ip,name)
  data=thumb_parts(q,ip)[1]
  print(name,'tip',data['tip'].round(2),'angles',data['angles'],'bodies',len(pieces),flush=True)
 for name,s in all_shapes(0,0,0):
  cq.exporters.export(s,str(PARTS/f'{name}.step'))
 cq.exporters.export(cq.Compound.makeCompound([s for _,s in all_shapes(0,0,0)]),str(ROOT/'hand_v05b_rest_reference.step'))
