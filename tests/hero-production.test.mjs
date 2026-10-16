import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {ATTACKS,gripForPose} from '../hero-poses.mjs';
const root=path.resolve(import.meta.dirname,'..');
const s=path.join(root,'animations','hero');

test('three different attacks, six frames each, same ready pose and one contact at frame four',()=>{
 assert.deepEqual(ATTACKS.map(a=>a.id),['slash','overhead','thrust']);
 for(const attack of ATTACKS){
  assert.equal(attack.frames.length,6);assert.equal(attack.captions.length,6);
  assert.deepEqual(attack.frames[0],attack.frames[5],`${attack.id} must settle back to start`);
  assert.ok(attack.captions[3].toLowerCase().includes(attack.id==='slash'?'удар':attack.id==='thrust'?'контакт':'удар'));
 }
});

test('all 18 frames have same face, no embedded sword, and foreleg reaches transformed SVG hilt',()=>{
 for(const attack of ATTACKS){
  let distinct=new Set();
  for(let i=0;i<6;i++){
   const file=path.join(s,attack.id,`${String(i+1).padStart(2,'0')}.svg`);
   assert.ok(fs.existsSync(file),file);
   const svg=fs.readFileSync(file,'utf8');distinct.add(svg);
   assert.match(svg,/data:image\/png;base64,/,'canonical face retained');
   assert.match(svg,/data-has-painted-sword="false"/);
   assert.doesNotMatch(svg,/art\/weapons\//,'sword must be separate');
   const xm=svg.match(/data-grip-x="([\d.]+)"/),ym=svg.match(/data-grip-y="([\d.]+)"/);
   assert.ok(xm&&ym);
   const [x,y]=gripForPose(attack.frames[i]);
   assert.ok(Math.abs(+xm[1]-x)<.003 && Math.abs(+ym[1]-y)<.003,`detached grip in ${attack.id}/${i+1}`);
  }
  assert.ok(distinct.size>=5,`animation ${attack.id} must move the body`);
 }
});

test('game and animation studio use common poses + one replaceable SVG weapon',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const js=fs.readFileSync(path.join(root,'game.mjs'),'utf8');
 const studio=fs.readFileSync(path.join(root,'sprint-01-studio.html'),'utf8');
 assert.equal((html.match(/id="hero-weapon"/g)||[]).length,1,'no double swords');
 assert.ok(html.includes('id="hero-hand"'));
 for(const source of [js,studio]){
  assert.match(source,/hero-poses\.mjs/);
  assert.match(source,/hero-hand/);
  assert.match(source,/hero-body/);
 }
 assert.match(js,/contactAttack\(\);playEnemyFrames\('hurt'\)/);
 assert.match(js,/heroFrame\(3\)/);
});

test('boss slime crown compensates pose tilt and stays attached on all 12 frames',()=>{
 for(const type of ['attack','hurt'])for(let n=1;n<=6;n++){
  const file=path.join(root,'animations','slime','boss',type,`${String(n).padStart(2,'0')}.svg`);
  const svg=fs.readFileSync(file,'utf8');
  const tilt=Number(svg.match(/translate\(160 190\) rotate\(([-\d.]+)\)/)?.[1]);
  const leveling=Number(svg.match(/data-crown-level="true" transform="rotate\(([-\d.]+) 155 108\)"/)?.[1]);
  assert.ok(Number.isFinite(tilt)&&Number.isFinite(leveling),file);
  assert.ok(Math.abs(tilt+leveling)<.001,`crown tilted in ${type} ${n}`);
 }
});
