import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {WAVE_COUNT,freshProgress,validateProgress,monsterForWave,startFight,stepFight,swordCost,armorCost} from '../game-core.mjs';
import {caveStageForWave,caveStageName,caveBackgroundForWave,CAVE_ROOM_COUNT} from '../cave-themes.mjs';

test('all 2000 monster waves have finite, progressively balanced attributes',()=>{
 assert.equal(WAVE_COUNT,2000);
 let prev=null;
 for(let n=1;n<=2000;n++){
  const m=monsterForWave(n);
  assert.equal(m.boss,n%10===0);
  for(const k of ['hp','attack','reward'])assert.ok(Number.isSafeInteger(m[k])&&m[k]>0,n+': '+k);
  if(prev&&n%10!==1&&n%10!==0&&prev.boss===false)assert.ok(m.hp>=prev.hp,n+': hp');
  prev=m;
 }
 assert.ok(monsterForWave(101).hp>monsterForWave(99).hp);
 assert.ok(monsterForWave(2000).reward>monsterForWave(100).reward);
 for(let n=0;n<200;n++)assert.ok(Number.isSafeInteger(swordCost(n))&&Number.isSafeInteger(armorCost(n)));
});

test('200 unique cave stage images, exactly one new stage per ten waves',()=>{
 assert.equal(CAVE_ROOM_COUNT,200);
 assert.equal(caveStageForWave(1),1);
 assert.equal(caveStageForWave(10),1);
 assert.equal(caveStageForWave(11),2);
 assert.equal(caveStageForWave(100),10);
 assert.equal(caveStageForWave(101),11);
 assert.equal(caveStageForWave(2000),200);
 const scenes=new Set();
 for(let stage=1;stage<=200;stage++){
  const start=(stage-1)*10+1;
  assert.equal(caveStageForWave(start+9),stage);
  const url=caveBackgroundForWave(start);
  assert.ok(url.startsWith([1,5,12].includes(stage)?'assets/prototypes/p1/':'data:image/svg+xml'));
  assert.ok(caveStageName(stage).length>3);
  scenes.add(url);
 }
 assert.equal(scenes.size,200);
});

test('legacy chapter-100 victory resumes at wave 101 with intact inventory',()=>{
 const legacy={...freshProgress(),version:4,room:100,best:100,cleared:true,gold:1270,sword:8,armor:6};
 const p=validateProgress(legacy);
 assert.equal(p.gold,1270);assert.equal(p.sword,8);assert.equal(p.armor,6);
 assert.equal(p.room,101);assert.equal(p.best,100);assert.equal(p.cleared,false);
 assert.equal(startFight(p).level,101);
});

test('last boss finishes at 2000; no overflow or reset on save',()=>{
 const p=freshProgress();Object.assign(p,{room:2000,best:699,sword:1000,armor:1000});
 const b=startFight(p);assert.ok(b.monster.boss);b.enemyHp=1;b.heroTimer=2;
 const ev=stepFight(p,b,.1,true);
 assert.equal(ev.filter(x=>x.kind==='win'&&x.firstClear).length,1);
 assert.equal(p.best,2000);assert.equal(p.room,2000);assert.equal(p.cleared,true);
 const saved=validateProgress(JSON.parse(JSON.stringify(p)));assert.equal(saved.best,2000);assert.equal(saved.cleared,true);
});
test('new UI only adjusts modals and cave room; approved hero and scene assets remain referenced',()=>{
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const game=fs.readFileSync(new URL('../game.mjs',import.meta.url),'utf8');
 const css=fs.readFileSync(new URL('../style.css',import.meta.url),'utf8');
 assert.match(html,/id="cave-backdrop"/);
 assert.match(html,/id="cave-stage"/);
 assert.match(html,/id="hero-rig"/);
 assert.match(game,/caveBackgroundForWave/);
 assert.match(css,/warm 2D UI refresh/);
 assert.match(css,/\.modal\[data-mode="quests"\]/);
 assert.match(css,/\.modal\[data-mode="bucket"\]/);
});
