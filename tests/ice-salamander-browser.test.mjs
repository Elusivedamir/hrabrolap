import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';

const base=process.env.HRABROLAP_BASE_URL||'http://127.0.0.1:8080/';

test('ice salamander standalone preview: images, all 12 frames and controls on mobile',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(new URL('ice-salamander-test.html',base).href,{waitUntil:'load'});
  assert.equal(await page.title(),'Храбролап — тест анимаций ледяной саламандры');
  assert.equal(await page.locator('#frames .frame').count(),6);
  for(const [selector,width] of [['#boss-art',320],['#room-art',840],['.seal-card img',384]]){
   assert.equal(await page.locator(selector).evaluate(async img=>{await img.decode();return img.naturalWidth}),width,selector);
  }
  assert.equal(await page.locator('#mode-attack').getAttribute('aria-pressed'),'true');
  for(const [mode,button] of [['attack','#mode-attack'],['hurt','#mode-hurt']]){
   await page.locator(button).click();
   assert.equal(await page.locator(button).getAttribute('aria-pressed'),'true');
   for(let i=0;i<6;i++){
    await page.locator('#frames .frame').nth(i).click();
    const src=await page.locator('#boss-art').getAttribute('src');
    assert.equal(src,'assets/approved/ice-salamander/'+mode+'_'+String(i+1).padStart(2,'0')+'.webp');
    assert.equal(await page.locator('#boss-art').evaluate(async img=>{await img.decode();return img.naturalWidth}),320);
   }
  }
  await page.locator('#prev').click();
  assert.match(await page.locator('#counter').textContent(),/05\/06/);
  await page.locator('#next').click();
  assert.match(await page.locator('#counter').textContent(),/06\/06/);
  await page.locator('#transparent').check();
  assert.match(await page.locator('#stage').getAttribute('class'),/checker/);
  assert.equal(await page.locator('#room-art').evaluate(e=>getComputedStyle(e).visibility),'hidden');
  await page.locator('#fps').evaluate(e=>{e.value='12';e.dispatchEvent(new Event('input',{bubbles:true}))});
  assert.equal(await page.locator('#fps-value').textContent(),'12 к/с');
  await page.locator('#zoom').evaluate(e=>{e.value='125';e.dispatchEvent(new Event('input',{bubbles:true}))});
  assert.equal(await page.locator('#zoom-value').textContent(),'125%');
  await page.locator('#play').click();
  assert.equal(await page.locator('#play').getAttribute('aria-pressed'),'true');
  await page.waitForTimeout(250);
  await page.locator('#play').click();
  assert.equal(await page.locator('#play').getAttribute('aria-pressed'),'false');
  await mkdir('qa/screenshots',{recursive:true});
  await page.screenshot({path:'qa/screenshots/ice-salamander-qa-mobile.png',fullPage:true});
  assert.deepEqual(errors,[]);
 } finally {await browser.close();}
});
