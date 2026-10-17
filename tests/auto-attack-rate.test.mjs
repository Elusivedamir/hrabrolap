import test from 'node:test';
import assert from 'node:assert/strict';
import * as c from '../game-core.mjs';

test('manual attack hard-limited to 3 taps per second even when tapping at 100Hz',()=>{
 const p=c.freshProgress(),b=c.startFight(p);b.monster.hp=100000;b.enemyHp=100000;
 let hits=0;
 for(let i=0;i<100;i++){
  c.stepFight(p,b,.01,false);
  hits+=c.tapMonster(p,b).filter(x=>x.kind==='hero-hit').length;
 }
 assert.ok(hits<=3 && hits>=2);
 assert.equal(c.MANUAL_HITS_PER_SECOND,3);
 assert.ok(Math.abs(c.attackInterval(p,false)-1/3)<1e-9);
});
test('auto attack rate at 0,20,40,60,80,100 levels is exactly 1–6 hits/second',()=>{
 for(const [level,expected] of [[0,1],[1,1.05],[19,1.95],[20,2],[39,2.95],[40,3],[59,3.95],[60,4],[79,4.95],[80,5],[99,5.95],[100,6]]){
  const p=c.freshProgress();p.autoUnlocked=true;p.autoEnabled=true;p.autoLevel=level;
  assert.ok(Math.abs(c.autoHitsPerSecond(p)-expected)<1e-9,'auto level '+level);
  const b=c.startFight(p);b.monster.hp=100000;b.enemyHp=100000;
  let hits=0;
  for(let i=0;i<100;i++)hits+=c.stepFight(p,b,.01,true).filter(x=>x.kind==='hero-hit').length;
  assert.ok(Math.abs(hits-expected)<=1,'actual hits at auto level '+level+': '+hits);
 }
});
test('auto upgrades require purchase, charge only displayed price and stop at level 100',()=>{
 const p=c.freshProgress();p.gold=1000000;
 // Speed upgrade can be bought immediately; no auto unlock required.
 const firstPrice=c.autoUpgradeCost(0);const initialGold=p.gold;
 const independent=c.upgradeAttackSpeed(p);
 assert.equal(independent.ok,true);assert.equal(independent.level,1);
 assert.equal(p.gold,initialGold-firstPrice);
 assert.equal(p.autoUnlocked,false);
 assert.equal(c.purchaseAutoBattle(p).cost,1);
 let paid=0;
 for(let i=1;i<100;i++){
  const cost=c.autoUpgradeCost(i);
  const before=p.gold;const x=c.upgradeAttackSpeed(p);
  assert.equal(x.ok,true);assert.equal(x.cost,cost);
  assert.equal(before-p.gold,cost);assert.equal(x.level,i+1);
  paid+=cost;
 }
 assert.equal(p.autoLevel,100);assert.equal(c.autoHitsPerSecond(p),6);
 assert.equal(c.upgradeAutoBattle(p).reason,'max');
 assert.equal(p.gold,1000000-1-firstPrice-paid);
 const q=c.validateProgress(JSON.parse(JSON.stringify(p)));
 assert.equal(q.autoLevel,100);assert.equal(q.autoUnlocked,true);
});
test('older unlocked saves begin auto-upgrades from zero, invalid progress is clamped',()=>{
 const p=c.freshProgress();p.gold=99;
 assert.equal(c.validateProgress({...p,autoUnlocked:true,autoEnabled:true}).autoLevel,0);
 assert.equal(c.validateProgress({...p,autoUnlocked:true,autoLevel:150}).autoLevel,100);
 assert.equal(c.validateProgress({...p,autoUnlocked:false,autoLevel:150}).autoLevel,100);
 assert.equal(c.validateProgress({...p,autoUnlocked:true,autoLevel:-8}).autoLevel,0);
});

test('manual hit after idle or restored timer cannot spend surplus credit on a second fast hit',()=>{
 const p=c.freshProgress(),b=c.startFight(p);b.enemyHp=10000;b.heroTimer=1;
 assert.equal(c.tapMonster(p,b).filter(e=>e.kind==='hero-hit').length,1);
 assert.equal(b.heroTimer,0);
 c.stepFight(p,b,.25,false);
 assert.equal(c.tapMonster(p,b)[0].kind,'cooldown');
 c.stepFight(p,b,1/12,false);
 assert.equal(c.tapMonster(p,b).filter(e=>e.kind==='hero-hit').length,1);
});
