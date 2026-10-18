import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CHAPTER_NAMES,DAWN_SEALS,dawnSealForWave,dawnSealForStage,ownsDawnSeal,collectedDawnSeals,chapterSealCount} from '../dawn-seals.mjs';
import {dawnSealSvg,dawnSealUrl} from '../dawn-seal-art.mjs';
import {freshProgress,validateProgress,startFight,stepFight} from '../game-core.mjs';

test('forty seals exactly match the forty canonical bosses and arenas',()=>{
 assert.equal(DAWN_SEALS.length,40);
 assert.equal(CHAPTER_NAMES.length,10);
 assert.equal(new Set(DAWN_SEALS.map(s=>s.id)).size,40);
 for(let i=0;i<40;i++){
  const item=DAWN_SEALS[i];
  assert.equal(item.wave,50*(i+1));
  assert.equal(item.chapter,Math.floor(i/4)+1);
  assert.equal(dawnSealForWave(item.wave),item);
  assert.equal(dawnSealForStage(item.wave/10),item);
  assert.equal(dawnSealForWave(item.wave+1),null);
  assert.equal(dawnSealForStage(item.wave/10-1),null);
  assert.match(dawnSealSvg(item.wave),/^<svg[^>]+>/);
  assert.ok(dawnSealUrl(item.wave).startsWith('data:image/svg+xml'));
 }
 assert.deepEqual(DAWN_SEALS.slice(0,4).map(s=>s.name),['Печать Мха','Печать Кости','Печать Хитина','Печать Льда']);
 assert.equal(new Set([50,100,150,200].map(dawnSealSvg)).size,4,'four independent first-chapter glyph compositions');
});

test('first boss win releases one seal; repeated fight cannot duplicate it or add coins',()=>{
 const p=freshProgress();p.room=50;p.best=49;p.autoEnabled=true;p.sword=200;
 const b=startFight(p);b.enemyHp=1;b.heroTimer=2;
 const event=stepFight(p,b,.1,true);
 assert.ok(event.some(e=>e.kind==='win'&&e.firstClear&&e.level===50));
 assert.deepEqual(p.megaBossWins,[50]);assert.equal(ownsDawnSeal(p,50),true);
 assert.equal(collectedDawnSeals(p).length,1);
 assert.equal(chapterSealCount(p,1),1);
 const oldGold=p.gold;const oldWins=p.megaBossWins.length;
 p.room=51;p.farming=true;
 const repeat=startFight(p);repeat.enemyHp=1;repeat.heroTimer=2;
 const events=stepFight(p,repeat,.1,true);
 assert.ok(events.some(e=>e.kind==='win'&&!e.firstClear));
 assert.equal(p.megaBossWins.length,oldWins,'seal win cannot repeat');
 assert.equal(collectedDawnSeals(p).length,1);
 assert.ok(p.gold>oldGold,'ordinary replay gold behavior is unchanged');
});

test('old version-6 saves retain seals from boss wins and backfill completed waves',()=>{
 const p=freshProgress();p.best=200;p.room=201;p.megaBossWins=[50,100];p.gold=733;p.equippedArmor='none';
 const after=validateProgress({...p,version:6});
 assert.equal(after.gold,733);assert.equal(after.room,201);
 assert.equal(collectedDawnSeals(after).length,4,'completed campaign implies its earlier seals');
 assert.equal(chapterSealCount(after,1),4);
 assert.deepEqual(after.megaBossWins,[50,100],'do not rewrite established boss-win records');
 assert.equal(ownsDawnSeal(after,250),false);
 assert.equal(collectedDawnSeals(freshProgress()).length,0);
});
