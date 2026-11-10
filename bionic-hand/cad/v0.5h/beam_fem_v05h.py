#!/usr/bin/env python3
"""Simple 1-D beam FE baseline, NOT 3-D stress validation or load approval."""
import json, math
import numpy as np
from pathlib import Path
P=Path(__file__).parent
E=200000.  # N/mm², hypothetical mild steel; no material batch certified
b,t,L=12.,2.,10.
I=b*t**3/12.
def tip(n,F):
 h=L/n
 k=(E*I/h**3)*np.array([[12,6*h,-12,6*h],
                        [6*h,4*h*h,-6*h,2*h*h],
                        [-12,-6*h,12,-6*h],
                        [6*h,2*h*h,-6*h,4*h*h]])
 K=np.zeros((2*(n+1),2*(n+1)))
 for a in range(n):
  q=[2*a,2*a+1,2*a+2,2*a+3]
  K[np.ix_(q,q)]+=k
 f=np.zeros(len(K));f[-2]=F
 return float(np.linalg.solve(K[2:,2:],f[2:])[-2])
res={'version':'v0.5h','method':'Euler-Bernoulli uniform cantilever 1D beam finite element',
 'assumptions':{'E_N_mm2':E,'width_mm':b,'thickness_mm':t,'length_mm':L,'I_mm4':I},
 'cases':[]}
for F in (10.,20.,50.):
 exact=F*L**3/(3*E*I)
 series=[tip(n,F) for n in (2,4,8,16)]
 assert max(abs(x-exact)/exact for x in series)<1e-7
 res['cases'].append({'force_N':F,'analytic_tip_mm':round(exact,8),'FEM_2_4_8_16_mm':[round(x,8) for x in series],
  'ideal_root_stress_MPa':round(F*L*(t/2)/I,3)})
res['status']='1D_NUMERICAL_PASS_NOT_3D_STRENGTH_APPROVAL'
res['NOT_MODELED']=['pivot/bore notch stress','actual boundary and bolt preload','plate hole failure',
 'printed plastic anisotropy','spring load','cable wear','fatigue/creep/corrosion','shock','contact FEA',
 '3D mesh convergence','physical tests']
(P/'beam_fem_v05h.json').write_text(json.dumps(res,indent=2,ensure_ascii=False)+'\n')
print(res['status'],[(x['force_N'],x['ideal_root_stress_MPa']) for x in res['cases']])
