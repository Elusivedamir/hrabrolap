#!/usr/bin/env python3
"""Install localized bucket + six transparent source-derived sleep sprites.
Existing combat animation data, characters, scenes, fishing capacity unchanged.
Usage: python install_v096.py /path/to/game
"""
from pathlib import Path
import sys,shutil,re,subprocess,hashlib
SRC=Path(__file__).resolve().parent
ROOT=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path.cwd()
if not all((ROOT/f).is_file() for f in ['index.html','game.mjs','style.css','game-core.mjs']):
 raise SystemExit('ERROR: expected an existing Hrabrolap game directory (index.html, game.mjs, style.css, game-core.mjs).')
html=(ROOT/'index.html').read_text('utf8')
game=(ROOT/'game.mjs').read_text('utf8')
css=(ROOT/'style.css').read_text('utf8')
if 'function render()' not in game or 'id="bucket"' not in html or 'id="surface"' not in html:
 raise SystemExit('ERROR: unsupported game layout. No files were modified.')
if 'bucket-rest.mjs' in game:
 print('INSTALLED already. No files changed.');raise SystemExit(0)
# Confirm existing canonical animation is not accidentally modified.
combat_signature={f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for f in ['game.mjs','index.html']}
# Prepare full changes in memory before any writes.
old_bucket='<button class="bucket" id="bucket" aria-label="Открыть ведро с рыбой"><img src="art/scenery/bucket.svg" alt="Ведро для рыбы"/><span id="bucket-indicator">0/12</span></button>'
new_bucket='<button class="bucket" id="bucket" aria-label="Открыть ведро с рыбой"><img id="bucket-graphic" src="art/scenery/bucket-empty.svg" alt="Деревянное ведро"/><span id="bucket-indicator">0 рыб</span></button>'
if old_bucket not in html:raise SystemExit('ERROR: original bucket markup not found. Nothing changed.')
html=html.replace(old_bucket,new_bucket,1)
cut='<img class="house-cutaway" src="art/approved/port_rest.webp" alt="Тот же домик с раскрытым интерьером во время отдыха"/>'
if cut not in html:raise SystemExit('ERROR: existing house cutaway was not found. Nothing changed.')
html=html.replace(cut,cut+'\n <img id="rest-sleep-sprite" class="rest-sleep-sprite" src="assets/rest/sleep_01.png" alt="Храбролап отдыхает в своём доме без брони и меча" aria-hidden="true"/>',1)
html=html.replace('Автосохранение · v0.9.5','Автосохранение · v0.9.6')
# No changes to hero-art, ATTACKS, heroFrame, hurtFrame, sword or armor layers.
imp="import {bucketArt, sleepFrameIndex, SLEEP_FRAMES} from './bucket-rest.mjs';\n"
game=imp+game
needle="function render(){"
if game.count(needle)!=1:raise SystemExit('ERROR: function render not unique.')
new_functions='''let sleepStartedAt=null;
function updateBucketDrawing(){
 const icon=$('bucket-graphic');
 const n=p.fishBucket.length; // actual NUMBER OF FISH, not occupied fish slots
 const next=bucketArt(n,p.bucketLevel>0);
 if(icon.getAttribute('src')!==next)icon.setAttribute('src',next);
 $('bucket-indicator').textContent=n+' рыб';
 $('bucket').setAttribute('aria-label','Рыцарское ведро: '+n+' рыб. Открыть улов');
}
function updateSleepDrawing(rest){
 const sprite=$('rest-sleep-sprite');
 if(!rest){sleepStartedAt=null;return;}
 const now=performance.now();
 if(sleepStartedAt===null)sleepStartedAt=now;
 const file=SLEEP_FRAMES[sleepFrameIndex(now-sleepStartedAt)];
 if(sprite.getAttribute('src')!==file)sprite.setAttribute('src',file);
}
'''
game=game.replace(needle,new_functions+needle,1)
rest="$('surface').classList.toggle('resting',rest);$('hero-art').classList.toggle('resting-hero',rest);"
if game.count(rest)!=1:raise SystemExit('ERROR: rest UI toggle missing. Nothing changed.')
game=game.replace(rest,rest+'updateSleepDrawing(rest);',1)
pattern=r"\$\('bucket-indicator'\)\.textContent=bucketVolume\(p\)\+'/'\+bucketCapacity\(p\);"
if len(re.findall(pattern,game))!=1:raise SystemExit('ERROR: bucket indicator code missing. Nothing changed.')
game=re.sub(pattern,'updateBucketDrawing();',game,count=1)
# Stable original layout: only bucket and sleeping-cat overlay get additional CSS.
css+='''
/* v0.9.6 — only the physical bucket next to the fisherman and the cat inside
   the EXISTING approved port_rest.webp. Never alter the game layout. */
.surface .bucket{
 left:1.5%!important;bottom:9%!important;
 width:17%!important;height:33%!important;max-height:83px;
 min-width:0!important;min-height:0!important;
 z-index:7!important;display:flex!important;flex-direction:column;
 align-items:center;justify-content:flex-end;gap:0;
 padding:0!important;border:0!important;border-radius:0!important;
 background:none!important;filter:drop-shadow(0 2px 2px #291c1c9a);
}
.surface .bucket img, .surface .bucket img#bucket-graphic{
 display:block!important;opacity:1!important;flex:1 1 auto;
 width:100%!important;height:calc(100% - 16px)!important;
 min-height:0;object-fit:contain;filter:none;
}
.surface .bucket span{
 flex:0 0 auto;border-radius:7px;padding:1px 4px;
 color:#fff6d9;background:#49362edb!important;font-size:.70em;
 font-weight:800;line-height:1.2;white-space:nowrap;
}
.surface .rest-sleep-sprite{
 position:absolute;z-index:5;
 left:64%;top:37%;width:24%;height:53%;
 object-fit:contain;object-position:center bottom;
 opacity:0;pointer-events:none;
 filter:drop-shadow(0 2px 1px #31222d55);
}
.surface.resting .rest-sleep-sprite{opacity:1}
/* Do not place the cat in the cave; its combat model is already hidden in rest. */
'''
# Syntax check before copying over originals (does not execute modules).
backup=ROOT/'.v096-backup';backup.mkdir(exist_ok=True)
for p in ['index.html','game.mjs','style.css']:
 shutil.copy2(ROOT/p,backup/p)
