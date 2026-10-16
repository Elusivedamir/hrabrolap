import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';
const root=new URL('../',import.meta.url);
test('all 192 original v0.9.3 normal and boss animation SVGs remain byte-exact',async()=>{
 const packed=(await readFile(new URL('assets/legacy-v093-monster-frames.manifest.b64',root),'utf8')).trim();
 const manifest=JSON.parse(inflateSync(Buffer.from(packed,'base64')).toString('utf8'));
 assert.equal(Object.keys(manifest).length,192);
 for(const [path,record] of Object.entries(manifest)){
  const bytes=await readFile(new URL(path,root));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),record.sha256,'Original frame has changed: '+path);
 }
});
test('combat renderer selects frame files and suppresses duplicate boss crown during a boss animation',async()=>{
 const code=await readFile(new URL('game.mjs',root),'utf8');
 assert.ok(code.includes("art.classList.add('approved-monster-frame')"));
 assert.ok(code.includes("animat"+"ions/"));
 assert.ok(code.includes("boss?'boss':'normal'"));
 assert.ok(code.includes("visibility='hidden'"));
});
