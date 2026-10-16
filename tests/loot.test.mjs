import test from 'node:test';
import assert from 'node:assert/strict';
import * as c from '../game-core.mjs';

test('10 мечей, 10 покупаемых броней, независимые SVG-пути',()=>{
 assert.equal(c.WEAPONS.length,10);
 assert.equal(c.ARMORS.filter(a=>a.id!=='none').length,10);
 assert.equal(new Set(c.WEAPONS.map(w=>w.svg)).size,10);
 assert.equal(new Set(c.ARMORS.filter(a=>a.svg).map(a=>a.svg)).size,10);
 for(const item of [...c.WEAPONS,...c.ARMORS])assert.ok(item.price>=0);
 const web=c.ARMORS.find(a=>a.id==='web');assert.equal(web.price,300);assert.equal(web.materials.web,6);
 const bone=c.ARMORS.find(a=>a.id==='bone_slime');assert.equal(bone.materials.bone,5);assert.equal(bone.materials.slime,5);
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
test('300 монет и ровно 6 паутин: списание только при успешной покупке',()=>{
 const p=c.freshProgress();p.gold=300;p.materials.web=5;
 let r=c.buyEquipment(p,'armor','web');assert.equal(r.reason,'material');
 assert.equal(p.gold,300);assert.equal(p.materials.web,5);assert.equal(p.ownedArmors.includes('web'),false);
 p.materials.web=6;r=c.buyEquipment(p,'armor','web');assert.equal(r.ok,true);
 assert.equal(p.gold,0);assert.equal(p.materials.web,0);
 assert.equal(c.equipEquipment(p,'armor','web'),true);assert.equal(c.maxHealth(p),100);
 assert.equal(c.buyEquipment(p,'armor','web').reason,'owned');
});
test('броня из слизи и костей: по пять каждого и золото',()=>{
 const p=c.freshProgress();p.gold=550;p.materials.bone=5;p.materials.slime=5;
 assert.equal(c.buyEquipment(p,'armor','bone_slime').ok,true);
 assert.equal(p.gold,0);assert.equal(p.materials.bone,0);assert.equal(p.materials.slime,0);
});
test('сохранения v3 мигрируют, v4 сохраняют ресурсы и тип врага',()=>{
 const old=c.validateProgress({...c.freshProgress(),version:3,materials:{web:600},gold:305});
 assert.equal(old.materials.web,0);assert.equal(old.gold,305);
 const p=c.freshProgress();p.materials.web=7;p.gold=987;p.ownedArmors.push('web');p.equippedArmor='web';
 const fight=c.startFight(p,c.maxHealth(p),()=>.1);
 const raw=JSON.parse(JSON.stringify({...p,battleState:{level:fight.level,enemyHp:fight.enemyHp,hp:33,phase:'fight',heroTimer:0,enemyTimer:0,rest:0,monsterType:fight.monster.type}}));
 const copy=c.validateProgress(raw);const restored=c.restoreFight(copy,raw.battleState);
 assert.equal(copy.materials.web,7);assert.equal(copy.equippedArmor,'web');
 assert.equal(restored.monster.type,'spider');assert.equal(restored.hp,33);
 const corrupted=c.validateProgress({...raw,materials:{web:-99,bone:3.4,hack:999}});
 assert.equal(corrupted.materials.web,0);assert.equal(corrupted.materials.bone,3);assert.equal('hack' in corrupted.materials,false);
});
