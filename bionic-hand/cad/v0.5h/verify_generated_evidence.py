#!/usr/bin/env python3
"""Cross-version generated JSON consistency gates, NOT hardware approval.
Run after every generator in v0.5h/i/j/k and v0.6a in sibling folders.
"""
from pathlib import Path
import hashlib,json,platform
root=Path(__file__).resolve().parent.parent
def audit_h(x):return x.get('body_checks')==671 and x.get('pair_checks')==2196 and not x.get('invalid') and not x.get('unintended_penetrations')
def qa_h(x):
 d=x.get('interfaces') or x.get('checks')
 bolt=d.get('bolt_head_clearance_vs_old_boot_mm')
 if bolt is None:bolt=d['bolt_head_vs_previous_boot_z12']['clearance_mm']
 pin=d.get('pin_overlap_with_steel_plate_mm')
 if pin is None:pin=d['pin_plate_axial_engagement']['overlap_mm']
 return round(bolt,1)==-.3 and round(pin,1)==1.8
def fem_h(x):return len(x['cases'])==3 and [round(y['ideal_root_stress_MPa'],1) for y in x['cases']]==[12.5,25.,62.5]
def tol_h(x):return not x['scenarios'][0].get('worst_case_fit_demonstrated',x['scenarios'][0].get('worst_case_nominal_fit'))
def ext_i(x):
 if 'runs' in x:return len(x['runs'])==64 and not any(y['interference_count']==0 and not y['outside_old_boot_z_range'] for y in x['runs'])
 if 'candidates' in x:return len(x['candidates'])==64 and not any(y['interference_count_7_poses']==0 and not y['outside_old_local_z_keepout'] for y in x['candidates'])
 return False
def torsion_j(x):return (x.get('total_body_checks',x.get('body_checks'))==732 and
 x.get('coil_checks',x.get('coil_other_body_checks'))==610 and
 not x.get('invalid') and not x.get('non_intended_overlap',x.get('coil_collisions',[])))
def bag_6a(x):
 a=x.get('cases') or x.get('scenarios')
 return len(a)==3 and round(a[0].get('force_each_if_equal_N',a[0].get('each_finger_N_if_equal',0)),1)==24.5
def market_k(x):return len(x.get('products',[]))==5 and not any(p.get('known_fit_verified',p.get('fits_model_directly_confirmed',False)) for p in x['products'])
checks=[('v0.5h','audit_v05h.json',audit_h),('v0.5h','qa_interfaces_v05h.json',qa_h),
 ('v0.5h','beam_fem_v05h.json',fem_h),('v0.5h','tolerance_budget_v05h.json',tol_h),
 ('v0.5i','spring_screen_v05i.json',ext_i),('v0.5j','torsion_coil_screen_v05j.json',torsion_j),
 ('v0.6a','hook_load_cases_v06a.json',bag_6a),('v0.5k','spring_catalog_v05k.json',market_k)]
root=Path(__file__).resolve().parent.parent
report={'date':'2026-11-10','purpose':'report consistency, NOT prosthetic safety','python':platform.python_version(),'checks':[]}
for stage,name,check in checks:
 path=root/stage/name
 try:
  raw=path.read_bytes();value=json.loads(raw)
  report['checks'].append({'path':str(path.relative_to(root)),'pass':bool(check(value)),'sha256':hashlib.sha256(raw).hexdigest()})
 except Exception as e:report['checks'].append({'path':str(path.relative_to(root)),'pass':False,'error':str(e)})
report['status']='CONSISTENT_BUT_NOT_LOAD_OR_WEAR_APPROVED' if all(x['pass'] for x in report['checks']) else 'FAIL'
(Path(__file__).parent/'verification_manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(report['status'])
if report['status']=='FAIL':raise SystemExit(1)
