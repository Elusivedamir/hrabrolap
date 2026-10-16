import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

// Exact original Git blob hashes of the user-approved eight v0.9.3 monster models.
// These hashes were taken from hrabrolap-v0.9.3-knight-animated.zip.
export const APPROVED_V2 = Object.freeze({
 slime:'a3d531ccab1cc303fd5e8374c41cf7ec7db1c1ca',
 spider:'7ad01f4a30f6d9834942e3abbcceafe769be7508',
 mouse:'330d14ac372356ebdfec38ef8547f1a61dd9da2a',
 mushroom:'4d22fd8fcec87cc14615e2cd39ae81cf93e9d3b9',
 beetle:'21d7019836036c56e70aa48c2091f11b05bfd025',
 larva:'c08de30c30813d50d61f6fcb8e5bd808d4e7f416',
 bat:'93e5655155ac6320e594a941f640c3f7f9d74572',
 ghost:'3c066b6ab6d7d621d56f3f5293730a29e2ad1ae1'
});
test('eight approved v0.9.3 monsters must remain EXACT, not substituted by legacy SVG',async()=>{
 for(const [type,sha] of Object.entries(APPROVED_V2)){
  const bytes=await readFile(new URL('../art/monsters-v2/'+type+'.svg',import.meta.url));
  const actual=createHash('sha1').update(Buffer.from('blob '+bytes.length)).update(Buffer.from([0])).update(bytes).digest('hex');
  assert.equal(actual,sha,'Approved monster changed: '+type);
 }
});
test('game explicitly references the eight approved v2 models',async()=>{
 const js=await readFile(new URL('../game.mjs',import.meta.url),'utf-8');
 assert.match(js,/art\\/monsters-v2\\//);
 for(const type of Object.keys(APPROVED_V2)) assert.ok(js.includes("'"+type+"'"),'Model is not selected: '+type);
});
