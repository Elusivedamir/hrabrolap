import {WEAPONS,ARMORS,MATERIALS} from './equipment-catalog.mjs';
import {megaBossForWave} from './mega-bosses.mjs';
export {WEAPONS,ARMORS,MATERIALS} from './equipment-catalog.mjs';
// Храбролап v0.8.1 — исправления HP, миграции и восстановления сохранений.
export const VERSION=6;
export const WAVE_COUNT=2000;
export const MONSTERS=[
 {type:'slime',name:'Слизень',texture:'slime',move:'jump',attackName:'Прыжок телом'},
 {type:'mouse',name:'Мышь',texture:'mouse',move:'bite',attackName:'Быстрый укус'},
 {type:'mushroom',name:'Гриб',texture:'mushroom',move:'spores',attackName:'Ядовитые споры'},
 {type:'bat',name:'Летучая мышь',texture:'bat',move:'swoop',attackName:'Налёт крыльями'},
 {type:'spider',name:'Паук',texture:'spider',move:'leap',attackName:'Прыжок с паутиной'},
 {type:'larva',name:'Личинка',texture:'larva',move:'wriggle',attackName:'Толчок головой'},
 {type:'beetle',name:'Жук',texture:'beetle',move:'ram',attackName:'Удар панцирем'},
 {type:'ghost',name:'Призрак',texture:'ghost',move:'pulse',attackName:'Призрачный импульс'},
 {type:'skeleton',name:'Скелет',texture:'skeleton',move:'rattle',attackName:'Костяной взмах'},
 {type:'golem',name:'Каменный голем',texture:'golem',move:'ram',attackName:'Каменный толчок'}
];
export function monsterForWave(level){
 const n=Math.max(1,Math.min(WAVE_COUNT,Math.floor(level))),boss=n%10===0;
 // На каждой десятой волне усиленная версия обычного монстра: та же модель + корона.
 const model=MONSTERS[(Math.floor((n-1)/10)*3+(n-1)%10)%10];
 const after=Math.max(0,n-100);
 // Keep waves 1-100 exactly as players know them; 101-700 scale steadily.
 const baseHp=n<=100?17+4.8*n+n**1.34:(17+480+100**1.34)*(1+.006*after+.000008*after*after);
 const hp=Math.round(baseHp*(boss?2.25:1));
 const baseAttack=Math.ceil((n<=100?1+n*.34:35*(1+.003*after+.000002*after*after))*(boss?1.42:1)*(n>=50?1.18:1));
 // Gold is a scarce upgrade resource, not a score counter. Bonuses are paid only once.
 const baseReward=Math.max(2,Math.round((n<=100?8+n*3.8+n**1.2*.38:(8+380+100**1.2*.38)*(1+.011*after+.000006*after*after))*(boss?2.3:1)*.48));
 const major=megaBossForWave(n);
 if(major)return {...model,...major,type:major.id,texture:major.id,boss:true,megaboss:true,hp:Math.round(hp*1.38),attack:Math.ceil(baseAttack*1.13),reward:Math.round(baseReward*1.28),bloodless:['golem','wraith','clockwork','guardian'].includes(major.family)||['bone_regent','granite_colossus','shadow_knight'].includes(major.id)};
 const bloodless=['ghost','golem','skeleton'].includes(model.type);
 return {...model,name:(boss?'Король · ':'')+model.name,boss,megaboss:false,hp,attack:baseAttack,reward:baseReward,immunity:bloodless?'poison':'',bloodless};
}
// В обычных боях шанс паука 30%. Прежний регулярный слот паука
// отдан скелету; боссы на каждой 10-й волне остаются без изменений.
export function spawnMonsterForWave(level,r=Math.random){
 const original=monsterForWave(level);
 if(original.boss)return original;
 const base=(r()<.30?MONSTERS.find(m=>m.type==='spider'):original.type==='spider'?MONSTERS.find(m=>m.type==='skeleton'):original);
 const bloodless=['ghost','golem','skeleton'].includes(base.type);
 return {...original,...base,name:base.name,boss:false,immunity:bloodless?'poison':'',bloodless};
}
export const ENEMIES=Array.from({length:WAVE_COUNT},(_,i)=>monsterForWave(i+1));
export const swordCost=n=>Math.round(n<=35?20*1.17**n:20*1.17**35*(1+.039*(n-35))**2);
export const armorCost=n=>Math.round(n<=35?35*1.16**n:35*1.16**35*(1+.039*(n-35))**2);
// Fishing stays worthwhile without exponential dead-ends at high levels.
export const MAX_FISH_LEVEL=30;
export const fishCost=n=>Math.round(45*1.12**Math.min(MAX_FISH_LEVEL,Math.max(0,n)));
// Rest bottoms out at 2.5s around level 13: buying beyond is wasteful.
export const MAX_HOME_LEVEL=13;
export const homeCost=n=>Math.round(65*1.23**Math.min(MAX_HOME_LEVEL,Math.max(0,n)));
export const bucketCost=()=>320;
// 0 => 1 hit/sec, 20 => 2, ... 100 => 6 hits/sec. Manual mode is always 3 hits/sec.
export const MAX_AUTO_LEVEL=100;
export const MANUAL_HITS_PER_SECOND=3;
export const autoHitsPerSecond=p=>1+Math.min(MAX_AUTO_LEVEL,Math.max(0,p.autoLevel||0))*.05;
export const autoUpgradeCost=level=>Math.round(12*1.06**Math.max(0,Math.min(99,level)));
export const attackInterval=(p,auto=p.autoEnabled)=>1/(auto?autoHitsPerSecond(p):MANUAL_HITS_PER_SECOND);
// Attack speed is an independent upgrade, purchasable even before owning auto-combat.
// Its bonus only affects auto attacks; manual tapping remains fixed at 3 hits/sec.
export function upgradeAttackSpeed(p){
 if(p.autoLevel>=MAX_AUTO_LEVEL)return {ok:false,reason:'max'};
 const cost=autoUpgradeCost(p.autoLevel);
 if(p.gold<cost)return {ok:false,reason:'gold',cost};
 p.gold-=cost;p.autoLevel++;
 return {ok:true,cost,level:p.autoLevel,hitsPerSecond:autoHitsPerSecond(p)};
}
// Compatibility for existing tests and older clients; UI uses upgradeAttackSpeed.
export const upgradeAutoBattle=upgradeAttackSpeed;
export const bucketCapacity=p=>p.bucketLevel>0?24:12;
const equipped=(arr,id)=>arr.find(x=>x.id===id)||arr[0];
export const heroDamage=p=>8+3*p.sword+equipped(WEAPONS,p.weapon).damage;
export const maxHealth=p=>65+14*p.armor+equipped(ARMORS,p.equippedArmor).health;
export const restDuration=p=>Math.max(2.5,7-p.home*.35);
export function battleRate(p){const m=monsterForWave(Math.max(1,Math.min(WAVE_COUNT,p.best&&p.best%10===0?p.best-1:p.best||1)));return Math.floor(m.reward*60/Math.max(4,Math.ceil(m.hp/heroDamage(p))*1.3+1.1));}
export function freshProgress(){return {version:VERSION,gold:0,sword:0,armor:0,fishLevel:0,home:0,bucketLevel:0,weapon:'iron',equippedArmor:'none',ownedWeapons:['iron'],ownedArmors:['none'],room:1,best:0,fails:0,farming:false,cleared:false,kills:0,totalGold:0,killedSlimes:0,caughtTotal:0,soldFish:0,soldPike:0,spentSword:0,autoUnlocked:false,autoEnabled:false,autoLevel:0,enchantment:'none',
  monsterKills:Object.fromEntries(MONSTERS.map(m=>[m.type,0])),megaBossWins:[],achievementClaimed:[],bossKills:0,lightningHits:0,poisonKills:0,vampireHeals:0,
  materials:Object.fromEntries(MATERIALS.map(m=>[m.id,0])),fishBucket:[],catchPlan:[],nextCatchMs:0,merchantPhase:'away',merchantMs:300000,lastSeen:0,pendingOffline:0,questClaimed:[]};}
