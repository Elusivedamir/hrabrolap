import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {freshProgress} from '../game-core.mjs';

const base=process.env.HRABROLAP_BASE_URL||'http://127.0.0.1:8080/';
const key='hrabrolap-v0.2-save';
const save=page=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);

test('Dawn Seals: boss wall collection flies into 40-slot journal, persists and cannot be repeated',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const width of [320,390]){
   const context=await browser.newContext({viewport:{width,height:width===320?740:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
   try{
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const p=freshProgress();
    p.room=50;p.best=49;p.sword=200;p.armor=70;p.autoEnabled=false;
    p.battleState={level:50,monsterType:'thorn_warden',hp:550,enemyHp:1,phase:'fight',heroTimer:1,enemyTimer:0,rest:0};
    await page.addInitScript(({key,seed})=>{
     if(!sessionStorage.getItem('seal-fixture-seeded')){
      localStorage.setItem(key,JSON.stringify({...seed,lastSeen:0}));
      sessionStorage.setItem('seal-fixture-seeded','1');
     }
    },{key,seed:p});
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await page.locator('#hero-rig').waitFor();
    assert.equal(await page.locator('#dawn-wall').isVisible(),true);
    assert.equal(await page.locator('#dawn-wall').getAttribute('aria-label'),'На стене: Печать Мха');
    assert.equal(await page.locator('#dawn-wall-art').evaluate(async img=>{await img.decode();return img.naturalWidth>0}),true);
    assert.equal(await page.locator('#seals').textContent(),'✧ 0/40');
    await fs.mkdir('qa/screenshots',{recursive:true});
    await page.locator('#dungeon').screenshot({path:'qa/screenshots/dawn-seal-before-'+width+'.png'});
    await page.locator('#enemy-holder').click();
    await page.waitForFunction(()=>document.getElementById('seals')?.textContent?.includes('1/40'));
    const state=await save(page);
    assert.equal(state.best,50);assert.deepEqual(state.megaBossWins,[50]);
    assert.equal(await page.locator('#dawn-wall').getAttribute('aria-label'),'Печать Рассвета уже освобождена: Печать Мха');
    assert.equal(await page.locator('#dawn-wall-imprint').isVisible(),true);
    await page.locator('#dungeon').screenshot({path:'qa/screenshots/dawn-seal-after-'+width+'.png'});
    await page.locator('#seals').click();
    assert.equal(await page.locator('.seal-card').count(),40);
    assert.equal(await page.locator('.seal-chapter-title').count(),10);
    assert.match(await page.locator('.seal-chapter-title').first().textContent(),/1\/4/);
    assert.equal(await page.locator('.seal-card.collected').count(),1);
    const one=page.locator('.seal-card').first();
    assert.match(await one.getAttribute('aria-label'),/Печать Мха · собрана/);
    assert.match(await page.locator('.seal-card').nth(1).getAttribute('aria-label'),/Печать Кости · не собрана/);
    const overflow=await page.locator('#modal-content').evaluate(e=>e.scrollWidth-e.clientWidth);
    assert.ok(overflow<=2,'no horizontal overflow at '+width);
    await page.screenshot({path:'qa/screenshots/dawn-seal-journal-'+width+'.png'});
    await page.locator('#modal-x').click();
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('#seals').click();
    assert.equal(await page.locator('.seal-card.collected').count(),1);
    assert.deepEqual((await save(page)).megaBossWins,[50]);
    assert.deepEqual(errors,[]);
   }finally{await context.close();}
  }
 }finally{await browser.close();}
});

test('Dawn Seals: old progress unlocks previously beaten bosses without mutating stored save',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:320,height:740},isMobile:true,hasTouch:true});
  try{
   const page=await context.newPage();
   const p=freshProgress();p.best=200;p.room=201;p.megaBossWins=[50,100];p.armor=70;
   await page.addInitScript(data=>localStorage.setItem('hrabrolap-v0.2-save',JSON.stringify({...data,lastSeen:0})),p);
   await page.goto(base,{waitUntil:'domcontentloaded'});
   await page.locator('#seals').click();
   assert.equal(await page.locator('.seal-card.collected').count(),4);
   assert.match(await page.locator('.seal-chapter-title').first().textContent(),/4\/4/);
   assert.equal((await save(page)).gold,p.gold);
  }finally{await context.close();}
 }finally{await browser.close();}
});
