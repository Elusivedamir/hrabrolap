import test from 'node:test';
import assert from 'node:assert/strict';
import * as game from '../game-core.mjs';
import {MEGA_BOSSES} from '../mega-bosses.mjs';
import {MEGA_ANIMATION_COUNT,megaBossFrameSvg} from '../mega-boss-art.mjs';
import {caveStageForWave,caveBackgroundForWave,CAVE_ROOM_COUNT} from '../cave-themes.mjs';

test('debug merchant arrives every 15 seconds and normal game retains five minutes',()=>{
 const p=game.freshProgress();
 p.merchantMs=15000;
 assert.equal(game.stepMerchant(p,14999,false,true).length,0);
 assert.equal(game.stepMerchant(p,1,false,true)[0].kind,'merchant-arrive');
 assert.equal(p.merchantMs,5000);
 game.stepMerchant(p,5000,false,true);
 assert.equal(p.merchantPhase,'away');
 assert.equal(p.merchantMs,10000);
 const second=game.stepMerchant(p,10000,false,true);
 assert.equal(second[0].kind,'merchant-arrive');
 const saleProgress=game.freshProgress();
 saleProgress.merchantPhase='waiting';saleProgress.merchantMs=5000;
 saleProgress.fishBucket=[{species:'Плотва',slots:1,weight:.2,length:20,price:8,waitMs:1000}];
 assert.equal(game.sellAll(saleProgress,true).ok,true);
 assert.equal(saleProgress.merchantMs,15000,'selling must not reset test merchant to five minutes');
 game.stepMerchant(saleProgress,15000,false,true);
 assert.equal(saleProgress.merchantPhase,'waiting');
 const normal=game.freshProgress();
 game.stepMerchant(normal,15000);
 assert.equal(normal.merchantPhase,'away');
 game.stepMerchant(normal,285000);
 assert.equal(normal.merchantPhase,'waiting');
 assert.equal(normal.merchantMs,15000);
});
test('probability of vampirism is exactly 5% for a successful hit',()=>{
 const p=game.freshProgress();p.enchantment='vampirism';p.sword=1;p.armor=3;
 const b=game.startFight(p);b.enemyHp=100000;b.hp=100;b.heroTimer=2;
 let calls=0;const chance=()=>{calls++;return calls%20===1?.04999:.05;};
 let heals=0;
 for(let i=0;i<100;i++){
  b.heroTimer=2;
  const ev=game.tapMonster(p,b,chance);
  if(ev.some(e=>e.kind==='hero-hit'&&e.healed>0))heals++;
  b.hp=100;
 }
 assert.equal(heals,5);
 assert.equal(game.VAMPIRISM_CHANCE,.05);
});
test('ghost, skeleton and golem are poison-immune and cannot feed vampirism',()=>{
 for(const type of ['ghost','skeleton','golem']){
  const original=game.MONSTERS.find(m=>m.type===type);
  assert.ok(original);
  const p=game.freshProgress();p.enchantment='poison';
  for(let wave=1;wave<=60;wave++){
   const base=game.spawnMonsterForWave(wave,()=>.99);
   if(base.type!==type)continue;
   assert.equal(base.immunity,'poison');
   assert.equal(base.bloodless,true);
   const f={...game.startFight(p),monster:base,enemyHp:999999,heroTimer:1};
   game.tapMonster(p,f);
   assert.equal(f.poisonRemaining,0);
   p.enchantment='vampirism';f.hp=10;f.heroTimer=1;
   game.tapMonster(p,f,()=>0);
   assert.equal(f.hp,10);
   break;
  }
 }
});
test('40 super bosses and 200 unique cave locations cover 2000-wave campaign',()=>{
 assert.equal(game.WAVE_COUNT,2000);
 assert.equal(CAVE_ROOM_COUNT,200);
 assert.equal(MEGA_BOSSES.length,40);
 assert.equal(MEGA_ANIMATION_COUNT,480);
 const ids=new Set(),scenes=new Set();
 for(let n=1;n<=2000;n++){
  const m=game.monsterForWave(n);
  assert.equal(Boolean(m.megaboss),n%50===0);
  assert.equal(Boolean(m.boss),n%10===0);
  assert.ok(m.hp>0&&m.attack>0&&m.reward>0);
  if(m.megaboss)ids.add(m.id);
  if(n%10===1)scenes.add(caveBackgroundForWave(n));
 }
 assert.equal(ids.size,40);assert.equal(scenes.size,200);
 assert.equal(caveStageForWave(2000),200);
 for(const m of MEGA_BOSSES)for(const action of ['attack','hurt'])for(let i=0;i<6;i++)
  assert.match(megaBossFrameSvg(m.id,action,i),/<svg/);
});
test('completed v5 700-wave save resumes 701 with all gold, unlocked gear and trophies',()=>{
 const raw={...game.freshProgress(),version:5,best:700,room:700,cleared:true,gold:12345,autoLevel:37,megaBossWins:[50,700]};
 const p=game.validateProgress(raw);
 assert.equal(p.version,6);assert.equal(p.cleared,false);
 assert.equal(p.best,700);assert.equal(p.room,701);
 assert.equal(p.gold,12345);assert.equal(p.autoLevel,37);
 assert.deepEqual(p.megaBossWins,[50,700]);
});

test('restoring saved fleshless enemies cannot accidentally enable poison',()=>{
 for(const type of ['ghost','golem','skeleton']){
  const p=game.freshProgress();p.room=3;p.best=2;p.enchantment='poison';
  const b=game.restoreFight(p,{level:3,monsterType:type,hp:60,enemyHp:9999,phase:'fight',heroTimer:1,enemyTimer:0});
  assert.equal(b.monster.type,type);
  assert.equal(b.monster.immunity,'poison');
  game.tapMonster(p,b);
  assert.equal(b.poisonRemaining,0);
 }
});
