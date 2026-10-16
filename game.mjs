import {ATTACKS} from './hero-poses.mjs';
import {WEAPONS,ARMORS,freshProgress,validateProgress,restoreFight,swordCost,armorCost,fishCost,homeCost,bucketCost,bucketCapacity,heroDamage,maxHealth,startFight,stepFight,upgrade,buyEquipment,equipEquipment,offlineReward,bucketVolume,bucketGold,planFishing,stepFishing,stepMerchant,sellAll} from './game-core.mjs';
const $=id=>document.getElementById(id), SAVE='hrabrolap-v0.2-save',OLD='hrabrolap-v0.1-save',fmt=n=>Math.floor(n).toLocaleString('ru-RU');
let p,b,modalType='',last=performance.now(),lastSave=0,lastAutosave=0,msgTimeout=0,toastTimeout=0,lastFrameRest=false;
const heartsRoot=$('hero-hearts');
const monsterHeartsRoot=$('enemy-hearts');
const monsterHearts=Array.from({length:5},()=>{const shell=document.createElement('span');shell.className='heart-shell';shell.innerHTML='<img class="heart-unfilled" src="art/approved/heart.svg" alt=""><span class="heart-filled"><img src="art/approved/heart.svg" alt=""></span>';monsterHeartsRoot.append(shell);return shell;});
const heroHearts=Array.from({length:5},()=>{const shell=document.createElement('span');shell.className='heart-shell';shell.innerHTML='<img class="heart-unfilled" src="art/approved/heart.svg" alt=""><span class="heart-filled"><img src="art/approved/heart.svg" alt=""></span>';heartsRoot.append(shell);return shell;});
try {const raw=JSON.parse(localStorage.getItem(SAVE)||'null')||JSON.parse(localStorage.getItem(OLD)||'null');p=validateProgress(raw);b=restoreFight(p,raw?.version>=2?raw.battleState:null,raw?.version<3&&raw.cleared&&raw.best<100);
 if(p.lastSeen&&Date.now()>p.lastSeen+20000){p.pendingOffline=Math.min(p.pendingOffline+offlineReward(p,Date.now()-p.lastSeen),Math.floor(Math.min(swordCost(p.sword),armorCost(p.armor))*1.1));} p.lastSeen=Date.now();
}catch(e){p=freshProgress();b=startFight(p);console.warn('save recovery',e);}
if(!b)b=startFight(p);
if(!p.catchPlan.length && bucketVolume(p)<bucketCapacity(p))planFishing(p);
function save(){try{p.lastSeen=Date.now();localStorage.setItem(SAVE,JSON.stringify({...p,battleState:{level:b.level,hp:b.hp,enemyHp:b.enemyHp,phase:b.phase,heroTimer:b.heroTimer,enemyTimer:b.enemyTimer,rest:b.rest}}));}catch(e){console.warn(e)}}
function notify(t){const el=$('toast');el.textContent=t;el.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove('show'),2300)}
function say(t,time=2200){$('battle-message').textContent=t;clearTimeout(msgTimeout);msgTimeout=setTimeout(()=>{$('battle-message').textContent=b.phase==='rest'?'Котёнок отдыхает в домике':(p.autoBattle?'Котёнок сражается сам · покупай улучшения':'Нажми «Удар», чтобы атаковать')},time)}
function pulse(el,name,time=600){el.classList.remove(name);void el.offsetWidth;el.classList.add(name);setTimeout(()=>el.classList.remove(name),time)}

