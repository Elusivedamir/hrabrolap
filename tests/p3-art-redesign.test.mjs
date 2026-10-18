import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {caveBackgroundForWave,caveStageName,CHAPTER_ONE_ROOM_NAMES} from '../cave-themes.mjs';
import {megaBossFrameUrl} from '../mega-boss-art.mjs';
import {p3RoomCandidate,p3BossFrameUrl,p3BossCandidate} from '../p3-art-candidates.mjs';

test('P3 all 20 chapter-one stage titles match the approved written catalog',()=>{
 assert.equal(CHAPTER_ONE_ROOM_NAMES.length,20);
 const specials={10:'Костяной зал',15:'Паучье гнездо',20:'Логово ледяного змея'};
 for(let i=1;i<=20;i++)assert.equal(caveStageName(i),CHAPTER_ONE_ROOM_NAMES[i-1]);
 for(const [stage,name] of Object.entries(specials))assert.equal(caveStageName(Number(stage)),name);
});

test('P3 illustrated arenas have unique authored scenery but are opt-in only',async()=>{
 const expected=new Map([[10,'R010-bone-hall.svg'],[15,'R015-spider-nest.svg'],[20,'R020-ice-serpent-lair.svg']]);
 const texts=[];
 for(const [stage,file] of expected){
  const candidate=p3RoomCandidate(stage);
  assert.equal(candidate.url,'assets/prototypes/p3/'+file);
  const svg=await readFile(new URL('../'+candidate.url,import.meta.url),'utf8');
  assert.match(svg,/<svg/);assert.match(svg,/viewBox="0 0 840 470"/);
  assert.ok(svg.length>5000,'scene has its own drawn environmental elements');
  assert.ok((svg.match(/<path/g)||[]).length>=20,'scene must contain illustrated objects');
  assert.equal(caveBackgroundForWave(stage*10,true),candidate.url);
  assert.ok(caveBackgroundForWave(stage*10).startsWith('data:image/svg+xml'),'default game art untouched');
  texts.push(svg);
 }
 assert.equal(new Set(texts).size,3);
 for(const wave of [1,41,111]){
  assert.equal(caveBackgroundForWave(wave,true),caveBackgroundForWave(wave),'approved P1 stage remains untouched');
 }
});

test('P3 each anatomically distinct boss has 6 independently drawn attack/hurt frames; normal mode unchanged',async()=>{
 const pack=new Map([
  ['bone_regent','boss-bone-regent'],
  ['silk_empress','boss-silk-empress'],
  ['glacier_serpent','boss-glacier-serpent']
 ]);
 for(const [boss,dir] of pack){
  assert.equal(p3BossCandidate(boss),dir);
  const frames=new Set();
  for(const phase of ['attack','hurt'])for(let i=0;i<6;i++){
    const src=p3BossFrameUrl(boss,phase,i);
    assert.equal(src,megaBossFrameUrl(boss,phase,i,true));
    assert.match(src,new RegExp('assets/prototypes/p3/'+dir+'/'+phase+'_0[1-6]\\.svg'));
    const svg=await readFile(new URL('../'+src,import.meta.url),'utf8');
    assert.match(svg,/<svg/);
    assert.match(svg,/viewBox="0 0 240 245"/);
    assert.ok(svg.length>3500,'rich silhouette frame of '+boss);
    frames.add(svg);
    assert.ok(megaBossFrameUrl(boss,phase,i).startsWith('data:image/svg+xml'),'regular boss art unchanged');
  }
  assert.equal(frames.size,12,'twelve distinct authored frames for '+boss);
 }
 assert.match(megaBossFrameUrl('thorn_warden','attack',0,true),/assets\/prototypes\/p1/);
});
