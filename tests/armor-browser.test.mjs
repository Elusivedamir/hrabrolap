import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {chromium} from 'playwright';
import {ARMOR_SET_IDS,ARMOR_POSES,armorFramePath} from '../armor-frames.mjs';import {ARMORS,freshProgress,startFight} from '../game-core.mjs';
const base=process.env.HRABROLAP_BASE_URL||'http://127.0.0.1:8080/';
const launch={headless:true,...(process.env.HRABROLAP_CHROMIUM_EXECUTABLE?{executablePath:process.env.HRABROLAP_CHROMIUM_EXECUTABLE,args:['--no-zygote','--single-process','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{})};
test('all 120 SVG overlays render transparently and retain flower, paws and eyes',async()=>{
 const browser=await chromium.launch(launch);const errors=[];await fs.mkdir('qa/armor-review',{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1120,height:1000}});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(new URL('armor-review.html',base).href);assert.equal(await page.locator('.set').count(),10);
  const results=[];
  for(const kind of ['attack','hurt'])for(let i=0;i<6;i++){
   await page.locator('#kind').selectOption(kind);await page.locator('#frame').selectOption(String(i));
   const paths=await page.locator('[data-layer="armor"]').evaluateAll(items=>items.map(e=>e.getAttribute('href')));
   assert.deepEqual(paths,ARMOR_SET_IDS.map(id=>armorFramePath(id,kind,i)));
   const pose=ARMOR_POSES[kind][i];
   const samples=await page.evaluate(async({paths,pose})=>{
    const [hx,hy,angle]=pose.head,radians=angle*Math.PI/180;
    const eyes=[[-20,20],[35,25]].map(([x,y])=>[hx+x*Math.cos(radians)-y*Math.sin(radians),hy+x*Math.sin(radians)+y*Math.cos(radians)]);
    const protectedPoints=[pose.flower,...pose.paws.map(p=>p.slice(0,2)),...eyes];
    // Read vector overlays alone: protection must be actual transparency, not painted-over pixels.
    return Promise.all(paths.map(async path=>{
     const image=new Image();image.src=path;await image.decode();const canvas=document.createElement('canvas');canvas.width=279;canvas.height=370;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
     const alpha=protectedPoints.map(([x,y])=>ctx.getImageData(Math.round(x),Math.round(y),1,1).data[3]);
     let ink=0;const bytes=ctx.getImageData(0,0,279,370).data;for(let n=3;n<bytes.length;n+=4)if(bytes[n])ink++;
     return {path,alpha,ink,width:image.naturalWidth,height:image.naturalHeight};
    }));
   },{paths,pose});
   for(const s of samples){assert.equal(s.width,279);assert.equal(s.height,370);assert.ok(s.ink>3000,s.path);assert.ok(s.alpha.every(n=>n===0),'protected detail covered: '+JSON.stringify(s));}
   results.push(...samples);
   // Wait for each displayed SVG image to be decoded before the screenshot.
   await page.evaluate(async()=>{await Promise.all([...document.querySelectorAll('.set image')].map(e=>{const im=new Image();im.src=e.getAttribute('href');return im.decode();}));});
   await page.screenshot({path:`qa/armor-review/${kind}-0${i+1}.png`,fullPage:true});
  }
  // Compare alpha silhouettes of torso constructions, with all colors discarded.
  // Recoloring one breastplate ten times must fail this regression.
  const silhouettes=await page.evaluate(async(paths)=>{
   const masks=await Promise.all(paths.map(async path=>{
    const xml=new DOMParser().parseFromString(await (await fetch(path)).text(),'image/svg+xml');
    xml.querySelectorAll('[data-part="helmet"],[data-part="boot"]').forEach(e=>e.remove());
    const image=new Image();image.src='data:image/svg+xml;base64,'+btoa(new XMLSerializer().serializeToString(xml));await image.decode();
    const c=document.createElement('canvas');c.width=279;c.height=370;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);
    const bytes=ctx.getImageData(0,0,279,370).data;return Array.from({length:279*370},(_,i)=>bytes[i*4+3]>127?1:0);
   }));
   const pairs=[];for(let i=0;i<masks.length;i++)for(let j=i+1;j<masks.length;j++){
    let union=0,difference=0;for(let n=0;n<masks[i].length;n++){union+=masks[i][n]|masks[j][n];difference+=masks[i][n]^masks[j][n];}
    pairs.push({a:paths[i],b:paths[j],silhouetteDifference:difference/union});
   }return pairs;
  },ARMOR_SET_IDS.map(id=>armorFramePath(id,'attack',0)));
  for(const pair of silhouettes)assert.ok(pair.silhouetteDifference>.10,'torso outlines too similar: '+JSON.stringify(pair));
  await fs.writeFile('qa/armor-review/silhouette-results.json',JSON.stringify({colorIndependent:true,minimumDifference:Math.min(...silhouettes.map(p=>p.silhouetteDifference)),pairs:silhouettes},null,2));
  // A fitted garment must cover the shoulder and flank that the old belly icon left bare.
  const fitted=await page.evaluate(async()=>{const i=new Image();i.src='art/armor-frames/steel/attack/01.svg';await i.decode();const c=document.createElement('canvas');c.width=279;c.height=370;const x=c.getContext('2d');x.drawImage(i,0,0);return [[125,242],[108,285],[111,304],[243,241]].map(([u,v])=>({u,v,alpha:x.getImageData(u,v,1,1).data[3]}));});
  for(const point of fitted)assert.equal(point.alpha,255,'garment leaves shoulder/flank bare: '+JSON.stringify(point));
  await page.goto(new URL('armor-fit-review.html',base).href);await page.waitForFunction(()=>window.fitReady);
  for(const kind of ['attack','hurt']){
   await page.locator('#kind').selectOption(kind);await page.waitForFunction(k=>[...document.querySelectorAll('main svg')].every(e=>e.dataset.frame.startsWith(k)),kind);
   await page.evaluate(async()=>{await Promise.all([...document.querySelectorAll('main image')].map(e=>{const i=new Image();i.src=e.getAttribute('href');return i.decode();}));});
   await page.screenshot({path:`qa/armor-review/fitted-steel-${kind}.png`,fullPage:true});
   if(kind==='attack'){const first=page.locator('main svg').first();await first.evaluate(e=>e.setAttribute('viewBox','25 65 240 285'));await first.screenshot({path:'qa/armor-review/fitted-steel-closeup.png'});await first.evaluate(e=>e.setAttribute('viewBox','0 0 279 370'));}
  }
  assert.equal(results.length,120);assert.deepEqual(errors,[]);
  await fs.writeFile('qa/armor-review/vector-render-results.json',JSON.stringify({browser:browser.version(),rendered:results.length,errors,results},null,2));
 }finally{await browser.close();}
});
test('ten armor sets survive equip, actual combat attack/hurt frames and localStorage reload on mobile',async()=>{
 const browser=await chromium.launch(launch);const errors=[];
 try{
  for(const armor of ARMORS.filter(a=>a.svg)){
   const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
   const p=freshProgress();Object.assign(p,{gold:10000,armor:100,equippedArmor:'none',ownedArmors:ARMORS.map(a=>a.id),autoUnlocked:true,autoEnabled:true});
   const b=startFight(p);b.enemyTimer=2.39;
   await page.clock.install({time:new Date('2026-10-16T16:00:00Z')});await page.clock.pauseAt(new Date('2026-10-16T16:01:00Z'));
   await page.addInitScript(({p,b})=>{Math.random=()=>.99;if(!sessionStorage.getItem('armor-seeded')){localStorage.setItem('hrabrolap-v0.2-save',JSON.stringify({...p,lastSeen:0,battleState:b}));sessionStorage.setItem('armor-seeded','1');}},{p,b});
   await page.goto(base);
   await page.locator('#inventory').click();
   await page.locator('.shop-item').filter({hasText:armor.name}).getByRole('button',{name:'Надеть',exact:true}).click();
   await page.locator('#modal-x').click();
   assert.equal(await page.locator('#hero-armor').getAttribute('data-armor-id'),armor.id);
   await page.evaluate(()=>{window.gearFrames=[];new MutationObserver(()=>{const a=document.querySelector('#hero-armor');window.gearFrames.push({body:document.querySelector('#hero-body').getAttribute('data-reference-frame'),armor:a.getAttribute('data-armor-pose'),href:a.getAttribute('href')});}).observe(document.querySelector('#hero-armor'),{attributes:true,attributeFilter:['href']});});
   await page.clock.runFor(1800);
   const seen=await page.evaluate(()=>window.gearFrames);
   for(const kind of ['attack','hurt'])for(let i=1;i<=6;i++)assert.ok(seen.some(s=>s.body===`${kind}-${i}`&&s.armor===s.body&&s.href===`art/armor-frames/${armor.id}/${kind}/0${i}.svg`),`${armor.id} missing ${kind} ${i}`);
   await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));await page.reload();
   assert.equal(await page.locator('#hero-armor').getAttribute('data-armor-id'),armor.id);
   assert.ok(await page.locator('#hero-armor').evaluate(e=>getComputedStyle(e).display!=='none'));
   if(['web','king'].includes(armor.id))await page.screenshot({path:`qa/armor-review/live-${armor.id}.png`});
   await page.close(); // Context lifetime belongs to the browser; do not close contexts in single-process builds.
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