// v0.8: one swordless hero body + one separate animated SVG weapon + independent armor.
// The archived original PNG 6-frame sword animation remains in assets/battle, completely untouched.
// slash / overhead / thrust — the same timeline drives 18 swordless SVG sprites.
// Weapon sprites remain independent and interchangeable during every pose.
let manualWindup=null;
let poseSerial=0,poseTimeouts=[],attackPrepared=false,currentPose=-1,attackSerial=0,activeAttack=0;
const heroMotion=$('hero-motion'),slot=$('weapon-slot');
function heroFrame(index=0){
 const frame=Math.max(0,Math.min(5,index));
 const attack=ATTACKS[activeAttack];
 const [x,y,angle,dx,dy,lean]=attack.frames[frame];
 const weaponPose=`translate(${x} ${y}) rotate(${angle})`;
 slot.setAttribute('transform',weaponPose);
 // One stable hand-to-hilt transform, including the contact frame of thrust.
 $('hero-hand').setAttribute('transform',weaponPose);
 $('hero-body').setAttribute('href',`animations/hero/${attack.id}/${String(frame+1).padStart(2,'0')}.svg`);
 heroMotion.setAttribute('transform',`translate(${dx} ${dy}) rotate(${lean} 238 252)`);
 currentPose=frame;
}
function cancelPose(){poseSerial++;for(const t of poseTimeouts)clearTimeout(t);poseTimeouts=[];attackPrepared=false;}
function queuePose(index,delay,serial=poseSerial){const t=setTimeout(()=>{if(serial===poseSerial&&b.phase!=='rest'&&!document.hidden)heroFrame(index);},delay);poseTimeouts.push(t);}
function prepareAttack(){if(attackPrepared||b.phase!=='fight')return;cancelPose();attackPrepared=true;activeAttack=attackSerial++%3;const serial=poseSerial;heroFrame(0);queuePose(1,110,serial);queuePose(2,245,serial);}
function contactAttack(){cancelPose();const serial=poseSerial;heroFrame(3);queuePose(4,125,serial);queuePose(5,245,serial);queuePose(0,425,serial);}
function cancelAttackPose(){cancelPose();activeAttack=0;heroFrame(0);}
function syncHeroPose(){if(b.phase==='rest')cancelAttackPose();}
function syncEquipment(){
 const weapon=WEAPONS.find(w=>w.id===p.weapon)||WEAPONS[0];$('hero-weapon').setAttribute('href',weapon.svg);
 const armor=ARMORS.find(a=>a.id===p.equippedArmor)||ARMORS[0];const art=$('hero-armor');art.style.display=armor.svg?'':'none';if(armor.svg)art.setAttribute('href',armor.svg);
}
// 6 real, individually authored SVG frames per species for attack and hurt, including own aligned boss crown.
const monsterSprite=(type,boss,action='attack',frame=1)=>`animations/${type}/${boss?'boss':'normal'}/${action}/${String(frame).padStart(2,'0')}.svg`;
let enemyAnimationToken=0, enemyFrameLock=false, enemyAnimationIds=[], enemyVisualKey='';
function stopEnemyAnimation(){enemyAnimationToken++;for(const id of enemyAnimationIds)clearTimeout(id);enemyAnimationIds=[];enemyFrameLock=false;}
function playEnemyFrames(action){
 stopEnemyAnimation();const type=b.monster.type,boss=b.monster.boss,token=enemyAnimationToken;
 enemyFrameLock=true;
 for(let i=0;i<6;i++)enemyAnimationIds.push(setTimeout(()=>{
  if(token!==enemyAnimationToken||document.hidden||b.monster.type!==type||b.monster.boss!==boss)return;
  $('enemy-art').src=monsterSprite(type,boss,action,i+1);
 },i*85));
 enemyAnimationIds.push(setTimeout(()=>{
  if(token!==enemyAnimationToken)return;
  enemyFrameLock=false;$('enemy-art').src=monsterSprite(b.monster.type,b.monster.boss);
 },6*85));
}
function enemyAttack(move){playEnemyFrames('attack');}
let fishAnimationToken=0,fishFrameIds=[];
function playFishCatch(){
 fishAnimationToken++;for(const id of fishFrameIds)clearTimeout(id);
 fishFrameIds=[];const token=fishAnimationToken,img=$('fishing-animation');
 img.classList.add('playing');$('surface').classList.add('animated-fishing');
 for(let i=0;i<10;i++)fishFrameIds.push(setTimeout(()=>{if(token===fishAnimationToken&&!document.hidden)img.src=`animations/fishing/${String(i+1).padStart(2,'0')}.svg`;},i*135));
 fishFrameIds.push(setTimeout(()=>{if(token===fishAnimationToken){img.classList.remove('playing');$('surface').classList.remove('animated-fishing');}},1450));
}
let merchantFrame=1,lastMerchantFrame=0;
function updateMerchantAnimation(now){
 if(!p||p.merchantPhase!=='waiting')return;
 if(now-lastMerchantFrame>170){lastMerchantFrame=now;merchantFrame=merchantFrame%10+1;
 $('merchant-image').src=`animations/merchant/${String(merchantFrame).padStart(2,'0')}.svg`;}
}
function coinFx(n){const c=document.createElement('span');c.className='float-coin';c.textContent='+'+fmt(n)+' 🪙';document.querySelector('.dungeon').append(c);setTimeout(()=>c.remove(),1100)}
function fmtTimer(ms){const n=Math.ceil(ms/1000);return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')}
function render(){
 $('gold').textContent=fmt(p.gold);
 $('room').textContent=`ВОЛНА ${b.level}/100`; $('room-progress').textContent=`${p.best}/100`; $('room-fill').style.width=(p.best)+'%';
 $('enemy-name').textContent=b.monster.name;const enemySource=monsterSprite(b.monster.type,b.monster.boss);const key=b.monster.type+':'+b.monster.boss;if(enemyVisualKey!==key){stopEnemyAnimation();enemyVisualKey=key;$('enemy-art').src=enemySource;}else if(!enemyFrameLock&&$('enemy-art').getAttribute('src')!==enemySource)$('enemy-art').src=enemySource;$('enemy-holder').dataset.monster=b.monster.type;$('enemy-holder').classList.toggle('boss',b.monster.boss);$('enemy-art').classList.toggle('boss',b.monster.boss);
 $('hero-hp-num').textContent=Math.ceil(b.hp)+'/'+maxHealth(p);$('enemy-hp-num').textContent=Math.ceil(b.enemyHp)+'/'+b.monster.hp;
 $('hero-hp').style.width=(100*b.hp/maxHealth(p))+'%';$('enemy-hp').style.width=(100*b.enemyHp/b.monster.hp)+'%';
 const heartCapacity=maxHealth(p)/5;heroHearts.forEach((e,i)=>{const filling=Math.max(0,Math.min(1,(b.hp-i*heartCapacity)/heartCapacity));e.querySelector('.heart-filled').style.width=(filling*100)+'%';});const monsterCapacity=b.monster.hp/5;monsterHearts.forEach((e,i)=>{const filling=Math.max(0,Math.min(1,(b.enemyHp-i*monsterCapacity)/monsterCapacity));e.querySelector('.heart-filled').style.width=(filling*100)+'%';});heartsRoot.setAttribute('aria-label',`Здоровье ${Math.ceil(b.hp)} из ${maxHealth(p)}`);
 $('boss-crown').style.display='none'; // Crown is attached to each boss animation frame.
 const rest=b.phase==='rest';if(rest && !$('battle-message').textContent.includes('Котёнок'))$('battle-message').textContent='Котёнок отдыхает дома';$('surface').classList.toggle('resting',rest);$('hero-art').classList.toggle('resting-hero',rest);
 const status=$('status');status.classList.toggle('rest',rest);status.textContent=p.autoBattle?'АВТОБОЙ':'РУЧНОЙ БОЙ';status.setAttribute('aria-pressed',String(p.autoBattle));status.setAttribute('aria-label',p.autoBattle?'Автобой: включить ручной бой':'Ручной бой: включить автобой');
 $('manual-hit').hidden=p.autoBattle;$('manual-hit').disabled=b.phase!=='fight'||manualWindup!==null||b.heroTimer<.95;
 const info=[['sword',p.sword,swordCost(p.sword),'Меч','Урон '+heroDamage(p)+' → '+(heroDamage(p)+3)],['armor',p.armor,armorCost(p.armor),'Броня','HP '+maxHealth(p)+' → '+(maxHealth(p)+14)],['fish',p.fishLevel,fishCost(p.fishLevel),'Удочка','Более ценный улов'],['home',p.home,homeCost(p.home),'Домик','Быстрее отдых']];
 for(const [kind,lev,cost,label,description] of info){const id=kind==='home'?'home':kind;$(id+'-lvl').textContent='ур. '+lev;$(id+'-cost').textContent='🪙 '+fmt(cost);if(kind==='sword'||kind==='armor')$(kind+'-stat').textContent=description;const btn=$('buy-'+kind);btn.classList.toggle('can-buy',p.gold>=cost);btn.classList.toggle('cant-buy',p.gold<cost);btn.setAttribute('aria-label',`${label}: улучшить за ${cost} монет`);}
 syncEquipment();
 $('bucket-indicator').textContent=bucketVolume(p)+'/'+bucketCapacity(p);$('fish-status').textContent=bucketVolume(p)>=bucketCapacity(p)?'Ведро заполнено · рыбалка ждёт':`Поклёвка через ${fmtTimer(p.nextCatchMs)}`;
 const visiting=p.merchantPhase==='waiting';$('merchant').classList.toggle('visible',visiting);$('merchant-visit').textContent=fmtTimer(p.merchantMs);$('merchant-status').textContent=visiting?'Торговец приехал!':'Торговец через '+fmtTimer(p.merchantMs);
}
function onUpgrade(kind){const result=upgrade(p,kind);if(!result.ok){notify(result.reason==='max'?'Ведро максимально улучшено':'Не хватает '+fmt((result.cost||0)-p.gold)+' монет');return;}
 // Deliberately DO NOT recreate the battle: hero HP is persistent across room changes and upgrades.
 notify(({sword:'Меч стал сильнее!',armor:'Максимальное HP выросло, но здоровье не восстановилось',fish:'Теперь можно поймать рыбу подороже!',home:'Дом стал уютнее · отдых быстрее'})[kind]);
 if(kind==='sword'||kind==='armor')pulse($('hero-art'),'upgrade-glow',750);
 // If farming and the upgrade can help, attack the blocked level after current fight. No free healing.
 if(kind==='bucket'){p.catchPlan=[];planFishing(p);}save();render();
}
const QUESTS=[{id:0,name:'Победи 5 слизней',field:'killedSlimes',target:5,reward:60},{id:1,name:'Продай 3 рыбы',field:'soldFish',target:3,reward:45},{id:2,name:'Улучши меч 2 раза',field:'spentSword',target:2,reward:40},{id:3,name:'Продай 5 щук',field:'soldPike',target:5,reward:150}];
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
  para(mode==='shop'?'У торговца снаряжением покупаем новые SVG-предметы. Урон меча зависит от выбранного оружия.':'Выбирай любое приобретённое снаряжение. Меняется на котёнке сразу во всех трёх атаках.');
  const line=(caption,items,category)=>{
    const title=document.createElement('div');title.className='section-title';title.textContent=caption;content.append(title);
    for(const item of items){const own=category==='weapon'?p.ownedWeapons:p.ownedArmors;
      if(mode==='inventory'&&!own.includes(item.id))continue;
      const row=document.createElement('div');row.className='shop-item';const im=document.createElement('img');if(item.svg)im.src=item.svg;else {im.src='art/hero/bare-kitten.svg';im.alt='Без брони';}
      const main=document.createElement('main'),label=document.createElement('b');label.textContent=item.name;const stats=document.createElement('small');stats.textContent=category==='weapon'?'Урон +'+item.damage:'Здоровье +'+item.health;main.append(label,stats);
      const button=document.createElement('button');const equipped=(category==='weapon'?p.weapon:p.equippedArmor)===item.id;const has=own.includes(item.id);button.textContent=equipped?'Надето':has?'Надеть':'🪙 '+fmt(item.price);button.disabled=equipped;
      button.addEventListener('click',()=>{if(!has){const r=buyEquipment(p,category,item.id);if(!r.ok){notify('Не хватает монет');return;}notify('Куплено: '+item.name);}else{equipEquipment(p,category,item.id,b);notify('Надето: '+item.name);}save();openModal(mode==='shop'?'Магазин':'Инвентарь',mode);});
      row.append(im,main,button);content.append(row);
    }
  };
  line('Мечи',WEAPONS,'weapon');line('Броня',ARMORS,'armor');
  if(mode==='shop'){para('Качество меча и брони улучшается кнопками внизу экрана независимо от внешнего вида предметов.');action('Открыть инвентарь',()=>openModal('Инвентарь','inventory'));}
  else action('Открыть магазин',()=>openModal('Магазин','shop'));
 }else if(mode==='quests'){
  for(const q of QUESTS){const done=p.questClaimed.includes(q.id),count=p[q.field];const row=document.createElement('div');row.className='quest-row';const text=document.createElement('span');text.textContent=q.name;const mini=document.createElement('small');mini.textContent=Math.min(q.target,count)+'/'+q.target+' · награда '+q.reward+' 🪙';text.append(mini);const btn=document.createElement('button');btn.textContent=done?'✓':'+ 🪙';btn.disabled=done||count<q.target;btn.addEventListener('click',()=>{if(p.questClaimed.includes(q.id)||p[q.field]<q.target)return;p.questClaimed.push(q.id);p.gold+=q.reward;save();openModal('Задания','quests');notify('Награда за задание: +'+q.reward+' монет')});row.append(text,btn);content.append(row);}
  para('В заданиях учитываются реальные победы, улучшения и продажи, но не офлайн-время.');
 }else if(mode==='offline'){
  para('Котёнок заработал, пока тебя не было: +'+fmt(p.pendingOffline)+' монет.');para('Офлайн-заработок ограничен стоимостью ближайшего улучшения и не открывает новые комнаты.');action('Забрать '+fmt(p.pendingOffline)+' 🪙',()=>{p.gold+=p.pendingOffline;p.pendingOffline=0;save();closeModal();notify('Офлайн-награда получена!')});
 }else if(mode==='reset'){
  para('Это удалит монеты, улов, улучшения и весь прогресс.');action('Сбросить игру',()=>{p=freshProgress();manualWindup=null;cancelAttackPose();b=startFight(p);planFishing(p);save();closeModal();render();notify('Прогресс сброшен')});
 }else para(text);
 if(mode!=='offline')action('Закрыть',closeModal,'secondary');
 if(!$('modal').open)$('modal').showModal();render();
}
function closeModal(){const mode=modalType;modalType='';if($('modal').open)$('modal').close();last=performance.now();render()}
function battleEvents(events){for(const ev of events){
 if(ev.kind==='hero-hit'){contactAttack();playEnemyFrames('hurt');}
 if(ev.kind==='enemy-hit'){pulse($('hero-art'),'battle-hurt',260);enemyAttack(ev.move);}
 if(ev.kind==='win'){coinFx(ev.gold);say(`Победа! +${ev.gold} монет`);pulse($('enemy-holder'),'dead',660);save();if(ev.level===100&&ev.firstClear)setTimeout(()=>openModal('100 волн пройдено!','info','Храбролап прошёл все сто волн! Можно продолжать сражаться и собирать монеты.'),600);}
 if(ev.kind==='defeat'){syncHeroPose();say('Котёнок возвращается домой отдохнуть');save();}
 if(ev.kind==='spawn'&&ev.afterRest){cancelAttackPose();say('Мы справимся!');pulse($('surface'),'wake-up',1800);}
}}
function fishEvents(events){for(const e of events){if(e.kind==='catch'){playFishCatch();notify('Рыцарь поймал: '+e.fish.species+' · '+e.fish.weight+' кг');save();}if(e.kind==='bucket-full'){notify('Ведро заполнено! Ждём торговца.');save();}}}
function merchantEvents(events){for(const e of events){if(e.kind==='merchant-arrive'){notify('Хей, ребята привет, есть что-то для меня?');save();}if(e.kind==='merchant-leave'){notify('Скоро вернусь!');save();}}}
function frame(now){const dt=Math.min(.12,Math.max(0,(now-last)/1000));last=now;
 if(!document.hidden){
  // Prepares the swing in the last 350 ms before the real damage tick.
  if(p.autoBattle && b.phase==='fight' && !attackPrepared && b.heroTimer < .95 && b.heroTimer+dt >= .95) prepareAttack();
  if(manualWindup!==null)manualWindup=Math.max(0,manualWindup-dt);
  const manualReady=!p.autoBattle&&manualWindup===0;
  const events=stepFight(p,b,dt,p.autoBattle||manualReady);
  if(events.some(e=>['hero-hit','defeat','spawn'].includes(e.kind)))manualWindup=null;
  battleEvents(events);fishEvents(stepFishing(p,dt*1000));merchantEvents(stepMerchant(p,dt*1000,modalType==='trade'));updateMerchantAnimation(now);
  // HP and phase changes must appear on the same frame as the combat event.
  if(events.length||now-lastSave>250){render();lastSave=now;}
  if(now-lastAutosave>5000){save();lastAutosave=now;}
 }
 requestAnimationFrame(frame);
}
$('status').addEventListener('click',()=>{p.autoBattle=!p.autoBattle;manualWindup=null;cancelAttackPose();say(p.autoBattle?'Автобой включён':'Нажми «Удар», чтобы атаковать');render();save();});
$('manual-hit').addEventListener('click',()=>{if(p.autoBattle||b.phase!=='fight'||manualWindup!==null||b.heroTimer<.95)return;manualWindup=.35;prepareAttack();render();});
for(const kind of ['sword','armor','fish','home'])$('buy-'+kind).addEventListener('click',()=>onUpgrade(kind));
$('bucket').addEventListener('click',()=>openModal('Ведро рыцаря','bucket'));
$('merchant').addEventListener('click',()=>openModal('Серый кот-торговец','trade'));
$('quests').addEventListener('click',()=>openModal('Задания','quests'));
$('inventory').addEventListener('click',()=>openModal('Инвентарь','inventory'));
$('shop').addEventListener('click',()=>openModal('Магазин','shop'));
$('mini-shop').addEventListener('click',()=>openModal('Магазин','shop'));
$('help').addEventListener('click',()=>openModal('Как играть','info','Храбролап автоматически бьётся с монстрами и приносит монеты. Кнопка «Автобой» переключает ручной бой: нажимай «Удар» для каждой атаки. Противник продолжает атаковать в обоих режимах. После победы здоровье НЕ восстанавливается. После поражения он отдыхает в домике и лечится. Рыбак сам ловит разную рыбу и складывает её в ведро. Каждые 5 минут приезжает торговец и ждёт 15 секунд. Нажми на торговца, чтобы продать улов. Рыбалка и визиты торговца полностью останавливаются, пока игра закрыта. Офлайн котёнок приносит только ограниченное количество монет.'));
$('reset').addEventListener('click',()=>openModal('Начать заново?','reset'));
$('modal-x').addEventListener('click',closeModal);
$('modal').addEventListener('cancel',e=>{e.preventDefault();if(modalType!=='offline')closeModal()});
function visibility(){if(document.hidden){manualWindup=null;cancelAttackPose();stopEnemyAnimation();save();}else{cancelAttackPose();if(p.lastSeen){const elapsed=Date.now()-p.lastSeen;if(elapsed>20000){const award=offlineReward(p,elapsed);p.pendingOffline=Math.min(p.pendingOffline+award,Math.floor(Math.min(swordCost(p.sword),armorCost(p.armor))*1.1));if(award>0)setTimeout(()=>{if(!$('modal').open)openModal('Награда за отсутствие','offline')},250);}}last=performance.now();save();}}
document.addEventListener('visibilitychange',visibility);
window.addEventListener('pagehide',save);
setInterval(()=>{if(!document.hidden)save()},3000);
cancelAttackPose();render();save();requestAnimationFrame(frame);
if(p.pendingOffline>0)setTimeout(()=>openModal('Награда за отсутствие','offline'),500);