const int=(v,lo,hi,d=lo)=>Number.isFinite(v)?Math.max(lo,Math.min(hi,Math.floor(v))):d;
export function validateProgress(raw){
 const p=freshProgress(); if(!raw||![1,2,3,4,5,6].includes(raw.version))return p;
 for(const k of ['gold','sword','armor','fishLevel','home','room','best','fails','kills','totalGold','killedSlimes','caughtTotal','soldFish','soldPike','spentSword','pendingOffline','bucketLevel'])p[k]=int(raw[k],0,k==='gold'||k==='totalGold'?1e13:1e6,p[k]);
 p.room=int(p.room,1,WAVE_COUNT);p.best=int(p.best,0,WAVE_COUNT);p.fails=int(p.fails,0,2);p.bucketLevel=int(p.bucketLevel,0,1);
 p.farming=!!raw.farming;p.cleared=!!raw.cleared;
 // A completed 100-wave v4 save resumes at 101, retaining all inventory and gold.
 if(p.cleared&&p.best<WAVE_COUNT&&((raw.version<=4&&p.best>=100)||(raw.version<=5&&p.best>=700))){p.cleared=false;p.farming=false;p.room=Math.max(p.room,p.best+1);}
 p.autoUnlocked=!!raw.autoUnlocked;
 p.autoEnabled=p.autoUnlocked&&!!raw.autoEnabled;
 p.autoLevel=int(raw.autoLevel,0,MAX_AUTO_LEVEL,0);
 p.enchantment=['none','poison','lightning','vampirism'].includes(raw.enchantment)?raw.enchantment:'none';
 for(const monster of MONSTERS)p.monsterKills[monster.type]=int(raw.monsterKills?.[monster.type],0,1000000,0);
 for(const key of ['bossKills','lightningHits','poisonKills','vampireHeals'])p[key]=int(raw[key],0,1000000,0);
 if(raw.version>=2){
  p.fishBucket=fitFish(raw.fishBucket,bucketCapacity(p));
  p.catchPlan=fitFish(raw.catchPlan,bucketCapacity(p)-bucketVolume(p));
  p.nextCatchMs=int(raw.nextCatchMs,0,360000);
  p.merchantPhase=['away','waiting'].includes(raw.merchantPhase)?raw.merchantPhase:'away';
  p.merchantMs=int(raw.merchantMs,0,300000,300000);
  p.lastSeen=Number.isFinite(raw.lastSeen)?Math.min(Date.now(),Math.max(0,raw.lastSeen)):0;
  p.questClaimed=Array.isArray(raw.questClaimed)?raw.questClaimed.filter(x=>Number.isInteger(x)&&x>=0&&x<40).slice(0,40):[];
  p.achievementClaimed=Array.isArray(raw.achievementClaimed)?[...new Set(raw.achievementClaimed.filter(x=>Number.isInteger(x)&&x>=0&&x<100))].slice(0,100):[];
  p.megaBossWins=Array.isArray(raw.megaBossWins)?[...new Set(raw.megaBossWins.filter(x=>Number.isInteger(x)&&x>=50&&x<=WAVE_COUNT&&x%50===0))]:[];
 }
 if(raw.version>=3){
  p.ownedWeapons=[...new Set(['iron',...(Array.isArray(raw.ownedWeapons)?raw.ownedWeapons:[]).filter(id=>WEAPONS.some(w=>w.id===id))])];
  p.ownedArmors=[...new Set(['none',...(Array.isArray(raw.ownedArmors)?raw.ownedArmors:[]).filter(id=>ARMORS.some(w=>w.id===id))])];
  p.weapon=p.ownedWeapons.includes(raw.weapon)?raw.weapon:'iron';
  p.equippedArmor=p.ownedArmors.includes(raw.equippedArmor)?raw.equippedArmor:'none';
 }
   // Миграция старых сохранений: новые ингредиенты с нулевого счётчика.
  if(raw.version>=4&&raw.materials&&typeof raw.materials==='object'&&!Array.isArray(raw.materials)){
   for(const item of MATERIALS)p.materials[item.id]=int(raw.materials[item.id],0,1000000,0);
  }
// В v1/v2 cleared означало прохождение десяти комнат, а не ста волн.
 if(raw.version<3&&p.cleared&&p.best<100){p.cleared=false;p.room=Math.min(WAVE_COUNT,Math.max(p.room,p.best+1));}
 return p;
}
function isFish(f){return f&&SPECIES.some(s=>s.species===f.species&&s.slots===f.slots)&&Number.isSafeInteger(f.price)&&f.price>0&&Number.isFinite(f.weight)&&f.weight>0&&Number.isFinite(f.length)&&f.length>0&&Number.isFinite(f.waitMs)&&f.waitMs>0}
function fitFish(raw,capacity){const fish=[];if(!Array.isArray(raw))return fish;for(const f of raw){if(!isFish(f)||f.slots>capacity)continue;fish.push({...f});capacity-=f.slots;if(capacity===0)break;}return fish;}
export function getRoom(p){return p.cleared?WAVE_COUNT:(p.farming?Math.max(1,p.room-1):p.room);}
export function startFight(p,hp=maxHealth(p),r=Math.random){const level=getRoom(p),monster=spawnMonsterForWave(level,r);return {level,monster,hp:Math.min(maxHealth(p),hp),enemyHp:monster.hp,phase:'fight',heroTimer:0,enemyTimer:0,rest:0,poisonRemaining:0,poisonTick:0};}
export function restoreFight(p,raw,completedLegacyChapter=false){
 if(!raw||typeof raw!=='object')return startFight(p);
 const finite=(value,min,max,fallback)=>Number.isFinite(value)?Math.max(min,Math.min(max,value)):fallback;
 const level=int(raw.level,1,WAVE_COUNT,getRoom(p));
 const hp=finite(raw.hp,0,maxHealth(p),maxHealth(p));
 // Завершённый бой из старой главы не переносим на заново открытые волны.
 if(completedLegacyChapter&&level<=p.best)return startFight(p,hp);
 const standard=monsterForWave(level);
 const custom=MONSTERS.find(m=>m.type===raw.monsterType);
 const monster=!standard.boss&&custom?{...standard,...custom,name:custom.name,boss:false}:standard;
 const phase=['fight','rest','transition'].includes(raw.phase)?raw.phase:'fight';
 const b={level,monster,hp,enemyHp:finite(raw.enemyHp,0,monster.hp,monster.hp),phase,
  heroTimer:finite(raw.heroTimer,0,1,0),enemyTimer:finite(raw.enemyTimer,0,2.4,0),rest:finite(raw.rest,0,phase==='rest'?restDuration(p):1.15,0),
  poisonRemaining:finite(raw.poisonRemaining,0,5,0),poisonTick:finite(raw.poisonTick,0,1,0)};
 if(b.phase==='fight'&&b.hp===0){b.phase='rest';b.rest=restDuration(p);}
 return b;
}
export function upgrade(p,kind){const info={sword:['sword',swordCost],armor:['armor',armorCost],fish:['fishLevel',fishCost],home:['home',homeCost],bucket:['bucketLevel',bucketCost]}[kind];if(!info)return {ok:false};const [field,priceFunc]=info;if((kind==='bucket'&&p.bucketLevel>0)||(kind==='fish'&&p.fishLevel>=MAX_FISH_LEVEL)||(kind==='home'&&p.home>=MAX_HOME_LEVEL))return {ok:false,reason:'max'};
 const cost=priceFunc(p[field]);if(p.gold<cost)return {ok:false,cost};p.gold-=cost;p[field]++;if(kind==='sword')p.spentSword++;
 if(kind==='sword'||kind==='armor'){p.fails=0;p.farming=false;}
 return {ok:true,cost};}
