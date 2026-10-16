import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {FOREST_GUARDIAN_ID,FRAME_COUNT,forestArmorUrl,forestForegroundPath} from '../forest-guardian-rig.mjs';
import {freshProgress,buyEquipment,equipEquipment,validateProgress,ARMORS,maxHealth} from '../game-core.mjs';
test('forest guardian supplies 12 independent frame paths without overwriting the kitten',()=>{
 assert.equal(FRAME_COUNT,6);
 const paths=[];
 for(const kind of ['attack','hurt'])for(let i=0;i<6;i++){
  paths.push(forestArmorUrl(kind,i));
  const file=new URL('../'+forestArmorUrl(kind,i).split('?')[0],import.meta.url);
  const bytes=fs.readFileSync(file);
  assert.ok(bytes.length>25000,'Missing armor PNG: '+file);
  assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a','PNG header '+file);
  assert.equal(bytes.readUInt32BE(16),279,'Width '+file);
  assert.equal(bytes.readUInt32BE(20),370,'Height '+file);
  assert.equal(bytes.readUInt8(25),6,'Required transparent RGBA PNG '+file);
  assert.match(forestForegroundPath(kind,i),/^M[\d.-]+ [\d.-]+ a/);
 }
 assert.equal(new Set(paths).size,12);
 assert.equal(forestArmorUrl('attack',9),paths[5]);
 assert.throws(()=>forestArmorUrl('sleep',0));
});
test('the renderer does not copy an approximate oval of the cat over fitted sleeves',()=>{
 const game=fs.readFileSync(new URL('../game.mjs',import.meta.url),'utf8');
 const preview=fs.readFileSync(new URL('../forest-guardian-preview.html',import.meta.url),'utf8');
 assert.match(game,/foreground\.style\.display='none'/);
 assert.ok(!game.includes("foreground.setAttribute('href'"),'old foreground overlay must be disabled');
 assert.ok(!preview.includes('forest-clip-'),'preview must not redraw large ellipses over sleeve');
 assert.equal((preview.match(/svg\.append\(armor\)/g)||[]).length,1);
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
