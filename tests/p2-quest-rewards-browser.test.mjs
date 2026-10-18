import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {freshProgress} from '../game-core.mjs';

const base=process.env.HRABROLAP_BASE_URL||'http://127.0.0.1:8080/';
const key='hrabrolap-v0.2-save';

test('P2: mobile quest rewards show exact amount, keep 44px targets and never pay twice',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const [width,height] of [[320,568],[390,844]]){
   const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:true,hasTouch:true});
   try{
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    const seed=freshProgress();
    seed.killedSlimes=5;
    seed.autoEnabled=false;
    await page.addInitScript(data=>localStorage.setItem('hrabrolap-v0.2-save',JSON.stringify(data)),seed);
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await page.locator('#quests').click();
    const first=page.locator('.quest-row').first();
    const claim=first.getByRole('button',{name:'Забрать 60 монет за задание: Победи 5 слизней'});
    assert.equal(await claim.textContent(),'Забрать +60 🪙');
    assert.equal(await claim.isEnabled(),true);
    const locked=page.locator('.quest-row').nth(1).getByRole('button');
    assert.equal(await locked.textContent(),'🔒 Не готово');
    assert.equal(await locked.isDisabled(),true);
    const bounds=await claim.boundingBox();
    assert.ok(bounds.width>=88&&bounds.height>=44,'reward must be finger-friendly');
    const horizontalOverflow=await page.locator('#modal-content').evaluate(el=>el.scrollWidth-el.clientWidth);
    assert.ok(horizontalOverflow<=2,'quest rows must not overflow at '+width+'px');
    await fs.mkdir('qa/screenshots',{recursive:true});
    await page.screenshot({path:'qa/screenshots/p2-quest-rewards-'+width+'.png',fullPage:true});
    await claim.click();
    const raw=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),key));
    assert.equal(raw.gold,seed.gold+60,'payout exactly once');
    assert.deepEqual(raw.questClaimed,[0],'stable quest ID retained');
    const completed=page.locator('.quest-row').first().getByRole('button');
    assert.equal(await completed.textContent(),'Получено ✓');
    assert.equal(await completed.isDisabled(),true);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('#quests').click();
    assert.equal(await page.locator('.quest-row').first().getByRole('button').textContent(),'Получено ✓');
    const restored=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),key));
    assert.equal(restored.gold,seed.gold+60,'reload must not duplicate claim');
    assert.deepEqual(errors,[]);
   }finally{await context.close();}
  }
 }finally{await browser.close();}
});
