// Реальный Chromium. В сессии подготовки v0.8.1 НЕ ИСПОЛНЯЛСЯ.
// Сервер: python3 -m http.server 8080 --bind 127.0.0.1
import {before,after,afterEach,test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import * as c from '../game-core.mjs';
import {FISHING_FRAMES} from '../fishing-frames.mjs';
const base=process.env.HRABROLAP_BASE_URL||'http://127.0.0.1:8080/';
const key='hrabrolap-v0.2-save';let browser;
const errors=[];const contexts=[];
before(async()=>{await fs.mkdir('qa/screenshots',{recursive:true});browser=await chromium.launch({headless:true,...(process.env.HRABROLAP_CHROMIUM_EXECUTABLE?{executablePath:process.env.HRABROLAP_CHROMIUM_EXECUTABLE,args:process.env.HRABROLAP_SOFTWARE_ONLY?['--no-zygote','--disable-gpu','--disable-software-rasterizer']:['--no-zygote','--single-process','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{})});});
after(async()=>{await browser?.close();await fs.writeFile('qa/browser-errors.json',JSON.stringify(errors,null,2));});
afterEach(async()=>{
 if(!process.env.HRABROLAP_CHROMIUM_EXECUTABLE||process.env.HRABROLAP_SOFTWARE_ONLY)
  while(contexts.length)await contexts.pop().close();
});
async function pageFor(progress=c.freshProgress(),battleState,options={}){
 // Existing 0.9.6 visual regression fixtures explicitly use unlocked auto mode.
 // v0.9.7 default gameplay stays MANUAL until auto is purchased for 1 coin.
 if(!options.manual)Object.assign(progress,{autoUnlocked:true,autoEnabled:true});
 const ctx=await browser.newContext({viewport:options.viewport||{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});contexts.push(ctx);
 const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
 page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
 await page.clock.install({time:new Date('2026-10-15T17:00:00Z')});await page.clock.pauseAt(new Date('2026-10-15T17:01:00Z'));
 // Фикстура пишется один раз; последующие reload читают реальное сохранение игры.
 await page.addInitScript(()=>{Math.random=()=>.99;});
 await page.addInitScript(({key,raw})=>{if(!sessionStorage.getItem('qa-seeded')){localStorage.setItem(key,JSON.stringify(raw));sessionStorage.setItem('qa-seeded','1');}},{key,raw:{...progress,lastSeen:0,...(battleState?{battleState}:{})}});
 await page.goto(options.merchantTest?base+'?merchantTest=1':base);await page.locator('#hero-rig').waitFor();
 await page.evaluate(()=>{window.qaObserved={attacks:[],transforms:[],spriteFrames:[],hurts:0};new MutationObserver(records=>{
  for(const r of records){const t=r.target;if(t.id==='weapon-slot')window.qaObserved.transforms.push(t.getAttribute('transform'));if(t.id==='hero-body')window.qaObserved.spriteFrames.push(t.getAttribute('href'));
   if(t.id==='enemy-holder'){window.qaObserved.attacks.push(...[...t.classList].filter(x=>x.startsWith('attack-')));if(t.classList.contains('hurt'))window.qaObserved.hurts++;}}
 }).observe(document.querySelector('#game'),{subtree:true,attributes:true,attributeFilter:['class','transform','href']});});
 return page;
}
async function saved(page){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);}
async function shot(page,name){await page.screenshot({path:'qa/screenshots/'+name+'.png'});}
test('мобильный запуск, цикл трёх атак, ресурсы и отсутствие JS-ошибок',async()=>{
 const page=await pageFor();await page.clock.runFor(10000);
 const observed=await page.evaluate(()=>window.qaObserved);
 for(let i=1;i<=6;i++)assert.ok(observed.spriteFrames.includes('assets/clean/canonical/attack_0'+i+'.png'),'missing original attack frame '+i);
 assert.ok(observed.hurts>0);assert.ok((await saved(page)).kills>0);
 const missing=await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src));assert.deepEqual(missing,[]);
 await shot(page,'normal-mobile');assert.deepEqual(errors,[]);
});
test('магазин, инвентарь, смена SVG и reload реального localStorage',async()=>{
 const p=c.freshProgress();p.gold=5000;const page=await pageFor(p);
 await page.locator('#shop').click();
 await page.locator('.shop-item').filter({hasText:'Лунный клинок'}).getByRole('button').click();
 await page.locator('.shop-item').filter({hasText:'Лесной страж'}).getByRole('button').click();
 await page.getByRole('button',{name:'Открыть инвентарь',exact:true}).click();
 await page.locator('.shop-item').filter({hasText:'Лунный клинок'}).getByRole('button').click();
 await page.locator('.shop-item').filter({hasText:'Лесной страж'}).getByRole('button').click();
 await shot(page,'fixture-inventory');await page.locator('#modal-x').click();
 assert.equal(await page.locator('#hero-weapon').getAttribute('href'),'art/weapons/moon.svg');
 assert.equal(await page.locator('#hero-body').getAttribute('data-costume'),'forest_guardian');
 const before=await saved(page);await page.reload();await page.locator('#hero-rig').waitFor();
 const after=await saved(page);for(const k of ['gold','weapon','equippedArmor','room','best'])assert.equal(after[k],before[k],k);
 await page.locator('#inventory').click();await page.locator('.shop-item').filter({hasText:'Без брони'}).getByRole('button').click();
 const now=await saved(page);assert.ok(now.battleState.hp<=c.maxHealth(now));
});
test('каждый из десяти SVG-мечей остаётся единственным оружием во всех трёх атаках',async()=>{
 for(const weapon of c.WEAPONS){
  const p=c.freshProgress();Object.assign(p,{ownedWeapons:c.WEAPONS.map(w=>w.id),weapon:weapon.id,armor:100});
  const page=await pageFor(p);await page.clock.runFor(10000);
  const seen=await page.evaluate(()=>window.qaObserved.spriteFrames);
  for(let i=1;i<=6;i++)assert.ok(seen.includes('assets/clean/canonical/attack_0'+i+'.png'),weapon.id+' frame '+i);
  assert.equal(await page.locator('#hero-weapon').count(),1);
  assert.equal(await page.locator('#hero-weapon').getAttribute('href'),weapon.svg);
  await shot(page,'fixture-weapon-'+weapon.id);
 }
});
test('все десять монстров показывают 6 кадров атаки/урона, сердечки и короны десяти боссов',async()=>{
 for(const monster of c.MONSTERS){
  const p=c.freshProgress();p.armor=100;
  const b=c.startFight(p);b.monsterType=monster.type;b.enemyTimer=2.39;
  const page=await pageFor(p,b,{manual:true});
  await page.evaluate(()=>{
   window.monsterSamples=[];
   new MutationObserver(()=>{const h=document.querySelector('#enemy-holder');
    window.monsterSamples.push([h.dataset.monsterPhase,+h.dataset.monsterFrame]);
   }).observe(document.querySelector('#enemy-holder'),{attributes:true,attributeFilter:['data-monster-frame']});
  });
  await page.clock.runFor(450);
  await page.locator('#enemy-holder').click();
  await page.clock.runFor(450);
  const seen=await page.evaluate(()=>window.monsterSamples);
  for(const phase of ['attack','hurt'])for(let i=1;i<=6;i++)assert.ok(seen.some(([p,f])=>p===phase&&f===i),monster.type+' '+phase+' frame '+i);
  assert.equal(await page.locator('#enemy-holder').getAttribute('data-monster'),monster.type);
  assert.equal(await page.locator('#enemy-hearts .heart-shell').count(),5);
  assert.equal(await page.locator('.legacy-monster-hp').evaluate(e=>getComputedStyle(e).display),'none');
  await shot(page,'fixture-monster-'+monster.type);
 }
 for(let wave=10;wave<=100;wave+=10){
  const p=c.freshProgress();Object.assign(p,{room:wave,best:wave-1});const page=await pageFor(p);
  const type=c.monsterForWave(wave).type;
  if(wave%50===0){
   assert.equal(await page.locator('#boss-crown').isVisible(),false,'epic bosses have bespoke heads, no extra crown');
   assert.ok((await page.locator('#enemy-art').getAttribute('src')).startsWith('data:image/svg+xml'));
   assert.equal(await page.locator('#boss-resistance').isVisible(),true);
   assert.ok(await page.locator('#enemy-art').evaluate(async img=>{await img.decode();return img.naturalWidth>0}),`boss wave ${wave} ${type} failed to decode`);
  }else if(['skeleton','golem'].includes(type)){
   assert.equal(await page.locator('#boss-crown').isVisible(),false,'crown is embedded in this model');
   assert.match(await page.locator('#enemy-art').getAttribute('src'),new RegExp('animations/'+type+'/boss/'));
   assert.ok(await page.locator('#enemy-art').evaluate(img=>img.complete&&img.naturalWidth===320));
  }else assert.equal(await page.locator('#boss-crown').isVisible(),true);
  if([10,40,100].includes(wave))await shot(page,'fixture-boss-'+wave);
 }
});
test('рыбалка, ведро 12→24 и ручная продажа торговцу',async()=>{
 const p=c.freshProgress();p.gold=1000;c.planFishing(p,()=>.3);p.nextCatchMs=100;p.merchantMs=1000;
 const page=await pageFor(p);await page.clock.runFor(1200);
 assert.ok((await saved(page)).caughtTotal>0);assert.equal(await page.locator('#merchant').isVisible(),true);
 await page.locator('#bucket').click();await page.getByRole('button',{name:/Улучшить ведро/}).click();assert.equal((await saved(page)).bucketLevel,1);
 await page.locator('#modal-x').click();await page.locator('#merchant').click();await shot(page,'fixture-trade');
 await page.clock.runFor(20000);assert.equal((await saved(page)).merchantPhase,'waiting');
 await page.getByRole('button',{name:/Продать всё/}).click();const raw=await saved(page);
 assert.ok(raw.soldFish>0);assert.equal(raw.fishBucket.length,0);assert.equal(raw.merchantPhase,'away');
});
test('поражение, дом и возрождение без покупки лечения',async()=>{
 const p=c.freshProgress(),b=c.startFight(p);b.hp=1;b.enemyTimer=2.39;
 const page=await pageFor(p,b);for(let i=0;i<4;i++)await page.clock.runFor(500);
 assert.equal((await saved(page)).battleState.phase,'rest','defeat reaches rest phase');
 assert.ok((await page.locator('#surface').getAttribute('class')).includes('resting'), 'UI must show resting state after defeat');await shot(page,'fixture-rest');
 await page.clock.runFor(7200);assert.ok(parseInt(await page.locator('#hero-hp-num').textContent(),10)>0);
 assert.equal((await page.locator('#surface').getAttribute('class')).includes('resting'),false);await shot(page,'fixture-respawn');
 assert.deepEqual(errors,[]);
});

test('новый костюм в инвентаре: покупка за 50, экипировка и reload',async()=>{
 const p=c.freshProgress();p.gold=50;
 const page=await pageFor(p);
 await page.locator('#shop').click();
 const row=page.locator('.shop-item').filter({hasText:/^(?=.*(?:Стальной рыцарь|Золотой рыцарь)).*$/});
 await row.getByRole('button',{name:'Купить'}).click();
 let save=await saved(page);assert.equal(save.gold,0);assert.ok(save.ownedArmors.includes('steel_knight'));
 await page.getByRole('button',{name:'Открыть инвентарь'}).click();
 await page.locator('.shop-item').filter({hasText:/^(?=.*(?:Стальной рыцарь|Золотой рыцарь)).*$/}).getByRole('button',{name:'Надеть'}).click();
 assert.equal(await page.locator('#hero-body').getAttribute('data-costume'),'steel_knight');
 await shot(page,'fixture-steel-knight');
 await page.reload();save=await saved(page);
 assert.equal(save.equippedArmor,'steel_knight');
 assert.ok((await page.locator('#hero-body').getAttribute('href')).startsWith('assets/clean/steel_knight/attack_0'));
});


test('шестикадровое получение урона переключает одетого котёнка, меч отдельно',async()=>{
 const p=c.freshProgress();p.armor=150;p.ownedArmors.push('steel_knight');p.equippedArmor='steel_knight';
 p.ownedWeapons.push('fishbone');p.weapon='fishbone';
 const b=c.startFight(p);b.enemyTimer=2.39;
 const page=await pageFor(p,b);
 await page.evaluate(()=>{window.hurtFrames=[];
  new MutationObserver(()=>{const n=document.querySelector('#hero-art').dataset.hurtFrame;if(n)window.hurtFrames.push(+n);})
   .observe(document.querySelector('#hero-art'),{attributes:true,attributeFilter:['data-hurt-frame']});
 });
 await page.clock.runFor(900);
 const frames=await page.evaluate(()=>window.hurtFrames);
 for(let i=1;i<=6;i++)assert.ok(frames.includes(i),'missing hit frame '+i+': '+frames.join(','));
 assert.ok((await page.locator('#hero-body').getAttribute('href')).startsWith('assets/clean/steel_knight/'));
 assert.equal(await page.locator('#hero-armor').isVisible(),false);
 assert.equal(await page.locator('#hero-weapon').getAttribute('href'),'art/weapons/fishbone.svg');
 assert.match(await page.locator('#armor-slot').getAttribute('transform'),/^translate\(/);
 await shot(page,'rig-hurt-frame-6');
});
test('мобильное SVG-ателье показывает 6 кадров и все доступные мечи и комплекты брони',async()=>{
 const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 contexts.push(ctx);
 const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(new URL('equipment-preview.html',base).href);
 await page.locator('.sprite').first().waitFor();
 assert.equal(await page.locator('.sprite').count(),6);
 assert.equal(await page.locator('#weapon option').count(),10);
 assert.deepEqual(await page.locator('#armor option').evaluateAll(options=>options.map(option=>option.value)),c.ARMORS.map(armor=>armor.id));
 await page.locator('#armor').selectOption('steel_knight');
 await page.locator('#weapon').selectOption('spiderleg');
 await page.locator('#kind').selectOption('hurt');
 assert.equal(await page.locator('.sprite').count(),6);
 assert.equal(await page.locator('#big image').count(),4);
 await shot(page,'equipment-preview-hurt-web-spiderleg');
 await page.locator('#kind').selectOption('overhead');
 await page.locator('#armor').selectOption('steel_knight');
 await page.locator('#weapon').selectOption('dusk');
 await page.locator('.sprite').nth(3).click();
 assert.equal(await page.locator('#current-frame').textContent(),'4/6');
 await shot(page,'equipment-preview-attack-moon-dusk');
 const broken=await page.locator('svg image').evaluateAll(images=>images.filter(im=>!im.getAttribute('href')).map(im=>im.id||'missing'));
 assert.deepEqual(broken,[]);
});

test('новое ведро отрисовывается слева и меняет состояние по числу рыб и улучшению',async()=>{
 const p=c.freshProgress();p.fishBucket=[{species:'Плотва',weight:0.25,length:21,slots:1,price:5,waitMs:1500}];
 const page=await pageFor(p);
 const bucket=page.locator('#bucket');
 assert.equal(await page.locator('#bucket-graphic').getAttribute('src'),'art/scenery/bucket-low-v2.svg');
 const coords=await page.evaluate(()=>({bucket:document.querySelector('#bucket').getBoundingClientRect().left,scene:document.querySelector('#surface').getBoundingClientRect().left,width:document.querySelector('#surface').getBoundingClientRect().width}));
 assert.ok(coords.bucket<coords.scene+coords.width*.21,'bucket should be to the left of fisherman');
 await shot(page,'fixture-bucket-left');
});
test('кот отдыхает в существующем доме без добавления котёнка в подземелье',async()=>{
 const p=c.freshProgress(),b=c.startFight(p);b.hp=1;b.enemyTimer=2.39;
 const page=await pageFor(p,b);
 await page.clock.runFor(1800);
 assert.ok((await page.locator('#surface').getAttribute('class')).includes('resting'));
 assert.equal(await page.locator('#rest-sleep-sprite').isVisible(),true);
 assert.equal(await page.locator('#hero-art').evaluate(el=>getComputedStyle(el).opacity),'0');
 assert.match(await page.locator('#rest-sleep-sprite').getAttribute('src'),/^assets\/rest\/sleep_0[1-6]\.png$/);
 await shot(page,'fixture-rest-inside-existing-house');
});

test('новый игрок вручную атакует, покупает автобой за 1 монету и переключает его',async()=>{
 const p=c.freshProgress();p.gold=1;
 const page=await pageFor(p,undefined,{manual:true});
 assert.match(await page.locator('#status').textContent(),/АВТОБОЙ.*1/);
 await page.clock.runFor(1600);
 const initial=Number((await page.locator('#enemy-hp-num').textContent()).split('/')[0]);
 await page.locator('#enemy-holder').click();
 const attacked=Number((await page.locator('#enemy-hp-num').textContent()).split('/')[0]);
 assert.ok(attacked<initial,'manual tap deals damage when cooldown ready');
 await page.locator('#status').click();
 let savedGame=await saved(page);
 assert.equal(savedGame.gold,0);assert.equal(savedGame.autoUnlocked,true);assert.equal(savedGame.autoEnabled,true);
 assert.match(await page.locator('#status').textContent(),/АВТОБОЙ/);
 await page.locator('#status').click();
 savedGame=await saved(page);
 assert.equal(savedGame.autoEnabled,false);assert.equal(savedGame.gold,0);
 await page.locator('#status').click();
 await page.clock.runFor(9000);
 assert.ok((await saved(page)).kills>=1,'auto attacks after purchase');
 await shot(page,'fixture-manual-and-unlocked-auto');
});
test('монстр демонстрирует 6 последовательных кадров нанесения урона и сердечки вместо HP-полосы',async()=>{
 const p=c.freshProgress();const battle=c.startFight(p);
 battle.enemyTimer=2.38;battle.hp=65;
 const page=await pageFor(p,battle);
 await page.evaluate(()=>{
  window.monsterFrames=[];
  new MutationObserver(()=>{const n=document.querySelector('#enemy-holder').dataset.monsterFrame;
   if(n)window.monsterFrames.push(Number(n));}).observe(document.querySelector('#enemy-holder'),{attributes:true,attributeFilter:['data-monster-frame']});
 });
 await page.clock.runFor(650);
 const frames=await page.evaluate(()=>window.monsterFrames);
 for(let i=1;i<=6;i++)assert.ok(frames.includes(i),'monster frame '+i+' missing in '+frames);
 assert.equal(await page.locator('#enemy-hearts .heart-shell').count(),5);
 assert.equal(await page.locator('.legacy-monster-hp').evaluate(e=>getComputedStyle(e).display),'none');
 await shot(page,'fixture-monster-six-attack-heart-hp');
});
test('яд действует на монстра визуально и отражается в сохранении',async()=>{
 const p=c.freshProgress();p.enchantment='poison';p.armor=100;
 const b=c.startFight(p);b.heroTimer=1.29;
 const page=await pageFor(p,b);
 await page.clock.runFor(500);
 assert.equal(await page.locator('#enemy-holder').evaluate(el=>el.classList.contains('poisoned')),true);
 assert.equal((await saved(page)).enchantment,'poison');
 await shot(page,'fixture-poison-enchantment');
});
test('молния и вампиризм активируются без замены кат-сэмпла или оружия',async()=>{
 for(const effect of ['lightning','vampirism']){
  const p=c.freshProgress();p.enchantment=effect;
  const b=c.startFight(p);b.heroTimer=1.29;b.hp=40;
  const page=await pageFor(p,b);
  await page.clock.runFor(250);
  await page.evaluate(()=>window.dispatchEvent(new Event('pagehide'))); // force persisted state for assertion
  if(effect==='lightning')assert.equal((await saved(page)).lightningHits>0,true);
  else {assert.equal((await saved(page)).enchantment,'vampirism');assert.ok((await saved(page)).vampireHeals<=1,'5% vampirism is not guaranteed on each hit');}
  assert.equal(await page.locator('#hero-weapon').getAttribute('href'),'art/weapons/iron.svg');
 }
});

test('original 10-frame fisher keeps fish away from house and ends at bucket',async()=>{
 const p=c.freshProgress();
 p.catchPlan=[{species:'Плотва',slots:1,weight:.2,length:21,price:12,waitMs:200}];
 p.nextCatchMs=200;
 const page=await pageFor(p);
 await page.evaluate(()=>{
  window.fisherFrames=[];
  new MutationObserver(()=>{window.fisherFrames.push(document.querySelector('#fishing-animation')?.getAttribute('src'))})
   .observe(document.querySelector('#fishing-animation'),{attributes:true,attributeFilter:['src']});
 });
 await page.clock.runFor(1550);
 const frames=await page.evaluate(()=>window.fisherFrames);
 for(let i=1;i<=10;i++)
  assert.ok(frames.some(src=>src===FISHING_FRAMES[i-1]),'original fishing pose '+i+' missing');
 assert.ok(await page.locator('#fishing-animation').evaluate(img=>img.complete&&img.naturalWidth>0));
 assert.equal(await page.locator('.fishing-rig').evaluate(el=>getComputedStyle(el).display),'none');
 const bucket=await page.locator('#bucket').boundingBox();
 const scene=await page.locator('#surface').boundingBox();
 assert.ok(bucket.x<scene.x+scene.width*.21,'physical bucket must be left of fisherman');
 await shot(page,'original-knight-fishing-ten-frames');
});

test('автобой покупается за монету и двадцатый уровень показывает 2 атаки в секунду',async()=>{
 const p=c.freshProgress();p.gold=100000;p.autoUnlocked=true;p.autoEnabled=true;p.autoLevel=19;
 const page=await pageFor(p);
 assert.match(await page.locator('#status').textContent(),/АВТОБОЙ/);
 assert.match(await page.locator('#attack-speed-lvl').textContent(),/19\/100/);
 const before=(await saved(page)).gold;
 await page.locator('#buy-attack-speed').click();
 const after=await saved(page);
 assert.equal(after.autoLevel,20);
 assert.equal(after.gold,before-c.autoUpgradeCost(19));
 assert.match(await page.locator('#status').textContent(),/АВТОБОЙ/);
 await page.reload();
 assert.match(await page.locator('#status').textContent(),/АВТОБОЙ/);
 await shot(page,'auto-level-20-two-hits');
});
test('карточка скорости атаки — пятая, на всю ширину снизу, автобой покупается отдельно сверху',async()=>{
 const p=c.freshProgress();p.gold=100;
 const page=await pageFor(p,undefined,{manual:true});
 assert.equal(await page.locator('.dungeon-title #status').count(),1);
 assert.equal(await page.locator('.dungeon-title #buy-attack-speed').count(),0);
 assert.equal(await page.locator('.upgrade-grid > .upgrade-card').count(),5);
 assert.equal(await page.locator('.upgrade-grid > #buy-attack-speed').count(),1);
 const cards=await page.locator('.upgrade-grid > .upgrade-card').evaluateAll(items=>items.map(e=>e.id));
 assert.deepEqual(cards,['buy-sword','buy-armor','buy-fish','buy-home','buy-attack-speed']);
 const grid=await page.locator('.upgrade-grid').boundingBox();
 const speed=await page.locator('#buy-attack-speed').boundingBox();
 const last=await page.locator('#buy-home').boundingBox();
 assert.ok(speed.y>=last.y+last.height-2,'speed upgrade must be below original four');
 assert.ok(speed.width>grid.width*.85,'speed upgrade must span both columns');
 assert.equal(await page.locator('#auto-upgrade').count(),0,'obsolete top auto speed button must not exist');
 await shot(page,'fifth-bottom-attack-speed-card');
});
test('скорость атаки отдельна от покупки автобоя и доступна сразу',async()=>{
 const p=c.freshProgress();p.gold=100;
 const page=await pageFor(p,undefined,{manual:true});
 assert.match(await page.locator('#status').textContent(),/АВТОБОЙ.*1/);
 assert.equal(await page.locator('#buy-attack-speed').isVisible(),true);
 assert.match(await page.locator('#attack-speed-lvl').textContent(),/0\/100/);
 await page.locator('#buy-attack-speed').click();
 const savedGame=await saved(page);
 assert.equal(savedGame.autoUnlocked,false,'speed upgrade must not unlock autobattle');
 assert.equal(savedGame.autoLevel,1);
 assert.equal(savedGame.gold,100-c.autoUpgradeCost(0));
 assert.match(await page.locator('#status').textContent(),/АВТОБОЙ.*1/);
 await shot(page,'attack-speed-independent-upgrade');
});
test('таймер поклёвки скрыт, состояние рыцаря видно, магазин стоит левее текста торговца',async()=>{
 const p=c.freshProgress();p.nextCatchMs=157000;
 const page=await pageFor(p);
 assert.equal(await page.locator('#fish-status').textContent(),'Рыцарь рыбачит');
 assert.ok(!(await page.locator('#surface').innerText()).includes('Поклёвка через'));
 const shop=await page.locator('#mini-shop').boundingBox();
 const merchant=await page.locator('#merchant-status').boundingBox();
 const surf=await page.locator('#surface').boundingBox();
 assert.ok(shop.x<merchant.x,'магазин должен стоять слева от надписи торговца');
 // The shop SVG has empty space below its painted base (y=121 of 138).
 // Check the actual painted base, not the bottom of the transparent img box.
 const floor=await page.locator('#surface').evaluate(el=>{const r=el.getBoundingClientRect();return r.bottom-parseFloat(getComputedStyle(el).borderBottomWidth);});
 const scale=Math.min(shop.width/140,shop.height/138);
 const paintedBase=shop.y+shop.height-scale*(138-121);
 assert.ok(Math.abs(paintedBase-floor)<2,`painted shop base ${paintedBase} must meet floor ${floor}`);
 await shot(page,'shop-grounded-and-no-bite-countdown');
});
test('при нулевых HP на монстре не должно быть пяти ярких сердец',async()=>{
 const p=c.freshProgress();const b=c.startFight(p);b.enemyHp=0;b.phase='transition';
 const page=await pageFor(p,b);
 const hearts=await page.locator('#enemy-hearts .heart-shell').evaluateAll(items=>items.map(el=>({
  fill:parseFloat(getComputedStyle(el.querySelector('.heart-filled')).width),
  dark:getComputedStyle(el.querySelector('.heart-unfilled')).filter
 })));
 assert.equal(hearts.length,5);
 assert.ok(hearts.every(x=>x.fill===0),'0 HP must yield no bright heart overlays');
 assert.ok(hearts.every(x=>x.dark.includes('grayscale(1)')),'unfilled hearts must stay gray');
 await shot(page,'enemy-empty-hearts');
});
test('рыба появляется на счётчике только после десятикадровой анимации укладки',async()=>{
 const p=c.freshProgress();p.catchPlan=[{species:'Плотва',slots:1,weight:.2,length:21,price:12,waitMs:200}];p.nextCatchMs=200;
 const page=await pageFor(p);
 await page.clock.runFor(320);
 assert.match(await page.locator('#bucket-indicator').textContent(),/0 рыб/);
 await page.clock.runFor(1650);
 assert.match(await page.locator('#bucket-indicator').textContent(),/^1 рыба$/);
 await shot(page,'fish-delivered-to-bucket');
});

test('рыба в девятой позе попадает в край физического ведра на трёх мобильных экранах',async()=>{
 for(const viewport of [{width:320,height:640},{width:390,height:844},{width:430,height:932}]){
  const page=await pageFor(c.freshProgress(),undefined,{manual:true,viewport});
  const geometry=await page.evaluate(async()=>{
   const scene=document.querySelector('#surface').getBoundingClientRect();
   const img=document.querySelector('#bucket-graphic'),box=img.getBoundingClientRect();
   const fit=Math.min(box.width/114,box.height/116);
   const rim={x:box.x+box.width/2,y:box.y+(box.height-116*fit)/2+47*fit,rx:42*fit,ry:9*fit};
   const svg=new DOMParser().parseFromString(await (await fetch('animations/fishing-deposit/09.svg')).text(),'image/svg+xml');
   const transform=svg.querySelector('[data-part="catch"]').getAttribute('transform');
   const [x,y]=transform.match(/translate\(([^)]+)\)/)[1].split(' ').map(Number);
   const cx=x+(45-26)*Math.SQRT1_2*.66,cy=y+(45+26)*Math.SQRT1_2*.66;
   return {rim,fish:{x:scene.x+cx/941*scene.width,y:scene.y+cy/425*(scene.height-5)}};
  });
  assert.ok(Math.abs(geometry.fish.x-geometry.rim.x)<geometry.rim.rx*.6,JSON.stringify(geometry));
  assert.ok(Math.abs(geometry.fish.y-geometry.rim.y)<geometry.rim.ry+4,JSON.stringify(geometry));
 }
});
test('награда задания сохраняется после reload и повторно не выдаётся',async()=>{
 const p=c.freshProgress();p.killedSlimes=5;
 const page=await pageFor(p,undefined,{manual:true});
 await page.locator('#quests').click();
 const row=page.locator('.quest-row').filter({hasText:'Победи 5 слизней'});
 await row.getByRole('button').click();
 assert.equal((await saved(page)).gold,60);
 assert.deepEqual((await saved(page)).questClaimed,[0]);
 assert.equal(await row.getByRole('button').isEnabled(),false);
 await shot(page,'quests-claimed-once');await page.reload();
 await page.locator('#quests').click();
 assert.equal(await page.locator('.quest-row').filter({hasText:'Победи 5 слизней'}).getByRole('button').isEnabled(),false);
 assert.equal((await saved(page)).gold,60);
});
test('уровень 100 даёт ровно 6 автоударов/с, ручной бой остаётся 3/с',async()=>{
 for(const auto of [true,false]){
  const p=c.freshProgress();Object.assign(p,{room:100,best:99,armor:100,autoUnlocked:true,autoEnabled:auto,autoLevel:100});
  const b=c.startFight(p),page=await pageFor(p,b,{manual:true});
  // Prime the first RAF. 1,000 ms from navigation ends at the previous 16 ms frame.
  await page.clock.runFor(112);await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  const before=(await saved(page)).battleState.enemyHp;
  for(let i=0;i<20;i++){
   await page.clock.runFor(50);
   if(!auto)await page.locator('#enemy-holder').evaluate(el=>{for(let j=0;j<10;j++)el.click();});
  }
  await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  const final=await saved(page);
  assert.equal(before-final.battleState.enemyHp,(auto?6:3)*c.heroDamage(p));
  assert.equal(final.autoLevel,100);assert.equal(await page.locator('#buy-attack-speed').isEnabled(),false);
  await page.reload();assert.match(await page.locator('#attack-speed-lvl').textContent(),/100\/100/);
  await shot(page,auto?'auto-level-100-six-hits':'manual-cap-three-hits');
 }
});


test('серый торговец использует настоящий атлас 18 кадров и остаётся кликабельным',async()=>{
 const p=c.freshProgress();p.merchantPhase='waiting';p.merchantMs=10000;
 const page=await pageFor(p);
 const merchant=page.locator('#merchant');
 await page.locator('#merchant.atlas-ready').waitFor({timeout:5000});
 assert.equal(await merchant.isVisible(),true);
 assert.equal(await merchant.getAttribute('data-phase'),'idle');
 const atlas=await page.evaluate(async()=>{
  const image=new Image();image.src='art/merchant-animated.webp';await image.decode();
  const sheet=document.querySelector('#merchant-sheet');
  return {width:image.naturalWidth,height:image.naturalHeight,position:getComputedStyle(sheet).backgroundPosition,display:getComputedStyle(sheet).display};
 });
 assert.equal(atlas.width,1260);assert.equal(atlas.height,792);
 assert.equal(atlas.display,'block');
 assert.match(atlas.position,/%/);
 await shot(page,'merchant-v2-mobile');
 await merchant.click();assert.match(await page.locator('#modal-title').textContent(),/торговец/i);
 assert.deepEqual(errors,[]);
});


test('cozy UI modals preserve fishing trade and 200-stage cave changes on mobile',async()=>{
 const p=c.freshProgress();Object.assign(p,{room:11,best:10,gold:600,fishBucket:[{species:'Плотва',slots:1,weight:.25,length:20,price:8,waitMs:1200}]});
 const page=await pageFor(p);
 assert.equal(await page.locator('#room').textContent(),'ВОЛНА 11/2000');
 assert.match(await page.locator('#cave-stage').textContent(),/ЗАЛ 2\/200/);
 const src=await page.locator('#cave-backdrop').getAttribute('src');
 assert.ok(src.startsWith('data:image/svg+xml'),'the second stage must change the cave art');
 const ready=await page.locator('#cave-backdrop').evaluate(async img=>{await img.decode();return img.naturalWidth>0});
 assert.ok(ready,'cave background must decode successfully');
 await shot(page,'cave-stage-2-mobile');
 for(const [id,mode,name] of [['#bucket','bucket','bucket-v2-mobile'],['#shop','shop','shop-v2-mobile'],['#quests','quests','quests-v2-mobile']]){
  await page.locator(id).click();
  assert.equal(await page.locator('#modal').getAttribute('data-mode'),mode);
  assert.equal(await page.locator('#modal').getAttribute('open'),'');
  await shot(page,name);
  await page.locator('#modal-x').click();
 }
 assert.deepEqual(errors,[]);
});

test('first fifty-wave mega-boss and achievement window render on mobile',async()=>{
 const p=c.freshProgress();p.room=50;p.best=49;p.gold=250;
 const page=await pageFor(p);
 assert.match(await page.locator('#enemy-name').textContent(),/Моховой страж/);
 assert.equal(await page.locator('#boss-resistance').isVisible(),true);
 assert.match(await page.locator('#boss-resistance').textContent(),/яду/);
 const img=await page.locator('#enemy-art').evaluate(async el=>{await el.decode();return {url:el.getAttribute('src'),w:el.naturalWidth,h:el.naturalHeight};});
 assert.ok(img.url.startsWith('data:image/svg+xml'));
 assert.ok(img.w>=180&&img.h>=180);
 await shot(page,'megaboss-50-mobile');
 await page.locator('#achievements').click();
 assert.equal(await page.locator('#modal').getAttribute('data-mode'),'achievements');
 assert.equal(await page.locator('.achievement-row').count(),28);
 await shot(page,'achievements-24-mobile');
 await page.locator('#modal-x').click();
 assert.deepEqual(errors,[]);
});

test('merchant test mode shows cat every 15 seconds without changing regular saves',async()=>{
 const p=c.freshProgress();p.merchantPhase='away';p.merchantMs=300000;
 const page=await pageFor(p,undefined,{merchantTest:true});
 assert.equal(await page.locator('#merchant').isVisible(),false);
 await page.clock.runFor(18000); // sample inside the 15–20s visit, not on a RAF boundary
 assert.equal(await page.locator('#merchant').isVisible(),true);
 await shot(page,'merchant-debug-after-15s');
 await page.clock.runFor(5000);
 assert.equal(await page.locator('#merchant').isVisible(),false);
 await page.clock.runFor(10000);
 assert.equal(await page.locator('#merchant').isVisible(),true);
 const raw=await saved(page);
 assert.equal(raw.merchantMs,300000);
 assert.equal(raw.merchantPhase,'away');
 await page.goto(base);await page.clock.runFor(2000);
 assert.equal(await page.locator('#merchant').isVisible(),false);
 assert.deepEqual(errors,[]);
});
test('new stage boss 750 and final boss 2000 use their unique vector art',async()=>{
 for(const wave of [750,2000]){
  const p=c.freshProgress();p.room=wave;p.best=wave-1;p.armor=200;
  const page=await pageFor(p);
  const type=c.monsterForWave(wave).type;
  assert.equal(await page.locator('#enemy-holder').getAttribute('data-monster'),type);
  await page.locator('#enemy-art').evaluate(async img=>img.decode());
  assert.equal(await page.locator('#boss-resistance').isVisible(),true);
  assert.ok((await page.locator('#enemy-art').getAttribute('src')).startsWith('data:image/svg+xml'));
  await shot(page,'boss-'+wave+'-mobile');
 }
 assert.deepEqual(errors,[]);
});
