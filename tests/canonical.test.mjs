import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CANONICAL_FRAME_PATHS,CANONICAL_FRAME_COUNT,ARMOR_HANDLES,WEAPON_HANDLES} from '../canonical-sprites.mjs';
test('approved 6 attack + 6 hurt assets are present without duplicate frames',()=>{
 assert.equal(CANONICAL_FRAME_COUNT,6);
 const all=[...CANONICAL_FRAME_PATHS.attack,...CANONICAL_FRAME_PATHS.hurt];
 assert.equal(all.length,12);assert.equal(new Set(all).size,12);
 const buffers=[];
 for(const p of all){const file=new URL('../'+p,import.meta.url);assert.ok(fs.existsSync(file),p);const buf=fs.readFileSync(file);assert.ok(buf.length>10000,p);assert.equal(buf.subarray(1,4).toString(),'PNG');buffers.push(buf);}
 assert.equal(new Set(buffers.map(b=>b.toString('base64'))).size,12,'all extracted PNG files should be distinct byte arrays');
});
test('gear is independent of kitten and has an anchor for every pose',()=>{
 for(const kind of ['attack','hurt']){
  assert.equal(ARMOR_HANDLES[kind].length,6);
  assert.equal(WEAPON_HANDLES[kind].length,6);
  for(const entry of [...ARMOR_HANDLES[kind],...WEAPON_HANDLES[kind]])assert.ok(entry.every(Number.isFinite));
 }
 const markup=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.ok(markup.includes('id="hero-weapon"'));
 assert.ok(markup.includes('id="hero-armor"'));
 assert.ok(markup.includes('assets/canonical/attack_01.png'));
});

test('fourth hurt pose keeps weapon grip in paw and blade angled away from face',()=>{
 const [x,y,angle,scale]=WEAPON_HANDLES.hurt[3];
 assert.equal(x,82);assert.equal(y,201);
 assert.equal(angle,-55);assert.equal(scale,.62);
});
