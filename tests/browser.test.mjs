// Real Chromium: live HTTP page, saved-state fixtures, image decoding and UI actions.
// Сервер: python3 -m http.server 8080 --bind 127.0.0.1
import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import * as c from '../game-core.mjs';
import {ATTACKS} from '../hero-poses.mjs';
const contacts=ATTACKS.map(a=>{const [x,y,r]=a.frames[3];return `translate(${x} ${y}) rotate(${r})`;});
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
 await page.addInitScript(({key,raw})=>{if(!sessionStorage.getItem('qa-seeded')){localStorage.setItem(key,JSON.stringify(raw));sessionStorage.setItem('qa-seeded','1');}},{key,raw:{...progress,lastSeen:0,...(battleState?{battleState}:{})}});
 await page.goto(base);await page.locator('#hero-rig').waitFor();
 await page.evaluate(()=>{window.qaObserved={attacks:[],transforms:[],hurts:0};new MutationObserver(records=>{
  for(const r of records){const t=r.target;if(t.id==='weapon-slot')window.qaObserved.transforms.push(t.getAttribute('transform'));
   if(t.id==='enemy-art'){const src=t.getAttribute('src');if(src.includes('/attack/')&&!src.endsWith('/01.svg'))window.qaObserved.attacks.push(src);if(src.includes('/hurt/'))window.qaObserved.hurts++;}}
 }).observe(document.querySelector('#game'),{subtree:true,attributes:true,attributeFilter:['class','transform','src']});});
 return page;
}
async function saved(page){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);}
async function shot(page,name){await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode().catch(()=>{}))));await page.screenshot({path:'qa/screenshots/'+name+'.png'});}
test('мобильный запуск, цикл трёх атак, ресурсы и отсутствие JS-ошибок',async()=>{
 const page=await pageFor();await page.clock.runFor(10000);
 const observed=await page.evaluate(()=>window.qaObserved);
 for(const transform of contacts)assert.ok(observed.transforms.includes(transform),transform);
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
test('каждый из трёх SVG-мечей остаётся единственным оружием во всех трёх атаках',async()=>{
 for(const weapon of c.WEAPONS){
  const p=c.freshProgress();Object.assign(p,{ownedWeapons:c.WEAPONS.map(w=>w.id),weapon:weapon.id,armor:100});
  const page=await pageFor(p);await page.clock.runFor(10000);
  const seen=await page.evaluate(()=>window.qaObserved.transforms);
  for(const transform of contacts)assert.ok(seen.includes(transform),weapon.id+' '+transform);
  assert.equal(await page.locator('#hero-weapon').count(),1);
  assert.equal(await page.locator('#hero-weapon').getAttribute('href'),weapon.svg);
  await shot(page,'fixture-weapon-'+weapon.id);
 }
});
test('восемь монстров атакуют/получают урон, короны всех десяти боссов',async()=>{
 for(let wave=1;wave<=8;wave++){
  const p=c.freshProgress();Object.assign(p,{room:wave,best:wave-1,armor:100});const page=await pageFor(p);
  await page.clock.runFor(2700);const seen=await page.evaluate(()=>window.qaObserved);
  assert.ok(seen.attacks.some(src=>src.includes('/'+c.monsterForWave(wave).type+'/normal/attack/')));assert.ok(seen.hurts>0);
  assert.equal(await page.locator('#enemy-holder').getAttribute('data-monster'),c.monsterForWave(wave).type);
  await shot(page,'fixture-monster-'+c.monsterForWave(wave).type);
 }
 for(let wave=10;wave<=100;wave+=10){
  const p=c.freshProgress();Object.assign(p,{room:wave,best:wave-1});const page=await pageFor(p);
  const src=await page.locator('#enemy-art').getAttribute('src');assert.match(src,/\/boss\//);
  const svg=await (await page.request.get(new URL(src,base).href)).text();assert.ok((svg.match(/data:image\/svg\+xml;base64,/g)||[]).length>=2,'boss model and attached crown');
  assert.equal(await page.locator('#boss-crown').isVisible(),false);
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
 const page=await pageFor(p,b);await page.clock.runFor(250);
 assert.ok((await page.locator('#surface').getAttribute('class')).includes('resting'));await shot(page,'fixture-rest');
 await page.clock.runFor(7200);assert.ok(parseInt(await page.locator('#hero-hp-num').textContent(),10)>0);
 assert.equal((await page.locator('#surface').getAttribute('class')).includes('resting'),false);await shot(page,'fixture-respawn');
 assert.deepEqual(errors,[]);
});

test('ручной бой: смена текста, один удар, три атаки, reload и возврат автобоя',async()=>{
 const p=c.freshProgress();p.armor=100;p.room=50;p.best=49;
 const page=await pageFor(p);
 await page.locator('#status').click();
 assert.equal(await page.locator('#status').textContent(),'РУЧНОЙ БОЙ');
 const before=await page.locator('#enemy-hp-num').textContent();
 await page.clock.runFor(3000);
 assert.equal(await page.locator('#enemy-hp-num').textContent(),before);
 for(let i=0;i<3;i++){
  const old=Number((await page.locator('#enemy-hp-num').textContent()).split('/')[0]);
  await page.locator('#manual-hit').click();await page.clock.runFor(500);
  const now=Number((await page.locator('#enemy-hp-num').textContent()).split('/')[0]);
  assert.equal(old-now,c.heroDamage(p));
  await page.clock.runFor(1200);
  assert.equal(Number((await page.locator('#enemy-hp-num').textContent()).split('/')[0]),now);
 }
 const seen=await page.evaluate(()=>window.qaObserved.transforms);
 for(const contact of contacts)assert.ok(seen.includes(contact));
 await shot(page,'manual-mobile');await page.reload();await page.locator('#hero-rig').waitFor();
 assert.equal(await page.locator('#status').textContent(),'РУЧНОЙ БОЙ');
 await page.locator('#status').click();assert.equal(await page.locator('#status').textContent(),'АВТОБОЙ');
 assert.equal(await page.locator('#manual-hit').isVisible(),false);
 const hp=await page.locator('#enemy-hp-num').textContent();await page.clock.runFor(1600);
 assert.notEqual(await page.locator('#enemy-hp-num').textContent(),hp);
});

test('сцена на 390 и 320: ведро слева от рыцаря, рыбалка и 18 поз вправо',async()=>{
 for(const width of [390,320]){
  const p=c.freshProgress();c.planFishing(p,()=>.3);p.nextCatchMs=100;
  const page=await pageFor(p);await page.setViewportSize({width,height:width===320?700:844});
  await page.clock.runFor(550);
  const surface=await page.locator('#surface').boundingBox(),bucket=await page.locator('#bucket').boundingBox();
  assert.ok(bucket.x+bucket.width<surface.x+surface.width*.24);
  assert.ok(bucket.y+bucket.height>surface.y+surface.height*.9);
  assert.equal(await page.locator('#fishing-animation').getAttribute('class'),'fishing-anim-overlay playing');
  await shot(page,'fishing-'+width);
  const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
  assert.ok(dimensions.scroll<=dimensions.width);
 }
 const page=await pageFor();
 for(const attack of ATTACKS)for(let frame=1;frame<=6;frame++){
  const text=await (await page.request.get(base+`animations/hero/${attack.id}/${String(frame).padStart(2,'0')}.svg`)).text();
  assert.match(text,/data-facing="right"/);
 }
 assert.deepEqual(errors,[]);
});
