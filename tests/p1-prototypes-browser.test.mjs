import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';

const base=process.env.HRABROLAP_BASE_URL||'http://127.0.0.1:8080/';
test('P1 review page renders original hero, three separate rooms and 12 moss boss poses',async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text())});
 try{
 await fs.mkdir('qa/screenshots',{recursive:true});
 await page.goto(new URL('p1-review.html',base).toString(),{waitUntil:'load'});
 await page.locator('#hero').evaluate(e=>e.decode());
 await page.locator('#boss').evaluate(e=>e.decode());
 await page.locator('#cave').evaluate(e=>e.decode());
 assert.match(await page.locator('header').innerText(),/графический просмотрщик/);
 assert.equal(await page.locator('.frame').count(),12);
 await page.locator('#play').click(); // stop animation for deterministic screenshots
 for(const [room,file] of [['R001','stone-threshold'],['R005','moss-outpost'],['R012','rune-dead-end']]){
  await page.locator('[data-room="'+room+'"]').click();
  const result=await page.locator('#cave').evaluate(async img=>{await img.decode();return {w:img.naturalWidth,h:img.naturalHeight,src:img.getAttribute('src')}});
  assert.equal(result.w,840,room+' image width');
  assert.equal(result.h,470,room+' image height');
  assert.ok(result.src.includes(file),room+' image changed');
  await page.screenshot({path:'qa/screenshots/p1-'+room+'-review-mobile.png',fullPage:true});
 }
 await page.locator('[data-room="R005"]').click();
 for(const phase of ['attack','hurt'])for(let i=1;i<=6;i++){
  const b=page.locator('.frame[aria-label="'+phase+' кадр '+i+'"]');
  await b.click();
  const frame=await page.locator('#boss').evaluate(async img=>{await img.decode();return {w:img.naturalWidth,h:img.naturalHeight,src:img.getAttribute('src')}});
  assert.equal(frame.w,240,'boss '+phase+' frame '+i);
  assert.equal(frame.h,245,'boss '+phase+' frame '+i);
  assert.ok(frame.src.includes(phase+'_'+String(i).padStart(2,'0')+'.svg'));
 }
 await page.locator('.frame[aria-label="attack кадр 1"]').click();
 await page.screenshot({path:'qa/screenshots/p1-Moss-Guardian-attack-12frames.png',fullPage:true});
 await page.locator('.frame[aria-label="hurt кадр 4"]').click();
 await page.screenshot({path:'qa/screenshots/p1-Moss-Guardian-hurt-12frames.png',fullPage:true});
 assert.deepEqual(errors,[]);
 } finally{await browser.close();}
});
