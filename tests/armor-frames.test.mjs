import test from 'node:test';import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {ARMORS} from '../equipment-catalog.mjs';import {ARMOR_SET_IDS,ARMOR_POSES,armorFramePath} from '../armor-frames.mjs';
import {applyCanonicalFrame,CANONICAL_FRAME_PATHS} from '../canonical-sprites.mjs';
const element=(initial={})=>({attrs:{...initial},style:{},setAttribute(k,v){this.attrs[k]=String(v)},getAttribute(k){return this.attrs[k]??null},removeAttribute(k){delete this.attrs[k]}});
test('10 catalog armors have all 120 independent vector pose overlays, with protected flower/paws/scarf',async()=>{
 assert.deepEqual(new Set(ARMOR_SET_IDS),new Set(ARMORS.filter(a=>a.svg).map(a=>a.id)));
 const paths=new Set();
 for(const id of ARMOR_SET_IDS)for(const kind of ['attack','hurt']){
  const shapes=new Set();
  for(let frame=0;frame<6;frame++){
   const path=armorFramePath(id,kind,frame);paths.add(path);
   const svg=await readFile(new URL('../'+path,import.meta.url),'utf8');
   assert.ok(svg.includes(`data-armor="${id}" data-phase="${kind}" data-frame="${frame+1}"`));
   assert.match(svg,/viewBox="0 0 279 370"/);assert.ok(!svg.includes('<image'),'all gear must stay editable vector');
   for(const part of ['helmet','chestplate','boot'])assert.ok(svg.includes(`data-part="${part}"`));
   for(const detail of ['flower','paw','scarf'])assert.ok(svg.includes(`data-protect="${detail}"`));
   shapes.add(createHash('sha256').update(svg.slice(svg.indexOf('<defs>'))).digest('hex'));
  }
  assert.equal(shapes.size,kind==='hurt'?6:5,'hurt recovery has its own shifted garment anchors');
 }
 assert.equal(paths.size,120);assert.equal(armorFramePath('none','attack',0),'');
});
test('every armor follows every canonical frame without moving kitten or changing weapon handles',()=>{
 for(const id of ARMOR_SET_IDS)for(const kind of ['attack','hurt'])for(let n=0;n<6;n++){
  const rig={body:element(),heroMotion:element(),weaponSlot:element(),armorSlot:element(),armorImage:element({'data-armor-id':id})};
  applyCanonicalFrame(kind,n,rig);
  assert.equal(rig.body.getAttribute('href'),CANONICAL_FRAME_PATHS[kind][n]);
  assert.equal(rig.heroMotion.getAttribute('transform'),'translate(0 0)');
  assert.equal(rig.armorImage.getAttribute('href'),armorFramePath(id,kind,n));
  for(const key of ['x','y','width','height'])assert.equal(rig.armorImage.getAttribute(key),rig.body.getAttribute(key));
  assert.equal(rig.armorSlot.getAttribute('transform'),'translate(0 0)');
 }
 const rig={body:element(),heroMotion:element(),weaponSlot:element(),armorSlot:element(),armorImage:element({'data-armor-id':'none'})};
 applyCanonicalFrame('hurt',3,rig);assert.equal(rig.armorImage.style.display,'none');assert.equal(rig.armorImage.getAttribute('href'),null);
});
