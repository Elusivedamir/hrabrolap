import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {CANONICAL_FRAME_PATHS,applyCanonicalFrame} from '../canonical-sprites.mjs';
for(const series of ['canonical','forest_guardian','steel_knight']) {
 test('36 transparent approved-body copies: '+series,()=>{
  for(const kind of ['attack','hurt'])for(let n=1;n<=6;n++) {
   const name=kind+'_'+String(n).padStart(2,'0')+'.png';
   const path=new URL('../assets/clean/'+series+'/'+name,import.meta.url);
   assert.ok(existsSync(path),String(path));
   const b=readFileSync(path);assert.equal(b.subarray(1,4).toString(),'PNG');
   assert.equal(b.readUInt8(25),6);
  }
 });
}
test('default source remains locked but renderer can select a clean copy',()=>{
 const e=()=>({attrs:{},setAttribute(k,v){this.attrs[k]=v;}});
 const r=Object.fromEntries(['body','heroMotion','weaponSlot','armorSlot','armorImage'].map(k=>[k,e()]));
 applyCanonicalFrame('attack',0,r);
 assert.equal(r.body.attrs.href,CANONICAL_FRAME_PATHS.attack[0]);
 applyCanonicalFrame('attack',0,{...r,transparent:true});
 assert.equal(r.body.attrs.href,'assets/clean/canonical/attack_01.png');
 applyCanonicalFrame('attack',0,{...r,transparent:true,armorId:'steel_knight'});
 assert.equal(r.body.attrs.href,'assets/clean/steel_knight/attack_01.png');
});