#!/usr/bin/env python3
"""Independent v0.5h interface QA: collision-free != manufacturable.
Fails dangerous assumptions by reporting the measured deficits (no load approval).
"""
import json
from pathlib import Path
from build_reinforced_mcp import components, BOLT_XS, BORE_R
P=Path(__file__).parent
def zrange(shape):
    b=shape.BoundingBox()
    return [round(b.zmin,4),round(b.zmax,4)]
s=components(0)
pin=zrange(s['pivot_mock']); plate=zrange(s['steel_strip'])
cap=zrange(s['capstan_print'])
head1=zrange(s['m3_bolt_1'])
head2=zrange(s['m3_bolt_2'])
rep={'version':'v0.5h','scope':'interface QA of ISOLATED mocked MCP; not a medical device test',
  'drilling':{'plate_length_mm':34,'width_mm':12,'thickness_mm':2,
              'holes_x_mm':[0]+BOLT_XS,'hole_diameter_mm':2*BORE_R,
              'minimum_center_spacing_mm':min(b-a for a,b in zip([0]+BOLT_XS,([0]+BOLT_XS)[1:]))},
  'interfaces':{
    'bolt_head_clearance_vs_old_boot_mm':round(12-max(head1[1],head2[1]),3),
    'pin_overlap_with_steel_plate_mm':round(max(0,min(pin[1],plate[1])-max(pin[0],plate[0])),3),
    'pin_overlap_with_printed_capstan_mm':round(max(0,min(pin[1],cap[1])-max(pin[0],cap[0])),3),
    'nominal_M3_diametral_clearance_mm':round(2*BORE_R-3,3)},
  'blocking_findings':['two bolt heads exceed old local z=12mm boot reserve by 0.3mm, before cover wall',
       'pivot pin engages metal plate for 1.8 of its 2mm thickness, no retained axial stop proved',
       'printed capstan is NOT directly supported by pivot pin, load routed via bolts to strip',
       'all intentional mating/contact interfaces excluded from penetration screen; fit not certified',
       'physical spring, tendon termination, disconnect and IP envelope absent'],
  'status':'REWORK_REQUIRED_FOR_WEARABLE_OR_LOADED_USE'}
assert rep['interfaces']['bolt_head_clearance_vs_old_boot_mm']<0
assert 0<rep['interfaces']['pin_overlap_with_steel_plate_mm']<2
assert rep['interfaces']['pin_overlap_with_printed_capstan_mm']==0
assert rep['interfaces']['nominal_M3_diametral_clearance_mm']==.3
(P/'qa_interfaces_v05h.json').write_text(json.dumps(rep,indent=2,ensure_ascii=False)+'\n')
print(rep['status'],rep['interfaces'])
