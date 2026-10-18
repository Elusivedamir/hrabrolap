import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {freshProgress,monsterForWave} from '../game-core.mjs';

const base=process.env.HRABROLAP_BASE_URL||'http://127.0.0.1:8080/';
const key='hrabrolap-v0.2-save';

test('P2: shop explains missing materials and coins, modal has touch-safe close and returns focus',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:320,height:740},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  const progress=freshProgress();
  await page.addInitScript(raw=>localStorage.setItem('hrabrolap-v0.2-save',JSON.stringify(raw)),progress);
  await page.goto(base);
  await page.locator('#hero-rig').waitFor();
  await page.locator('#shop').click();
  assert.equal(await page.locator('#modal').getAttribute('aria-labelledby'),'modal-title');
  assert.equal(await page.locator('#modal-title').textContent(),'Магазин');
  assert.equal(await page.evaluate(()=>document.activeElement?.id),'modal-x');
  const close=await page.locator('#modal-x').boundingBox();
  assert.ok(close.width>=44&&close.height>=44,'close target must be 44px');
  const slime=page.locator('.shop-item').filter({hasText:'Слизневая броня'});
  assert.match(await slime.innerText(),/Не хватает: Слизь 0\/15/);
  const sword=page.locator('.shop-item').filter({hasText:'Лунный клинок'});
  assert.match(await sword.innerText(),/Нужно ещё 900/);
  // Keep existing clickable purchasing errors and existing game state.
  await slime.getByRole('button',{name:'Создать',exact:true}).click();
  assert.equal(await page.locator('#modal').getAttribute('data-mode'),'shop');
  const row=await page.locator('.shop-item').first().boundingBox();
  assert.ok(row.width>120,'card should remain readable at 320px');
  await fs.mkdir('qa/screenshots',{recursive:true});
  await page.screenshot({path:'qa/screenshots/p2-shop-320-mobile.png',fullPage:true});
  const raw=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),key));
  assert.equal(raw.gold,0);assert.equal(raw.materials.slime,0);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#modal').isVisible(),false);
  assert.equal(await page.evaluate(()=>document.activeElement?.id),'shop','focus returns to original menu trigger');
  await page.locator('#quests').click();
  const quest=await page.locator('.quest-row button').first().boundingBox();
  assert.ok(quest.width>=44&&quest.height>=44,'quest reward touch target');
  await page.screenshot({path:'qa/screenshots/p2-quests-320-mobile.png',fullPage:true});
  await page.locator('#modal-x').click();
  assert.equal(await page.evaluate(()=>document.activeElement?.id),'quests');
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});

test('P2: keyboard Enter and Space attack the live monster in manual mode',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const progress=freshProgress();progress.autoEnabled=false;
  await page.addInitScript(raw=>localStorage.setItem('hrabrolap-v0.2-save',JSON.stringify(raw)),progress);
  await page.goto(base);
  await page.locator('#enemy-holder').waitFor();
  await page.locator('#enemy-holder').focus();
  assert.equal(await page.evaluate(()=>document.activeElement?.id),'enemy-holder');
  await page.waitForTimeout(650);
  await page.keyboard.press('Enter');
  const afterEnter=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),key));
  const firstHP=afterEnter.battleState.enemyHp;
  assert.ok(firstHP<monsterForWave(1).hp,'Enter should inflict actual manual attack');
  await page.waitForTimeout(650);
  await page.keyboard.press('Space');
  const afterSpace=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),key));
  assert.ok(afterSpace.battleState.enemyHp<firstHP,'Space should inflict another manual attack');
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});

test('P2: the dockside shop image is keyboard-accessible and returns focus after closing',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:320,height:740},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  try{
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   const progress=freshProgress();
   await page.addInitScript(raw=>localStorage.setItem('hrabrolap-v0.2-save',JSON.stringify(raw)),progress);
   await page.goto(base);
   await page.locator('#hero-rig').waitFor();
   const dockShop=page.getByRole('button',{name:'Открыть магазин у дома'});
   assert.equal(await dockShop.count(),1);
   await dockShop.focus();
   assert.equal(await page.evaluate(()=>document.activeElement?.id),'mini-shop');
   await page.keyboard.press('Enter');
   assert.equal(await page.locator('#modal-title').textContent(),'Магазин');
   await page.locator('#modal-x').click();
   assert.equal(await page.evaluate(()=>document.activeElement?.id),'mini-shop');
   await page.keyboard.press('Space');
   assert.equal(await page.locator('#modal-title').textContent(),'Магазин');
   await page.keyboard.press('Escape');
   assert.equal(await page.locator('#modal').isVisible(),false);
   assert.equal(await page.evaluate(()=>document.activeElement?.id),'mini-shop');
   const saved=JSON.parse(await page.evaluate(()=>localStorage.getItem('hrabrolap-v0.2-save')));
   assert.equal(saved.gold,0,'opening a shop must not spend gold');
   assert.deepEqual(errors,[]);
  }finally{await context.close();}
 }finally{await browser.close();}
});
