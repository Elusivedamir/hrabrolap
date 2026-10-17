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

test('approved P1 art renders in actual gameplay at waves 1, 41, 50 and 111',async()=>{
 const {freshProgress}=await import('../game-core.mjs');
 const {caveBackgroundForWave,caveStageName}=await import('../cave-themes.mjs');
 const {megaBossFrameUrl}=await import('../mega-boss-art.mjs');
 const checks=[
  {wave:1,stage:1,name:'Каменный порог',room:'R001-stone-threshold.svg'},
  {wave:41,stage:5,name:'Моховая сторожка',room:'R005-moss-outpost.svg'},
  {wave:50,stage:5,name:'Моховая сторожка',room:'R005-moss-outpost.svg',boss:true},
  {wave:111,stage:12,name:'Рунный тупик',room:'R012-rune-dead-end.svg'}
 ];
 const browser=await chromium.launch({headless:true});
 try{
  for(const c of checks){
   assert.ok(caveBackgroundForWave(c.wave).endsWith(c.room));
   assert.equal(caveStageName(c.stage),c.name);
   const progress={...freshProgress(),room:c.wave,best:c.wave-1,autoUnlocked:false,autoEnabled:false,lastSeen:0};
   const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   try{
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
    await page.addInitScript(data=>{localStorage.setItem('hrabrolap-v0.2-save',JSON.stringify(data));},progress);
    await page.goto(base,{waitUntil:'load'});
    const back=page.locator('#cave-backdrop');
    await page.waitForFunction(expected=>document.getElementById('cave-backdrop')?.getAttribute('src')?.endsWith(expected),c.room);
    const size=await back.evaluate(async img=>{await img.decode();return [img.naturalWidth,img.naturalHeight]});
    assert.deepEqual(size,[840,470],c.room);
    await page.locator('#cave-stage').waitFor();
    assert.match(await page.locator('#cave-stage').innerText(),new RegExp(c.name));
    if(c.boss){
      const sprite=page.locator('#enemy-art');
      await page.waitForFunction(()=>document.getElementById('enemy-art')?.getAttribute('src')?.includes('boss-thorn-warden/attack_'),null,{timeout:10000});
      const art=await sprite.evaluate(async img=>{await img.decode();return {src:img.getAttribute('src'),w:img.naturalWidth,h:img.naturalHeight}});
      assert.equal(art.w,240);
      assert.equal(art.h,245);
      assert.ok(art.src.includes('boss-thorn-warden/attack_'));
      assert.match(await page.locator('#enemy-name').innerText(),/Моховой страж/);
      for(const phase of ['attack','hurt'])for(let n=0;n<6;n++){
        const path=megaBossFrameUrl('thorn_warden',phase,n);
        assert.match(path,new RegExp(phase+'_'+String(n+1).padStart(2,'0')+'\\.svg$'));
        const img=await page.evaluate(async src=>{
         const image=new Image();image.src=src;await image.decode();return [image.naturalWidth,image.naturalHeight];
        },path);
        assert.deepEqual(img,[240,245],path);
      }
    }
    await fs.mkdir('qa/screenshots',{recursive:true});
    await page.locator('#dungeon').screenshot({path:'qa/screenshots/p1-IN-GAME-'+c.wave+'-mobile.png'});
    assert.deepEqual(errors,[],JSON.stringify(errors));
   }finally{await context.close();}
  }
 }finally{await browser.close();}
});
