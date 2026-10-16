import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate} from './simulate-balance.mjs';
test('фактический путь 1→100, все десять моделей и десять боссов',()=>{
 const r=simulate({id:'test',decisionSeconds:1});
 assert.equal(r.cleared,true);assert.equal(r.waves.length,100);
 assert.deepEqual(r.waves.map(w=>w.wave),Array.from({length:100},(_,i)=>i+1));
 assert.deepEqual(r.bossWaves,Array.from({length:10},(_,i)=>(i+1)*10));assert.equal(r.monsterTypes.length,10);
});
test('сохранение каждые пять минут не меняет результат кампании',()=>{
 const a=simulate({id:'normal',decisionSeconds:10});
 const b=simulate({id:'reload',decisionSeconds:10,reload:true});
 assert.ok(b.reloads>0);for(const k of ['seconds','wins','defeats','farmWins','best','gold'])assert.equal(b[k],a[k],k);
});
