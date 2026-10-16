import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const lock=JSON.parse(await readFile(new URL('./locked-art-shas.json',import.meta.url),'utf8'));
test('approved reference cat, sword, sleep and original scene bytes remain unchanged',async()=>{
 assert.ok(lock.files.length>=35);
 for(const file of lock.files){
  const data=await readFile(new URL('../'+file.path,import.meta.url));
  assert.equal(data.length,file.size,'size changed: '+file.path);
  const sha=createHash('sha1').update('blob '+data.length+'\0').update(data).digest('hex');
  assert.equal(sha,file.sha,'APPROVED ASSET CHANGED: '+file.path);
 }
});
