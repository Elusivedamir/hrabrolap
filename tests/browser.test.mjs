// Реальный Chromium. В сессии подготовки v0.8.1 НЕ ИСПОЛНЯЛСЯ.
// Сервер: python3 -m http.server 8080 --bind 127.0.0.1
import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import * as c from '../game-core.mjs';
const base=process.env.HRABROLAP_BASE_URL||'http://127.0.0.1:8080/';
const key='hrabrolap-v0.2-save';let browser;
const errors=[];const contexts=[];
before(async()=>{await fs.mkdir('qa/screenshots',{recursive:true});browser=await chromium.launch({headless:true,...(process.env.HRABROLAP_CHROMIUM_EXECUTABLE?{executablePath:process.env.HRABROLAP_CHROMIUM_EXECUTABLE,args:['--no-zygote','--single-process','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{})});});
after(async()=>{for(const ctx of contexts)await ctx.close();await browser?.close();await fs.writeFile('qa/browser-errors.json',JSON.stringify(errors,null,2));});
async function pageFor(progress=c.freshProgress(),battleState,options={}){
 // Existing 0.9.6 visual regression fixtures explicitly use unlocked auto mode.
 // v0.9.7 default gameplay stays MANUAL until auto is purchased for 1 coin.
 if(!options.manual)Object.assign(progress,{autoUnlocked:true,autoEnabled:true});
 const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});contexts.push(ctx);
 const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
 page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
 await page.clock.install({time:new Date('2026-10-15T17:00:00Z')});await page.clock.pauseAt(new Date('2026-10-15T17:01:00Z'));
 // Фикстура пишется один раз; последующие reload читают реальное сохранение игры.
 await page.addInitScript(()=>{Math.random=()=>.99;});
 await page.addInitScript(({key,raw})=>{if(!sessionStorage.getItem('qa-seeded')){localStorage.setItem(key,JSON.stringify(raw));sessionStorage.setItem('qa-seeded','1');}},{key,raw:{...progress,lastSeen:0,...(battleState?{battleState}:{})}});
 await page.goto(base);await page.locator('#hero-rig').waitFor();
 await page.evaluate(()=>{window.qaObserved={attacks:[],transforms:[],spriteFrames:[],hurts:0};new MutationObserver(records=>{
  for(const r of records){const t=r.target;if(t.id==='weapon-slot')window.qaObserved.transforms.push(t.getAttribute('transform'));if(t.id==='hero-body')window.qaObserved.spriteFrames.push(t.getAttribute('href'));
   if(t.id==='enemy-holder'){window.qaObserved.attacks.push(...[...t.classList].filter(x=>x.startsWith('attack-')));if(t.classList.contains('hurt'))window.qaObserved.hurts++;}}
 }).observe(document.querySelector('#game'),{subtree:true,attributes:true,attributeFilter:['class','transform','href']});});
 return page;
}
async function saved(page){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);}
async function shot(page,name){await page.screenshot({path:'qa/screenshots/'+name+'.png'});}
test('мобильный запуск, цикл трёх атак, ресурсы и отсутствие JS-ошибок',async()=>{
 const page=await pageFor();await page.clock.runFor(10000);
 const observed=await page.evaluate(()=>window.qaObserved);
 for(let i=1;i<=6;i++)assert.ok(observed.spriteFrames.includes('assets/canonical/attack_0'+i+'.png'),'missing original attack frame '+i);
 assert.ok(observed.hurts>0);assert.ok((await saved(page)).kills>0);
 const missing=await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src));assert.deepEqual(missing,[]);
 await shot(page,'normal-mobile');assert.deepEqual(errors,[]);
});
test('магазин, инвентарь, смена SVG и reload реального localStorage',async()=>{
 const p=c.freshProgress();p.gold=5000;const page=await pageFor(p);
 await page.locator('#shop').click();
 await page.locator('.shop-item').filter({hasText:'Лунный клинок'}).getByRole('button').click();
 await page.locator('.shop-item').filter({hasText:'Лесная броня'}).getByRole('button').click();
 await page.getByRole('button',{name:'Открыть инвентарь',exact:true}).click();
 await page.locator('.shop-item').filter({hasText:'Лунный клинок'}).getByRole('button').click();
 await page.locator('.shop-item').filter({hasText:'Лесная броня'}).getByRole('button').click();
 await shot(page,'fixture-inventory');await page.locator('#modal-x').click();
 assert.equal(await page.locator('#hero-weapon').getAttribute('href'),'art/weapons/moon.svg');
 assert.equal(await page.locator('#hero-armor').getAttribute('href'),'art/armor/leaf.svg');
 const before=await saved(page);await page.reload();await page.locator('#hero-rig').waitFor();
 const after=await saved(page);for(const k of ['gold','weapon','equippedArmor','room','best'])assert.equal(after[k],before[k],k);
 await page.locator('#inventory').click();await page.locator('.shop-item').filter({hasText:'Без брони'}).getByRole('button').click();
 const now=await saved(page);assert.ok(now.battleState.hp<=c.maxHealth(now));
});
test('каждый из десяти SVG-мечей остаётся единственным оружием во всех трёх атаках',async()=>{
 for(const weapon of c.WEAPONS){
  const p=c.freshProgress();Object.assign(p,{ownedWeapons:c.WEAPONS.map(w=>w.id),weapon:weapon.id,armor:100});
  const page=await pageFor(p);await page.clock.runFor(10000);
  const seen=await page.evaluate(()=>window.qaObserved.spriteFrames);
  for(let i=1;i<=6;i++)assert.ok(seen.includes('assets/canonical/attack_0'+i+'.png'),weapon.id+' frame '+i);
  assert.equal(await page.locator('#hero-weapon').count(),1);
  assert.equal(await page.locator('#hero-weapon').getAttribute('href'),weapon.svg);
  await shot(page,'fixture-weapon-'+weapon.id);
 }
});
test('восемь монстров атакуют/получают урон, короны всех десяти боссов',async()=>{
 for(let wave=1;wave<=8;wave++){
  const p=c.freshProgress();Object.assign(p,{room:wave,best:wave-1,armor:100});const page=await pageFor(p);
  await page.clock.runFor(2700);const seen=await page.evaluate(()=>window.qaObserved);
  const expected=c.monsterForWave(wave).type==='spider'?c.MONSTERS.find(x=>x.type==='skeleton'):c.monsterForWave(wave);
  assert.ok(seen.attacks.includes('attack-'+expected.move));assert.ok(seen.hurts>0);
  assert.equal(await page.locator('#enemy-holder').getAttribute('data-monster'),expected.type);
  await shot(page,'fixture-monster-'+expected.type);
 }
 for(let wave=10;wave<=100;wave+=10){
  const p=c.freshProgress();Object.assign(p,{room:wave,best:wave-1});const page=await pageFor(p);
  assert.equal(await page.locator('#boss-crown').isVisible(),true);
  if(wave===100)await shot(page,'fixture-boss-100');
 }
});
test('рыбалка, ведро 12→24 и ручная продажа торговцу',async()=>{
 const p=c.freshProgress();p.gold=1000;c.planFishing(p,()=>.3);p.nextCatchMs=100;p.merchantMs=1000;
 const page=await pageFor(p);await page.clock.runFor(1200);
 assert.ok((await saved(page)).caughtTotal>0);assert.equal(await page.locator('#merchant').isVisible(),true);
 await page.locator('#bucket').click();await page.getByRole('button',{name:/Улучшить ведро/}).click();assert.equal((await saved(page)).bucketLevel,1);
 await page.locator('#modal-x').click();await page.locator('#merchant').click();await shot(page,'fixture-trade');
 await page.clock.runFor(20000);assert.equal((await saved(page)).merchantPhase,'waiting');
 await page.getByRole('button',{name:/Продать всё/}).click();const raw=await saved(page);
 assert.ok(raw.soldFish>0);assert.equal(raw.fishBucket.length,0);assert.equal(raw.merchantPhase,'away');
});
test('поражение, дом и возрождение без покупки лечения',async()=>{
 const p=c.freshProgress(),b=c.startFight(p);b.hp=1;b.enemyTimer=2.39;
 const page=await pageFor(p,b);for(let i=0;i<4;i++)await page.clock.runFor(500);
 assert.equal((await saved(page)).battleState.phase,'rest','defeat reaches rest phase');
 assert.ok((await page.locator('#surface').getAttribute('class')).includes('resting'), 'UI must show resting state after defeat');await shot(page,'fixture-rest');
 await page.clock.runFor(7200);assert.ok(parseInt(await page.locator('#hero-hp-num').textContent(),10)>0);
 assert.equal((await page.locator('#surface').getAttribute('class')).includes('resting'),false);await shot(page,'fixture-respawn');
 assert.deepEqual(errors,[]);
});

test('паутина в инвентаре, покупка брони за 300 и 6 паутин, экипировка и reload',async()=>{
 const p=c.freshProgress();p.gold=300;p.materials.web=6;
 const page=await pageFor(p);
 await page.locator('#shop').click();
 const web=page.locator('.shop-item').filter({hasText:'Паутинная броня'});
 assert.ok((await web.textContent()).includes('6/6'));
 await web.getByRole('button',{name:'Купить'}).click();
 let save=await saved(page);assert.equal(save.materials.web,0);assert.equal(save.gold,0);assert.ok(save.ownedArmors.includes('web'));
 await page.getByRole('button',{name:'Открыть инвентарь'}).click();
 await page.locator('.shop-item').filter({hasText:'Паутинная броня'}).getByRole('button',{name:'Надеть'}).click();
 assert.equal(await page.locator('#hero-armor').getAttribute('href'),'art/armor/web.svg');
 await shot(page,'fixture-web-armor');
 await page.reload();save=await saved(page);
 assert.equal(save.equippedArmor,'web');assert.equal(save.materials.web,0);
 assert.equal(await page.locator('#hero-armor').getAttribute('href'),'art/armor/web.svg');
});

test('шестикадровое получение урона двигает SVG-броню и меч без замены кота',async()=>{
 const p=c.freshProgress();p.armor=150;p.ownedArmors.push('web');p.equippedArmor='web';
 p.ownedWeapons.push('fishbone');p.weapon='fishbone';
 const b=c.startFight(p);b.enemyTimer=2.39;
 const page=await pageFor(p,b);
 await page.evaluate(()=>{window.hurtFrames=[];
  new MutationObserver(()=>{const n=document.querySelector('#hero-art').dataset.hurtFrame;if(n)window.hurtFrames.push(+n);})
   .observe(document.querySelector('#hero-art'),{attributes:true,attributeFilter:['data-hurt-frame']});
 });
 await page.clock.runFor(900);
 const frames=await page.evaluate(()=>window.hurtFrames);
 for(let i=1;i<=6;i++)assert.ok(frames.includes(i),'missing hit frame '+i+': '+frames.join(','));
 assert.match(await page.locator('#hero-body').getAttribute('href'),/^assets\/canonical\/(attack|hurt)_0[1-6]\.png$/);
 assert.equal(await page.locator('#hero-armor').getAttribute('href'),'art/armor/web.svg');
 assert.equal(await page.locator('#hero-weapon').getAttribute('href'),'art/weapons/fishbone.svg');
 assert.match(await page.locator('#armor-slot').getAttribute('transform'),/^translate\(/);
 await shot(page,'rig-hurt-frame-6');
});
test('мобильное SVG-ателье показывает 6 кадров и переключает 10 мечей и 10 видов брони',async()=>{
 const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 contexts.push(ctx);
 const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(new URL('equipment-preview.html',base).href);
 await page.locator('.sprite').first().waitFor();
 assert.equal(await page.locator('.sprite').count(),6);
 assert.equal(await page.locator('#weapon option').count(),10);
 assert.equal(await page.locator('#armor option').count(),11);
 await page.locator('#armor').selectOption('web');
 await page.locator('#weapon').selectOption('spiderleg');
 await page.locator('#kind').selectOption('hurt');
 assert.equal(await page.locator('.sprite').count(),6);
 assert.equal(await page.locator('#big image').count(),3);
 await shot(page,'equipment-preview-hurt-web-spiderleg');
 await page.locator('#kind').selectOption('overhead');
 await page.locator('#armor').selectOption('moon_armor');
 await page.locator('#weapon').selectOption('dusk');
 await page.locator('.sprite').nth(3).click();
 assert.equal(await page.locator('#current-frame').textContent(),'4/6');
 await shot(page,'equipment-preview-attack-moon-dusk');
 const broken=await page.locator('svg image').evaluateAll(images=>images.filter(im=>!im.getAttribute('href')).map(im=>im.id||'missing'));
 assert.deepEqual(broken,[]);
});

test('новое ведро отрисовывается слева и меняет состояние по числу рыб и улучшению',async()=>{
 const p=c.freshProgress();p.fishBucket=[{species:'Плотва',weight:0.25,length:21,slots:1,price:5,waitMs:1500}];
 const page=await pageFor(p);
 const bucket=page.locator('#bucket');
 assert.equal(await page.locator('#bucket-graphic').getAttribute('src'),'art/scenery/bucket-low.svg');
 const coords=await page.evaluate(()=>({bucket:document.querySelector('#bucket').getBoundingClientRect().left,scene:document.querySelector('#surface').getBoundingClientRect().left,width:document.querySelector('#surface').getBoundingClientRect().width}));
 assert.ok(coords.bucket<coords.scene+coords.width*.21,'bucket should be to the left of fisherman');
 await shot(page,'fixture-bucket-left');
});
test('кот отдыхает в существующем доме без добавления котёнка в подземелье',async()=>{
 const p=c.freshProgress(),b=c.startFight(p);b.hp=1;b.enemyTimer=2.39;
 const page=await pageFor(p,b);
 await page.clock.runFor(1800);
 assert.ok((await page.locator('#surface').getAttribute('class')).includes('resting'));
 assert.equal(await page.locator('#rest-sleep-sprite').isVisible(),true);
 assert.equal(await page.locator('#hero-art').evaluate(el=>getComputedStyle(el).opacity),'0');
 assert.match(await page.locator('#rest-sleep-sprite').getAttribute('src'),/^assets\/rest\/sleep_0[1-6]\.png$/);
 await shot(page,'fixture-rest-inside-existing-house');
});

test('новый игрок вручную атакует, покупает автобой за 1 монету и переключает его',async()=>{
 const p=c.freshProgress();p.gold=1;
 const page=await pageFor(p,undefined,{manual:true});
 assert.match(await page.locator('#status').textContent(),/АВТОБОЙ.*1/);
 await page.clock.runFor(1600);
 const initial=Number((await page.locator('#enemy-hp-num').textContent()).split('/')[0]);
 await page.locator('#enemy-holder').click();
 const attacked=Number((await page.locator('#enemy-hp-num').textContent()).split('/')[0]);
 assert.ok(attacked<initial,'manual tap deals damage when cooldown ready');
 await page.locator('#status').click();
 let savedGame=await saved(page);
 assert.equal(savedGame.gold,0);assert.equal(savedGame.autoUnlocked,true);assert.equal(savedGame.autoEnabled,true);
 assert.match(await page.locator('#status').textContent(),/АВТОБОЙ 1\/с/);
 await page.locator('#status').click();
 savedGame=await saved(page);
 assert.equal(savedGame.autoEnabled,false);assert.equal(savedGame.gold,0);
 await page.locator('#status').click();
 await page.clock.runFor(9000);
 assert.ok((await saved(page)).kills>=1,'auto attacks after purchase');
 await shot(page,'fixture-manual-and-unlocked-auto');
});
test('монстр демонстрирует 6 последовательных кадров нанесения урона и сердечки вместо HP-полосы',async()=>{
 const p=c.freshProgress();const battle=c.startFight(p);
 battle.enemyTimer=2.38;battle.hp=65;
 const page=await pageFor(p,battle);
 await page.evaluate(()=>{
  window.monsterFrames=[];
  new MutationObserver(()=>{const n=document.querySelector('#enemy-holder').dataset.monsterFrame;
   if(n)window.monsterFrames.push(Number(n));}).observe(document.querySelector('#enemy-holder'),{attributes:true,attributeFilter:['data-monster-frame']});
 });
 await page.clock.runFor(650);
 const frames=await page.evaluate(()=>window.monsterFrames);
 for(let i=1;i<=6;i++)assert.ok(frames.includes(i),'monster frame '+i+' missing in '+frames);
 assert.equal(await page.locator('#enemy-hearts .heart-shell').count(),5);
 assert.equal(await page.locator('.legacy-monster-hp').evaluate(e=>getComputedStyle(e).display),'none');
 await shot(page,'fixture-monster-six-attack-heart-hp');
});
test('яд действует на монстра визуально и отражается в сохранении',async()=>{
 const p=c.freshProgress();p.enchantment='poison';p.armor=100;
 const b=c.startFight(p);b.heroTimer=1.29;
 const page=await pageFor(p,b);
 await page.clock.runFor(500);
 assert.equal(await page.locator('#enemy-holder').evaluate(el=>el.classList.contains('poisoned')),true);
 assert.equal((await saved(page)).enchantment,'poison');
 await shot(page,'fixture-poison-enchantment');
});
test('молния и вампиризм активируются без замены кат-сэмпла или оружия',async()=>{
 for(const effect of ['lightning','vampirism']){
  const p=c.freshProgress();p.enchantment=effect;
  const b=c.startFight(p);b.heroTimer=1.29;b.hp=40;
  const page=await pageFor(p,b);
  await page.clock.runFor(250);
  await page.evaluate(()=>window.dispatchEvent(new Event('pagehide'))); // force persisted state for assertion
  if(effect==='lightning')assert.equal((await saved(page)).lightningHits>0,true);
  else assert.equal((await saved(page)).vampireHeals>0,true);
  assert.equal(await page.locator('#hero-weapon').getAttribute('href'),'art/weapons/iron.svg');
 }
});

test('original 10-frame fisher keeps fish away from house and ends at bucket',async()=>{
 const p=c.freshProgress();
 p.catchPlan=[{species:'Плотва',slots:1,weight:.2,length:21,price:12,waitMs:200}];
 p.nextCatchMs=200;
 const page=await pageFor(p);
 await page.evaluate(()=>{
  window.fisherFrames=[];
  new MutationObserver(()=>{window.fisherFrames.push(document.querySelector('#fishing-animation')?.getAttribute('src'))})
   .observe(document.querySelector('#fishing-animation'),{attributes:true,attributeFilter:['src']});
 });
 await page.clock.runFor(1550);
 const frames=await page.evaluate(()=>window.fisherFrames);
 for(let i=1;i<=10;i++)
  assert.ok(frames.some(src=>src===`animations/fishing/${String(i).padStart(2,'0')}.svg`),'original fishing pose '+i+' missing');
 assert.ok(await page.locator('#fishing-animation').evaluate(img=>img.complete&&img.naturalWidth>0));
 assert.equal(await page.locator('.fishing-rig').evaluate(el=>getComputedStyle(el).display),'none');
 const bucket=await page.locator('#bucket').boundingBox();
 const scene=await page.locator('#surface').boundingBox();
 assert.ok(bucket.x<scene.x+scene.width*.21,'physical bucket must be left of fisherman');
 await shot(page,'original-knight-fishing-ten-frames');
});

test('автобой покупается за монету и двадцатый уровень показывает 2 атаки в секунду',async()=>{
 const p=c.freshProgress();p.gold=100000;p.autoUnlocked=true;p.autoEnabled=true;p.autoLevel=19;
 const page=await pageFor(p);
 assert.match(await page.locator('#status').textContent(),/АВТОБОЙ 1\/с/);
 assert.match(await page.locator('#attack-speed-lvl').textContent(),/19\/100/);
 const before=(await saved(page)).gold;
 await page.locator('#buy-attack-speed').click();
 const after=await saved(page);
 assert.equal(after.autoLevel,20);
 assert.equal(after.gold,before-c.autoUpgradeCost(19));
 assert.match(await page.locator('#status').textContent(),/АВТОБОЙ 2\/с/);
 await page.reload();
 assert.match(await page.locator('#status').textContent(),/АВТОБОЙ 2\/с/);
 await shot(page,'auto-level-20-two-hits');
});
test('карточка скорости атаки — пятая, на всю ширину снизу, автобой покупается отдельно сверху',async()=>{
 const p=c.freshProgress();p.gold=100;
 const page=await pageFor(p,undefined,{manual:true});
 assert.equal(await page.locator('.dungeon-title #status').count(),1);
 assert.equal(await page.locator('.dungeon-title #buy-attack-speed').count(),0);
 assert.equal(await page.locator('.upgrade-grid > .upgrade-card').count(),5);
 assert.equal(await page.locator('.upgrade-grid > #buy-attack-speed').count(),1);
 const cards=await page.locator('.upgrade-grid > .upgrade-card').evaluateAll(items=>items.map(e=>e.id));
 assert.deepEqual(cards,['buy-sword','buy-armor','buy-fish','buy-home','buy-attack-speed']);
 const grid=await page.locator('.upgrade-grid').boundingBox();
 const speed=await page.locator('#buy-attack-speed').boundingBox();
 const last=await page.locator('#buy-home').boundingBox();
 assert.ok(speed.y>=last.y+last.height-2,'speed upgrade must be below original four');
 assert.ok(speed.width>grid.width*.85,'speed upgrade must span both columns');
 assert.equal(await page.locator('#auto-upgrade').count(),0,'obsolete top auto speed button must not exist');
 await shot(page,'fifth-bottom-attack-speed-card');
});
test('скорость атаки отдельна от покупки автобоя и доступна сразу',async()=>{
 const p=c.freshProgress();p.gold=100;
 const page=await pageFor(p,undefined,{manual:true});
 assert.match(await page.locator('#status').textContent(),/АВТОБОЙ.*1/);
 assert.equal(await page.locator('#buy-attack-speed').isVisible(),true);
 assert.match(await page.locator('#attack-speed-lvl').textContent(),/0\/100/);
 await page.locator('#buy-attack-speed').click();
 const savedGame=await saved(page);
 assert.equal(savedGame.autoUnlocked,false,'speed upgrade must not unlock autobattle');
 assert.equal(savedGame.autoLevel,1);
 assert.equal(savedGame.gold,100-c.autoUpgradeCost(0));
 assert.match(await page.locator('#status').textContent(),/АВТОБОЙ.*1/);
 await shot(page,'attack-speed-independent-upgrade');
});
test('таймер поклёвки скрыт, состояние рыцаря видно, магазин стоит левее текста торговца',async()=>{
 const p=c.freshProgress();p.nextCatchMs=157000;
 const page=await pageFor(p);
 assert.equal(await page.locator('#fish-status').textContent(),'Рыцарь рыбачит');
 assert.ok(!(await page.locator('#surface').innerText()).includes('Поклёвка через'));
 const shop=await page.locator('#mini-shop').boundingBox();
 const merchant=await page.locator('#merchant-status').boundingBox();
 const surf=await page.locator('#surface').boundingBox();
 assert.ok(shop.x<merchant.x,'магазин должен стоять слева от надписи торговца');
 assert.ok(shop.y+shop.height>surf.y+surf.height*.73,'магазинчик должен касаться земли');
 await shot(page,'shop-grounded-and-no-bite-countdown');
});
test('при нулевых HP на монстре не должно быть пяти ярких сердец',async()=>{
 const p=c.freshProgress();const b=c.startFight(p);b.enemyHp=0;b.phase='transition';
 const page=await pageFor(p,b);
 const hearts=await page.locator('#enemy-hearts .heart-shell').evaluateAll(items=>items.map(el=>({
  fill:parseFloat(getComputedStyle(el.querySelector('.heart-filled')).width),
  dark:getComputedStyle(el.querySelector('.heart-unfilled')).filter
 })));
 assert.equal(hearts.length,5);
 assert.ok(hearts.every(x=>x.fill===0),'0 HP must yield no bright heart overlays');
 assert.ok(hearts.every(x=>x.dark.includes('grayscale(1)')),'unfilled hearts must stay gray');
 await shot(page,'enemy-empty-hearts');
});
test('рыба появляется на счётчике только после десятикадровой анимации укладки',async()=>{
 const p=c.freshProgress();p.catchPlan=[{species:'Плотва',slots:1,weight:.2,length:21,price:12,waitMs:200}];p.nextCatchMs=200;
 const page=await pageFor(p);
 await page.clock.runFor(320);
 assert.match(await page.locator('#bucket-indicator').textContent(),/0 рыб/);
 await page.clock.runFor(1650);
 assert.match(await page.locator('#bucket-indicator').textContent(),/1 рыб/);
 await shot(page,'fish-delivered-to-bucket');
});
