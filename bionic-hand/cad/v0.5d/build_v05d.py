#!/usr/bin/env python3
"""New reproducible MCP clevis study based on the AVAILABLE 23-solid archive.
Not a reconstruction of the missing 24-solid variant; not a manufacturing release.
"""
from pathlib import Path
import sys, json, math, gzip
import numpy as np
import cadquery as cq
import trimesh

ROOT=Path(__file__).resolve().parent
PREVIOUS=ROOT.parent/'archive_review_v05c_r1'
sys.path.insert(0,str(PREVIOUS))
import build_thumb_motor_v05c as old
from scipy.spatial.transform import Rotation as Rot

# Engineering placement parameter, not a measured anthropometric dimension.
# The old 6mm offset leaves rotor and proximal eye occupying the same volume.
MCP_OFFSET_MM=14.0
CLEVIS_INNER_HALF_MM=2.2
CLEVIS_OUTER_HALF_MM=6.5
PIN_RADIUS_MM=1.5
BORE_RADIUS_MM=1.6

def box(x0,x1,y0,y1,z0,z1):
    return cq.Workplane('XY').box(x1-x0,y1-y0,z1-z0).translate(((x0+x1)/2,(y0+y1)/2,(z0+z1)/2)).val()

def cyl(radius,height,z0):
    return cq.Solid.makeCylinder(radius,height,cq.Vector(0,0,z0),cq.Vector(0,0,1))

def capsule(x0,x1,r,z0,z1):
    c0=cq.Solid.makeCylinder(r,z1-z0,cq.Vector(x0,0,z0),cq.Vector(0,0,1))
    c1=cq.Solid.makeCylinder(r,z1-z0,cq.Vector(x1,0,z0),cq.Vector(0,0,1))
    return box(x0,x1,-r,r,z0,z1).fuse(c0,c1).clean()

def local_clevis():
    lo=CLEVIS_INNER_HALF_MM;hi=CLEVIS_OUTER_HALF_MM
    fork=capsule(-10,0,4.0,-hi,-lo).fuse(capsule(-10,0,4.0,lo,hi),box(-13,-9,-4,4,-hi,hi)).clean()
    return fork.cut(cyl(BORE_RADIUS_MM,18,-9)).clean()

FORK=local_clevis()
# Model a headed, grooved pin and a separate C-shaped retention envelope.
# These dimensions do not identify an off-the-shelf circlip or shoulder screw.
PIN=cyl(1.5,14.6,-6.8).fuse(cyl(2.6,1.2,-8.0)).clean()
groove=cyl(1.6,.6,6.9).cut(cyl(1.15,.8,6.8))
PIN=PIN.cut(groove).clean()
RETAINER=cyl(2.6,.5,6.95).cut(cyl(1.2,.7,6.85)).cut(box(0,4,-.6,.6,6.8,7.6)).clean()

def thumb_parts(q,ip,mcp_deg=0.,offset_mm=MCP_OFFSET_MM):
    if not 0<=q<=1 or not 0<=ip<=1 or not 0<=mcp_deg<=20:
        raise ValueError('study limits: q/ip 0..1, MCP 0..20 degrees')
    parts,info=old.thumb_pose(q,ip)
    Q=Rot.from_rotvec(q*old.ROT_VEC).as_matrix()
    Rc=Q@old.R_OPEN
    P=old.B+offset_mm*old.A
    Rflex=Rc@Rot.from_euler('z',mcp_deg,degrees=True).as_matrix()
    Rd=Rflex@Rot.from_euler('z',25*ip,degrees=True).as_matrix()
    joint=P+Rflex@np.array([33.,0,0])
    parts['thumb_prox']=old.rigid(old.seg_solid(33,12.5,'prox'),Rflex,P)
    parts['thumb_dist']=old.rigid(old.seg_solid(25,11.5,'dist'),Rd,joint)
    fork=old.rigid(FORK,Rc,P)
    # One connected CAD rotor+clevis mock-up, rather than two overlapping parts.
    # Production split into standard shaft + bracket is a later strength/cost task.
    bridge=old.cylinder_between(old.B+3*old.A,P+Rc@np.array([-11.,0,0]),3.0)
    parts['thumb_rotor']=parts['thumb_rotor'].fuse(bridge,fork).clean()
    parts['thumb_mcp_pin']=old.rigid(PIN,Rc,P)
    parts['thumb_mcp_retainer_envelope']=old.rigid(RETAINER,Rc,P)
    info.update({'mcp_origin_mm':P.tolist(),'mcp_axis':Rc[:,2].tolist(),
                 'mcp_deg':float(mcp_deg),'mcp_offset_mm':float(offset_mm),
                 'proximal_joint':joint,'tip':joint+Rd@np.array([25.,0,0])})
    return parts,info

