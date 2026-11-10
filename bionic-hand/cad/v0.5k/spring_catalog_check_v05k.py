#!/usr/bin/env python3
"""Conservative market-to-CAD mismatch for v0.5j torsion spring placeholder.
These are public listing snapshots, not actual measured/supplied components.
"""
from pathlib import Path
import json
model={'OD_mm':6.6,'ID_mm':3.7,'axial_length_mm':2.3}
parts=[
 {'vendor':'Ozon','name':'double torsion spring OD5.2 wire0.5 pack5','OD':5.2,'wire':.5,'turns':None,'double':True,'price_rub_listed':497,
  'url':'https://www.ozon.ru/product/dvoynaya-pruzhina-krucheniya-0-5-5-2-3-mm-diametr-provoloki-naruzhnyy-diametr-dlina-ugolka-2976733541/'},
 {'vendor':'Ozon','name':'double torsion spring OD6.8 wire0.6 pack5','OD':6.8,'wire':.6,'turns':None,'double':True,'price_rub_listed':271,
  'url':'https://www.ozon.ru/product/dvoynaya-pruzhina-krucheniya-0-6-6-8-6-mm-diametr-provoloki-naruzhnyy-diametr-dlina-ugolka-2976734438/'},
 {'vendor':'Eicom','name':'Century Spring TO-1098CS','OD':6.1,'wire':.64,'turns':3.75,'double':False,'price_rub_listed':2015,
  'url':'https://eicom.ru/catalog/hardware-fasteners-accessories/springs-torsion/'},
 {'vendor':'Eicom','name':'Century Spring TO-5043LCS','OD':6.35,'wire':.71,'turns':10.75,'double':False,'price_rub_listed':1628,
  'url':'https://eicom.ru/catalog/hardware-fasteners-accessories/springs-torsion/'},
 {'vendor':'NPZ','name':'20x3.5x0.5 n3; minimum1000','OD':3.5,'wire':.5,'turns':3,'double':False,'price_rub_listed':None,
  'url':'https://npznn.ru/product/pruzhina-krucheniya-20h35h05-n3/'}
]
for p in parts:
 p['derived_ID_OD_minus_2wire_mm']=round(p['OD']-2*p['wire'],3)
 p['hypothetical_windings_wire_stack_mm']=(round(p['turns']*p['wire'],3) if p['turns'] else None)
 p['fits_model_directly_confirmed']=False
 p['caveat']='Double-coil internal dimensions NOT confirmed' if p['double'] else 'Unmeasured legs, tolerance, spring constant and winding'
report={'version':'v0.5k','captured_date':'2026-11-10','placeholder':model,'shaft_d_mm':3.0,
        'products':parts,'passed_exact_purchased_component_fit':0,
        'result':'NONE verified as drop-in to v0.5j; adapt CAD to real orderable hardware after supplier drawing/measurement',
        'caveats':['Prices excluding checked delivery and availability','OD-2wire is only a nominal geometry relationship',
                   'No angular strength, fatigue, or emergency opening proven',
                   'No manufacturer-certified installed spring selected']}
(Path(__file__).parent/'spring_catalog_v05k.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(report['result'])
