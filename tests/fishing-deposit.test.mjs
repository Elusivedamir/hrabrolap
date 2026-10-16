import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {FISHING_FRAMES} from '../fishing-frames.mjs';
test('10 fishing poses retain original knight; only free fish deposit position differs',async()=>{
 assert.equal(FISHING_FRAMES.length,10);
 const old=await readFile(new URL('../animations/fishing/09.svg',import.meta.url),'utf8');
 const fixed=await readFile(new URL('../'+FISHING_FRAMES[8],import.meta.url),'utf8');
 assert.equal(fixed,old.replace('translate(58 340) rotate(45) scale(.66)','translate(84 257) rotate(45) scale(.66)'));
});
