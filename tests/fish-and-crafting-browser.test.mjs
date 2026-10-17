import {before,after,afterEach,test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import * as c from '../game-core.mjs';
import {fishCount} from '../russian.mjs';
import {fishArt} from '../fish-art.mjs';
const base=process.env.HRABROLAP_BASE_URL||'http://127.0.0.1:8080/';
const key='hrabrolap-v0.2-save',errors=[],contexts=[];
let browser;
before(async()=>{
 await fs.mkdir('qa/fish-and-crafting',{recursive:true});
 browser=await chromium.launch({headless:true,...(process.env.HRABROLAP_CHROMIUM_EXECUTABLE?{executablePath:process.env.HRABROLAP_CHROMIUM_EXECUTABLE,args:['--no-zygote','--disable-gpu','--disable-software-rasterizer']}:{})});
});
afterEach(async()=>{while(contexts.length)await contexts.pop().close();});
after(async()=>{await browser?.close();await fs.writeFile('qa/fish-and-crafting/browser-errors.json',JSON.stringify(errors,null,2));});
async function open(p,width=390){
 const ctx=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true});contexts.push(ctx);
 const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.clock.install({time:new Date('2026-10-17T10:00:00Z')});
 await page.clock.pauseAt(new Date('2026-10-17T10:01:00Z'));
 await page.addInitScript(({key,p})=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem(key,JSON.stringify({...p,lastSeen:0}));sessionStorage.setItem('seeded','1');}},{key,p});
 await page.goto(base);await page.locator('#hero-rig').waitFor();return page;
}
const catchFish=species=>({species:species.species,slots:species.slots,price:species.base,length:species.length[0],weight:species.weight[0],waitMs:10000});
const saved=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
test('bucket label, accessible name and summary use correct Russian counts',async()=>{
 for(const n of [0,1,2,4,5,11,12,14,21,22,24]){
  const p=c.freshProgress();p.bucketLevel=1;p.fishBucket=Array.from({length:n},()=>catchFish(c.SPECIES[0]));
  const page=await open(p);
  assert.equal(await page.locator('#bucket-indicator').textContent(),fishCount(n));
  assert.ok((await page.locator('#bucket').getAttribute('aria-label')).includes(fishCount(n)));
  await page.locator('#bucket').click();
  assert.ok((await page.locator('#modal-content').textContent()).includes('Улов: '+fishCount(n)));
  await contexts.pop().close();
 }
});
test('five distinct fish portraits load in bucket and trade at mobile widths',async()=>{
 for(const width of [320,390,430]){
  const p=c.freshProgress();p.fishBucket=c.SPECIES.map(catchFish);p.merchantPhase='waiting';p.merchantMs=15000;
  const page=await open(p,width);await page.locator('#bucket').click();
  const rows=page.locator('.fish-row');assert.equal(await rows.count(),5);
  for(let i=0;i<5;i++){
   const im=rows.nth(i).locator('img');assert.equal(await im.getAttribute('src'),fishArt(c.SPECIES[i].species));
   assert.equal(await im.getAttribute('alt'),c.SPECIES[i].species);await im.evaluate(im=>im.decode());
   assert.ok(await rows.nth(i).evaluate(el=>el.scrollWidth<=el.clientWidth));
  }
  await page.screenshot({path:`qa/fish-and-crafting/bucket-${width}.png`});
  await page.locator('#modal-x').click();await page.locator('#merchant').click();
  assert.equal(await page.locator('.fish-portrait').count(),5);
  await page.getByRole('button',{name:/Продать всё/}).click();
  assert.equal((await saved(page)).fishBucket.length,0);
  assert.ok((await page.locator('#toast').textContent()).includes('5 рыб'));
  await contexts.pop().close();
 }
});
for(const [id,material,name] of [['slime_guardian','slime','Слизневая броня'],['bone_guardian','bone','Костяная броня']]){
 test(`${name}: craft without gold, equip, all 12 transparent frames and saved reload`,async()=>{
  const p=c.freshProgress();p.materials[material]=15;p.armor=100;
  const page=await open(p);await page.locator('#shop').click();
  let row=page.locator('.shop-item').filter({hasText:name});
  assert.ok((await row.textContent()).includes('15/15'));
  await row.getByRole('button',{name:'Создать',exact:true}).click();
  assert.equal((await saved(page)).materials[material],0);assert.equal((await saved(page)).gold,0);
  row=page.locator('.shop-item').filter({hasText:name});await row.getByRole('button',{name:'Надеть',exact:true}).click();
  assert.equal((await saved(page)).materials[material],0);assert.equal((await saved(page)).equippedArmor,id);
  await page.locator('#modal-x').click();await page.reload();await page.locator('#hero-rig').waitFor();
  assert.equal(await page.locator('#hero-body').getAttribute('data-costume'),id);
  for(const kind of ['attack','hurt'])for(let i=0;i<6;i++){
   const result=await page.evaluate(async({kind,i,id})=>{
    const {applyCanonicalFrame}=await import('./canonical-sprites.mjs');
    const get=id=>document.getElementById(id);
    applyCanonicalFrame(kind,i,{body:get('hero-body'),heroMotion:get('hero-motion'),weaponSlot:get('weapon-slot'),armorSlot:get('armor-slot'),armorImage:get('hero-armor'),armorId:id,transparent:true});
    const src=get('hero-body').getAttribute('href'),im=new Image();im.src=src;await im.decode();
    const canvas=document.createElement('canvas');canvas.width=im.width;canvas.height=im.height;
    const ctx=canvas.getContext('2d');ctx.drawImage(im,0,0);const bytes=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    let transparent=0;for(let k=3;k<bytes.length;k+=4)if(bytes[k]===0)transparent++;
    return {src,width:im.width,height:im.height,transparent};
   },{kind,i,id});
   assert.equal(result.src,`assets/clean/${id}/${kind}_0${i+1}.png`);
   assert.equal(result.width,279);assert.equal(result.height,370);assert.ok(result.transparent>279*370*.25);
   if(i===0||i===3)await page.screenshot({path:`qa/fish-and-crafting/${id}-${kind}-${i+1}.png`});
  }
  await page.locator('#inventory').click();await page.locator('.shop-item').filter({hasText:'Без брони'}).getByRole('button').click();
  await page.locator('#modal-x').click();assert.equal(await page.locator('#hero-body').getAttribute('data-costume'),'none');
 });
 test(`${name}: insufficient materials do not change the save`,async()=>{
  const p=c.freshProgress();p.materials[material]=14;
  const page=await open(p);await page.locator('#shop').click();
  await page.locator('.shop-item').filter({hasText:name}).getByRole('button',{name:'Создать',exact:true}).click();
  assert.ok((await page.locator('#toast').textContent()).includes('14/15'));
  await page.locator('#modal-x').click();await page.locator('#inventory').click();
  assert.equal(await page.locator('.shop-item').filter({hasText:name}).count(),0);
 });
}
test('new workflows produced no browser errors',()=>assert.deepEqual(errors,[]));
