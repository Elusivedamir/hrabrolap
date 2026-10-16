import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as rig from '../equipment-rig.mjs';
import {WEAPONS,ARMORS} from '../equipment-catalog.mjs';

test('точно сохранены оригинальные координаты трёх шестикадровых атак',async()=>{
 const source=await fs.readFile(new URL('../game.mjs',import.meta.url),'utf8');
 const match=source.match(/const ATTACKS=(\[[\s\S]*?\n\]);/);
 assert.ok(match,'original ATTACKS must remain in game.mjs');
 // Интерпретируем только локальный массив из исходника проекта, без внешнего ввода.
 const original=Function('return '+match[1])();
 assert.deepEqual(original,rig.REFERENCE_ATTACKS);
 assert.equal(original.length,3);
 for(const attack of original)assert.equal(attack.frames.length,6);
});
test('все позы экипировки образуют 3×6 ударов и 6 реакций на урон',()=>{
 assert.equal(rig.ARMOR_ATTACK_POSES.length,3);
 for(const poses of rig.ARMOR_ATTACK_POSES)assert.equal(poses.length,6);
 assert.equal(rig.HURT_FRAMES.length,6);
 assert.equal(rig.HURT_FRAME_MS,75);
 for(let a=0;a<3;a++)for(let f=0;f<6;f++){
  assert.match(rig.armorAttackTransform(a,f),/^translate\(-?\d+ -?\d+\) rotate\(-?\d+ 236 243\)$/);
 }
 for(let f=0;f<6;f++){
  for(const transform of [rig.armorHurtTransform(f),rig.hurtMotionTransform(f),rig.hurtWeaponTransform(f)]){
   assert.ok(!transform.includes('undefined')&&!transform.includes('NaN'));
  }
 }
});
test('preview references modular swords and armors; base cat is never redrawn',async()=>{
 assert.equal(WEAPONS.length,10);assert.equal(ARMORS.filter(a=>a.svg).length,10);
 const game=await fs.readFile(new URL('../game.mjs',import.meta.url),'utf8');
 const page=await fs.readFile(new URL('../equipment-preview.html',import.meta.url),'utf8');
 assert.ok(page.includes('art/hero/bare-kitten.svg'));
 assert.ok(page.includes('equipment-rig.mjs'));
 assert.ok(game.includes("const heroMotion=$('hero-motion'),slot=$('weapon-slot'),armorSlot=$('armor-slot')"));
 assert.ok(!game.includes('drawImage('),'base illustration must not be repainted');
});
