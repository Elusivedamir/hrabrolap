import test from 'node:test';
import assert from 'node:assert/strict';
import * as c from '../game-core.mjs';

test('10 мечей и 2 полных комплекта за 50 монет',()=>{
 assert.equal(c.WEAPONS.length,10);
 assert.equal(c.ARMORS.filter(a=>a.id!=='none').length,2);
 assert.equal(new Set(c.WEAPONS.map(w=>w.svg)).size,10);
 assert.equal(new Set(c.ARMORS.filter(a=>a.svg).map(a=>a.svg)).size,2);
 for(const item of c.ARMORS.filter(a=>a.id!=='none')){
  assert.equal(item.price,50);
  assert.equal(item.health,0);
  assert.equal(item.fullCharacter,true);
 }
});
test('пауки возникают в 30% обычных боёв, с сохранением боссов',()=>{
 for(const n of [1,2,5,9,11,42,99]){
  assert.equal(c.spawnMonsterForWave(n,()=>.29999).type,'spider');
  assert.notEqual(c.spawnMonsterForWave(n,()=>.30000).type,'spider');
 }
 assert.equal(c.spawnMonsterForWave(5,()=>.99).type,'skeleton');
 for(let n=10;n<=100;n+=10)assert.deepEqual(c.spawnMonsterForWave(n,()=>0),c.monsterForWave(n));
});
test('за убийство паука выдаётся паутина, только один раз',()=>{
 const p=c.freshProgress();const b=c.startFight(p,c.maxHealth(p),()=>0);
 assert.equal(b.monster.type,'spider');b.enemyHp=1;b.heroTimer=1.29;
 const ev=c.stepFight(p,b,.02);const win=ev.find(e=>e.kind==='win');
 assert.deepEqual(win.loot,{id:'web',amount:1});assert.equal(p.materials.web,1);
 assert.equal(c.stepFight(p,b,.01).filter(e=>e.kind==='win').length,0);
 assert.equal(p.materials.web,1);
});
test('кости и слизь добываются с соответствующих монстров',()=>{
 for(const [monster,resource] of [['skeleton','bone'],['slime','slime'],['larva','leaf'],['beetle','chitin'],['ghost','essence']]){
  const p=c.freshProgress();const b=c.startFight(p,c.maxHealth(p),()=>.99);
  b.monster={...b.monster,...c.MONSTERS.find(m=>m.type===monster),boss:false};
  b.enemyHp=1;b.heroTimer=1.29;
  assert.equal(c.stepFight(p,b,.02).find(x=>x.kind==='win').loot.id,resource);
  assert.equal(p.materials[resource],1);
 }
});
test('покупка двух визуальных комплектов по 50 монет не расходует добычу',()=>{
 const p=c.freshProgress();p.gold=49;p.materials.web=7;p.materials.bone=3;
 assert.equal(c.buyEquipment(p,'armor','steel_knight').ok,false);
 assert.equal(p.gold,49);
 p.gold=100;
 for(const id of ['forest_guardian','steel_knight']){
  const before= {...p.materials};
  const result=c.buyEquipment(p,'armor',id);
  assert.equal(result.ok,true,id);
  assert.deepEqual(p.materials,before,'cosmetic outfits do not spend ingredients');
  assert.equal(c.equipEquipment(p,'armor',id),true);
  assert.equal(c.maxHealth(p),65);
 }
 assert.equal(p.gold,0);
 assert.equal(c.buyEquipment(p,'armor','steel_knight').reason,'owned');
 assert.equal(c.buyEquipment(p,'armor','web').reason,'missing');
});
test('сохранения v3 мигрируют, v4 сохраняют ресурсы и тип врага',()=>{
 const old=c.validateProgress({...c.freshProgress(),version:3,materials:{web:600},gold:305});
 assert.equal(old.materials.web,0);assert.equal(old.gold,305);
 const p=c.freshProgress();p.materials.web=7;p.gold=987;p.ownedArmors.push('steel_knight');p.equippedArmor='steel_knight';
 const fight=c.startFight(p,c.maxHealth(p),()=>.1);
 const raw=JSON.parse(JSON.stringify({...p,battleState:{level:fight.level,enemyHp:fight.enemyHp,hp:33,phase:'fight',heroTimer:0,enemyTimer:0,rest:0,monsterType:fight.monster.type}}));
 const copy=c.validateProgress(raw);const restored=c.restoreFight(copy,raw.battleState);
 assert.equal(copy.materials.web,7);assert.equal(copy.equippedArmor,'steel_knight');
 assert.equal(restored.monster.type,'spider');assert.equal(restored.hp,33);
 const corrupted=c.validateProgress({...raw,materials:{web:-99,bone:3.4,hack:999}});
 assert.equal(corrupted.materials.web,0);assert.equal(corrupted.materials.bone,3);assert.equal('hack' in corrupted.materials,false);
});
