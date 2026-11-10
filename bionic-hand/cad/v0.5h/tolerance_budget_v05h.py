#!/usr/bin/env python3
"""Worst-case hand-drilled/printed hole alignment estimate; no physical measurements."""
import json
from pathlib import Path
bolt=3.0;hole=3.3; radial=(hole-bolt)/2
scenarios=[('independent-print-and-drill',.2,.2),('matched-drill-fixture-hypothetical',.06,.06)]
report={'version':'v0.5h','radial_clearance_mm':radial,'scenarios':[]}
for name,e1,e2 in scenarios:
 report['scenarios'].append({'method':name,'centering_error_each_mm':[e1,e2],
  'worst_relative_misalign_mm':e1+e2,'worst_case_nominal_fit':e1+e2<=radial})
report['limits']=['Assumptions only; no caliper measurements','No bolt head, load or fatigue validation']
report['recommendation']='Use clamped reference pilot holes, gauges and a simple manually drilled jig; verify assembled sample before relying on M3 holes.'
(Path(__file__).parent/'tolerance_budget_v05h.json').write_text(json.dumps(report,indent=2)+'\n')
print(report)
