import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {FOREST_GUARDIAN_ID,FRAME_COUNT,forestArmorUrl,forestForegroundPath} from '../forest-guardian-rig.mjs';
import {freshProgress,buyEquipment,equipEquipment,validateProgress,ARMORS,maxHealth} from '../game-core.mjs';
test('forest guardian supplies 12 independent frame paths and clipped original hands',()=>{
 assert.equal(FRAME_COUNT,6);
 const paths=[];
 for(const kind of ['attack','hurt'])for(let i=0;i<6;i++){
  paths.push(forestArmorUrl(kind,i));
  assert.match(forestForegroundPath(kind,i),/^M[\d.-]+ [\d.-]+ a/);
 }
 assert.equal(new Set(paths).size,12);
 assert.equal(forestArmorUrl('attack',9),paths[5]);
 assert.throws(()=>forestArmorUrl('sleep',0));
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
