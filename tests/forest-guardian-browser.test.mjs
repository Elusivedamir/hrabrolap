import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import * as core from '../game-core.mjs';
import {forestFrameUrl} from '../forest-guardian-rig.mjs';

const base=process.env.HRABROLAP_BASE_URL||'http://127.0.0.1:8080/';
const key='hrabrolap-v0.2-save',out='qa/forest-manual';
const paths=['attack','hurt'].flatMap(kind=>Array.from({length:6},(_,i)=>forestFrameUrl(kind,i).replace('assets/costumes/','assets/clean/')));
const errors=[];let browser;
before(async()=>{
 await fs.mkdir(out,{recursive:true});
 browser=await chromium.launch({headless:true,...(process.env.HRABROLAP_CHROMIUM_EXECUTABLE?{
  executablePath:process.env.HRABROLAP_CHROMIUM_EXECUTABLE,
  args:['--no-zygote','--disable-gpu','--disable-software-rasterizer']
 }:{})});
});
after(async()=>{await browser?.close();await fs.writeFile(out+'/browser-errors.json',JSON.stringify(errors,null,2)+'\n');});
async function pageFor(progress,battle){
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
 await page.clock.install({time:new Date('2026-10-17T07:00:00Z')});
 await page.clock.pauseAt(new Date('2026-10-17T07:01:00Z'));
 await page.addInitScript(({key,raw})=>{
  Math.random=()=>.99;
  if(!sessionStorage.getItem('forest-manual-seeded')){
   localStorage.setItem(key,JSON.stringify(raw));sessionStorage.setItem('forest-manual-seeded','1');
  }
 },{key,raw:{...progress,lastSeen:0,...(battle?{battleState:battle}:{})}});
 await page.goto(base);await page.locator('#hero-rig').waitFor();
 return page;
}
const saved=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
const row=page=>page.locator('.shop-item').filter({hasText:'Лесной страж'});
async function preload(page){
 return page.evaluate(async paths=>Promise.all(paths.map(async url=>{
  const img=new Image();img.src=url;await img.decode();
  return {url,width:img.naturalWidth,height:img.naturalHeight};
 })),paths);
}
test('50-coin shop purchase, inventory equipment, real reload and removal',async()=>{
 const p=core.freshProgress();p.gold=50;
 const page=await pageFor(p);await page.locator('#shop').click();
 assert.equal(await row(page).count(),1);assert.match(await row(page).textContent(),/50/);
 assert.equal(await row(page).locator('img').getAttribute('src'),paths[0]);
 await row(page).scrollIntoViewIfNeeded();await page.screenshot({path:out+'/shop-mobile.png'});
 await row(page).getByRole('button',{name:'Купить',exact:true}).click();
 let state=await saved(page);assert.equal(state.gold,0);assert.ok(state.ownedArmors.includes('forest_guardian'));
 await page.getByRole('button',{name:'Открыть инвентарь',exact:true}).click();
 await row(page).getByRole('button',{name:'Надеть',exact:true}).click();
 await page.screenshot({path:out+'/inventory-mobile.png'});await page.locator('#modal-x').click();
 assert.equal(await page.locator('#hero-body').getAttribute('href'),paths[0]);
 assert.equal(await page.locator('#hero-body').getAttribute('data-costume'),'forest_guardian');
 for(const id of ['hero-armor','forest-armor','forest-front'])assert.equal(await page.locator('#'+id).isVisible(),false,id);
 await preload(page);await page.screenshot({path:out+'/equipped-mobile.png'});
 await page.reload();await page.locator('#hero-rig').waitFor();
 state=await saved(page);assert.equal(state.equippedArmor,'forest_guardian');assert.equal(state.gold,0);
 assert.equal(await page.locator('#hero-body').getAttribute('href'),paths[0]);
 await page.locator('#inventory').click();await page.locator('.shop-item').filter({hasText:'Без брони'}).getByRole('button').click();
 await page.locator('#modal-x').click();
 assert.equal(await page.locator('#hero-body').getAttribute('href'),'assets/clean/canonical/attack_01.png');
 assert.equal((await saved(page)).gold,0);assert.deepEqual(errors,[]);
 await page.context().close();
});
test('49 coins cannot purchase the costume',async()=>{
 const p=core.freshProgress();p.gold=49;const page=await pageFor(p);
 await page.locator('#shop').click();await row(page).getByRole('button',{name:'Купить',exact:true}).click();
 assert.equal((await saved(page)).gold,49);assert.equal((await saved(page)).ownedArmors.includes('forest_guardian'),false);
 assert.match(await page.locator('#toast').textContent(),/Не хватает/);await page.context().close();
});
test('live battle plays all 6 attack and 6 hurt frames with one body and one separate sword',async()=>{
 const p=core.freshProgress();Object.assign(p,{room:50,best:49,armor:100,autoUnlocked:true,autoEnabled:true,
  ownedArmors:['none','forest_guardian'],equippedArmor:'forest_guardian'});
 const battle=core.startFight(p);battle.enemyTimer=.3;
 const page=await pageFor(p,battle);const sizes=await preload(page);
 assert.equal(sizes.length,12);for(const s of sizes)assert.equal(s.width/s.height,279/370);
 await page.evaluate(()=>{
  window.forestObserved=[];
  new MutationObserver(()=>window.forestObserved.push(document.querySelector('#hero-body').getAttribute('href')))
   .observe(document.querySelector('#hero-body'),{attributes:true,attributeFilter:['href']});
 });
 const captured=new Set();
 for(let tick=0;tick<240&&captured.size<12;tick++){
  await page.clock.runFor(50);
  const source=await page.locator('#hero-body').getAttribute('href');
  if(paths.includes(source)&&!captured.has(source)){
   captured.add(source);const name=source.split('/').at(-1);
   await page.locator('#hero-art').screenshot({path:out+'/'+name});
   if(name==='attack_04.png'||name==='hurt_04.png')await page.screenshot({path:out+'/game-'+name});
  }
 }
 const seen=await page.evaluate(()=>window.forestObserved);
 for(const path of paths){assert.ok(seen.includes(path),'live animation missed '+path);assert.ok(captured.has(path),'screenshot missed '+path);}
 assert.equal(await page.locator('#hero-body').count(),1);assert.equal(await page.locator('#hero-weapon').count(),1);
 assert.equal(await page.locator('#hero-weapon').getAttribute('href'),'art/weapons/iron.svg');
 assert.equal(await page.locator('#hero-armor').isVisible(),false);
 for(const id of ['forest-armor','forest-front'])assert.equal(await page.locator('#'+id).isVisible(),false);
 assert.ok(seen.every(path=>paths.includes(path)),'a bare or obsolete frame leaked into the equipped animation');
 await fs.writeFile(out+'/browser-results.json',JSON.stringify({browser:browser.version(),viewport:{width:390,height:844},
  price:50,shop:true,inventory:true,reload:true,removal:true,insufficientGold:true,liveFrames:[...captured],sizes,errors},null,2)+'\n');
 assert.deepEqual(errors,[]);await page.context().close();
});
test('preview and SVG atelier use the same complete frames without layering another cat',async()=>{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.goto(new URL('forest-guardian-preview.html',base).href);
 assert.equal(await page.locator('.cell svg image').count(),12);
 const hrefs=await page.locator('.cell svg image').evaluateAll(images=>images.map(im=>im.getAttribute('href')));
 assert.deepEqual(hrefs,paths);await preload(page);
 await page.locator('#toggle').click();
 assert.ok((await page.locator('.cell svg image').first().getAttribute('href')).startsWith('assets/clean/canonical/'));
 await page.goto(new URL('equipment-preview.html',base).href);
 await page.locator('#armor').selectOption('forest_guardian');
 for(const kind of ['slash','overhead','thrust','hurt']){
  await page.locator('#kind').selectOption(kind);
  for(let i=0;i<6;i++){
   const sprite=page.locator('.sprite').nth(i);const body=sprite.locator('image[data-costume="forest_guardian"]');
   assert.equal(await body.count(),1);assert.equal(await body.getAttribute('href'),forestFrameUrl(kind==='hurt'?'hurt':'attack',i).replace('assets/costumes/','assets/clean/'));
  }
 }
 await page.close();
});
