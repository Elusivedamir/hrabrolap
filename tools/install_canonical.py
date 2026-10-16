#!/usr/bin/env python3
"""Install user-approved 12-frame kitten sprites into existing Hrabrolap v0.9.4+.

USAGE: python install_canonical.py /path/to/hrabrolap
Backs up changed source files; never deletes or changes approved original art.
"""
from pathlib import Path
import shutil, re, sys, hashlib

SRC=Path(__file__).resolve().parent
ROOT=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path.cwd()
if not (ROOT/'game.mjs').is_file() or not (ROOT/'index.html').is_file() or not (ROOT/'game-core.mjs').is_file():
 raise SystemExit('ERROR: Specify your existing hrabrolap repository path (game.mjs, index.html, game-core.mjs).')

game=(ROOT/'game.mjs').read_text(encoding='utf8')
html=(ROOT/'index.html').read_text(encoding='utf8')
if 'canonical-sprites.mjs' in game:
 print('CANONICAL already installed. No further changes made.')
 raise SystemExit(0)
if 'function heroFrame(index=0)' not in game or 'function hurtFrame(index)' not in game or 'id="hero-body"' not in html:
 raise SystemExit('ERROR: Unsupported version. No changes were made.')
# Guard against install into an unexpected project. Existing SVG-only rig must exist.
if 'id="armor-slot"' not in html or 'id="weapon-slot"' not in html:
 raise SystemExit('ERROR: SVG armor/weapon rig not found; use v0.9.4 or newer.')

def replace_function(text,start,until,replacement):
 a=text.find(start);b=text.find(until,a+len(start))
 if a<0 or b<0 or text.count(start)!=1:raise SystemExit(f'ERROR: Cannot safely find {start}')
 return text[:a]+replacement+text[b:]

game = "import {applyCanonicalFrame} from './canonical-sprites.mjs';\n"+game
body='''function heroFrame(index=0){
 // Replaces previously rotated ONE illustration with source sprite number index+1.
 // Original ATTACKS data remains unchanged and is still available for rollback.
 applyCanonicalFrame('attack',index,{
  body:$('hero-body'),heroMotion,weaponSlot:slot,armorSlot,armorImage:$('hero-armor')
 });
 currentPose=index;
}
'''
game=replace_function(game,'function heroFrame(index=0){','function cancelPose()',body)
hurt='''function hurtFrame(index){
 applyCanonicalFrame('hurt',index,{
  body:$('hero-body'),heroMotion,weaponSlot:slot,armorSlot,armorImage:$('hero-armor')
 });
 $('hero-art').dataset.hurtFrame=String(index+1);
}
'''
game=replace_function(game,'function hurtFrame(index){','function playHurt()',hurt)

pattern=r'<image\s+id="hero-body"\s+[^>]*?/>'
repl='<image id="hero-body" href="assets/canonical/attack_01.png" x="114" y="-22" width="260" height="346"/>'
html,number=re.subn(pattern,repl,html,count=1)
if number!=1:raise SystemExit('ERROR: Could not locate base hero image in index.html. No changes were made.')
html=html.replace('Тихая пристань v0.9.4','Тихая пристань v0.9.5')
html=html.replace('Автосохранение · v0.9.4','Автосохранение · v0.9.5')

backup=ROOT/'.canonical-backup'
backup.mkdir(exist_ok=True)
for filename in ['game.mjs','index.html']:
 shutil.copy2(ROOT/filename, backup/filename)
for file in (SRC/'assets/canonical').glob('*.png'):
 dest=ROOT/'assets/canonical'/file.name;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(file,dest)
shutil.copy2(SRC/'canonical-sprites.mjs',ROOT/'canonical-sprites.mjs')
shutil.copy2(SRC/'preview-canonical.html',ROOT/'preview-canonical.html')
(ROOT/'game.mjs').write_text(game,encoding='utf8')
(ROOT/'index.html').write_text(html,encoding='utf8')
# Migrate browser assertions from the old rotating-single-SVG rig to original PNG frame swaps.
browser=ROOT/'tests/browser.test.mjs'
if browser.is_file():
 b=browser.read_text(encoding='utf8')
 old=b
 b=b.replace('window.qaObserved={attacks:[],transforms:[],hurts:0}',
             'window.qaObserved={attacks:[],transforms:[],spriteFrames:[],hurts:0}')
 b=b.replace("if(t.id==='weapon-slot')window.qaObserved.transforms.push(t.getAttribute('transform'));",
             "if(t.id==='weapon-slot')window.qaObserved.transforms.push(t.getAttribute('transform'));if(t.id==='hero-body')window.qaObserved.spriteFrames.push(t.getAttribute('href'));")
 b=b.replace("attributeFilter:['class','transform']", "attributeFilter:['class','transform','href']")
 b=b.replace("for(const transform of ['translate(189 237) rotate(74)','translate(210 234) rotate(132)','translate(227 227) rotate(88)'])assert.ok(observed.transforms.includes(transform),transform);",
             "for(let i=1;i<=6;i++)assert.ok(observed.spriteFrames.includes('assets/canonical/attack_0'+i+'.png'),'missing original attack frame '+i);")
 b=b.replace('const seen=await page.evaluate(()=>window.qaObserved.transforms);',
             'const seen=await page.evaluate(()=>window.qaObserved.spriteFrames);')
 b=b.replace("for(const transform of ['translate(189 237) rotate(74)','translate(210 234) rotate(132)','translate(227 227) rotate(88)'])assert.ok(seen.includes(transform),weapon.id+' '+transform);",
             "for(let i=1;i<=6;i++)assert.ok(seen.includes('assets/canonical/attack_0'+i+'.png'),weapon.id+' frame '+i);")
 b=b.replace("assert.equal(await page.locator('#armor-slot').getAttribute('transform'),'translate(0 0) rotate(0 236 243)');",
             "assert.match(await page.locator('#armor-slot').getAttribute('transform'),/^translate\(/);")
 if b!=old:
  shutil.copy2(browser,backup/'browser.test.mjs')
  browser.write_text(b,encoding='utf8')
# Supplement original tests with source-frame preservation checks.
tests=ROOT/'tests';tests.mkdir(exist_ok=True)
shutil.copy2(SRC/'tests/canonical.test.mjs',tests/'canonical.test.mjs')
pkg=ROOT/'package.json'
if pkg.is_file():
 import json
 raw=json.loads(pkg.read_text(encoding='utf8'))
 raw['version']='0.9.5'
 if raw.get('scripts',{}).get('test'):
  script=raw['scripts']['test']
  if 'tests/canonical.test.mjs' not in script:
   script=script.replace('tests/balance.test.mjs','tests/canonical.test.mjs tests/balance.test.mjs')
   raw['scripts']['test']=script
 shutil.copy2(pkg,backup/'package.json')
 pkg.write_text(json.dumps(raw,ensure_ascii=False,indent=2)+'\n',encoding='utf8')

print('INSTALLED original 12-frame kitten animation and equipment anchors; backup in .canonical-backup')
print('PROTECTED originals: art/hero/bare-kitten.svg and assets/battle/attack_*.png untouched')
print('NEXT: npm test ; npm run qa:balance ; npm run qa:browser')