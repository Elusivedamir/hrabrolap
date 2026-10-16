import {QUESTS,questProgress,claimQuest} from './quests.mjs';
import {monsterPose} from './monster-rig.mjs';
import {bucketArt,sleepFrameIndex,SLEEP_FRAMES} from './bucket-rest.mjs';
import {applyCanonicalFrame} from './canonical-sprites.mjs';
import {armorAttackTransform,armorHurtTransform,hurtMotionTransform,hurtWeaponTransform,HURT_FRAMES,HURT_FRAME_MS} from './equipment-rig.mjs';
import {WEAPONS,ARMORS,MATERIALS,freshProgress,validateProgress,restoreFight,swordCost,armorCost,fishCost,homeCost,bucketCost,bucketCapacity,heroDamage,maxHealth,startFight,stepFight,upgrade,buyEquipment,equipEquipment,offlineReward,bucketVolume,bucketGold,planFishing,stepFishing,stepMerchant,sellAll,purchaseAutoBattle,setEnchantment,tapMonster} from './game-core.mjs';
const $=id=>document.getElementById(id), SAVE='hrabrolap-v0.2-save',OLD='hrabrolap-v0.1-save',fmt=n=>Math.floor(n).toLocaleString('ru-RU');
let p,b,modalType='',last=performance.now(),lastSave=0,lastAutosave=0,msgTimeout=0,toastTimeout=0,lastFrameRest=false;
const heartsRoot=$('hero-hearts');
const monsterHearts=Array.from({length:5},()=>{const shell=document.createElement('span');shell.className='heart-shell';shell.innerHTML='<img class="heart-unfilled" src="art/approved/heart.svg" alt=""><span class="heart-filled"><img src="art/approved/heart.svg" alt=""></span>';$('enemy-hearts').append(shell);return shell;});
const heroHearts=Array.from({length:5},()=>{const shell=document.createElement('span');shell.className='heart-shell';shell.innerHTML='<img class="heart-unfilled" src="art/approved/heart.svg" alt=""><span class="heart-filled"><img src="art/approved/heart.svg" alt=""></span>';heartsRoot.append(shell);return shell;});
try {const raw=JSON.parse(localStorage.getItem(SAVE)||'null')||JSON.parse(localStorage.getItem(OLD)||'null');p=validateProgress(raw);b=restoreFight(p,raw?.version>=2?raw.battleState:null,raw?.version<3&&raw.cleared&&raw.best<100);
 if(p.lastSeen&&Date.now()>p.lastSeen+20000){p.pendingOffline=Math.min(p.pendingOffline+offlineReward(p,Date.now()-p.lastSeen),Math.floor(Math.min(swordCost(p.sword),armorCost(p.armor))*1.1));} p.lastSeen=Date.now();
}catch(e){p=freshProgress();b=startFight(p);console.warn('save recovery',e);}
if(!b)b=startFight(p);
if(!p.catchPlan.length && bucketVolume(p)<bucketCapacity(p))planFishing(p);
function save(){try{p.lastSeen=Date.now();localStorage.setItem(SAVE,JSON.stringify({...p,battleState:{level:b.level,hp:b.hp,enemyHp:b.enemyHp,phase:b.phase,heroTimer:b.heroTimer,enemyTimer:b.enemyTimer,rest:b.rest,monsterType:b.monster.type,poisonRemaining:b.poisonRemaining||0,poisonTick:b.poisonTick||0}}));}catch(e){console.warn(e)}}
function notify(t){const el=$('toast');el.textContent=t;el.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove('show'),2300)}
function say(t,time=2200){$('battle-message').textContent=t;clearTimeout(msgTimeout);msgTimeout=setTimeout(()=>{$('battle-message').textContent=b.phase==='rest'?'Котёнок отдыхает в домике':'Котёнок сражается сам · покупай улучшения'},time)}
function pulse(el,name,time=600){el.classList.remove(name);void el.offsetWidth;el.classList.add(name);setTimeout(()=>el.classList.remove(name),time)}

