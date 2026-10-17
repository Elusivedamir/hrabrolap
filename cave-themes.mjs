/** Three user-approved P1 illustrated rooms and procedural fallback for remaining stages.
 * Pure deterministic scene generation: no image assets, character art,
 * battle geometry, or accepted backgrounds are overwritten.
 */
export const CAVE_ROOM_COUNT=200;
const PALETTES=Object.freeze([
 {name:'Старая пещера',rock:'#364559',shade:'#192635',floor:'#6b665e',light:'#f5b469',crystal:'#87bee1',glow:'#c5e9fd'},
 {name:'Синие кристаллы',rock:'#273b66',shade:'#111c39',floor:'#455078',light:'#85caf2',crystal:'#66bcff',glow:'#c6ebff'},
 {name:'Мшистый грот',rock:'#375347',shade:'#192f2b',floor:'#5b7157',light:'#b7d889',crystal:'#90dab1',glow:'#e2f6c4'},
 {name:'Янтарные залы',rock:'#61473b',shade:'#352531',floor:'#87634c',light:'#ffcd77',crystal:'#f9b355',glow:'#ffefb9'},
 {name:'Ледяная расщелина',rock:'#42637b',shade:'#203950',floor:'#7a9db0',light:'#c7f4ff',crystal:'#a0efff',glow:'#ffffff'},
 {name:'Грибные глубины',rock:'#4b365d',shade:'#28213c',floor:'#665675',light:'#e2a1d7',crystal:'#ca8fff',glow:'#fee9ff'},
 {name:'Пепельные катакомбы',rock:'#59505b',shade:'#252b38',floor:'#756d70',light:'#e9a28a',crystal:'#b99ebd',glow:'#ffe0d1'},
 {name:'Изумрудные шахты',rock:'#245354',shade:'#112d3d',floor:'#48706a',light:'#8cdbba',crystal:'#3fe9b1',glow:'#dbffea'},
 {name:'Лавовый разлом',rock:'#633b39',shade:'#302333',floor:'#7c5146',light:'#ffa66c',crystal:'#ff715d',glow:'#ffe1b5'},
 {name:'Зал древних рун',rock:'#434468',shade:'#1b2846',floor:'#5a5777',light:'#bab5fe',crystal:'#a4b2ff',glow:'#eef0ff'}
]);
function clampStage(n){return Math.max(1,Math.min(CAVE_ROOM_COUNT,Math.floor(Number(n)||1)));}
export function caveStageForWave(wave){return clampStage(Math.floor((Math.max(1,Number(wave)||1)-1)/10)+1);}
const APPROVED_P1_ROOMS=Object.freeze({
  1:Object.freeze({name:'Каменный порог',url:'assets/prototypes/p1/R001-stone-threshold.svg'}),
  5:Object.freeze({name:'Моховая сторожка',url:'assets/prototypes/p1/R005-moss-outpost.svg'}),
  12:Object.freeze({name:'Рунный тупик',url:'assets/prototypes/p1/R012-rune-dead-end.svg'})
});
export function caveStageName(stage){const n=clampStage(stage);return APPROVED_P1_ROOMS[n]?.name||PALETTES[(n-1)%PALETTES.length].name;}
function rand(seed){const s=Math.sin(seed*37.181+.33)*43758.5453;return s-Math.floor(s);}
const cache=new Map();
export function caveBackgroundForWave(wave){
 const stage=caveStageForWave(wave);
 if(APPROVED_P1_ROOMS[stage])return APPROVED_P1_ROOMS[stage].url;
 if(cache.has(stage))return cache.get(stage);
 const p=PALETTES[(stage-1)%PALETTES.length];
 const epoch=Math.floor((stage-1)/PALETTES.length);
 const k=stage*29.41;
 const stones=Array.from({length:16},(_,i)=>{
  const x=(i%8)*115-24+(rand(k+i)*25),y=62+Math.floor(i/8)*124;
  return '<path d="M'+x.toFixed(0)+' '+y+' l'+(60+rand(i+k)*38).toFixed(0)+' -11 38 46 -15 40 -70 4 Z" fill="'+(i%3===0?p.shade:p.rock)+'" opacity="'+(.46+rand(k+i+50)*.22).toFixed(2)+'" stroke="'+p.shade+'" stroke-width="6"/>';
 }).join('');
 const spikes=Array.from({length:9},(_,i)=>{
  const x=i*105+rand(k+i+8)*39-50, length=28+rand(k+i+17)*73;
  return '<path d="M'+x.toFixed(0)+' 0l'+(30+rand(i)*25).toFixed(0)+' 0 -'+(7+rand(i)*13).toFixed(0)+' '+length.toFixed(0)+' Z" fill="'+p.shade+'" stroke="'+p.rock+'" stroke-width="5"/>';
 }).join('');
 const crystals=Array.from({length:10},(_,i)=>{
  const side=i<5?20:670;
  const x=side+rand(k+i)*130;
  const y=310+rand(k+i+7)*88;
  const h=27+rand(k+i+12)*63+epoch*2;
  return '<g opacity=".94"><path d="M'+x.toFixed(0)+' '+y.toFixed(0)+' l17 -'+h.toFixed(0)+' 23 '+Math.floor(h*.67)+' -9 '+Math.floor(h*.33)+'Z" fill="'+p.crystal+'" stroke="'+p.shade+'" stroke-width="5"/><path d="M'+(x+17).toFixed(0)+' '+(y-h).toFixed(0)+'v'+h.toFixed(0)+'l23 -'+Math.floor(h*.33)+'Z" fill="'+p.glow+'" opacity=".52"/></g>';
 }).join('');
 const glyphs=Array.from({length:5},(_,i)=>{
  const x=165+i*120+rand(k+i+50)*27,y=330+rand(k+i+40)*52;
  return '<path d="M'+x.toFixed(0)+' '+y.toFixed(0)+' l9 -15 8 16 -12 -7 21 4" fill="none" stroke="'+p.glow+'" stroke-width="2" opacity=".38"/>';
 }).join('');
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 470" preserveAspectRatio="none">'+
 '<defs><linearGradient id="wall" x2=".2" y2="1"><stop stop-color="'+p.rock+'"/><stop offset="1" stop-color="'+p.shade+'"/></linearGradient>'+
 '<linearGradient id="ground" x2="0" y2="1"><stop stop-color="'+p.floor+'"/><stop offset="1" stop-color="'+p.shade+'"/></linearGradient>'+
 '<radialGradient id="halo"><stop stop-color="'+p.light+'" stop-opacity=".35"/><stop offset="1" stop-color="'+p.light+'" stop-opacity="0"/></radialGradient></defs>'+
 '<rect width="840" height="470" fill="url(#wall)"/><path d="M0 0H840V180Q720 118 661 156Q600 87 517 138Q414 63 335 143Q220 91 138 183Q61 145 0 224Z" fill="'+p.rock+'" stroke="'+p.shade+'" stroke-width="16"/>'+
 stones+'<path d="M249 322V198Q251 93 421 84Q593 96 600 204V326Z" fill="'+p.shade+'" stroke="'+p.rock+'" stroke-width="34"/>'+
 '<path d="M319 324V212Q333 152 424 147Q515 149 535 212V331Z" fill="'+p.rock+'" opacity=".30"/>'+
 '<ellipse cx="420" cy="200" rx="245" ry="193" fill="url(#halo)"/>'+
 '<path d="M0 317Q209 285 411 315Q660 280 840 320V470H0Z" fill="url(#ground)" stroke="'+p.shade+'" stroke-width="11"/>'+
 '<path d="M0 390Q170 352 328 392T840 388M0 450Q220 405 448 434T840 427" fill="none" stroke="'+p.shade+'" stroke-width="8" opacity=".43"/>'+
 spikes+crystals+glyphs+
 '<g stroke="'+p.shade+'" stroke-width="6"><path d="M107 269l17 -80 18 80Z" fill="'+p.light+'"/><path d="M695 271l18 -82 18 82Z" fill="'+p.light+'"/></g>'+
 '<path d="M93 265h65M682 265h65" stroke="'+p.shade+'" stroke-width="9" stroke-linecap="round"/>'+
 '<ellipse cx="'+(350+(epoch%5)*31)+'" cy="347" rx="280" ry="56" fill="'+p.glow+'" opacity=".055"/>'+
 '<g fill="'+p.glow+'" opacity=".43"><circle cx="'+Math.floor(40+rand(k)*700)+'" cy="86" r="3"/><circle cx="'+Math.floor(90+rand(k+3)*650)+'" cy="191" r="2"/><circle cx="'+Math.floor(110+rand(k+6)*620)+'" cy="122" r="4"/></g></svg>';
 const url='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
 cache.set(stage,url);return url;
}
