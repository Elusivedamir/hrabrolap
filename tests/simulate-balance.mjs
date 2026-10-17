// Ускоряется исполнение, а не игровые коэффициенты. Один шаг = 0.1 игровой секунды.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const coreURL=process.env.HRABROLAP_CORE?pathToFileURL(process.env.HRABROLAP_CORE):new URL('../game-core.mjs',import.meta.url);
const c=await import(coreURL);
function rng(seed){let state=seed>>>0;return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}

export function simulate({id,policy='balanced',decisionSeconds=1,seed=1,equipment=false,fish=false,reload=false,combat='manual',limitSeconds=43200}){
 let p=c.freshProgress(),b=c.startFight(p);const random=rng(seed),waves=[],seen=new Set(),bosses=[];
 let wins=0,defeats=0,farmWins=0,reloads=0,sales=0,fishGold=0,nextDecision=0,nextReload=300;
 const purchases={sword:0,armor:0,weapon:0,equippedArmor:0,attackSpeed:0};
 let tick=0;
 for(;tick<limitSeconds*10&&!p.cleared;tick++){
  const seconds=tick/10;
  const events=c.stepFight(p,b,.1,p.autoEnabled);
  if(!p.autoEnabled)events.push(...c.tapMonster(p,b));
  for(const e of events){
   if(e.kind==='win'){
    wins++;seen.add(b.monster.type);
    if(e.firstClear){waves.push({wave:e.level,seconds:+seconds.toFixed(1),sword:p.sword,armor:p.armor,damage:c.heroDamage(p),health:c.maxHealth(p),gold:p.gold});if(b.monster.boss)bosses.push(e.level);}
    else farmWins++;
   }
   if(e.kind==='defeat')defeats++;
  }
  if(fish){c.stepFishing(p,100,random);c.stepMerchant(p,100);if(p.merchantPhase==='waiting'&&p.fishBucket.length){const sale=c.sellAll(p);sales++;fishGold+=sale.gold;}}
  if(combat==='auto'&&!p.autoUnlocked&&p.gold>=1)c.purchaseAutoBattle(p);
  if(seconds>=nextDecision){
   nextDecision+=decisionSeconds;
   if(policy!=='none'){
    const options=[];
    if(policy!=='armor-only')options.push({kind:'sword',cost:c.swordCost(p.sword),run:()=>c.upgrade(p,'sword')});
    if(policy!=='sword-only')options.push({kind:'armor',cost:c.armorCost(p.armor),run:()=>c.upgrade(p,'armor')});
    if(combat==='auto'&&p.autoUnlocked&&p.autoLevel<c.MAX_AUTO_LEVEL)
     options.push({kind:'attackSpeed',cost:c.autoUpgradeCost(p.autoLevel),run:()=>c.upgradeAttackSpeed(p)});
    if(equipment){
     const affordableMaterials=item=>Object.entries(item.materials||{}).every(([id,need])=>(p.materials[id]||0)>=need);
     for(const w of c.WEAPONS.filter(w=>!p.ownedWeapons.includes(w.id)&&affordableMaterials(w)))options.push({kind:'weapon',cost:w.price,run:()=>{const buy=c.buyEquipment(p,'weapon',w.id);if(buy.ok)c.equipEquipment(p,'weapon',w.id,b);return buy;}});
     for(const a of c.ARMORS.filter(a=>!p.ownedArmors.includes(a.id)&&affordableMaterials(a)))options.push({kind:'equippedArmor',cost:a.price,run:()=>{const buy=c.buyEquipment(p,'armor',a.id);if(buy.ok)c.equipEquipment(p,'armor',a.id,b);return buy;}});
    }
    options.sort((a,b)=>a.cost-b.cost);const selected=options[0];
    if(selected&&selected.cost<=p.gold&&selected.run().ok)purchases[selected.kind]++;
   }
  }
  if(reload&&seconds>=nextReload){
   const raw=JSON.parse(JSON.stringify({...p,battleState:b}));
   p=c.validateProgress(raw);b=c.restoreFight(p,raw.battleState);reloads++;nextReload+=300;
  }
  if(!Number.isFinite(p.gold)||p.gold<0||!Number.isFinite(b.hp)||b.hp<0||b.hp>c.maxHealth(p)||p.room>c.WAVE_COUNT)throw Error('Invalid state at '+id+' '+seconds);
 }
 return {id,policy,combat,autoUnlocked:p.autoUnlocked,autoLevel:p.autoLevel,decisionSeconds,seed,equipment,fish,reload,cleared:p.cleared,best:p.best,room:p.room,
  seconds:+(tick/10).toFixed(1),minutes:+(tick/600).toFixed(2),wins,defeats,farmWins,damage:c.heroDamage(p),health:c.maxHealth(p),
  sword:p.sword,armor:p.armor,gold:p.gold,totalGold:p.totalGold,weapon:p.weapon,equippedArmor:p.equippedArmor,
  caught:p.caughtTotal,sales,fishGold,reloads,purchases,monsterTypes:[...seen],bossWaves:bosses,waves};
}

export async function runBalance(outDir){
 const began=performance.now();
 const configs=[
  {id:'balanced-1s',decisionSeconds:1},
  {id:'balanced-10s',decisionSeconds:10,combat:'auto'},
  {id:'balanced-30s',decisionSeconds:30},
  {id:'equipment-fishing-10s',decisionSeconds:10,equipment:true,fish:true,seed:1},
  {id:'reload-every-5min',decisionSeconds:10,reload:true,combat:'auto'},
  {id:'sword-only',policy:'sword-only'},
  {id:'armor-only',policy:'armor-only'},
  {id:'no-upgrades',policy:'none'},
  ...[2,3,4,5].map(seed=>({id:'fishing-seed-'+seed,decisionSeconds:10,equipment:true,fish:true,seed}))
 ];
 const results=configs.map(simulate);
 const summary={generatedAt:new Date().toISOString(),sourceCore:process.env.HRABROLAP_CORE?'external-core':'v0.9.7',
  method:'stepFight(0.1, autoEnabled) + manual tap at each eligible step; autobattle must be purchased for 1 coin if selected; max 3 manual/s or level-0 auto 1/s; покупки только за заработанное золото; максимум 12 игровых часов; продажа на каждом визите, если включена рыбалка. Реальное время воспроизводится моделью, не браузером.',
  wallSeconds:+((performance.now()-began)/1000).toFixed(3),results};
 if(outDir){
  await fs.mkdir(outDir,{recursive:true});
  await fs.writeFile(path.join(outDir,'balance-results.json'),JSON.stringify(summary,null,2)+'\n');
  const lines=['scenario,wave,seconds,sword_level,armor_level,damage,max_health,gold'];
  for(const r of results)for(const w of r.waves)lines.push([r.id,w.wave,w.seconds,w.sword,w.armor,w.damage,w.health,w.gold].join(','));
  await fs.writeFile(path.join(outDir,'balance-waves.csv'),lines.join('\n')+'\n');
 }
 console.table(results.map(({id,cleared,best,minutes,wins,defeats,farmWins,damage,health,reloads})=>({id,cleared,best,minutes,wins,defeats,farmWins,damage,health,reloads})));
 return summary;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await runBalance(process.argv[2]||fileURLToPath(new URL('../qa',import.meta.url)));