// v0.8: one swordless hero body + one separate animated SVG weapon + independent armor.
// The archived original PNG 6-frame sword animation remains in assets/battle, completely untouched.
const ATTACKS=[
 {id:'slash',name:'Рубящий удар',frames:[
  [170,229,-18,0,0,0],[167,228,-58,-5,1,-5],[174,225,-83,-7,-1,-6],[189,237,74,10,3,6],[195,241,105,12,1,8],[170,229,-18,0,0,0]]},
 {id:'overhead',name:'Сверху вниз',frames:[
  [173,229,-18,0,0,0],[208,202,-7,0,-6,-4],[212,206,36,-4,2,6],[210,234,132,11,10,12],[208,241,149,12,7,11],[170,229,-18,0,0,0]]},
 {id:'thrust',name:'Колющий рывок',frames:[
  [170,229,-18,0,0,0],[161,224,-64,-11,0,-10],[161,231,15,4,-5,-3],[227,227,88,22,-1,4],[236,226,84,26,-2,3],[170,229,-18,0,0,0]]}
];
let poseSerial=0,poseTimeouts=[],attackPrepared=false,currentPose=-1,attackSerial=0,activeAttack=0;
const heroMotion=$('hero-motion'),slot=$('weapon-slot'),armorSlot=$('armor-slot');
let hurtSerial=0,hurtTimers=[],hurting=false;
function cancelHurt(){
 hurtSerial++;for(const t of hurtTimers)clearTimeout(t);hurtTimers=[];hurting=false;
 delete $('hero-art').dataset.hurtFrame;
}
function hurtFrame(index){
 applyCanonicalFrame('hurt',index,{
  body:$('hero-body'),heroMotion,weaponSlot:slot,armorSlot,armorImage:$('hero-armor')
 });
 $('hero-art').dataset.hurtFrame=String(index+1);
}
function playHurt(){
 // Реакция на урон имеет приоритет над движением меча,
 // но не перерисовывает кота и не останавливает расчёт боя.
 cancelPose();cancelHurt();
 hurting=true;const serial=hurtSerial;hurtFrame(0);
 for(let i=1;i<HURT_FRAMES.length;i++){
  hurtTimers.push(setTimeout(()=>{if(serial===hurtSerial&&!document.hidden)hurtFrame(i);},i*HURT_FRAME_MS));
 }
 hurtTimers.push(setTimeout(()=>{
  if(serial!==hurtSerial)return;
  cancelHurt();if(b.phase==='rest')cancelAttackPose();else heroFrame(0);
 },HURT_FRAMES.length*HURT_FRAME_MS));
}

