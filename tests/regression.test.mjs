import test from 'node:test';
import assert from 'node:assert/strict';
import * as c from '../game-core.mjs';

test('manual mode waits for one command, enemy attacks continue, no stored burst',()=>{
 const p=c.freshProgress(),b=c.startFight(p);p.autoBattle=false;
 const events=[];for(let i=0;i<25;i++)events.push(...c.stepFight(p,b,.1,false));
 assert.equal(b.enemyHp,b.monster.hp);assert.ok(b.hp<c.maxHealth(p));
 assert.equal(events.filter(e=>e.kind==='hero-hit').length,0);
 assert.equal(c.stepFight(p,b,.01,true).filter(e=>e.kind==='hero-hit').length,1);
 assert.equal(c.stepFight(p,b,.01,true).filter(e=>e.kind==='hero-hit').length,0);
 assert.equal(c.validateProgress(JSON.parse(JSON.stringify(p))).autoBattle,false);
 assert.equal(c.validateProgress({version:3}).autoBattle,true);
});

test('снятие брони ограничивает текущее HP, надевание не лечит',()=>{
 const p=c.freshProgress();p.ownedArmors.push('leaf');p.equippedArmor='leaf';
 const b=c.startFight(p);assert.equal(b.hp,150);
 assert.equal(c.equipEquipment(p,'armor','none',b),true);
 assert.equal(b.hp,65);assert.equal(c.maxHealth(p),65);
 b.hp=20;c.equipEquipment(p,'armor','leaf',b);assert.equal(b.hp,20);
});
test('сильное оружие выводит из фарма, текущее сражение не пересоздаётся',()=>{
 const p=c.freshProgress();Object.assign(p,{room:10,best:9,farming:true,fails:2,gold:1000});
 const b=c.startFight(p);b.hp=17;const enemyHp=b.enemyHp;
 c.buyEquipment(p,'weapon','moon');c.equipEquipment(p,'weapon','moon',b);
 assert.equal(p.farming,false);assert.equal(p.fails,0);
 assert.equal(b.hp,17);assert.equal(b.level,9);assert.equal(b.enemyHp,enemyHp);
 assert.equal(c.startFight(p).level,10);
});
test('слабая экипировка не снимает режим фарма',()=>{
 const p=c.freshProgress();p.ownedWeapons.push('moon');p.weapon='moon';p.farming=true;p.fails=2;
 c.equipEquipment(p,'weapon','iron');assert.equal(p.farming,true);assert.equal(p.fails,2);
});
test('победа над фарм-врагом после апгрейда не считается первым прохождением',()=>{
 const p=c.freshProgress();Object.assign(p,{room:10,best:9,farming:true,gold:100});
 const b=c.startFight(p);c.upgrade(p,'sword');b.enemyHp=1;b.heroTimer=1.29;
 const e=c.stepFight(p,b,.02).find(e=>e.kind==='win');
 assert.equal(e.firstClear,false);assert.equal(p.best,9);assert.equal(p.room,10);
 for(let i=0;i<12;i++)c.stepFight(p,b,.1);
 assert.equal(b.level,10);
});
test('перенос завершённой старой главы v1/v2 открывает 11-ю волну',()=>{
 for(const version of [1,2]){
  const p=c.validateProgress({...c.freshProgress(),version,room:10,best:10,cleared:true,gold:321});
  assert.equal(p.gold,321);assert.equal(p.best,10);assert.equal(p.room,11);
  assert.equal(p.cleared,false);assert.equal(c.startFight(p).level,11);
 }
});
test('перенос незавершённой 10-й волны не пропускает босса',()=>{
 const p=c.validateProgress({...c.freshProgress(),version:2,room:10,best:9});
 assert.equal(p.room,10);assert.equal(c.startFight(p).level,10);
});
test('старое battleState не возвращает в уже завершённую главу',()=>{
 const p=c.validateProgress({...c.freshProgress(),version:2,room:10,best:10,cleared:true});
 const b=c.restoreFight(p,{level:10,hp:40,enemyHp:0,phase:'transition',rest:.5},true);
 assert.equal(b.level,11);assert.equal(b.phase,'fight');assert.equal(b.hp,40);
});
test('повреждённый список вещей сохраняет монеты и исправные поля',()=>{
 for(const ownedWeapons of [{},'moon',null,12]){
  const p=c.validateProgress({...c.freshProgress(),gold:432,room:4,best:3,ownedWeapons});
  assert.equal(p.gold,432);assert.equal(p.room,4);assert.deepEqual(p.ownedWeapons,['iron']);
 }
 for(const ownedArmors of [{},'steel',null,12]){
  const p=c.validateProgress({...c.freshProgress(),gold:432,ownedArmors});
  assert.equal(p.gold,432);assert.deepEqual(p.ownedArmors,['none']);
 }
});
test('встроенные предметы и повторные ID в сохранении не дублируются',()=>{
 const p=c.validateProgress({...c.freshProgress(),ownedWeapons:['iron','iron','moon','moon','invalid'],ownedArmors:['none','steel','steel']});
 assert.deepEqual(p.ownedWeapons,['iron','moon']);assert.deepEqual(p.ownedArmors,['none','steel']);
});
test('невалидная рыба и переполнение из сохранения отбрасываются',()=>{
 const f={species:'Щука',slots:3,price:80,weight:2,length:60,waitMs:9000};
 const p=c.validateProgress({...c.freshProgress(),fishBucket:[{...f,slots:-99},{...f,price:-999},{...f,weight:0},{...f,species:'<script>'},...Array(8).fill(f)]});
 assert.equal(c.bucketVolume(p),12);assert.equal(p.fishBucket.length,4);
 assert.equal(c.bucketGold(p),320);
});
test('план из сохранения не переполняет оставшееся место в ведре',()=>{
 const f={species:'Щука',slots:3,price:80,weight:2,length:60,waitMs:1000};
 const p=c.validateProgress({...c.freshProgress(),fishBucket:[f,f,f],catchPlan:[f,f],nextCatchMs:1});
 for(let i=0;i<5;i++)c.stepFishing(p,1000,()=>.2);
 assert.equal(c.bucketVolume(p),12);assert.equal(p.fishBucket.length,4);
});
test('восстановление боя очищает дробный уровень и нечисловые таймеры',()=>{
 const p=c.freshProgress();p.gold=765;
 const b=c.restoreFight(p,{level:1.5,hp:'bad',enemyHp:'bad',heroTimer:'bad',enemyTimer:-8,rest:'bad',phase:'fight'});
 assert.equal(p.gold,765);assert.equal(b.level,1);
 for(const k of ['hp','enemyHp','heroTimer','enemyTimer','rest'])assert.ok(Number.isFinite(b[k]),k);
});
test('сохранение/восстановление боя и отдыха через JSON без лечения',()=>{
 const p=c.freshProgress();p.ownedWeapons.push('fishbone');p.weapon='fishbone';p.gold=765;
 const b=c.startFight(p);Object.assign(b,{hp:21,enemyHp:12,heroTimer:.6,enemyTimer:1.2});
 const raw=JSON.parse(JSON.stringify({...p,battleState:b}));
 const restored=c.validateProgress(raw),fight=c.restoreFight(restored,raw.battleState);
 assert.equal(restored.weapon,'fishbone');assert.equal(restored.gold,765);
 for(const k of ['level','hp','enemyHp','heroTimer','enemyTimer','phase'])assert.equal(fight[k],b[k],k);
 const rest=c.restoreFight(p,{...b,hp:0,phase:'rest',rest:3});
 assert.equal(rest.hp,0);assert.equal(rest.phase,'rest');assert.equal(rest.rest,3);
});
test('перезагрузка сохраняет остаток перехода между волнами',()=>{
 const p=c.freshProgress();p.room=2;p.best=1;
 const b=c.restoreFight(p,{level:1,hp:27,enemyHp:0,heroTimer:.1,enemyTimer:1,phase:'transition',rest:.8});
 assert.equal(b.level,1);assert.equal(b.phase,'transition');assert.equal(b.rest,.8);assert.equal(b.hp,27);
});
test('у всех восьми видов реально происходят атака, урон и победа',()=>{
 const seen=new Set();
 for(let room=1;room<=8;room++){
  const p=c.freshProgress();p.room=room;p.best=room-1;p.armor=100;
  const b=c.startFight(p),events=[];
  for(let i=0;i<2000&&!events.some(e=>e.kind==='win');i++)events.push(...c.stepFight(p,b,.1));
  assert.ok(events.some(e=>e.kind==='enemy-hit'&&e.move===b.monster.move),b.monster.type);
  assert.ok(events.some(e=>e.kind==='hero-hit'),b.monster.type);
  assert.ok(events.some(e=>e.kind==='win'),b.monster.type);seen.add(b.monster.type);
 }
 assert.equal(seen.size,8);
});
test('100-я волна завершается единожды и прогресс не выходит за 100',()=>{
 const p=c.freshProgress();p.room=100;p.best=99;p.sword=1000;p.armor=1000;
 const b=c.startFight(p);const events=[];
 for(let i=0;i<150;i++)events.push(...c.stepFight(p,b,.1));
 assert.equal(events.filter(e=>e.kind==='win'&&e.firstClear).length,1);
 assert.equal(p.room,100);assert.equal(p.best,100);assert.equal(p.cleared,true);
 const copy=c.validateProgress(JSON.parse(JSON.stringify(p)));assert.equal(copy.cleared,true);
});
test('торговец: без него продажа невозможна, ожидание заморожено в открытой торговле',()=>{
 const p=c.freshProgress();c.planFishing(p,()=>.3);
 for(let i=0;i<360;i++)c.stepFishing(p,1000);
 const gold=c.bucketGold(p),count=p.fishBucket.length;
 assert.equal(c.sellAll(p).ok,false);c.stepMerchant(p,300000);
 c.stepMerchant(p,20000,true);assert.equal(p.merchantMs,15000);
 const sold=c.sellAll(p);assert.equal(sold.gold,gold);assert.equal(sold.count,count);
 assert.equal(p.gold,gold);assert.equal(p.merchantPhase,'away');assert.equal(c.sellAll(p).ok,false);
});
