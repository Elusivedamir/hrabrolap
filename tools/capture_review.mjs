// Real mobile-browser captures of the existing game, not rendered mockups.
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import * as c from '../game-core.mjs';
const base=process.env.HRABROLAP_BASE_URL||'http://127.0.0.1:8080/';
const browser=await chromium.launch({headless:true,...(process.env.HRABROLAP_CHROMIUM_EXECUTABLE?{executablePath:process.env.HRABROLAP_CHROMIUM_EXECUTABLE,args:['--no-zygote','--single-process','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{})});
const out=new URL('../qa/review/',import.meta.url);await fs.mkdir(out,{recursive:true});
const captures=[];const errors=[];
try{
 for(const name of ['attic-rest','skeleton-boss-attack','golem-boss-attack','fish-at-bucket','auto-speed-100']){
  const p=c.freshProgress();p.armor=100;
  if(name==='skeleton-boss-attack'){p.room=40;p.best=39;}
  if(name==='golem-boss-attack'){p.room=10;p.best=9;}
  if(name==='auto-speed-100')Object.assign(p,{room:100,best:99,autoUnlocked:true,autoEnabled:true,autoLevel:100});
  if(name==='fish-at-bucket'){p.nextCatchMs=200;p.catchPlan=[{species:'Плотва',slots:1,weight:.2,length:21,price:12,waitMs:200}];}
  const b=c.startFight(p);
  if(name==='attic-rest')Object.assign(b,{phase:'rest',rest:6});
  if(name.includes('boss-attack'))b.enemyTimer=2.39;
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install({time:new Date('2026-10-16T15:00:00Z')});await page.clock.pauseAt(new Date('2026-10-16T15:01:00Z'));
  await page.addInitScript(raw=>{Math.random=()=>.99;localStorage.setItem('hrabrolap-v0.2-save',JSON.stringify(raw));},{...p,lastSeen:0,battleState:b});
  await page.goto(base);await page.locator('#hero-rig').waitFor();
  await page.clock.runFor(name==='fish-at-bucket'?1300:name.includes('boss-attack')?224:800);
  await page.locator('#enemy-art').evaluate(img=>img.decode());
  await page.locator('#fishing-animation').evaluate(img=>img.decode());
  const path=new URL(name+'.png',out).pathname;await page.screenshot({path});
  captures.push({name,file:'qa/review/'+name+'.png',viewport:{width:390,height:844},monster:await page.locator('#enemy-holder').getAttribute('data-monster'),monsterPhase:await page.locator('#enemy-holder').getAttribute('data-monster-phase'),monsterFrame:await page.locator('#enemy-holder').getAttribute('data-monster-frame'),fishPose:await page.locator('#fishing-animation').getAttribute('src')});
 }
 if(errors.length)throw Error(JSON.stringify(errors));
 await fs.writeFile(new URL('captures.json',out),JSON.stringify({browser:browser.version(),method:'Playwright mobile touch emulation; seeded gameplay fixtures; unaltered page screenshots',captures,errors},null,2)+'\n');
 console.log(`Captured ${captures.length} real mobile game screens, Chromium ${browser.version()}, JS errors: ${errors.length}`);
}finally{await browser.close();}
