import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate} from './simulate-balance.mjs';
test('фактический путь 1→2000, все десять моделей и 70 боссов',()=>{
 const r=simulate({id:'test',decisionSeconds:1});
 assert.equal(r.cleared,true,JSON.stringify({best:r.best,room:r.room,sword:r.sword,armor:r.armor,seconds:r.seconds,defeats:r.defeats,gold:r.gold}));assert.equal(r.waves.length,2000);
 assert.deepEqual(r.waves.map(w=>w.wave),Array.from({length:2000},(_,i)=>i+1));
 assert.deepEqual(r.bossWaves,Array.from({length:200},(_,i)=>(i+1)*10));assert.equal(r.monsterTypes.length,24);
});
test('сохранение каждые пять минут не меняет результат кампании',()=>{
 const a=simulate({id:'normal',decisionSeconds:10,combat:'auto'});
 const b=simulate({id:'reload',decisionSeconds:10,reload:true,combat:'auto'});
 assert.ok(b.reloads>0);for(const k of ['seconds','wins','defeats','farmWins','best','gold'])assert.equal(b[k],a[k],k);
});
