#!/usr/bin/env python3
"""Dimensional review and an independent gasket-joint sample, NOT a hand enclosure."""
from pathlib import Path
import json, math
import numpy as np
import cadquery as cq
from build_thumb_motor_v05c import STATIC, B, A, C, U, V, RCRANK, Q_MAX, OUT

def review():
    p=json.loads((OUT/'protection_parameters.json').read_text())
    free=p['lid_gasket_free_thickness_hypothesis'];gap=p['lid_gasket_closed_gap_hypothesis']
    band=p['lid_sealing_band_hypothesis'];wall=p['cover_wall_hypothesis']
    w,h=p['sample_outer_size'];compression=1-gap/free
    assert 0<gap<free and 0<band<min(w,h)/2
    def plate(z,thick):
        return cq.Workplane('XY').box(w,h,thick).translate((0,0,z+thick/2)).val()
    def ring(z,thick):
        return plate(z,thick).cut(cq.Workplane('XY').box(w-2*band,h-2*band,thick+2).translate((0,0,z+thick/2)).val()).clean()
    # Cross-section coupon in its OWN coordinate system; not positioned on the palm.
    pieces={'land_sample':ring(0,2),'compressed_gasket_sample':ring(2,gap),
            'lid_sample':plate(2+gap,wall)}
    assert all(s.isValid() and len(s.Solids())==1 for s in pieces.values())
    sample=OUT/'protection_sample';sample.mkdir(exist_ok=True)
    cq.exporters.export(cq.Compound.makeCompound(list(pieces.values())),str(sample/'gasket_joint_concept.step'))
    # Analytic planar parallelogram only, before any bearing/seal friction.
    ground=B-C;ground_angle=math.atan2(np.dot(ground,V),np.dot(ground,U))
    theta=np.linspace(0,math.radians(Q_MAX),361)
    sine=np.abs(np.sin(theta-ground_angle))
    link_len=np.linalg.norm(B-C)
    errors=[]
    for a in theta:
        arm=U*math.cos(a)+V*math.sin(a)
        errors.append(abs(np.linalg.norm((B+arm*RCRANK)-(C+arm*RCRANK))-link_len))
    # TowerPro primary data point: 1.8 kgf cm stall at 4.8V. Not rated continuous torque.
    stall=1.8*9.80665*.01
    minimum_sine=float(sine.min())
    report={
      'version':'v0.5c-archive-review-r1','status':'COMPONENT_SELECTION_AND_PACKAGING_BLOCKED',
      'dimensions_mm':p,
      'lid_compression_hypothesis_fraction':compression,
      'inside_width_if_only_sidewalls_mm':p['palm_outer_width_preliminary']-2*wall,
      'inside_width_after_sealing_bands_mm':p['palm_outer_width_preliminary']-2*band,
      'CMC_shaft_radius_mm':4.0,'CMC_bore_radius_mm':4.3,
      'CMC_radial_gap_mm':.3,'CMC_ring2_end_to_shoulder_gap_mm':1.2-(-1.8+2.7),
      'CMC_between_rings_axial_space_mm':-1.8-(-7+2.7),
      'fixed_components_bbox_mm':{},
      'kinematic_calculation':{
        'samples':361,'opposition_range_deg':[0,float(Q_MAX)],'ratio':1.0,
        'link_length_mm':float(link_len),'max_link_closure_error_mm':float(max(errors)),
        'min_transmission_sine':minimum_sine,
        'min_acute_transmission_angle_deg':math.degrees(math.asin(minimum_sine)),
        'nominal_stall_torque_4V8_Nm':stall,
        'stall_only_link_force_upper_N':stall/(RCRANK*.001*minimum_sine),
        'stall_only_force_at_58mm_lever_N':stall/.058,
        'datasheet_no_load_travel_time_s':Q_MAX/60*.10,
        'requested_duration_s':1.5,
        'limits':['ideal rigid 1:1 parallelogram, one assembly branch only',
          'no stall rating used as continuous rating',
          'pin fit, backlash, bearing/seal friction, impact and load case not verified',
          '58mm is an illustrative lever, not calculated actual contact force',
          'motor voltage, actual angular range and hardware torque-speed curve unverified']},
      'blockers':[
        'no complete sealed hand housing or integrated gland',
        'CMC bridge outside provisional palm width; radial thumb-root envelope unresolved',
        'separate thumb flexion actuator not packaged',
        'rotor/proximal and servo spline/horn attachments unresolved',
        'pins have no designed axial retention or washers',
        'emergency release, PCB, battery, connectors and cable routes not packaged',
        'no thermal, ingress, strength, EMG or body-use validation'],
      'sample_validity':{k:{'valid':s.isValid(),'solid_count':len(s.Solids())} for k,s in pieces.items()},
      'IP_status':'UNVERIFIED; possible IP54 target only'}
    for n,s in STATIC.items():
        bb=s.BoundingBox();report['fixed_components_bbox_mm'][n]=[[bb.xmin,bb.ymin,bb.zmin],[bb.xmax,bb.ymax,bb.zmax]]
    (OUT/'protection_review.json').write_text(json.dumps(report,indent=2))
    print(json.dumps({k:report[k] for k in ['lid_compression_hypothesis_fraction','inside_width_after_sealing_bands_mm','CMC_ring2_end_to_shoulder_gap_mm','kinematic_calculation']},indent=2))
    return report

if __name__=='__main__':review()
