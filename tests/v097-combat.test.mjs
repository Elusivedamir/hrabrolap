import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as c from '../game-core.mjs';
import {MONSTER_TYPES,MONSTER_ANIMATIONS,monsterPose} from '../monster-rig.mjs';
import {QUESTS,questProgress,claimQuest} from '../quests.mjs';

test('10 enemies, each has 6 explicit attack and 6 explicit hurt poses',()=>{
 assert.equal(c.MONSTERS.length,10);assert.equal(new Set(c.MONSTERS.map(m=>m.type)).size,10);
 assert.deepEqual(new Set(MONSTER_TYPES),new Set(c.MONSTERS.map(m=>m.type)));
 for(const type of MONSTER_TYPES)for(const kind of ['attack','hurt']){
  const poses=MONSTER_ANIMATIONS[type][kind];assert.equal(poses.length,6);
  assert.equal(new Set(poses.map(p=>p.join(','))).size,6,'six unique poses for '+type+'/'+kind);
  for(let i=0;i<6;i++){
   const pose=monsterPose(type,kind,i);
   assert.equal(pose.frame,i+1);
   assert.ok(pose.transform.startsWith('translate('));
  }
 }
});
test('unpaid auto locked by default, costs exactly 1 once, modes toggle freely',()=>{
 const p=c.freshProgress();assert.equal(p.autoEnabled,false);assert.equal(p.autoUnlocked,false);
 assert.equal(c.purchaseAutoBattle(p).reason,'gold');
 p.gold=2;assert.equal(c.purchaseAutoBattle(p).cost,1);assert.equal(p.gold,1);
 assert.equal(p.autoEnabled,true);assert.equal(p.autoUnlocked,true);
 c.purchaseAutoBattle(p);assert.equal(p.autoEnabled,false);assert.equal(p.gold,1);
 c.purchaseAutoBattle(p);assert.equal(p.autoEnabled,true);assert.equal(p.gold,1);
 const copy=c.validateProgress(JSON.parse(JSON.stringify(p)));assert.equal(copy.autoEnabled,true);assert.equal(copy.autoUnlocked,true);
});
test('manual input waits for cooldown, then deals exactly one hit',()=>{
 const p=c.freshProgress();const b=c.startFight(p,c.maxHealth(p),()=>.99);
 const initial=b.enemyHp;
 for(let i=0;i<6;i++)assert.equal(c.stepFight(p,b,.25,false).filter(e=>e.kind==='hero-hit').length,0);
 const e=c.tapMonster(p,b);assert.equal(e.filter(x=>x.kind==='hero-hit').length,1);assert.ok(b.enemyHp<initial);
 assert.equal(c.tapMonster(p,b)[0].kind,'cooldown');
});
test('poison turns into real DOT and a poison win; lightning deals extra damage',()=>{
 const p=c.freshProgress();const b=c.startFight(p,c.maxHealth(p),()=>.99);
 assert.equal(c.setEnchantment(p,'poison'),true);b.heroTimer=1.3;b.enemyHp=15;
 const e=c.tapMonster(p,b);assert.equal(e[0].element,'poison');
 assert.ok(b.poisonRemaining>0);
 const poisonEvents=[];for(let i=0;i<16;i++)poisonEvents.push(...c.stepFight(p,b,.25,false));
 assert.ok(poisonEvents.some(x=>x.kind==='poison-tick'));
 assert.ok(poisonEvents.some(x=>x.kind==='win'));assert.equal(p.poisonKills,1);
 const l=c.startFight(p,c.maxHealth(p),()=>.99);c.setEnchantment(p,'lightning');l.heroTimer=1.3;
 const dmg=l.enemyHp;c.tapMonster(p,l);
 assert.ok(dmg-l.enemyHp>c.heroDamage(p));assert.equal(p.lightningHits,1);
});
test('vampirism heals no more than lost HP and persists effect selection',()=>{
 const p=c.freshProgress();c.setEnchantment(p,'vampirism');
 const b=c.startFight(p,c.maxHealth(p),()=>.99);b.heroTimer=1.3;b.hp=60;
 const e=c.tapMonster(p,b,()=>.04);assert.equal(e[0].element,'vampirism');
 assert.ok(b.hp>60&&b.hp<=c.maxHealth(p));assert.equal(p.vampireHeals,1);
 assert.equal(c.validateProgress(JSON.parse(JSON.stringify(p))).enchantment,'vampirism');
});
test('25 quests, old IDs kept, claimed once and completion tied to actual stats',()=>{
 assert.equal(QUESTS.length,25);
 assert.deepEqual(QUESTS.slice(0,4).map(q=>q.id),[0,1,2,3]);
 const p=c.freshProgress();assert.equal(claimQuest(p,4).ok,false);
 p.monsterKills.spider=3;assert.equal(questProgress(p,QUESTS[4]),3);
 const x=claimQuest(p,4);assert.equal(x.ok,true);assert.equal(claimQuest(p,4).ok,false);assert.equal(p.gold,x.reward);
 const copy=c.validateProgress(JSON.parse(JSON.stringify(p)));assert.ok(copy.questClaimed.includes(4));
});
test('approved cat PNGs and 10 SVG swords still exist as immutable inputs',()=>{
 for(let i=1;i<=6;i++)for(const phase of ['attack','hurt'])
  assert.ok(fs.existsSync(new URL('../assets/canonical/'+phase+'_0'+i+'.png',import.meta.url)));
 assert.equal(c.WEAPONS.length,10);
});
