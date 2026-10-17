import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CANONICAL_FRAME_PATHS,CANONICAL_FRAME_COUNT,ARMOR_HANDLES,WEAPON_HANDLES,PAW_HANDLES,applyCanonicalFrame} from '../canonical-sprites.mjs';
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
 assert.equal(x,65);assert.equal(y,214);
 assert.equal(angle,-55);assert.equal(scale,.62);
});

test('all five character appearances have pose-specific grips and a matching clipped paw',()=>{
 const el=()=>({props:{},setAttribute(k,v){this.props[k]=String(v)}});
 const rig=Object.fromEntries(['body','heroMotion','weaponSlot','armorSlot','armorImage','handFront','gripShape'].map(id=>[id,el()]));
 const armors=['none','forest_guardian','steel_knight','slime_guardian','bone_guardian'];
 for(const kind of ['attack','hurt']){
  assert.equal(PAW_HANDLES[kind].length,6);
  for(let i=0;i<6;i++){
   const [x,y,angle,scale]=WEAPON_HANDLES[kind][i];
   const [pawX,pawY]=PAW_HANDLES[kind][i];
   const wx=(114+x*260/279).toFixed(2);
   for(const armorId of armors){
    applyCanonicalFrame(kind,i,{...rig,armorId,transparent:true});
    const correction=armorId==='forest_guardian'&&kind==='attack'&&i===0?15:0;
    const wy=(-22+(y+correction)*346/370).toFixed(2);
    const gripY=(-22+(pawY+correction)*346/370).toFixed(2);
    assert.equal(rig.weaponSlot.props.transform,`translate(${wx} ${wy}) rotate(${angle}) scale(${scale})`,`${armorId} ${kind} ${i+1}`);
    assert.equal(rig.gripShape.props.cx,(114+pawX*260/279).toFixed(2));
    assert.equal(rig.gripShape.props.cy,gripY);
    assert.equal(rig.handFront.props.href,rig.body.props.href);
   }
  }
 }
 const markup=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.ok(markup.includes('id="hero-paw-front"'));
 assert.ok(markup.includes('id="paw-grip-ellipse"'));
 assert.ok(markup.includes('clip-path="url(#paw-grip-clip)"'));
});