function heroFrame(index=0){
 applyCanonicalFrame('attack',index,{
  body:$('hero-body'),heroMotion,weaponSlot:slot,armorSlot,armorImage:$('hero-armor')
 });
 currentPose=index;
}
function cancelPose(){poseSerial++;for(const t of poseTimeouts)clearTimeout(t);poseTimeouts=[];attackPrepared=false;}
function queuePose(index,delay,serial=poseSerial){const t=setTimeout(()=>{if(serial===poseSerial&&b.phase!=='rest'&&!document.hidden)heroFrame(index);},delay);poseTimeouts.push(t);}
function prepareAttack(){if(hurting||attackPrepared||b.phase!=='fight')return;cancelPose();attackPrepared=true;activeAttack=attackSerial++%3;const serial=poseSerial;heroFrame(0);queuePose(1,110,serial);queuePose(2,245,serial);}
function contactAttack(){if(hurting)cancelHurt();cancelPose();const serial=poseSerial;heroFrame(3);queuePose(4,125,serial);queuePose(5,245,serial);queuePose(0,425,serial);}
function cancelAttackPose(){cancelPose();activeAttack=0;heroFrame(0);}
function syncHeroPose(){if(b.phase==='rest'&&!hurting)cancelAttackPose();}
function syncEquipment(){
 const weapon=WEAPONS.find(w=>w.id===p.weapon)||WEAPONS[0];$('hero-weapon').setAttribute('href',weapon.svg);
 const armor=ARMORS.find(a=>a.id===p.equippedArmor)||ARMORS[0];const art=$('hero-armor');art.style.display=armor.svg?'':'none';if(armor.svg)art.setAttribute('href',armor.svg);
}
const APPROVED_MONSTER_TYPES=new Set(['slime','spider','mouse','mushroom','beetle','larva','bat','ghost']);
const monsterSource=type=>APPROVED_MONSTER_TYPES.has(type)?'art/monsters-v2/'+type+'.svg':type==='golem'?'art/golem.svg':'art/monsters/'+type+'.svg';
let monsterSequence=0,monsterTimers=[];
function cancelMonsterFrames(){
 monsterSequence++;for(const t of monsterTimers)clearTimeout(t);monsterTimers=[];
 const art=$('enemy-art');art.style.animation='';art.style.transform='';
 art.classList.remove('approved-monster-frame');delete art.dataset.playingAnimation;
 if(b?.monster){const source=monsterSource(b.monster.texture);if(art.getAttribute('src')!==source)art.setAttribute('src',source);}
 $('boss-crown').style.visibility='';
}
function playMonsterFrames(phase){
 cancelMonsterFrames();const sequence=monsterSequence,type=b.monster.type,boss=!!b.monster.boss;
 const art=$('enemy-art'),holder=$('enemy-holder');
 const archived=APPROVED_MONSTER_TYPES.has(type);
 art.style.animation='none';
 if(archived){
  art.classList.add('approved-monster-frame');art.dataset.playingAnimation='1';
  // Archived boss frames ALREADY INCLUDE the original approved crown.
  if(boss)$('boss-crown').style.visibility='hidden';
 }
 for(let i=0;i<6;i++){
  monsterTimers.push(setTimeout(()=>{
   if(sequence!==monsterSequence||b.monster.type!==type||!!b.monster.boss!==boss)return;
   holder.dataset.monsterPhase=phase;holder.dataset.monsterFrame=String(i+1);
   if(archived){
    art.setAttribute('src',`animations/${type}/${boss?'boss':'normal'}/${phase}/0${i+1}.svg`);
   }else{
    const pose=monsterPose(type,phase,i);
    art.style.transform=pose.transform;
   }
  },i*64));
 }
 monsterTimers.push(setTimeout(()=>{if(sequence!==monsterSequence)return;cancelMonsterFrames();},6*64+15));
}
function enemyAttack(move){playMonsterFrames('attack');const holder=$('enemy-holder');for(const cl of [...holder.classList])if(cl.startsWith('attack-')||cl==='spores')holder.classList.remove(cl);
 void holder.getBoundingClientRect();holder.classList.add('attack-'+move);if(move==='spores')holder.classList.add('spores');setTimeout(()=>holder.classList.remove('attack-'+move,'spores'),710);}
