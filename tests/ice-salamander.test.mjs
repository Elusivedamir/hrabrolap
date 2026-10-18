import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {megaBossForWave} from '../mega-bosses.mjs';
import {megaBossFrameUrl} from '../mega-boss-art.mjs';
import {caveStageForWave,caveStageName,caveBackgroundForWave} from '../cave-themes.mjs';
import {dawnSealForWave} from '../dawn-seals.mjs';
import {dawnSealUrl} from '../dawn-seal-art.mjs';

test('Wave 250 is the ice salamander in the matching icy chasm',()=>{
 const boss=megaBossForWave(250);
 assert.equal(boss.id,'ember_salamander','stable ID preserves existing save compatibility');
 assert.equal(boss.name,'Ледяная саламандра');
 assert.equal(boss.icon,'❄️');
 assert.equal(boss.attackName,'Ледяное дыхание');
 assert.equal(caveStageForWave(250),25);
 assert.equal(caveStageName(25),'Ледяная расщелина');
 const room=caveBackgroundForWave(250);
 assert.equal(room,'assets/approved/ice-salamander/R025-ice-chasm.webp');
 assert.equal(dawnSealForWave(250).name,'Печать Мороза');
 assert.equal(dawnSealUrl(250),'assets/approved/ice-salamander/frost_seal.webp');
});

test('All 12 boss frames and the center seal are real WebP files',()=>{
 const sprites=[];
 for(const phase of ['attack','hurt'])for(let i=0;i<6;i++){
  const path=megaBossFrameUrl('ember_salamander',phase,i);
  assert.match(path,/^assets\/approved\/ice-salamander\/(attack|hurt)_0[1-6]\.webp$/);
  const buf=readFileSync(new URL('../'+path,import.meta.url));
  assert.equal(buf.toString('ascii',0,4),'RIFF',path);
  assert.equal(buf.toString('ascii',8,12),'WEBP',path);
  assert.ok(buf.length>3000,path);
  sprites.push(path);
 }
 assert.equal(new Set(sprites).size,12);
 for(const path of [dawnSealUrl(250),caveBackgroundForWave(250)]){
  const buf=readFileSync(new URL('../'+path,import.meta.url));
  assert.equal(buf.toString('ascii',8,12),'WEBP',path);
 }
});
