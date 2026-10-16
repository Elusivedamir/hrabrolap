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
before(async()=>{await fs.mkdir('qa/screenshots',{recursive:true});browser=await chromium.launch({headless:true});});
after(async()=>{for(const ctx of contexts)await ctx.close();await browser?.close();await fs.writeFile('qa/browser-errors.json',JSON.stringify(errors,null,2));});
async function pageFor(progress=c.freshProgress(),battleState){
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