function coinFx(n){const c=document.createElement('span');c.className='float-coin';c.textContent='+'+fmt(n)+' 🪙';document.querySelector('.dungeon').append(c);setTimeout(()=>c.remove(),1100)}
function fmtTimer(ms){const n=Math.ceil(ms/1000);return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')}
let sleepStartedAt=null;
function updateBucketDrawing(){
 const icon=$('bucket-graphic');
 const n=p.fishBucket.length;
 const next=bucketArt(n,p.bucketLevel>0);
 if(icon.getAttribute('src')!==next)icon.setAttribute('src',next);
 $('bucket-indicator').textContent=n+' рыб';
 $('bucket').setAttribute('aria-label','Рыцарское ведро: '+n+' рыб. Открыть улов');
}
function updateSleepDrawing(rest){
 const sprite=$('rest-sleep-sprite');
 if(!rest){sleepStartedAt=null;return;}
 const now=performance.now();
 if(sleepStartedAt===null)sleepStartedAt=now;
 const next=SLEEP_FRAMES[sleepFrameIndex(now-sleepStartedAt)];
 if(sprite.getAttribute('src')!==next)sprite.setAttribute('src',next);
}
function render(){
 $('gold').textContent=fmt(p.gold);
 $('room').textContent=`ВОЛНА ${b.level}/100`; $('room-progress').textContent=`${p.best}/100`; $('room-fill').style.width=(p.best)+'%';
 $('enemy-name').textContent=b.monster.name;const enemySource=monsterSource(b.monster.texture),art=$('enemy-art'),variant=b.monster.boss?'boss':'normal';
 if(art.dataset.monsterType!==b.monster.type||art.dataset.monsterVariant!==variant){
  cancelMonsterFrames();art.dataset.monsterType=b.monster.type;art.dataset.monsterVariant=variant;
  art.setAttribute('src',enemySource);
 }else if(!art.dataset.playingAnimation&&art.getAttribute('src')!==enemySource){
  art.setAttribute('src',enemySource);
 }
 $('enemy-holder').dataset.monster=b.monster.type;$('enemy-holder').classList.toggle('boss',b.monster.boss);$('enemy-art').classList.toggle('boss',b.monster.boss);
 $('hero-hp-num').textContent=Math.ceil(b.hp)+'/'+maxHealth(p);$('enemy-hp-num').textContent=Math.ceil(b.enemyHp)+'/'+b.monster.hp;
 $('hero-hp').style.width=(100*b.hp/maxHealth(p))+'%';$('enemy-hp').style.width=(100*b.enemyHp/b.monster.hp)+'%';
 const monsterHeartCapacity=b.monster.hp/5;
 monsterHearts.forEach((e,i)=>{const filling=Math.max(0,Math.min(1,(b.enemyHp-i*monsterHeartCapacity)/monsterHeartCapacity));e.querySelector('.heart-filled').style.width=(filling*100)+'%';});
 $('enemy-hearts').setAttribute('aria-label',`Здоровье ${b.monster.name}: ${Math.ceil(b.enemyHp)} из ${b.monster.hp}`);
 $('enemy-hearts').dataset.monster=b.monster.type;
 $('enemy-holder').classList.toggle('poisoned',b.poisonRemaining>0&&b.phase==='fight');
 const heartCapacity=maxHealth(p)/5;heroHearts.forEach((e,i)=>{const filling=Math.max(0,Math.min(1,(b.hp-i*heartCapacity)/heartCapacity));e.querySelector('.heart-filled').style.width=(filling*100)+'%';});heartsRoot.setAttribute('aria-label',`Здоровье ${Math.ceil(b.hp)} из ${maxHealth(p)}`);
 $('boss-crown').style.display=b.monster.boss?'block':'none';
 const rest=b.phase==='rest';if(rest && !$('battle-message').textContent.includes('Котёнок'))$('battle-message').textContent='Котёнок отдыхает дома';$('surface').classList.toggle('resting',rest);$('hero-art').classList.toggle('resting-hero',rest);updateSleepDrawing(rest);
 const status=$('status');status.classList.toggle('rest',rest||p.farming);status.textContent=rest?'ОТДЫХ '+fmtTimer(b.rest*1000):p.cleared?'ГЛАВА ПРОЙДЕНА':p.autoEnabled?'АВТОБОЙ · ВКЛ':p.autoUnlocked?'РУЧНОЙ БОЙ':'АВТОБОЙ · 1 🪙';
 const info=[['sword',p.sword,swordCost(p.sword),'Меч','Урон '+heroDamage(p)+' → '+(heroDamage(p)+3)],['armor',p.armor,armorCost(p.armor),'Броня','HP '+maxHealth(p)+' → '+(maxHealth(p)+14)],['fish',p.fishLevel,fishCost(p.fishLevel),'Удочка','Более ценный улов'],['home',p.home,homeCost(p.home),'Домик','Быстрее отдых']];
 for(const [kind,lev,cost,label,description] of info){const id=kind==='home'?'home':kind;$(id+'-lvl').textContent='ур. '+lev;$(id+'-cost').textContent='🪙 '+fmt(cost);if(kind==='sword'||kind==='armor')$(kind+'-stat').textContent=description;const btn=$('buy-'+kind);btn.classList.toggle('can-buy',p.gold>=cost);btn.classList.toggle('cant-buy',p.gold<cost);btn.setAttribute('aria-label',`${label}: улучшить за ${cost} монет`);}
 syncEquipment();
 updateBucketDrawing();$('fish-status').textContent=bucketVolume(p)>=bucketCapacity(p)?'Ведро заполнено · рыбалка ждёт':`Поклёвка через ${fmtTimer(p.nextCatchMs)}`;
 const visiting=p.merchantPhase==='waiting';$('merchant').classList.toggle('visible',visiting);$('merchant-visit').textContent=fmtTimer(p.merchantMs);$('merchant-status').textContent=visiting?'Торговец приехал!':'Торговец через '+fmtTimer(p.merchantMs);
}
function onUpgrade(kind){const result=upgrade(p,kind);if(!result.ok){notify(result.reason==='max'?'Ведро максимально улучшено':'Не хватает '+fmt((result.cost||0)-p.gold)+' монет');return;}
 // Deliberately DO NOT recreate the battle: hero HP is persistent across room changes and upgrades.
 notify(({sword:'Меч стал сильнее!',armor:'Максимальное HP выросло, но здоровье не восстановилось',fish:'Теперь можно поймать рыбу подороже!',home:'Дом стал уютнее · отдых быстрее'})[kind]);
 if(kind==='sword'||kind==='armor')pulse($('hero-art'),'upgrade-glow',750);
 // If farming and the upgrade can help, attack the blocked level after current fight. No free healing.
 if(kind==='bucket'){p.catchPlan=[];planFishing(p);}save();render();
}
function openModal(title,mode='info',text=''){modalType=mode;$('modal-title').textContent=title;const content=$('modal-content'),buttons=$('modal-buttons');content.replaceChildren();buttons.replaceChildren();
 const para=t=>{const x=document.createElement('p');x.textContent=t;content.append(x)};
 const action=(label,callback,cls='')=>{const x=document.createElement('button');x.textContent=label;if(cls)x.className=cls;x.addEventListener('click',callback);buttons.append(x);return x};
 if(mode==='bucket'||mode==='trade'){
  if(mode==='trade')para('Хей, ребята привет, есть что-то для меня?');
  para(`Улов: ${p.fishBucket.length} рыб · ${bucketVolume(p)}/${bucketCapacity(p)} места · ${bucketGold(p)} монет`);
  if(!p.fishBucket.length){const d=document.createElement('div');d.className='empty';d.textContent='Ведро пока пустое';content.append(d)}
  for(const f of p.fishBucket){const row=document.createElement('div');row.className='fish-row';const details=document.createElement('span');details.textContent=`${f.species} · ${f.length} см · ${f.weight.toFixed(2)} кг`;const price=document.createElement('b');price.textContent=f.price+' 🪙';row.append(details,price);content.append(row);}
  if(mode==='trade'){const btn=action(`Продать всё · ${bucketGold(p)} 🪙`,()=>{const sale=sellAll(p);if(sale.ok){notify('Продано '+sale.count+' рыб · +'+sale.gold+' монет!');save();closeModal();}else notify('Ведро пустое');});btn.disabled=p.fishBucket.length===0;}
  else {para('Продать улов можно только серому коту-торговцу. Он приезжает каждые 5 минут активной игры и ждёт 15 секунд.');if(!p.bucketLevel)action('Улучшить ведро до 24 мест · '+bucketCost()+' 🪙',()=>{const r=upgrade(p,'bucket');if(!r.ok){notify('Не хватает монет');return;}p.catchPlan=[];planFishing(p);save();openModal('Ведро рыцаря','bucket');notify('Теперь вмещается 24!')});}
 }else if(mode==='shop'||mode==='inventory'){
  para(mode==='shop'?'Покупай SVG-экипировку за монеты и добычу с монстров. Рецепты проверяются перед покупкой.':'Выбирай приобретённые вещи. Меч и броня переключаются без изменения анимаций котёнка.');
   const materials=document.createElement('div');materials.className='materials-summary';
   const label=document.createElement('b');label.textContent='🎒 Материалы в инвентаре';materials.append(label);
   const chips=document.createElement('div');chips.className='material-chips';
   for(const material of MATERIALS){const chip=document.createElement('span');chip.textContent=`${material.icon} ${material.name}: ${p.materials[material.id]||0}`;chips.append(chip);}
   materials.append(chips);content.append(materials);
  const line=(caption,items,category)=>{
    const title=document.createElement('div');title.className='section-title';title.textContent=caption;content.append(title);
    for(const item of items){const own=category==='weapon'?p.ownedWeapons:p.ownedArmors;
       if(mode==='shop'&&!item.price)continue;
      if(mode==='inventory'&&!own.includes(item.id))continue;
      const row=document.createElement('div');row.className='shop-item';const im=document.createElement('img');if(item.svg)im.src=item.svg;else {im.src='art/hero/bare-kitten.svg';im.alt='Без брони';}
      const main=document.createElement('main'),label=document.createElement('b');label.textContent=item.name;
       const stats=document.createElement('small');stats.textContent=category==='weapon'?'Урон +'+item.damage:'Здоровье +'+item.health;
       const recipe=document.createElement('small');recipe.className='item-recipe';
       const names=Object.entries(item.materials||{}).map(([id,count])=>{const type=MATERIALS.find(m=>m.id===id);return `${type?.icon||'•'} ${type?.name||id} ${p.materials[id]||0}/${count}`;});
       recipe.textContent='🪙 '+fmt(item.price)+(names.length?' · '+names.join(' · '):'');
       main.append(label,stats,recipe);
      const button=document.createElement('button');const equipped=(category==='weapon'?p.weapon:p.equippedArmor)===item.id;const has=own.includes(item.id);button.textContent=equipped?'Надето':has?'Надеть':'Купить';button.disabled=equipped;
      button.addEventListener('click',()=>{if(!has){const r=buyEquipment(p,category,item.id);if(!r.ok){if(r.reason==='material'){const mat=MATERIALS.find(x=>x.id===r.material);notify('Не хватает: '+(mat?.name||r.material)+' '+r.available+'/'+r.need);}else notify('Не хватает монет');return;}notify('Куплено: '+item.name);}else{equipEquipment(p,category,item.id,b);notify('Надето: '+item.name);}save();openModal(mode==='shop'?'Магазин':'Инвентарь',mode);});
      row.append(im,main,button);content.append(row);
    }
  };
  line('Мечи',WEAPONS,'weapon');line('Броня',ARMORS,'armor');
  if(mode==='inventory'){
   const enchantWrap=document.createElement('div');enchantWrap.className='enchant-controls';
   const name=document.createElement('b');name.textContent='✨ Зачарование меча · тест механики';
   const select=document.createElement('select');select.setAttribute('aria-label','Эффект меча');
   for(const [id,label] of [['none','Без эффекта'],['poison','☠ Яд'],['lightning','⚡ Молния'],['vampirism','🩸 Вампиризм']]){
    const option=document.createElement('option');option.value=id;option.textContent=label;select.append(option);
   }
   select.value=p.enchantment||'none';
   select.addEventListener('change',()=>{setEnchantment(p,select.value);save();notify('Эффект оружия: '+select.options[select.selectedIndex].text);});
   const hint=document.createElement('small');hint.textContent='Эффекты доступны для тестирования бесплатно. Цены зачарований определим позже.';
   enchantWrap.append(name,select,hint);content.append(enchantWrap);
  }
  if(mode==='shop'){para('Качество меча и брони улучшается кнопками внизу экрана независимо от внешнего вида предметов.');
   action('🎞 Ателье SVG — посмотреть 6 кадров',()=>{save();window.location.href='equipment-preview.html'});
   action('Открыть инвентарь',()=>openModal('Инвентарь','inventory'));}
  else action('Открыть магазин',()=>openModal('Магазин','shop'));
 }else if(mode==='quests'){
  for(const q of QUESTS){const done=p.questClaimed.includes(q.id),count=questProgress(p,q);const row=document.createElement('div');row.className='quest-row';const text=document.createElement('span');text.textContent=q.name;const mini=document.createElement('small');mini.textContent=Math.min(q.target,count)+'/'+q.target+' · награда '+q.reward+' 🪙';text.append(mini);const btn=document.createElement('button');btn.textContent=done?'✓':'+ 🪙';btn.disabled=done||count<q.target;btn.addEventListener('click',()=>{const result=claimQuest(p,q.id);if(!result.ok)return;save();openModal('Задания','quests');notify('Награда за задание: +'+result.reward+' монет')});row.append(text,btn);content.append(row);}
  para('В заданиях учитываются реальные победы, улучшения и продажи, но не офлайн-время.');
 }else if(mode==='offline'){
  para('Котёнок заработал, пока тебя не было: +'+fmt(p.pendingOffline)+' монет.');para('Офлайн-заработок ограничен стоимостью ближайшего улучшения и не открывает новые комнаты.');action('Забрать '+fmt(p.pendingOffline)+' 🪙',()=>{p.gold+=p.pendingOffline;p.pendingOffline=0;save();closeModal();notify('Офлайн-награда получена!')});
 }else if(mode==='reset'){
  para('Это удалит монеты, улов, улучшения и весь прогресс.');action('Сбросить игру',()=>{p=freshProgress();b=startFight(p);planFishing(p);save();closeModal();render();notify('Прогресс сброшен')});
 }else para(text);
 if(mode!=='offline')action('Закрыть',closeModal,'secondary');
 if(!$('modal').open)$('modal').showModal();render();
}
function closeModal(){const mode=modalType;modalType='';if($('modal').open)$('modal').close();last=performance.now();render()}
function battleEvents(events){for(const ev of events){
 if(ev.kind==='hero-hit'){
  contactAttack();playMonsterFrames('hurt');pulse($('enemy-holder'),'hurt',350);
  const holder=$('enemy-holder');
  if(ev.element==='lightning')pulse(holder,'electrocuted',540);
  if(ev.element==='vampirism'&&ev.healed>0){pulse(holder,'life-drain',580);notify('Вампиризм: +'+ev.healed+' HP');}
 }
 if(ev.kind==='poison-tick'){pulse($('enemy-holder'),'poison-tick',350);}
 if(ev.kind==='enemy-hit'){playHurt();pulse($('hero-art'),'battle-hurt',HURT_FRAMES.length*HURT_FRAME_MS);enemyAttack(ev.move);}
 if(ev.kind==='win'){coinFx(ev.gold);
   const lootName=MATERIALS.find(x=>x.id===ev.loot?.id);
   say(`Победа! +${ev.gold} монет`+(lootName?` · +1 ${lootName.name}`:''));pulse($('enemy-holder'),'dead',660);save();if(ev.level===100&&ev.firstClear)setTimeout(()=>openModal('100 волн пройдено!','info','Храбролап прошёл все сто волн! Можно продолжать сражаться и собирать монеты.'),600);}
 if(ev.kind==='defeat'){syncHeroPose();say('Котёнок возвращается домой отдохнуть');save();}
 if(ev.kind==='spawn'){cancelMonsterFrames();}
 if(ev.kind==='spawn'&&ev.afterRest){cancelAttackPose();say('Мы справимся!');pulse($('surface'),'wake-up',1800);}
}}
function alignFishFlightWithBucket(){
 const fish=document.querySelector('#surface .fish-flight');
 const bucket=$('bucket-graphic');
 if(!fish||!bucket)return;
 const a=fish.getBoundingClientRect(),b=bucket.getBoundingClientRect();
 const x=(b.left+b.width*.5)-(a.left+a.width*.5);
 const y=(b.top+b.height*.32)-(a.top+a.height*.5);
 fish.style.setProperty('--fish-target-x',x.toFixed(2)+'px');
 fish.style.setProperty('--fish-target-y',y.toFixed(2)+'px');
}
function fishEvents(events){for(const e of events){if(e.kind==='catch'){pulse($('surface'),'biting',1400);setTimeout(()=>{alignFishFlightWithBucket();pulse($('surface'),'reeling',1400);},430);notify('Рыцарь поймал: '+e.fish.species+' · '+e.fish.weight+' кг');save();}if(e.kind==='bucket-full'){notify('Ведро заполнено! Ждём торговца.');save();}}}
function merchantEvents(events){for(const e of events){if(e.kind==='merchant-arrive'){notify('Хей, ребята привет, есть что-то для меня?');save();}if(e.kind==='merchant-leave'){notify('Скоро вернусь!');save();}}}
function frame(now){const dt=Math.min(.12,Math.max(0,(now-last)/1000));last=now;
 if(!document.hidden){
  // Prepares the swing in the last 350 ms before the real damage tick.
  if(b.phase==='fight' && p.autoEnabled && !attackPrepared && b.heroTimer < .95 && b.heroTimer+dt >= .95) prepareAttack();
  battleEvents(stepFight(p,b,dt,p.autoEnabled));fishEvents(stepFishing(p,dt*1000));merchantEvents(stepMerchant(p,dt*1000,modalType==='trade'));
  if(now-lastSave>250){render();lastSave=now;}
  if(now-lastAutosave>5000){save();lastAutosave=now;}
 }
 requestAnimationFrame(frame);
}
$('status').addEventListener('click',()=>{
 if(b.phase==='rest'){notify('Котёнок отдыхает');return;}
 const result=purchaseAutoBattle(p);
 if(!result.ok){notify('Для автобоя нужна 1 монета');return;}
 notify(p.autoEnabled?'Автобой включён':'Ручной бой: нажимай на монстра');
 save();render();
});
$('enemy-holder').addEventListener('click',()=>{
 if(p.autoEnabled){notify('Отключи автобой, чтобы атаковать вручную');return;}
 const events=tapMonster(p,b);
 if(events.some(e=>e.kind==='cooldown'))return;
 battleEvents(events);save();render();
});
for(const kind of ['sword','armor','fish','home'])$('buy-'+kind).addEventListener('click',()=>onUpgrade(kind));
$('bucket').addEventListener('click',()=>openModal('Ведро рыцаря','bucket'));
$('merchant').addEventListener('click',()=>openModal('Серый кот-торговец','trade'));
$('quests').addEventListener('click',()=>openModal('Задания','quests'));
$('inventory').addEventListener('click',()=>openModal('Инвентарь','inventory'));
$('shop').addEventListener('click',()=>openModal('Магазин','shop'));
$('mini-shop').addEventListener('click',()=>openModal('Магазин','shop'));
$('help').addEventListener('click',()=>openModal('Как играть','info','Нажимай на монстра, чтобы атаковать вручную. Автобой открывается за 1 монету и переключается кнопкой сверху. После победы здоровье НЕ восстанавливается. После поражения он отдыхает в домике и лечится. Рыбак сам ловит разную рыбу и складывает её в ведро. Каждые 5 минут приезжает торговец и ждёт 15 секунд. Нажми на торговца, чтобы продать улов. Рыбалка и визиты торговца полностью останавливаются, пока игра закрыта. Офлайн котёнок приносит только ограниченное количество монет.'));
$('reset').addEventListener('click',()=>openModal('Начать заново?','reset'));
$('modal-x').addEventListener('click',closeModal);
$('modal').addEventListener('cancel',e=>{e.preventDefault();if(modalType!=='offline')closeModal()});
function visibility(){if(document.hidden){cancelHurt();cancelAttackPose();save();}else{cancelHurt();cancelAttackPose();if(p.lastSeen){const elapsed=Date.now()-p.lastSeen;if(elapsed>20000){const award=offlineReward(p,elapsed);p.pendingOffline=Math.min(p.pendingOffline+award,Math.floor(Math.min(swordCost(p.sword),armorCost(p.armor))*1.1));if(award>0)setTimeout(()=>{if(!$('modal').open)openModal('Награда за отсутствие','offline')},250);}}last=performance.now();save();}}
document.addEventListener('visibilitychange',visibility);
window.addEventListener('pagehide',save);
setInterval(()=>{if(!document.hidden)save()},3000);
cancelAttackPose();render();save();requestAnimationFrame(frame);
if(p.pendingOffline>0)setTimeout(()=>openModal('Награда за отсутствие','offline'),500);
