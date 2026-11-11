#!/usr/bin/env python3
"""Bounding envelope check for MCP bolt heads and torsion pivot.
Not a gasket, not a waterproof/ingress test.
"""
from pathlib import Path
import math,json
HERE=Path(__file__).parent
old={'x':[-16.,7.],'y':[-7.,7.],'z':[-10.,12.]}
radius=2.7
def disc_in_x_slab(x0,theta_deg, r=radius):
    a=math.radians(theta_deg);cx=x0*math.cos(a);cy=x0*math.sin(a)
    dx=max(old['x'][0]-cx,0,cx-old['x'][1])
    if dx>r:return None
    span=math.sqrt(max(0,r*r-dx*dx))
    return {'center':[cx,cy],'min_y_in_slab':cy-span,'max_y_in_slab':cy+span}
data=[]
for deg in range(61):
    for index,x in ((1,7.5),(2,14.0),(3,23.0)):
        z=disc_in_x_slab(x,deg)
        if z: data.append({'angle':deg,'bolt_number':index,**z})
worst=max(data,key=lambda x:x['max_y_in_slab'])
first=[r for r in data if r['angle']==60 and r['bolt_number']==1][0]
second=[r for r in data if r['angle']==60 and r['bolt_number']==2][0]
result={'version':'v0.6c','scope':'M3 head disc sliced to old x-boot range, no full mechanical shell',
  'old_local_boot':old,'bolt_head_radius_mm':radius,'evaluated_angles':61,
  'bolt1_y_max_at60_mm':round(first['max_y_in_slab'],5),
  'bolt2_y_max_at60_mm':round(second['max_y_in_slab'],5),
  'worst_y_mm':round(worst['max_y_in_slab'],5),'worst_y_excess_mm':round(worst['max_y_in_slab']-7.,5),
  'head_z_max_mm':12.3,'head_z_excess_mm':.3,
  'torsion_pivot_head_z_min_mm':-12.6,'pivot_z_deficit_mm':2.6,
  'required_z_stack_no_walls_mm':24.9,'old_z_span_mm':22.0,
  'status':'OLD_RIGID_BOX_FAILS; FLEXIBLE_SERVICEABLE_MCP_BOOT_REQUIRED',
  'limitations':['actual sealing interface not modeled','no shell geometry or thickness','no compression/wear/moisture test','not an IP rating']}
assert first['max_y_in_slab']>9.
assert second['max_y_in_slab']>14.
assert result['worst_y_excess_mm']>7.
assert 12.3-(-12.6)==24.9
(HERE/'boot_envelope_v06c.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\\n')
print(result)