export function buyEquipment(p,category,id){
 const arr=category==='weapon'?WEAPONS:category==='armor'?ARMORS:null;
 if(!arr)return {ok:false,reason:'category'};
 const item=arr.find(x=>x.id===id);if(!item)return {ok:false,reason:'missing'};
 const owned=category==='weapon'?p.ownedWeapons:p.ownedArmors;
 if(owned.includes(id))return {ok:false,reason:'owned'};
 if(p.gold<item.price)return {ok:false,reason:'gold',cost:item.price};
 for(const [material,need] of Object.entries(item.materials||{})){
  const available=p.materials[material]||0;
  if(available<need)return {ok:false,reason:'material',material,need,available};
 }
 p.gold-=item.price;
 for(const [material,need] of Object.entries(item.materials||{}))p.materials[material]-=need;
 owned.push(id);
 return {ok:true,item};
}
export function equipEquipment(p,category,id,battle){const arr=category==='weapon'?WEAPONS:category==='armor'?ARMORS:null;if(!arr||!arr.some(x=>x.id===id))return false;
 const own=category==='weapon'?p.ownedWeapons:p.ownedArmors;
 if(!own.includes(id))return false;
 const oldDamage=heroDamage(p),oldHealth=maxHealth(p);
 if(category==='weapon')p.weapon=id;else p.equippedArmor=id;
 if(battle&&category==='armor')battle.hp=Math.min(battle.hp,maxHealth(p));
 if(heroDamage(p)>oldDamage||maxHealth(p)>oldHealth){p.fails=0;p.farming=false;}
 return true;}
