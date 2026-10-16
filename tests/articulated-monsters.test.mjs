import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
test('skeleton and golem have distinct articulated attack/hurt frames with fitted boss crowns',async()=>{
 for(const type of ['skeleton','golem'])for(const variant of ['normal','boss'])for(const phase of ['attack','hurt']){
  const hashes=new Set();
  for(let i=1;i<=6;i++){
   const s=await readFile(new URL(`../animations/${type}/${variant}/${phase}/0${i}.svg`,import.meta.url),'utf8');
   assert.match(s,/data-model="(skeleton|golem)-articulated"/);
   assert.ok(s.includes(`data-phase="${phase}" data-frame="${i}"`));
   // Hash the drawn content (strip metadata): separate joint poses, not six labels on one still.
   hashes.add(createHash('sha256').update(s.slice(s.indexOf('<defs>'))).digest('hex'));
   assert.equal(s.includes('data:image/svg+xml;base64,'),variant==='boss');
   assert.ok((s.match(/<g transform="rotate\(/g)||[]).length>=5,'independently moving joints');
  }
  assert.ok(hashes.size>=5,'wind-up, contact, recoil and recovery must differ');
 }
});