def all_parts(four,q,ip,mcp_deg=0.,offset_mm=MCP_OFFSET_MM):
    parts=dict(old.STATIC)
    for d in old.DIGITS:
        parts.update(dict(old.finger_solid_parts(d,four)[0]))
    thumb,info=thumb_parts(q,ip,mcp_deg,offset_mm);parts.update(thumb)
    return parts,info

def export():
    out=ROOT/'parts';out.mkdir(exist_ok=True)
    p,info=all_parts(0,0,0)
    for name,s in p.items():
        if not s.isValid() or len(s.Solids())!=1:raise ValueError('invalid or disconnected '+name)
        cq.exporters.export(s,str(out/(name+'.step')))
    step=ROOT/'hand_v05d_reference.step'
    cq.exporters.export(cq.Compound.makeCompound(list(p.values())),str(step))
    (ROOT/'hand_v05d_reference.step.gz').write_bytes(gzip.compress(step.read_bytes(),mtime=0))
    for tag,f,q,ip,m in [('rest',0,0,0,0),('opposed',.1,1,0,0),('pinch',.63,1,1,0),('mcp20',.1,1,0,20),('power',1,.5,.4,0)]:
        pieces,kin=all_parts(f,q,ip,m);sc=trimesh.Scene()
        for name,s in pieces.items():
            if not s.isValid() or len(s.Solids())!=1:raise ValueError(tag+':'+name)
            vertices,faces=s.tessellate(.12)
            mesh=trimesh.Trimesh(vertices=[v.toTuple() for v in vertices],faces=faces,process=False)
            color=[230,155,63,255] if name.startswith('thumb') else [54,76,101,255] if name.startswith('frame') else [72,133,190,255]
            if name.endswith('pin'):color=[220,223,228,255]
            if 'retainer' in name:color=[196,73,69,255]
            if name=='link_rod':color=[49,164,137,255]
            mesh.visual.face_colors=color;sc.add_geometry(mesh,node_name=name,geom_name=name)
        sc.export(str(ROOT/f'hand_v05d_{tag}.glb'))
    report={'version':'v0.5d','parent_commit':'db8b39ef963a7c8ae299f3eb70b27c85b143fa6d',
        'basis':'available 23-solid archive review; not the missing 24-solid variant',
        'palm_mm':[122,85],'digit_lengths_mm':[75,84,78,61], 'thumb_lengths_mm':[33,25],
        'wrist_reserved_limit_mm':50,'solid_count':len(p),
        'mcp_offset_mm':MCP_OFFSET_MM,'mcp_range_study_deg':[0,20],
        'mcp_pin_diameter_mm':3,'mcp_bore_diameter_mm':3.2,
        'clevis_inside_width_mm':4.4,'proximal_eye_width_mm':3.3,
        'eye_side_gap_each_mm':.55,'pin_axial_gap_before_head_mm':.3,
        'retainer_status':'geometry envelope only; standard part and spring retention not selected',
        'manufacturing_status':'single-piece rotor+clevis CAD mock-up; production construction/material unapproved',
        'actuation':'CMC candidate only; MCP/IP prescribed, flexion actuator absent',
        'environment':'reserve dust boot access; no installed seal or verified IP',
        'unverified':['8 grasps','loaded 1.5s','10kg','FEA','EMG','thermal','physical tests','IP','full assembly fastening'],
        'rest_parts':{n:{'valid':s.isValid(),'solids':len(s.Solids()),'volume_mm3':s.Volume()} for n,s in p.items()}}
    (ROOT/'geometry_v05d.json').write_text(json.dumps(report,indent=2))
    print('exported v0.5d',len(p),'bodies',flush=True)

if __name__=='__main__':export()