export function purchaseAutoBattle(p){
 if(p.autoUnlocked){p.autoEnabled=!p.autoEnabled;return {ok:true,enabled:p.autoEnabled,alreadyOwned:true};}
 if(p.gold<1)return {ok:false,reason:'gold',cost:1};
 p.gold-=1;p.autoUnlocked=true;p.autoEnabled=true;
 return {ok:true,enabled:true,cost:1};
}
export function setEnchantment(p,kind){
 if(!['none','poison','lightning','vampirism'].includes(kind))return false;
 p.enchantment=kind;return true;
}
function winFight(p,b,ev,source){
 if(b.phase!=='fight'||b.enemyHp>0)return false;
 // Repeat clears yield less gold. Prevents infinite premium-boss farm loops.
 const firstClear=!p.farming&&!p.cleared&&b.level===p.room&&b.level>p.best;
 const multiplier=firstClear?1:b.monster.megaboss?.2:b.monster.boss?.3:.42;
 const gold=Math.max(1,Math.round(b.monster.reward*multiplier));
 p.gold+=gold;p.totalGold+=gold;p.kills++;
 if(b.monster.type==='slime')p.killedSlimes++;
 if(p.monsterKills && b.monster.type in p.monsterKills)p.monsterKills[b.monster.type]++;
 if(b.monster.boss)p.bossKills++;
 if(b.monster.megaboss&&firstClear&&!p.megaBossWins.includes(b.level))p.megaBossWins.push(b.level);
 if(source==='poison')p.poisonKills++;
 const materialByMonster={spider:'web',slime:'slime',skeleton:'bone',larva:'leaf',mushroom:'leaf',beetle:'chitin',ghost:'essence'};
 const material=materialByMonster[b.monster.type]||null;
 const loot=material?{id:material,amount:1}:null;
 if(loot)p.materials[loot.id]=(p.materials[loot.id]||0)+loot.amount;
 if(firstClear){p.best=Math.max(p.best,b.level);p.fails=0;if(b.level===WAVE_COUNT){p.cleared=true;p.room=WAVE_COUNT;}else p.room=b.level+1;}
 b.phase='transition';b.rest=1.15;b.poisonRemaining=0;
 ev.push({kind:'win',gold,loot,level:b.level,firstClear});
 return true;
}
export const VAMPIRISM_CHANCE=.05;
function hitEnemy(p,b,ev,rng=Math.random){
 const element=p.enchantment||'none',base=heroDamage(p);
 // Lightning resistance changes only the enchantment bonus, not sword damage.
 const multiplier=b.monster.lightningMultiplier??1;
 const extra=element==='lightning'?Math.ceil(base*.35*multiplier):0;
 const damage=Math.min(b.enemyHp,base+extra);
 b.enemyHp=Math.max(0,b.enemyHp-damage);
 if(element==='poison'&&b.monster.immunity!=='poison'){b.poisonRemaining=Math.max(b.poisonRemaining||0,4);b.poisonTick=0;}
 if(element==='lightning'&&extra>0)p.lightningHits++;
 let healed=0;
 if(element==='vampirism'&&!b.monster.bloodless&&b.monster.immunity!=='vampirism'&&rng()<VAMPIRISM_CHANCE){
  // Five-percent proc chance PER successful hit, never guaranteed lifesteal.
  healed=Math.max(0,Math.min(maxHealth(p)-b.hp,Math.max(1,Math.floor(damage*.12)),Math.ceil(maxHealth(p)*.08)));
  b.hp+=healed;if(healed>0)p.vampireHeals++;
 }
 ev.push({kind:'hero-hit',damage,element,healed});
 winFight(p,b,ev,'sword');
}
export function tapMonster(p,b,rng=Math.random){
 if(b.phase!=='fight'||p.autoEnabled)return [];
 const interval=attackInterval(p,false);
 if(b.heroTimer+1e-8<interval)return [{kind:'cooldown',remaining:interval-b.heroTimer}];
 // A manual click starts a fresh cooldown; idle/restore credit cannot shorten the next interval.
 b.heroTimer=0;
 const ev=[];hitEnemy(p,b,ev,rng);return ev;
}
export function stepFight(p,b,seconds,auto=true,rng=Math.random){
 const ev=[],dt=Math.min(Math.max(0,seconds),.25);
 if(b.phase==='rest'||b.phase==='transition'){
  b.rest-=dt;
  if(b.rest<=0){const afterRest=b.phase==='rest',health=afterRest?maxHealth(p):b.hp;Object.assign(b,startFight(p,health));ev.push({kind:'spawn',afterRest,level:b.level});}
  return ev;
 }
 if(b.phase!=='fight')return ev;
 b.heroTimer=Math.min(attackInterval(p,auto)+dt,b.heroTimer+dt);b.enemyTimer+=dt;
 if(b.poisonRemaining>0){
  b.poisonRemaining=Math.max(0,b.poisonRemaining-dt);
  b.poisonTick=(b.poisonTick||0)+dt;
  if(b.poisonTick>=.5){
   b.poisonTick-=.5;
   const damage=Math.max(1,Math.ceil(heroDamage(p)*.10));
   b.enemyHp=Math.max(0,b.enemyHp-damage);
   ev.push({kind:'poison-tick',damage});
   if(winFight(p,b,ev,'poison'))return ev;
  }
 }
 if(auto&&b.heroTimer+1e-8>=attackInterval(p,true)){b.heroTimer=Math.max(0,b.heroTimer-attackInterval(p,true));hitEnemy(p,b,ev,rng);if(b.phase!=='fight')return ev;}
 const enemyInterval=Math.max(1.6,2.4-b.level/3000);
 if(b.enemyTimer>=enemyInterval){b.enemyTimer-=enemyInterval;b.hp=Math.max(0,b.hp-b.monster.attack);ev.push({kind:'enemy-hit',damage:b.monster.attack,move:b.monster.move});
  if(b.hp===0){if(!p.farming&&!p.cleared){p.fails++;if(p.fails>=2&&p.room>1)p.farming=true;}b.phase='rest';b.rest=restDuration(p);ev.push({kind:'defeat',farming:p.farming});}
 }
 return ev;
}
export function offlineReward(p,ms){const minutes=Math.min(480,Math.max(0,ms/60000)),raw=Math.floor(minutes*battleRate(p)*.5),next=Math.min(swordCost(p.sword),armorCost(p.armor));return Math.min(raw,Math.floor(next*1.1));}
// Fish sale prices follow the unlocked cave depth, but stay supplementary:
 // baseline ~4-6% of combat earnings; upgraded rods may add ~10-12%.
 export function fishMarketMultiplier(best){
  const cleared=Math.max(0,Math.min(WAVE_COUNT,Math.floor(Number(best)||0)));
  return Math.min(80,(1+cleared/100)**2);
 }
 export function fishingRodBonus(level){
  const n=Math.max(0,Math.min(MAX_FISH_LEVEL,Math.floor(Number(level)||0)));
  return 1+.11*Math.min(10,n)+.022*Math.max(0,n-10);
 }
 export const SPECIES=[
 {species:'Плотва',slots:1,base:8,min:12,max:25,weight:[.12,.45],length:[14,27]},
 {species:'Карась',slots:2,base:18,min:24,max:44,weight:[.45,1.2],length:[22,38]},
 {species:'Окунь',slots:2,base:27,min:30,max:51,weight:[.40,1.4],length:[23,42]},
 {species:'Щука',slots:3,base:85,min:58,max:95,weight:[1.6,4.1],length:[49,84]},
 {species:'Золотой карп',slots:4,base:140,min:60,max:110,weight:[2.8,5.8],length:[55,92]}
];
export const bucketVolume=p=>p.fishBucket.reduce((n,f)=>n+f.slots,0);
export const bucketGold=p=>p.fishBucket.reduce((n,f)=>n+f.price,0);
const rand=(r,min,max)=>min+(max-min)*r();
export function planFishing(p,r=Math.random){
 const capacity=bucketCapacity(p)-bucketVolume(p);if(capacity<=0){p.catchPlan=[];p.nextCatchMs=0;return;}
 const a=[];let remain=capacity;
 while(remain>0){const available=SPECIES.filter(x=>x.slots<=remain && (x.species!=='Золотой карп' || p.fishLevel>=3));const weighted=available.map(f=>({f,w:f.slots===1?6:f.slots===2?4:f.slots===3?1.5:.3}));let hit=r()*weighted.reduce((s,x)=>s+x.w,0);let s=weighted.at(-1).f;for(const w of weighted){hit-=w.w;if(hit<=0){s=w.f;break;}}
  const length=Math.round(rand(r,...s.length)),weight=+(rand(r,...s.weight)).toFixed(2);
  const price=Math.max(1,Math.round(s.base*(.75+weight/s.weight[1]*.55)*fishingRodBonus(p.fishLevel)*fishMarketMultiplier(p.best)));
  a.push({species:s.species,slots:s.slots,weight,length,price,waitMs:rand(r,s.min,s.max)*1000});remain-=s.slots;
 }
 // Six active minutes for a fully empty baseline bucket, but randomized time between bites, weighted by fish size.
 const duration=360000*capacity/12;
 const sum=a.reduce((n,x)=>n+x.waitMs,0);
 p.catchPlan=a.map(f=>({...f,waitMs:Math.max(800,Math.round(f.waitMs/sum*duration))}));
 const delta=duration-p.catchPlan.reduce((n,f)=>n+f.waitMs,0);if(p.catchPlan.length)p.catchPlan.at(-1).waitMs+=delta;
 p.nextCatchMs=p.catchPlan[0]?.waitMs||0;
}
export function stepFishing(p,ms,r=Math.random){
 const events=[];if(bucketVolume(p)>=bucketCapacity(p))return events;
 if(p.catchPlan.length===0)planFishing(p,r);
 let remaining=Math.min(Math.max(0,ms),5000); // bounded active simulation
 while(remaining>0 && p.catchPlan.length){const d=Math.min(remaining,p.nextCatchMs);remaining-=d;p.nextCatchMs-=d;
 if(p.nextCatchMs<=.01){const f=p.catchPlan.shift();p.fishBucket.push(f);p.caughtTotal++;events.push({kind:'catch',fish:f});p.nextCatchMs=p.catchPlan[0]?.waitMs||0;
  if(bucketVolume(p)>=bucketCapacity(p)){events.push({kind:'bucket-full'});p.nextCatchMs=0;break;}}
 }
 return events;
}
// Test-only fast merchant cadence: first visit after 15s, then 5s visible / 10s away.
// Production cadence remains 15s visible / 5 minutes away.
export function stepMerchant(p,ms,tradeOpen=false,testMode=false){
 if(tradeOpen)return [];
 const ev=[];
 p.merchantMs=Math.max(0,p.merchantMs-Math.max(0,ms));
 if(p.merchantMs<=0){
  if(p.merchantPhase==='away'){p.merchantPhase='waiting';p.merchantMs=testMode?5000:15000;ev.push({kind:'merchant-arrive'});}
  else{p.merchantPhase='away';p.merchantMs=testMode?10000:300000;ev.push({kind:'merchant-leave'});}
 }
 return ev;
}
export function sellAll(p){if(p.merchantPhase!=='waiting'||p.fishBucket.length===0)return {ok:false};const sum=bucketGold(p),count=p.fishBucket.length,pikes=p.fishBucket.filter(f=>f.species==='Щука').length;p.gold+=sum;p.totalGold+=sum;p.soldFish+=count;p.soldPike+=pikes;p.fishBucket=[];p.catchPlan=[];p.nextCatchMs=0;p.merchantPhase='away';p.merchantMs=300000;return {ok:true,gold:sum,count,pikes};}
