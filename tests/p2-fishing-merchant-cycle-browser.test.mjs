import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {freshProgress} from '../game-core.mjs';

const base=process.env.HRABROLAP_BASE_URL||'http://127.0.0.1:8080/';
const key='hrabrolap-v0.2-save';
const fish={species:'Плотва',slots:1,price:13,weight:.2,length:21,waitMs:250};
const saved=page=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);

async function launch(browser,seed,merchantTest=false){
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install({time:new Date('2026-10-18T10:00:00Z')});
 await page.clock.pauseAt(new Date('2026-10-18T10:01:00Z'));
 // Seed once per context; navigation/reload must use the saved state, never a reset fixture.
 await page.addInitScript(({key,seed})=>{
  if(!sessionStorage.getItem('qa-merchant-seeded')){
   localStorage.setItem(key,JSON.stringify({...seed,lastSeen:0}));
   sessionStorage.setItem('qa-merchant-seeded','1');
  }
 },{key,seed});
 await page.goto(base+(merchantTest?'?merchantTest=1':''),{waitUntil:'domcontentloaded'});
 await page.locator('#hero-rig').waitFor();
 return {context,page,errors};
}

test('P2: 10-frame fishing catches fish and trader sale survives reload without double gold',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const seed=freshProgress();
  seed.merchantPhase='waiting';seed.merchantMs=14000;
  seed.catchPlan=[fish];seed.nextCatchMs=250;
  const {context,page,errors}=await launch(browser,seed);
  try{
   await page.clock.runFor(1750);
   const caught=await saved(page);
   assert.equal(caught.caughtTotal,1);
   assert.equal(caught.fishBucket.length,1);
   assert.equal(await page.locator('#bucket-indicator').textContent(),'1 рыба');
   await page.locator('#bucket').click();
   assert.match(await page.locator('#modal-content').textContent(),/Улов: 1 рыба/);
   await page.locator('#modal-x').click();
   await page.locator('#merchant').click();
   assert.match(await page.locator('#modal-title').textContent(),/торговец/i);
   await fs.mkdir('qa/screenshots',{recursive:true});
   await page.screenshot({path:'qa/screenshots/p2-merchant-sale-before.png'});
   await page.getByRole('button',{name:/Продать всё/}).click();
   const sold=await saved(page);
   assert.equal(sold.soldFish,1);
   assert.equal(sold.fishBucket.length,0);
   assert.equal(sold.gold,13);
   assert.equal(sold.merchantPhase,'away');
   assert.equal(sold.merchantMs,300000);
   await page.reload({waitUntil:'domcontentloaded'});
   assert.equal((await saved(page)).gold,13);
   assert.equal((await saved(page)).soldFish,1);
   assert.equal((await saved(page)).fishBucket.length,0);
   await page.locator('#merchant').dispatchEvent('click');
   assert.equal(await page.locator('#modal').isVisible(),false,'an absent merchant cannot trade');
   assert.match(await page.locator('#toast').textContent(),/ещё не приехал/);
   assert.deepEqual(errors,[]);
  }finally{await context.close();}
 }finally{await browser.close();}
});

test('P2: merchant debug visit must not overwrite an incoming production visit on same browser',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const seed=freshProgress();
  seed.merchantPhase='waiting';seed.merchantMs=11000;
  seed.fishBucket=[fish];
  const {context,page,errors}=await launch(browser,seed,true);
  try{
   assert.equal(await page.locator('#merchant-test-countdown').isVisible(),true);
   assert.equal((await saved(page)).merchantPhase,'waiting');
   assert.equal((await saved(page)).merchantMs,11000);
   await page.clock.runFor(1200);
   await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
   assert.equal((await saved(page)).merchantPhase,'waiting');
   assert.equal((await saved(page)).merchantMs,11000);
   await page.goto(base,{waitUntil:'domcontentloaded'});
   assert.equal(await page.locator('#merchant-test-countdown').isVisible(),false);
   assert.equal(await page.locator('#merchant').isVisible(),true);
   assert.equal((await saved(page)).merchantPhase,'waiting');
   assert.ok((await saved(page)).merchantMs<=11000&& (await saved(page)).merchantMs>=9500);
   await page.locator('#merchant').click();
   assert.equal(await page.getByRole('button',{name:/Продать всё/}).isEnabled(),true);
   assert.deepEqual(errors,[]);
  }finally{await context.close();}
 }finally{await browser.close();}
});
