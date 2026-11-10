#!/usr/bin/env python3
"""Pre-FEA REQUIREMENT ONLY: 10kg bag on FOUR fingers, thumb excluded.
Assumes equal sharing and ideal double shear as reference, no real structure.
"""
import math,json
from pathlib import Path
results={'version':'v0.6a','type':'analytic four-finger hook LOAD CASES ONLY',
 'target_bag_mass_kg':10,'g_m_s2':9.80665,'fingers':4,'thumb_included':False,
 'assumptions':['load shared equally (not guaranteed)','40mm example joint arm','3mm ideal pin double shear'],
 'scenarios':[]}
for factor in (1,2,3):
 total=10*9.80665*factor;each=total/4
 area=math.pi*1.5**2
 results['scenarios'].append({'dynamic_or_test_factor_hypothesis':factor,
  'total_N':round(total,3),'each_finger_N_if_equal':round(each,3),
  'ideal_joint_moment_at_40mm_Nm':round(each*.04,3),
  'ideal_3mm_double_shear_MPa':round(each/(2*area),3),
  'verified_by_physical_testing':False})
results['status']='TARGET_NOT_VALIDATED'
results['open']=['Unequal loads from bag handles','metallic finger load path/plate/bolts','frame and wrist/socket transmission',
 'secure passive mechanical hook, not continuous servo stall','3D contact FEA and fatigue','drop and shock tests',
 'professional assessment of socket and skin loading','physical certification and safety']
(Path(__file__).parent/'hook_load_cases_v06a.json').write_text(json.dumps(results,indent=2)+'\n')
print(results)
