import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {megaBossForWave} from '../mega-bosses.mjs';

const base=process.env.HRABROLAP_BASE_URL||'http://127.0.0.1:8080/';

test('P3 review: all 20 first-chapter rooms show live runtime backgrounds and honest approval status',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',x=>{if(x.type()==='error')errors.push(x.text());});
  await page.goto(new URL('p3-review.html',base).href,{waitUntil:'load'});
  assert.equal(await page.locator('#rooms button').count(),20);
  assert.equal(await page.locator('#boss-buttons button').count(),4);
  assert.equal(await page.locator('#frames button').count(),12);
  assert.equal(await page.locator('#hero').evaluate(async img=>{await img.decode();return img.naturalWidth>0}),true);
  for(let stage=1;stage<=20;stage++){
   await page.locator('[data-room="'+stage+'"]').click();
   const actual=await page.locator('#cave').evaluate(async img=>{await img.decode();return {src:img.getAttribute('src'),w:img.naturalWidth,h:img.naturalHeight}});
   assert.ok(actual.w>0&&actual.h>0,'room R'+stage+' must decode');
   assert.match(await page.locator('#room-title').textContent(),new RegExp('R'+String(stage).padStart(3,'0')));
   const approved=[1,5,10,12,15,20].includes(stage);
   if(approved){assert.match(actual.src,stage===20?/assets\/approved\/glacier-serpent\/:stage===15?/assets\/approved\/silk-empress\//:stage===10?/assets\/approved\/bone-regent\//:stage===5?/assets\/approved\/moss-guardian\//:/assets\/prototypes\/p1\//);assert.match(await page.locator('#art-status').textContent(),/Принятый/);}
   else{assert.ok(actual.src.startsWith('data:image/svg+xml'),'room '+stage+' remains procedural');assert.match(await page.locator('#art-status').textContent(),/Технический/);}
   assert.equal(await page.locator('#boss').isVisible(),stage%5===0,'boss is visible only at milestone arena');
  }
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=2,'review page should not scroll horizontally');
  await fs.mkdir('qa/screenshots',{recursive:true});
  await page.screenshot({path:'qa/screenshots/p3-all-rooms-390-mobile.png',fullPage:true});
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});

test('P3 review: each of 4 original boss models can inspect 6 attacks and 6 hurt frames',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:320,height:740},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',x=>{if(x.type()==='error')errors.push(x.text());});
  await page.goto(new URL('p3-review.html',base).href,{waitUntil:'load'});
  for(const wave of [50,100,150,200]){
   const model=megaBossForWave(wave);
   await page.locator('#boss-buttons [data-wave="'+wave+'"]').click();
   assert.equal(await page.locator('#frames button').count(),12);
   assert.match(await page.locator('#room-title').textContent(),new RegExp('R'+String(wave/10).padStart(3,'0')));
   for(const phase of ['attack','hurt'])for(let frame=1;frame<=6;frame++){
    await page.getByRole('button',{name:model.name+': '+(phase==='attack'?'атака':'урон')+' '+frame+'/6'}).click();
    const image=await page.locator('#boss').evaluate(async img=>{await img.decode();return {w:img.naturalWidth,h:img.naturalHeight,src:img.getAttribute('src')}});
    assert.ok(image.w>0&&image.h>0,model.id+' '+phase+' '+frame);
    if(wave===50)assert.match(image.src,/assets\/approved\/moss-guardian\//);
    else if(wave===100)assert.match(image.src,/assets\/approved\/bone-regent\//);
    else if(wave===150)assert.match(image.src,/assets\/approved\/silk-empress\//);
    else if(wave===200)assert.match(image.src,/assets\/approved\/glacier-serpent\//);
    else assert.match(image.src,/assets\/prototypes\/p3\/boss-(bone-regent|silk-empress|glacier-serpent)\/(attack|hurt)_0[1-6]\.svg/,'new unique pose pack for boss '+wave);
    assert.match(await page.locator('#status').textContent(),new RegExp(phase==='attack'?'атака':'урон'));
   }
   await page.screenshot({path:'qa/screenshots/p3-boss-'+wave+'-320-mobile.png',fullPage:true});
  }
  await page.locator('#toggle-actors').click();
  assert.equal(await page.locator('#hero').isVisible(),false);
  await page.locator('#toggle-actors').click();
  assert.equal(await page.locator('#hero').isVisible(),true);
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
