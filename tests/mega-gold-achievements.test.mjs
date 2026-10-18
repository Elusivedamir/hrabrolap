import test from 'node:test';
import assert from 'node:assert/strict';
import {MEGA_BOSSES,megaBossForWave,megaBossByType} from '../mega-bosses.mjs';
import {MEGA_ANIMATION_COUNT,megaBossFrameSvg,megaBossFrameUrl} from '../mega-boss-art.mjs';
import {ACHIEVEMENTS,achievementProgress,claimAchievement} from '../achievements.mjs';
import {freshProgress,validateProgress,monsterForWave,startFight,stepFight,tapMonster,heroDamage,maxHealth,upgrade,planFishing,fishMarketMultiplier,fishingRodBonus,fishCost,homeCost,MAX_FISH_LEVEL,MAX_HOME_LEVEL} from '../game-core.mjs';

test('14 unique milestone bosses are placed at 50..700 and preserve normal attacks',()=>{
 assert.equal(MEGA_BOSSES.length,40);
 assert.equal(new Set(MEGA_BOSSES.map(x=>x.id)).size,40);
 for(let n=1;n<=2000;n++){
  const m=monsterForWave(n);
  assert.equal(!!m.megaboss,n%50===0);
  if(n%50!==0)continue;
  assert.equal(m.id,megaBossForWave(n).id);
  assert.equal(megaBossByType(m.id)?.wave,n);
  assert.equal(m.boss,true);
  assert.ok(m.hp>0&&m.attack>0&&m.reward>0);
 }
});
test('14 separate models contain 6 SVG attack poses and 6 hurt poses each',()=>{
 assert.equal(MEGA_ANIMATION_COUNT,480);
 const examples=new Set();
 for(const boss of MEGA_BOSSES){
  const first=megaBossFrameSvg(boss.id,'attack',0);
  examples.add(first);
  for(const phase of ['attack','hurt'])for(let i=0;i<6;i++){
   const svg=megaBossFrameSvg(boss.id,phase,i);
   assert.ok(svg.startsWith('<svg')&&svg.includes('</svg>'));
   assert.ok(svg.includes('viewBox="0 0 240 230"'));
   const url=megaBossFrameUrl(boss.id,phase,i);
   if(boss.id==='thorn_warden')assert.match(url,/^assets\/approved\/moss-guardian\/(attack|hurt)_0[1-6]\.png$/);
   else assert.ok(url.startsWith('data:image/svg+xml'));
  }
 }
 assert.equal(examples.size,40);
});
test('immunity cancels only enchantment effect, sword always works',()=>{
 const p=freshProgress();
 p.room=50;p.best=49;p.enchantment='poison';let b=startFight(p);b.heroTimer=2;
 const before=b.enemyHp;tapMonster(p,b);
 assert.equal(b.poisonRemaining,0);assert.ok(b.enemyHp<before);
 p.room=100;p.best=99;p.enchantment='vampirism';b=startFight(p);b.heroTimer=2;b.hp=maxHealth(p)-10;
 tapMonster(p,b);assert.equal(b.hp,maxHealth(p)-10);
 p.room=600;p.best=599;p.enchantment='lightning';b=startFight(p);b.heroTimer=2;
 const last=b.enemyHp;tapMonster(p,b);
 assert.equal(last-b.enemyHp,heroDamage(p));assert.equal(p.lightningHits,0);
});
test('one-time first-clear milestone bonus and reduced replay gold prevent boss farming',()=>{
 const p=freshProgress();p.room=50;p.best=49;p.sword=100;p.armor=100;
 let b=startFight(p);const premium=b.monster.reward;b.enemyHp=1;b.heroTimer=3;
 stepFight(p,b,.1,true);
 assert.equal(p.gold,premium);assert.deepEqual(p.megaBossWins,[50]);
 p.room=51;p.best=50;p.farming=true;
 b=startFight(p);assert.equal(b.level,50);b.enemyHp=1;b.heroTimer=3;
 const gold=p.gold;stepFight(p,b,.1,true);
 assert.ok(p.gold-gold>0&&p.gold-gold<premium/2);
 assert.deepEqual(p.megaBossWins,[50]);
});
test('gold sinks cap useless house and fishing upgrades without breaking saves',()=>{
 assert.equal(fishCost(100),fishCost(MAX_FISH_LEVEL));
 assert.equal(homeCost(100),homeCost(MAX_HOME_LEVEL));
 const p=freshProgress();p.gold=1e9;p.fishLevel=MAX_FISH_LEVEL;p.home=MAX_HOME_LEVEL;
 const gold=p.gold;
 assert.equal(upgrade(p,'fish').reason,'max');
 assert.equal(upgrade(p,'home').reason,'max');
 assert.equal(p.gold,gold);
 const restored=validateProgress({...p,version:5,megaBossWins:[50,50,100,125],achievementClaimed:[0,0,3]});
 assert.deepEqual(restored.megaBossWins,[50,100]);
 assert.deepEqual(restored.achievementClaimed,[0,3]);
});
test('achievements claim exactly once and do not print infinite gold',()=>{
 assert.equal(ACHIEVEMENTS.length,28);
 const p=freshProgress();p.best=10;
 const a=ACHIEVEMENTS[0];assert.equal(achievementProgress(p,a),10);
 assert.equal(claimAchievement(p,a.id).ok,true);
 const before=p.gold;
 assert.equal(claimAchievement(p,a.id).ok,false);
 assert.equal(p.gold,before);
 assert.equal(p.totalGold,before);
});

test('wave-scaled fishing remains supplementary and rod bonus has diminishing returns',()=>{
 assert.equal(fishMarketMultiplier(0),1);
 assert.equal(fishMarketMultiplier(100),4);
 assert.equal(fishMarketMultiplier(700),64);
 assert.equal(fishingRodBonus(0),1);
 assert.ok(Math.abs(fishingRodBonus(30)-2.54)<.001);
 const normal=freshProgress(),deep=freshProgress(),pro=freshProgress();
 deep.best=700;pro.best=700;pro.fishLevel=30;
 for(const p of [normal,deep,pro])planFishing(p,()=>.42);
 const value=p=>p.catchPlan.reduce((total,fish)=>total+fish.price,0);
 assert.ok(value(deep)>value(normal)*50);
 assert.ok(value(deep)<value(normal)*70);
 assert.ok(value(pro)>value(deep)*2.3);
 assert.ok(value(pro)<value(deep)*2.7);
});
