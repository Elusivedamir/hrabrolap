import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {FOREST_GUARDIAN_ID,FRAME_COUNT,forestFrameUrl} from '../forest-guardian-rig.mjs';
import {applyCanonicalFrame,CANONICAL_FRAME_PATHS} from '../canonical-sprites.mjs';
import {freshProgress,buyEquipment,equipEquipment,validateProgress,ARMORS,maxHealth} from '../game-core.mjs';
test('12 complete user frames retain their native canvases, order and verified export hashes',()=>{
 assert.equal(FRAME_COUNT,6);
 const manifest=JSON.parse(fs.readFileSync(new URL('../assets/costumes/forest_guardian/manifest.json',import.meta.url),'utf8'));
 assert.equal(manifest.content,'complete-character');assert.equal(manifest.pixel_changes,false);
 assert.equal(manifest.frames.length,12);
 const paths=[];
 const sourceOrder={attack:[12,11,9,10,8,7],hurt:[12,11,10,8,9,7]};
 for(const kind of ['attack','hurt'])for(let i=0;i<6;i++){
  paths.push(forestFrameUrl(kind,i));
  const file=new URL('../'+forestFrameUrl(kind,i),import.meta.url);
  const bytes=fs.readFileSync(file);
  assert.ok(bytes.length>25000,'Missing complete character PNG: '+file);
  assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a','PNG header '+file);
  const scale=kind==='hurt'&&(i===3||i===5)?2:1;
  assert.equal(bytes.readUInt32BE(16),279*scale,'Width '+file);
  assert.equal(bytes.readUInt32BE(20),370*scale,'Height '+file);
  assert.equal(bytes.readUInt8(25),6,'Required transparent RGBA PNG '+file);
  const record=manifest.frames.find(f=>f.kind===kind&&f.index===i+1);
  assert.equal(record.file,`${kind}_0${i+1}.png`);
  assert.ok(record.source.startsWith(`${kind}_${String(sourceOrder[kind][i]).padStart(2,'0')}_`));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),record.png_sha256);
 }
 assert.equal(new Set(paths).size,12);
 assert.equal(forestFrameUrl('attack',9),paths[5]);
 assert.throws(()=>forestFrameUrl('sleep',0));
});
test('equipping and removing the costume preserves its canvas and aligns the separate sword',()=>{
 const element=()=>({attrs:{},setAttribute(k,v){this.attrs[k]=v;}});
 const rig=Object.fromEntries(['body','heroMotion','weaponSlot','armorSlot','armorImage'].map(k=>[k,element()]));
 for(const kind of ['attack','hurt'])for(let i=0;i<6;i++){
  applyCanonicalFrame(kind,i,rig);
  const geometry={...rig.body.attrs},weapon=rig.weaponSlot.attrs.transform;
  applyCanonicalFrame(kind,i,{...rig,armorId:FOREST_GUARDIAN_ID});
  assert.equal(rig.body.attrs.href,forestFrameUrl(kind,i));
  assert.equal(rig.body.attrs['data-costume'],FOREST_GUARDIAN_ID);
  if(kind==='attack'&&i===0){
   assert.equal(rig.weaponSlot.attrs.transform,'translate(201.60 220.20) rotate(-15) scale(0.64)');
  }else assert.equal(rig.weaponSlot.attrs.transform,weapon);
  for(const key of ['x','y','width','height'])assert.equal(rig.body.attrs[key],geometry[key]);
  applyCanonicalFrame(kind,i,{...rig,armorId:'none'});
  assert.equal(rig.body.attrs.href,CANONICAL_FRAME_PATHS[kind][i]);
 }
});
test('new set costs 50 coins, preserves HP, saves and unequips',()=>{
 const p=freshProgress();p.gold=51;
 assert.equal(FOREST_GUARDIAN_ID,'forest_guardian');
 assert.equal(ARMORS.find(x=>x.id===FOREST_GUARDIAN_ID).price,50);
 const hp=maxHealth(p);
 assert.equal(buyEquipment(p,'armor',FOREST_GUARDIAN_ID).ok,true);
 assert.equal(p.gold,1);
 assert.equal(buyEquipment(p,'armor',FOREST_GUARDIAN_ID).reason,'owned');
 assert.equal(equipEquipment(p,'armor',FOREST_GUARDIAN_ID),true);
 assert.equal(maxHealth(p),hp);
 const loaded=validateProgress(JSON.parse(JSON.stringify(p)));
 assert.equal(loaded.equippedArmor,FOREST_GUARDIAN_ID);
 assert.equal(equipEquipment(loaded,'armor','none'),true);
 assert.equal(maxHealth(loaded),hp);
});
test('original immutable PNGs remain locked; graphics not yet loaded by this test',()=>{
 const lock=JSON.parse(fs.readFileSync(new URL('./locked-art-shas.json',import.meta.url),'utf8'));
 for(const f of lock.files.filter(x=>x.path.startsWith('assets/canonical/'))){
  const bytes=fs.readFileSync(new URL('../'+f.path,import.meta.url));
  const header=crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
  assert.equal(header,f.sha,f.path);
 }
});
