import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ARMORS,freshProgress,buyEquipment,equipEquipment} from '../game-core.mjs';
import {applyCanonicalFrame} from '../canonical-sprites.mjs';
const names=['steel_knight','slime_guardian','bone_guardian'];
test('four complete character costumes are available',()=>{
 assert.deepEqual(ARMORS.map(x=>x.id),['none','forest_guardian',...names]);
 for(const name of names){
  const armor=ARMORS.find(x=>x.id===name);assert.equal(armor.price,name==='steel_knight'?50:0);assert.equal(armor.fullCharacter,true);
  for(const kind of ['attack','hurt'])for(let i=1;i<=6;i++){
   const buf=readFileSync(new URL('../assets/costumes/'+name+'/'+kind+'_0'+i+'.png',import.meta.url));
   assert.equal(buf.subarray(1,4).toString(),'PNG');
   assert.equal(buf.readUInt32BE(16),279);assert.equal(buf.readUInt32BE(20),370);
   assert.equal(buf.readUInt8(25),6);
  }
 }
});
test('equipping approved complete character retains separate sword anchors and swaps to originals on removal',()=>{
 const element=()=>({attrs:{},setAttribute(k,v){this.attrs[k]=v;}});
 const r=Object.fromEntries(['body','heroMotion','weaponSlot','armorSlot','armorImage'].map(k=>[k,element()]));
 for(const name of names){
  const p=freshProgress();p.gold=name==='steel_knight'?50:0;p.materials.slime=15;p.materials.bone=15;
  assert.equal(buyEquipment(p,'armor',name).ok,true);assert.equal(p.gold,0);
  assert.equal(equipEquipment(p,'armor',name),true);
  for(const kind of ['attack','hurt'])for(let i=0;i<6;i++){
   applyCanonicalFrame(kind,i,{...r,armorId:name});
   assert.equal(r.body.attrs.href,'assets/costumes/'+name+'/'+kind+'_0'+(i+1)+'.png');
   assert.equal(r.body.attrs['data-costume'],name);
   assert.ok(r.weaponSlot.attrs.transform.includes('translate('));
  }
  applyCanonicalFrame('attack',0,r);
  assert.equal(r.body.attrs.href,'assets/canonical/attack_01.png');
 }
});