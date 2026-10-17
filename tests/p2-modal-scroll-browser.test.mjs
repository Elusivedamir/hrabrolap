import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {freshProgress} from '../game-core.mjs';

const base=process.env.HRABROLAP_BASE_URL||'http://127.0.0.1:8080/';

async function createPage(browser,width,height,offlineFonts=false){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 if(offlineFonts){
  await context.route(/https:\/\/fonts\.(?:googleapis|gstatic)\.com\//,route=>route.abort());
 }
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const progress=freshProgress();
 progress.materials.bone=15;
 await page.addInitScript(data=>localStorage.setItem('hrabrolap-v0.2-save',JSON.stringify(data)),progress);
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await page.locator('#hero-rig').waitFor();
 return {page,context,errors};
}

async function examineLongWindow(page,label,file){
 const modal=page.locator('#modal');
 const content=page.locator('#modal-content');
 const title=page.locator('#modal-title');
 const x=page.locator('#modal-x');
 const footer=page.locator('#modal-buttons');
 const metrics=await content.evaluate(el=>{
  const style=getComputedStyle(el);
  return {scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,overflowY:style.overflowY};
 });
 assert.ok(metrics.scrollHeight>metrics.clientHeight+40,label+' should scroll inside modal');
 assert.equal(metrics.overflowY,'auto');
 const before=await Promise.all([title.boundingBox(),x.boundingBox(),footer.boundingBox()]);
 await content.evaluate(el=>el.scrollTop=el.scrollHeight);
 await page.waitForTimeout(90);
 const after=await Promise.all([title.boundingBox(),x.boundingBox(),footer.boundingBox()]);
 for(let i=0;i<3;i++)assert.ok(Math.abs(before[i].y-after[i].y)<2,label+' fixed header/footer '+i);
 const outer=await modal.boundingBox();
 assert.ok(after[1].y>=outer.y&&after[1].y+after[1].height<=outer.y+outer.height,label+' close button on screen');
 assert.ok(after[2].y+after[2].height<=outer.y+outer.height,label+' action buttons on screen');
 await fs.mkdir('qa/screenshots',{recursive:true});
 await page.screenshot({path:'qa/screenshots/'+file,fullPage:true});
}

test('P2: long shop and quests scroll independently of header and actions, purchase retains scroll',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const [width,height] of [[320,568],[390,844]]){
   const {page,context,errors}=await createPage(browser,width,height);
   try{
    await page.locator('#shop').click();
    await examineLongWindow(page,'shop '+width,'p2-scroll-shop-'+width+'.png');
    const item=page.locator('.shop-item').filter({hasText:'Костяная броня'});
    await item.getByRole('button',{name:'Создать',exact:true}).scrollIntoViewIfNeeded();
    const previous=await page.locator('#modal-content').evaluate(el=>el.scrollTop);
    assert.ok(previous>40,'craft at bottom should require scrolling');
    await item.getByRole('button',{name:'Создать',exact:true}).click();
    const after=await page.locator('#modal-content').evaluate(el=>el.scrollTop);
    assert.ok(Math.abs(after-previous)<70,'craft must preserve list position: '+previous+' => '+after);
    const raw=JSON.parse(await page.evaluate(()=>localStorage.getItem('hrabrolap-v0.2-save')));
    assert.equal(raw.materials.bone,0,'15 bone spent once');
    assert.ok(raw.ownedArmors.includes('bone_guardian'),'item obtained');
    await page.locator('#modal-x').click();
    assert.equal(await page.evaluate(()=>document.activeElement?.id),'shop');
    await page.locator('#quests').click();
    await examineLongWindow(page,'quests '+width,'p2-scroll-quests-'+width+'.png');
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(()=>document.activeElement?.id),'quests');
    await page.locator('#achievements').click();
    await examineLongWindow(page,'achievements '+width,'p2-scroll-achievements-'+width+'.png');
    await page.locator('#modal-x').click();
    assert.deepEqual(errors,[]);
   }finally{await context.close();}
  }
 }finally{await browser.close();}
});

test('P2: fallback Cyrillic fonts do not block dialog when external font hosts are unreachable',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const {page,context,errors}=await createPage(browser,360,740,true);
  try{
   await page.locator('#inventory').click();
   const metrics=await page.locator('#modal-title').evaluate(el=>{
    const rect=el.getBoundingClientRect();
    return {text:el.textContent,width:rect.width,height:rect.height,font:getComputedStyle(el).fontFamily};
   });
   assert.equal(metrics.text,'Инвентарь');
   assert.ok(metrics.width>70&&metrics.height>15);
   assert.match(metrics.font,/Comfortaa/);
   assert.match(metrics.font,/system-ui/,'Cyrillic system fallback available');
   await page.locator('#modal-x').click();
   assert.equal(await page.evaluate(()=>document.activeElement?.id),'inventory');
   assert.deepEqual(errors,[]);
  }finally{await context.close();}
 }finally{await browser.close();}
});
