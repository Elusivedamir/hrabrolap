import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';
const root=new URL('../',import.meta.url);
test('10 original v0.9.3 knight SVG poses and 4 clean background/cutout files must stay exact',async()=>{
 const s=(await readFile(new URL('assets/legacy-v093-fishing.manifest.b64',root),'utf8')).trim();
 const archived=JSON.parse(inflateSync(Buffer.from(s,'base64')).toString('utf8'));
 assert.equal(Object.keys(archived.frames).length,10);
 for(const [file,rec] of Object.entries(archived.frames)){
  const body=await readFile(new URL(file,root));
  assert.equal(createHash('sha256').update(body).digest('hex'),rec.sha256,file);
 }
 for(const [file,sha] of Object.entries(archived.sha256)){
  const body=await readFile(new URL(file,root));
  assert.equal(createHash('sha256').update(body).digest('hex'),sha,file);
 }
});
test('game uses animated source scene and correct knight pose directory',async()=>{
 const html=await readFile(new URL('index.html',root),'utf8');
 const js=await readFile(new URL('game.mjs',root),'utf8');
 assert.match(html,/port_active_clean\.webp/);
 assert.match(html,/port_rest_clean\.webp/);
 assert.match(html,/id="fishing-animation"/);
 assert.ok(js.includes("animations/fishing/"));
 assert.ok(js.includes("playFishCatch()"));
});
