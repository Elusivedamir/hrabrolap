import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {freshProgress} from '../game-core.mjs';

const base=process.env.HRABROLAP_BASE_URL||'http://127.0.0.1:8080/';
const SAVE='hrabrolap-v0.2-save';
const cases=[
 {stage:20,wave:200,title:'Логово ледяного змея',boss:'glacier_serpent',directory:'glacier-serpent'}
];
async function decoded(locator){
 return locator.evaluate(async img=>{
  await img.decode();
  return {src:img.getAttribute('src'),width:img.naturalWidth,height:img.naturalHeight};
 });
}
test('P3 first-chapter viewer shows distinctive rooms and twelve animated art poses of each boss',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const width of [320,390]){
   const page=await browser.newPage({viewport:{width,height:width===320?740:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
   try{
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(new URL('p3-review.html',base).href,{waitUntil:'load'});
    assert.equal(await page.locator('#art-compare').getAttribute('aria-pressed'),'true');
    for(const art of cases){
     await page.locator('#boss-buttons [data-wave="'+art.wave+'"]').click();
     assert.match(await page.locator('#room-title').textContent(),new RegExp(art.title));
     const room=await decoded(page.locator('#cave'));
     assert.ok(room.src.includes('assets/approved/'+art.directory+'/R0'+art.stage+'-'));
     assert.ok(room.width>=840&&room.height>=470);
     assert.match(await page.locator('#art-status').textContent(),/Принятый/);
     assert.equal(await page.locator('#frames button').count(),12);
     const srcs=[];
     for(const phase of ['attack','hurt'])for(let n=1;n<=6;n++){
      await page.locator('#frames [data-phase="'+phase+'"][data-frame="'+(n-1)+'"]').click();
      const frame=await decoded(page.locator('#boss'));
      assert.match(frame.src,new RegExp('assets/approved/'+art.directory+'/'+phase+'_0'+n+'.png'));
      assert.ok(frame.width===362&&frame.height===362);
      srcs.push(frame.src);
     }
     assert.equal(new Set(srcs).size,12);
     const screenshot='qa/screenshots/p3-redesign-'+art.stage+'-'+width+'.png';
     await fs.mkdir('qa/screenshots',{recursive:true});
     await page.locator('#stage').screenshot({path:screenshot});
     await page.locator('#art-compare').click();
     assert.equal(await page.locator('#art-compare').getAttribute('aria-pressed'),'false');
     assert.match((await decoded(page.locator('#cave'))).src,/assets\/approved\/glacier-serpent\//);
     assert.match((await decoded(page.locator('#boss'))).src,/assets\/approved\/glacier-serpent\//);
     await page.locator('#art-compare').click();
     assert.equal(await page.locator('#art-compare').getAttribute('aria-pressed'),'true');
    }
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=2);
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),SAVE),null,'art review must never touch real progress');
    assert.deepEqual(errors,[]);
   }finally{await page.context().close();}
  }
 }finally{await browser.close();}
});

test('P3 opt-in real game renders new art at boss arenas and ordinary game still retains legacy appearance and save',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const item of cases){
   const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   try{
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const progress=freshProgress();progress.room=item.wave;progress.best=item.wave-1;progress.gold=173;progress.autoEnabled=false;progress.armor=80;
    await page.addInitScript(({key,progress})=>{
     if(!sessionStorage.getItem('p3-art-qa-fixture')){
      localStorage.setItem(key,JSON.stringify({...progress,lastSeen:0}));
      sessionStorage.setItem('p3-art-qa-fixture','1');
     }
    },{key:SAVE,progress});
    await page.goto(new URL('index.html?p3Art=1',base).href,{waitUntil:'domcontentloaded'});
    await page.locator('#hero-rig').waitFor();
    assert.match(await page.locator('#cave-stage').textContent(),new RegExp(item.title));
    assert.match((await decoded(page.locator('#cave-backdrop'))).src,/assets\/approved\/glacier-serpent\/R020-/);
    assert.match((await decoded(page.locator('#enemy-art'))).src,new RegExp('assets/approved/'+item.directory+'/attack_01.png'));
    await fs.mkdir('qa/screenshots',{recursive:true});
    await page.locator('#dungeon').screenshot({path:'qa/screenshots/p3-redesign-live-wave-'+item.wave+'.png'});
    await page.goto(new URL('index.html',base).href,{waitUntil:'domcontentloaded'});
    assert.match((await decoded(page.locator('#cave-backdrop'))).src,/assets\/approved\/glacier-serpent\//);
    assert.match((await decoded(page.locator('#enemy-art'))).src,/assets\/approved\/glacier-serpent\//);
    const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),SAVE);
    assert.equal(saved.gold,173);
    assert.equal(saved.best,item.wave-1);
    assert.deepEqual(errors,[]);
   }finally{await context.close();}
  }
 }finally{await browser.close();}
});
