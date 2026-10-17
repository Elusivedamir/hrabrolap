import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MERCHANT_FRAME_COUNT,MERCHANT_VISIT_MS,merchantFrameSvg,merchantFrameUrl,merchantVisual} from '../merchant-sprites.mjs';
import {freshProgress,stepMerchant} from '../game-core.mjs';

test('merchant has exactly 18 coherent transparent SVG frames',()=>{
 assert.deepEqual(MERCHANT_FRAME_COUNT,{arrive:6,idle:6,leave:6});
 for(const phase of ['arrive','idle','leave']){
  const unique=new Set();
  for(let i=0;i<6;i++){
   const svg=merchantFrameSvg(phase,i);
   assert.match(svg,/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
   assert.match(svg,/viewBox="0 0 210 255"/);
   assert.match(svg,/id="fur"/);
   assert.match(svg,/id="coat"/);
   assert.match(svg,/id="leather"/);
   assert.doesNotMatch(svg,/<(?:rect|image)[^>]+(?:background|floor|platform)/i);
   const data=merchantFrameUrl(phase,i);
   assert.ok(data.startsWith('data:image/svg+xml;charset=utf-8,'));
   assert.equal(decodeURIComponent(data.split(',').slice(1).join(',')),svg);
   unique.add(data);
  }
  assert.equal(unique.size,6,phase+' is not a six-frame animation');
 }
});
test('merchant enters, waits for 15 seconds, and walks away',()=>{
 assert.equal(MERCHANT_VISIT_MS,15000);
 assert.deepEqual(merchantVisual('away',300000,500,0),{visible:false,phase:'idle',frame:0});
 assert.deepEqual(merchantVisual('waiting',15000),{visible:true,phase:'arrive',frame:0});
 assert.deepEqual(merchantVisual('waiting',14400),{visible:true,phase:'arrive',frame:5});
 assert.equal(merchantVisual('waiting',10000).phase,'idle');
 assert.equal(merchantVisual('waiting',100).phase,'leave');
 assert.equal(merchantVisual('waiting',100).frame,5);
 assert.equal(merchantVisual('away',300000,1000,1600).phase,'leave');
 assert.equal(merchantVisual('away',300000,1601,1600).visible,false);
});
test('merchant animation uses existing visit timer and does not change saves or fish logic',()=>{
 const p=freshProgress();p.merchantPhase='away';p.merchantMs=100;
 assert.deepEqual(stepMerchant(p,100),[{kind:'merchant-arrive'}]);
 assert.equal(p.merchantPhase,'waiting');assert.equal(p.merchantMs,15000);
 assert.deepEqual(stepMerchant(p,15000),[{kind:'merchant-leave'}]);
 assert.equal(p.merchantPhase,'away');assert.equal(p.merchantMs,300000);
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const game=fs.readFileSync(new URL('../game.mjs',import.meta.url),'utf8');
 assert.ok(html.includes('id="merchant-art"'));
 assert.ok(game.includes('merchantFrameUrl(pose.phase,pose.frame)'));
 assert.ok(game.includes('merchant.classList.toggle(\'visible\',pose.visible)'));
});


test('detailed merchant WebP atlas is shipped and used in the harbor',()=>{
 const atlas=fs.readFileSync(new URL('../art/merchant-animated.webp',import.meta.url));
 assert.ok(atlas.length>10000);
 assert.equal(atlas.subarray(0,4).toString('ascii'),'RIFF');
 assert.equal(atlas.subarray(8,12).toString('ascii'),'WEBP');
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const game=fs.readFileSync(new URL('../game.mjs',import.meta.url),'utf8');
 const css=fs.readFileSync(new URL('../style.css',import.meta.url),'utf8');
 assert.ok(html.includes('id="merchant-sheet"'));
 assert.ok(game.includes("merchantAtlasImage.src='art/merchant-animated.webp'"));
 assert.ok(game.includes("backgroundPosition=(pose.frame*20)"));
 assert.ok(css.includes('background-size:600% 300%'));
});
