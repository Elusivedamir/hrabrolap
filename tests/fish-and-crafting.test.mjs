import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fishCount} from '../russian.mjs';
import {FISH_ART,fishArt} from '../fish-art.mjs';
import {SPECIES,freshProgress,buyEquipment,equipEquipment,validateProgress,maxHealth} from '../game-core.mjs';

test('Russian fish counts handle singular, few, teens and twenty-plus',()=>{
 for(const [n,word] of [[0,'рыб'],[1,'рыба'],[2,'рыбы'],[4,'рыбы'],[5,'рыб'],[11,'рыб'],[12,'рыб'],[14,'рыб'],[21,'рыба'],[22,'рыбы'],[24,'рыбы'],[25,'рыб'],[101,'рыба'],[111,'рыб']])
  assert.equal(fishCount(n),`${n} ${word}`);
});
test('every catchable species has its own valid SVG illustration',()=>{
 assert.equal(new Set(SPECIES.map(f=>fishArt(f.species))).size,SPECIES.length);
 for(const fish of SPECIES){
  assert.ok(FISH_ART[fish.species]);
  const svg=readFileSync(new URL('../'+fishArt(fish.species),import.meta.url),'utf8');
  assert.match(svg,/<svg[^>]+viewBox=/);assert.ok(svg.includes(`<title>${fish.species}</title>`));
 }
});
for(const [id,material] of [['slime_guardian','slime'],['bone_guardian','bone']]){
 test(`${id}: 15 materials, no coins, atomic failure, no double spend, persistent equipment`,()=>{
  const p=freshProgress();p.materials[material]=14;
  const before=JSON.stringify(p);
  assert.equal(buyEquipment(p,'armor',id).reason,'material');
  assert.equal(JSON.stringify(p),before);
  p.materials[material]=15;
  assert.equal(buyEquipment(p,'armor',id).ok,true);
  assert.equal(p.materials[material],0);assert.equal(p.gold,0);
  assert.equal(buyEquipment(p,'armor',id).reason,'owned');
  assert.equal(p.materials[material],0);assert.equal(equipEquipment(p,'armor',id),true);
  const restored=validateProgress(JSON.parse(JSON.stringify(p)));
  assert.equal(restored.equippedArmor,id);assert.ok(restored.ownedArmors.includes(id));
  assert.equal(restored.materials[material],0);assert.equal(maxHealth(restored),maxHealth(freshProgress()));
  assert.equal(equipEquipment(restored,'armor','none'),true);
 });
}
