#!/usr/bin/env python3
"""Import the user-approved complete Golden Knight kitten into the existing Hrabrolap."""
from pathlib import Path
from zipfile import ZipFile
from io import BytesIO
import hashlib,json
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
ARCHIVE=ROOT/'downloads/approved_knight_source.zip'
PREFIX='assets/costumes/approved_knight/'
DEST=ROOT/PREFIX
if not (ROOT/'game.mjs').exists(): raise SystemExit('Not the existing Hrabrolap repository')
if not ARCHIVE.exists(): raise SystemExit('Missing downloads/approved_knight_source.zip')
names={f'{kind}_{i:02}.png' for kind in ('attack','hurt') for i in range(1,7)}
with ZipFile(ARCHIVE) as arc:
 manifest=json.loads(arc.read(PREFIX+'manifest.json'))
 assert manifest['id']=='approved_knight' and manifest['price']==50
 assert {item['name'] for item in manifest['frames']}==names
 DEST.mkdir(parents=True,exist_ok=True)
 for item in manifest['frames']:
  name=item['name'];data=arc.read(PREFIX+name)
  assert hashlib.sha256(data).hexdigest()==item['sha256'],name
  image=Image.open(BytesIO(data))
  assert image.size==(279,370) and image.mode=='RGBA',name
  assert image.getextrema()[3][0]==0, 'Background must be transparent: '+name
  (DEST/name).write_bytes(data)
 (DEST/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')

def replace(path,old,new):
 file=ROOT/path;text=file.read_text()
 if new in text:return
 if text.count(old)!=1:raise RuntimeError(f'{path}: expected one anchor, found {text.count(old)}: {old}')
 file.write_text(text.replace(old,new))

replace('equipment-catalog.mjs',
 " {id:'frost_watcher',name:'Ледяной дозорный',price:50,health:0,fullCharacter:true,svg:'assets/costumes/frost_watcher/attack_01.png'}",
 " {id:'frost_watcher',name:'Ледяной дозорный',price:50,health:0,fullCharacter:true,svg:'assets/costumes/frost_watcher/attack_01.png'},\n {id:'approved_knight',name:'Золотой рыцарь',price:50,health:0,fullCharacter:true,svg:'assets/costumes/approved_knight/attack_01.png'}")
for file in ['canonical-sprites.mjs','tests/baked-costumes.test.mjs']:
 replace(file,"'thorn_ranger','moon_mage','ember_guard','frost_watcher'","'thorn_ranger','moon_mage','ember_guard','frost_watcher','approved_knight'")
replace('tests/loot.test.mjs',"assert.equal(c.ARMORS.filter(a=>a.id!=='none').length,6);","assert.equal(c.ARMORS.filter(a=>a.id!=='none').length,7);")
replace('tests/loot.test.mjs',"assert.equal(new Set(c.ARMORS.filter(a=>a.svg).map(a=>a.svg)).size,6);","assert.equal(new Set(c.ARMORS.filter(a=>a.svg).map(a=>a.svg)).size,7);")
replace('tests/loot.test.mjs',"['forest_guardian','steel_knight','thorn_ranger','moon_mage','ember_guard','frost_watcher']","['forest_guardian','steel_knight','thorn_ranger','moon_mage','ember_guard','frost_watcher','approved_knight']")
replace('tests/loot.test.mjs','p.gold=300;\n for(const id','p.gold=350;\n for(const id')
replace('tests/equipment-rig.test.mjs','assert.equal(ARMORS.filter(a=>a.svg).length,6);','assert.equal(ARMORS.filter(a=>a.svg).length,7);')
replace('tests/browser.test.mjs',"assert.equal(await page.locator('#armor option').count(),7);","assert.equal(await page.locator('#armor option').count(),8);")
print('Installed approved Golden Knight: 12 complete frames, 50 coins, separate sword.')