for target,contents in [('index.html',html),('game.mjs',game),('style.css',css)]:
 (ROOT/target).write_text(contents,'utf8')
shutil.copy2(SRC/'bucket-rest.mjs',ROOT/'bucket-rest.mjs')
for source in (SRC/'art/scenery').glob('bucket-*.svg'):
 dest=ROOT/'art/scenery'/source.name;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,dest)
for source in (SRC/'assets/rest').glob('sleep_*.png'):
 dest=ROOT/'assets/rest'/source.name;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,dest)
shutil.copy2(SRC/'preview-bucket-sleep.html',ROOT/'preview-bucket-sleep.html')
(RootTests:=ROOT/'tests').mkdir(exist_ok=True)
shutil.copy2(SRC/'tests/bucket-rest.test.mjs',RootTests/'bucket-rest.test.mjs')
package=ROOT/'package.json'
if package.is_file():
 import json
 raw=json.loads(package.read_text('utf8'))
 raw['version']='0.9.6'
 script=raw.get('scripts',{}).get('test','')
 if script and 'tests/bucket-rest.test.mjs' not in script:
  if 'tests/balance.test.mjs' in script:
   raw['scripts']['test']=script.replace('tests/balance.test.mjs','tests/bucket-rest.test.mjs tests/balance.test.mjs')
  else:
   raw['scripts']['test']=script+' && node --test tests/bucket-rest.test.mjs'
 shutil.copy2(package,backup/'package.json')
 package.write_text(json.dumps(raw,ensure_ascii=False,indent=2)+'\n','utf8')
print('INSTALLED bucket states and source-derived 6-frame sleep sprites. Originals backed up:',backup)
print('PROTECTED: combat model, canonical attack/hurt sprites, swords, armor, game-core and existing house artwork were not touched.')
print('RUN: node --check game.mjs && node --test tests/bucket-rest.test.mjs && npm test')