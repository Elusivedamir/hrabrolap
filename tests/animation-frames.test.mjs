import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const name=['slime','mouse','mushroom','bat','spider','larva','beetle','ghost'];
const at=(...parts)=>path.join(root,'animations',...parts);
test('8 монстров × (6 атака + 6 урон) × 2 варианта — 192 доступных кадра',()=>{
 for(const id of name)for(const variant of ['normal','boss'])for(const action of ['attack','hurt'])for(let i=1;i<=6;i++){
  let file=at(id,variant,action,String(i).padStart(2,'0')+'.svg');
  assert.ok(fs.existsSync(file),file);
  const source=fs.readFileSync(file,'utf8');
  assert.match(source,/<svg[^>]*viewBox=/);
  if(variant==='boss')assert.match(source,/data:image\/svg\+xml;base64,/,`no crown for ${file}`);
  else assert.ok(!source.includes('width="80" height="50"'),`unexpected crown for ${file}`);
 }
});
test('10 кадров рыбалки рыцаря и 10 кадров кота-торговца',()=>{
 for(const kind of ['fishing','merchant'])for(let i=1;i<=10;i++){
  const file=at(kind,String(i).padStart(2,'0')+'.svg');assert.ok(fs.existsSync(file),file);
  assert.ok(fs.statSync(file).size>250,file);
 }
});
test('Сохранены храбролаповский SVG-риг и точные игровые события',()=>{
 const game=fs.readFileSync(path.join(root,'game.mjs'),'utf8');
 for(const phrase of ['heroFrame(','contactAttack(','playEnemyFrames(\'hurt\')','playFishCatch();','updateMerchantAnimation(now)'])assert.ok(game.includes(phrase),phrase);
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 for(const element of ['id="enemy-hearts"','id="hero-rig"','id="fishing-animation"','id="merchant-image"'])assert.ok(html.includes(element),element);
});
