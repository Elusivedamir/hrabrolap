import assert from 'node:assert/strict';
import {freshProgress,validateProgress,startFight,stepFight,upgrade,heroDamage,maxHealth,ENEMIES,MONSTERS,WEAPONS,ARMORS,buyEquipment,equipEquipment,bucketCapacity,bucketVolume,planFishing,stepFishing,stepMerchant,sellAll,offlineReward,monsterForWave,fishCost,swordCost,armorCost} from '../game-core.mjs';
assert.equal(ENEMIES.length,700);
assert.equal(MONSTERS.length,10);
assert.equal(new Set(ENEMIES.map(e=>e.type)).size,24);
for (let n=1;n<=700;n++) {
 const e=monsterForWave(n);
 assert.ok(e.hp>0 && e.attack>0 && e.reward>0);
 assert.equal(e.boss,n%10===0);
 if(n>1)assert.ok(e.hp>monsterForWave(n-1).hp || n%10===1,`wave ${n} HP`);
}
for (let n=10;n<=700;n+=10){const e=monsterForWave(n),base=MONSTERS.find(x=>x.type===e.type);if(n%50===0){assert.equal(e.megaboss,true);}else{assert.ok(base);assert.equal(e.texture,base.texture);}}
const p=freshProgress();assert.equal(p.weapon,'iron');assert.equal(p.equippedArmor,'none');assert.equal(heroDamage(p),8);assert.equal(maxHealth(p),65);
const b=startFight(p),initial=b.hp;
p.gold=110;assert.equal(upgrade(p,'sword').ok,true);assert.equal(upgrade(p,'armor').ok,true);assert.equal(heroDamage(p),11);assert.equal(maxHealth(p),79);assert.equal(b.hp,initial,'upgrades do not heal');
assert.equal(equipEquipment(p,'weapon','fishbone'),false,'cannot equip unowned');
p.gold=3000;assert.equal(buyEquipment(p,'weapon','fishbone').ok,true);assert.equal(buyEquipment(p,'weapon','fishbone').ok,false);
assert.equal(equipEquipment(p,'weapon','fishbone'),true);assert.equal(heroDamage(p),19);
assert.equal(buyEquipment(p,'armor','steel_knight').ok,true);assert.equal(equipEquipment(p,'armor','steel_knight'),true);assert.equal(maxHealth(p),79);
assert.equal(equipEquipment(p,'weapon','iron'),true);assert.equal(heroDamage(p),11);
assert.equal(equipEquipment(p,'armor','none'),true);assert.equal(maxHealth(p),79);
const migrated=validateProgress({version:2,room:10,best:9,gold:333,fishBucket:[],merchantPhase:'away',merchantMs:280000});assert.equal(migrated.room,10);assert.equal(migrated.gold,333);assert.equal(migrated.weapon,'iron');
const fresh=freshProgress(),bf=startFight(fresh);let ev=[];for(let i=0;i<150;i++)ev.push(...stepFight(fresh,bf,.05));assert.ok(ev.some(x=>x.kind==='win'));assert.equal(fresh.room,2);assert.ok(bf.hp<maxHealth(fresh));
const defeat=freshProgress(),bd=startFight(defeat);bd.hp=1;bd.enemyTimer=2.35;const hit=stepFight(defeat,bd,.1);assert.ok(hit.some(e=>e.kind==='defeat'));assert.equal(bd.phase,'rest');let spawned=false;for(let i=0;i<150;i++){const event=stepFight(defeat,bd,.1);if(event.some(e=>e.kind==='spawn')){spawned=true;break;}}assert.equal(spawned,true);assert.equal(bd.phase,'fight');assert.equal(bd.hp,maxHealth(defeat));
const full=freshProgress();full.room=100;const boss=startFight(full);assert.ok(boss.monster.boss);boss.enemyHp=1;boss.heroTimer=1.25;const final=stepFight(full,boss,.1);assert.ok(final.some(x=>x.kind==='win'));assert.equal(full.best,100);assert.equal(full.cleared,false);assert.equal(full.room,101);
const f=freshProgress();let seq=0;planFishing(f,()=>((++seq*37)%101)/101);let fishEvents=[];for(let i=0;i<360;i++)fishEvents.push(...stepFishing(f,1000,()=>.31));assert.equal(bucketVolume(f),12);assert.ok(fishEvents.some(x=>x.kind==='bucket-full'));
f.gold=1000;assert.equal(upgrade(f,'bucket').ok,true);assert.equal(bucketCapacity(f),24);f.catchPlan=[];planFishing(f,()=>.32);for(let i=0;i<720;i++)stepFishing(f,1000,()=>.3);assert.equal(bucketVolume(f),24);assert.equal(upgrade(f,'bucket').ok,false);
stepMerchant(f,300000);assert.equal(f.merchantPhase,'waiting');const sale=sellAll(f);assert.equal(sale.ok,true);assert.equal(bucketVolume(f),0);
const m=freshProgress();stepMerchant(m,300000);stepMerchant(m,12000,true);assert.equal(m.merchantMs,15000);stepMerchant(m,15000);assert.equal(m.merchantPhase,'away');
const o=freshProgress();o.best=2;assert.ok(offlineReward(o,8*60*60*1000)<=Math.floor(Math.min(swordCost(0),armorCost(0))*1.1));
console.log('game-core tests: passed — 700 waves, 10 monster definitions, 10 weapons, 10 purchasable armors, saves and combat');
