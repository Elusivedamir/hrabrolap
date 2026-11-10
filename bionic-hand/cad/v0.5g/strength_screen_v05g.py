#!/usr/bin/env python3
"""Worst-case cartoon-beam screen for the capstan connecting rib.
Not FEA, not product strength, not a validated material stress model.
Ignores print anisotropy, local stress concentrations and joint failure.
"""
import json, math
from pathlib import Path
P=Path(__file__).resolve().parent
r=5.8 # mm cable effective radius
L=10.0 # mm selected worst-case unsupported rib span hypothesis
spool_r=3.0
eta=.6
out={'version':'v0.5g','analysis':'simple cantilever beam RED FLAG, not FEA',
     'hypotheses':{'lever_span_mm':L,'thin_rib_width_mm':3.2,
      'thin_rib_thickness_mm':2.0,'capstan_eff_radius_mm':r,'spool_radius_mm':spool_r,
      'motor_transfer_efficiency':eta,'tip_arm_mm':58},'scenarios':[]}
for Ft in [1,2,5]:
    cable_N=Ft*58/r
    for label,width,thickness in [('v05g-as-modeled-rectangular-strip',3.2,2),('wider-only',5.6,2),('wider-and-thicker-HYPOTHETICAL',5.6,4)]:
        sigma=6*cable_N*L/(width*thickness**2)
        out['scenarios'].append({'tip_scenario_N':Ft,'section_label':label,
          'cable_force_ideal_N':round(cable_N,2),'beam_bending_stress_screen_MPa':round(sigma,2),
          'motor_torque_scenario_Nm':round(cable_N*spool_r/1000/eta,4)})
out['status']='NOT_APPROVED_FOR_LOAD: geometry screen not validated; thin strip stress warning'
out['limitations']=[
 'Beam model assumes full load at 10mm cantilever; actual local stress distribution can be very different',
 'Printing direction, material, layers, corners, temperature, creep and fatigue absent',
 'High model stress is a warning, not proof of failure; low model stress is not a safety certification',
 'Wider/thicker idea is not in current STEP and its boot and motion fit must be checked',
 'Return spring force, friction, impact and lifetime not included',
 'IP cover and full-hand external envelope not checked']
(P/'strength_screen_v05g.json').write_text(json.dumps(out,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
for x in out['scenarios']:
 print(x['tip_scenario_N'],'N',x['section_label'],x['beam_bending_stress_screen_MPa'],'MPa')
