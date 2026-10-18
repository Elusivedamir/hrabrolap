import test from 'node:test';
import assert from 'node:assert/strict';
import * as c from '../game-core.mjs';
import {MEGA_BOSSES,megaBossForWave} from '../mega-bosses.mjs';
import {megaBossFrameSvg,megaBossFrameUrl,MEGA_ANIMATION_COUNT} from '../mega-boss-art.mjs';
import {ACHIEVEMENTS,achievementProgress,claimAchievement} from '../achievements.mjs';

test('14 genuinely distinct bosses replace every fifth crowned boss',()=>{
 assert.equal(MEGA_BOSSES.length,40);
 assert.equal(new Set(MEGA_BOSSES.map(x=>x.id)).size,40);
 for(let i=1;i<=40;i++){
  const wave=50*i,b=megaBossForWave(wave),monster=c.monsterForWave(wave);
  assert.ok(b);assert.equal(monster.type,b.id);
  assert.equal(monster.megaboss,true);assert.equal(monster.boss,true);
  assert.equal(monster.texture,b.id);assert.ok(monster.hp>0);
  assert.ok(monster.reward>0);assert.ok(monster.resistanceText);
 }
 assert.equal(megaBossForWave(51),null);
 assert.equal(c.monsterForWave(60).megaboss,false);
 assert.equal(c.monsterForWave(60).boss,true);
});

test('168 attack-and-hurt images include fourteen distinct silhouettes',()=>{
 assert.equal(MEGA_ANIMATION_COUNT,480);
 const shapes=new Set();
 for(const b of MEGA_BOSSES){
  const frames=new Set();
  for(const phase of ['attack','hurt'])for(let i=0;i<6;i++){
   const s=megaBossFrameSvg(b.id,phase,i),u=megaBossFrameUrl(b.id,phase,i);
   assert.match(s,/<svg /);assert.match(s,/<\/svg>/);
   assert.match(s,/<path|<ellipse|<circle/);
   if(b.id==='thorn_warden')assert.match(u,/^assets\/approved\/moss-guardian\/(attack|hurt)_0[1-6]\.png$/);
   else if(b.id==='bone_regent')assert.match(u,/^assets\/approved\/bone-regent\/(attack|hurt)_0[1-6]\.png$/);
   else if(b.id==='silk_empress')assert.match(u,/^assets\/approved\/silk-empress\/(attack|hurt)_0[1-6]\.png$/);
   else {assert.ok(u.startsWith('data:image/svg+xml'));assert.ok(u.length>700);}
   frames.add(s);
   if(phase==='attack'&&i===0)shapes.add(s);
  }
  assert.equal(frames.size,12,b.id);
 }
 assert.equal(shapes.size,40);
});

test('one-time rewards prevent major-boss infinite gold farming',()=>{
 const p=c.freshProgress();p.room=50;p.best=49;p.sword=1000;p.armor=1000;
 let battle=c.startFight(p);const base=battle.monster.reward;
 battle.enemyHp=1;battle.heroTimer=9;
 let ev=c.stepFight(p,battle,.1,true);
 let win=ev.find(x=>x.kind==='win');assert.ok(win);assert.equal(win.firstClear,true);
 const firstGold=win.gold;
 assert.ok(firstGold>=base*.95);
 assert.equal(p.room,51);assert.deepEqual(p.megaBossWins,[50]);
 p.room=50;p.farming=true;
 battle=c.startFight(p);battle.enemyHp=1;battle.heroTimer=9;
 ev=c.stepFight(p,battle,.1,true);win=ev.find(x=>x.kind==='win');
 assert.ok(win);assert.equal(win.firstClear,false);
 assert.ok(win.gold<firstGold*.5,'repeat premium-boss farming must be unattractive');
 assert.deepEqual(p.megaBossWins,[50]);
});

test('base sword damage stays valid through poison/vampirism/lightning immunity',()=>{
 for(const b of MEGA_BOSSES){
  const p=c.freshProgress();p.room=b.wave;p.best=b.wave-1;p.armor=100;
  for(const ench of ['poison','lightning','vampirism']){
   p.enchantment=ench;p.autoEnabled=false;
   const fight=c.startFight(p);fight.hp=c.maxHealth(p)-100;
   fight.heroTimer=9;const start=fight.enemyHp;
   const ev=c.tapMonster(p,fight);
   assert.ok(ev.some(x=>x.kind==='hero-hit'));
   assert.ok(fight.enemyHp<start,'base sword must always work '+b.id+' '+ench);
   if(ench==='poison'&&b.immunity==='poison')assert.equal(fight.poisonRemaining,0,b.id);
   if(ench==='vampirism'&&b.immunity==='vampirism')assert.equal(fight.hp,c.maxHealth(p)-100,b.id);
   if(ench==='lightning'&&b.lightningMultiplier===0)assert.equal(start-fight.enemyHp,c.heroDamage(p),b.id);
  }
 }
});

test('achievement gold is granted once and preserved in save migration',()=>{
 assert.ok(ACHIEVEMENTS.length>=20);
 const p=c.freshProgress();p.best=700;p.kills=2000;p.bossKills=70;
 p.caughtTotal=250;p.soldFish=100;p.soldPike=20;p.sword=50;p.armor=50;
 p.spentSword=50;p.megaBossWins=MEGA_BOSSES.map(x=>x.wave);
 for(const a of ACHIEVEMENTS){
  assert.ok(a.gold>=0);
  assert.ok(achievementProgress(p,a)>=0);
 }
 const a=ACHIEVEMENTS.find(x=>x.metric==='best'&&x.target===700);
 assert.ok(a);
 const before=p.gold;
 const first=claimAchievement(p,a.id);
 assert.ok(first.ok);assert.equal(p.gold,before+a.gold);
 assert.equal(claimAchievement(p,a.id).ok,false);
 const restored=c.validateProgress(JSON.parse(JSON.stringify(p)));
 assert.deepEqual(restored.achievementClaimed,[a.id]);
 assert.equal(claimAchievement(restored,a.id).ok,false);
});

test('sword/armor costs and gold rewards remain finite and buying is never negative',()=>{
 for(let n=0;n<=200;n++){
  for(const fn of [c.swordCost,c.armorCost]){const price=fn(n);assert.ok(Number.isSafeInteger(price)&&price>=0);}
 }
 for(let wave=1;wave<=2000;wave++){
  const enemy=c.monsterForWave(wave);
  assert.ok(Number.isSafeInteger(enemy.reward)&&enemy.reward>=1,wave);
 }
 const p=c.freshProgress();p.gold=250;
 const buy=c.upgrade(p,'sword');assert.ok(buy.ok);assert.ok(p.gold>=0);
});
