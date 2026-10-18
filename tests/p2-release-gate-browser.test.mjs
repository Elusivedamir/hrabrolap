import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {freshProgress} from '../game-core.mjs';

const base=process.env.HRABROLAP_BASE_URL||'http://127.0.0.1:8080/';
const key='hrabrolap-v0.2-save';
const loadSave=page=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);

async function openWithSave(browser,seed,width,height){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('console',entry=>{if(entry.type()==='error')errors.push(entry.text());});
 await page.addInitScript(({key,seed})=>{
  if(!sessionStorage.getItem('p2-release-seeded')){
   localStorage.setItem(key,JSON.stringify({...seed,lastSeen:0}));
   sessionStorage.setItem('p2-release-seeded','1');
  }
 },{key,seed});
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await page.locator('#hero-rig').waitFor();
 return {context,page,errors};
}

test('P2: achievements show exact rewards and pay once across reload at both mobile sizes',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const [width,height] of [[320,568],[390,844]]){
   const seed=freshProgress();seed.best=10;seed.room=11;seed.armor=70;
   const {context,page,errors}=await openWithSave(browser,seed,width,height);
   try{
    await page.locator('#achievements').click();
    const first=page.locator('.achievement-row').first();
    const claim=first.getByRole('button',{name:'Забрать 40 монет за достижение: Первые шаги'});
    assert.equal(await claim.textContent(),'Забрать +40 🪙');
    assert.equal(await claim.isEnabled(),true);
    const locked=page.locator('.achievement-row').nth(1).getByRole('button');
    assert.equal(await locked.textContent(),'🔒 Не готово');
    assert.equal(await locked.isDisabled(),true);
    const rect=await claim.boundingBox();
    assert.ok(rect.width>=90&&rect.height>=44,'reward button must be touch-safe');
    assert.ok(await page.locator('#modal-content').evaluate(el=>el.scrollWidth-el.clientWidth)<=2,'no horizontal overflow');
    await fs.mkdir('qa/screenshots',{recursive:true});
    await page.screenshot({path:'qa/screenshots/p2-achievements-'+width+'.png',fullPage:true});
    const old=await claim.elementHandle();
    await claim.click();
    const after=await loadSave(page);
    assert.equal(after.gold,40);
    assert.deepEqual(after.achievementClaimed,[0]);
    assert.equal(await first.getByRole('button').textContent(),'Получено ✓');
    assert.equal(await first.getByRole('button').isDisabled(),true);
    await old.evaluate(el=>el.click()); // stale input must not pay twice
    assert.equal((await loadSave(page)).gold,40);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('#achievements').click();
    assert.equal(await page.locator('.achievement-row').first().getByRole('button').textContent(),'Получено ✓');
    assert.equal((await loadSave(page)).gold,40,'reload cannot repeat achievement reward');
    assert.deepEqual(errors,[]);
   }finally{await context.close();}
  }
 }finally{await browser.close();}
});

test('P2: crafting, equipment reload and canceling reset preserve all resources',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const seed=freshProgress();seed.materials.bone=15;seed.gold=500;seed.armor=100;
  const {context,page,errors}=await openWithSave(browser,seed,320,740);
  try{
   await page.locator('#shop').click();
   const row=page.locator('.shop-item').filter({hasText:'Костяная броня'});
   const craft=row.getByRole('button',{name:'Создать',exact:true});
   const original=await craft.elementHandle();
   await craft.click();
   assert.equal((await loadSave(page)).materials.bone,0);
   assert.ok((await loadSave(page)).ownedArmors.includes('bone_guardian'));
   const goldAfter=(await loadSave(page)).gold;
   await original.evaluate(el=>el.click()); // old detached button cannot charge twice
   const afterDouble=await loadSave(page);
   assert.equal(afterDouble.materials.bone,0);
   assert.equal(afterDouble.gold,goldAfter);
   assert.equal(afterDouble.ownedArmors.filter(x=>x==='bone_guardian').length,1);
   await page.getByRole('button',{name:'Открыть инвентарь'}).click();
   await page.locator('.shop-item').filter({hasText:'Костяная броня'}).getByRole('button',{name:'Надеть'}).click();
   assert.equal((await loadSave(page)).equippedArmor,'bone_guardian');
   await page.locator('#modal-x').click();
   await page.reload({waitUntil:'domcontentloaded'});
   assert.equal((await loadSave(page)).equippedArmor,'bone_guardian');
   assert.equal((await loadSave(page)).materials.bone,0);
   await page.locator('#reset').click();
   assert.match(await page.locator('#modal-content').textContent(),/удалит монеты/);
   await page.locator('#modal-x').click();
   assert.equal((await loadSave(page)).equippedArmor,'bone_guardian','cancel must not reset inventory');
   assert.equal((await loadSave(page)).gold,goldAfter);
   assert.deepEqual(errors,[]);
  }finally{await context.close();}
 }finally{await browser.close();}
});
