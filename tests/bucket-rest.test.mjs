import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import {bucketStage,bucketArt,sleepFrameIndex,SLEEP_FRAMES} from '../bucket-rest.mjs';
test('bucket count 0, 1..4, 5..7, upgrade overlap at 7, 8..24',()=>{
 assert.equal(bucketStage(0,false),'empty');
 for(let n=1;n<=4;n++)assert.equal(bucketStage(n,false),'low');
 for(let n=5;n<=12;n++)assert.equal(bucketStage(n,false),'mid');
 for(let n=1;n<=4;n++)assert.equal(bucketStage(n,true),'low');
 for(let n=5;n<=6;n++)assert.equal(bucketStage(n,true),'mid');
 for(let n=7;n<=24;n++)assert.equal(bucketStage(n,true),'full');
 assert.match(bucketArt(7,true),/bucket-full\.svg$/);
 assert.match(bucketArt(7,false),/bucket-mid\.svg$/);
});
test('all six source frames exist and every frame is shown at least once',()=>{
 assert.equal(SLEEP_FRAMES.length,6);
 for(let n=0;n<6;n++){
  assert.ok(fs.existsSync(new URL('../'+SLEEP_FRAMES[n],import.meta.url)));
  assert.equal(sleepFrameIndex(n*430),n);
 }
 assert.equal(sleepFrameIndex(6*430),4);
 assert.equal(sleepFrameIndex(6*430+760),5);
});