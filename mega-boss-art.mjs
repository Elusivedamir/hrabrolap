import {megaBossByType,MEGA_BOSSES} from './mega-bosses.mjs';
/** Fourteen original vector silhouettes: no changes to existing approved sprites.
 * Every monster has 6 explicit attack poses + 6 explicit hurt poses (168 frames).
 * Artwork is deliberately hand-described as shapes, not recolors of a common body.
 */
export const MEGA_FRAME_COUNT=6;
const A=[[0,0,0,1,1],[-4,-3,-6,1.03,.99],[-10,-8,-12,1.07,.97],[-24,-5,9,1.16,.9],[-12,1,5,1.06,.95],[0,0,0,1,1]];
const H=[[0,0,0,1,1],[5,0,8,.96,1.01],[11,5,-13,.9,.92],[15,7,14,.86,.88],[6,3,-8,.95,.95],[0,0,0,1,1]];
const path=(d,fill='url(#shell)',width=5)=>'<path d="'+d+'" fill="'+fill+'" stroke="#282638" stroke-width="'+width+'" stroke-linejoin="round" stroke-linecap="round"/>';
const ellipse=(x,y,rx,ry,fill='url(#shell)',width=5)=>'<ellipse cx="'+x+'" cy="'+y+'" rx="'+rx+'" ry="'+ry+'" fill="'+fill+'" stroke="#282638" stroke-width="'+width+'"/>';
const circle=(x,y,r,fill,width=3)=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+fill+'" stroke="#332d3b" stroke-width="'+width+'"/>';
const eyes=(x1=99,x2=139,y=104,blink=false)=>{
 const h=blink?3:9;
 return ellipse(x1,y,8,h,'#fff0d1',2)+ellipse(x2,y,8,h,'#fff0d1',2)+(blink?'':circle(x1+2,y,4,'#202433',0)+circle(x2+2,y,4,'#202433',0)+circle(x1+3,y-2,1.4,'white',0)+circle(x2+3,y-2,1.4,'white',0));
};
function silhouette(type,b,pose,blink){
 const dark='#343042',light=b.accent,base=b.base;
 const scale=pose==='attack'?'0':'0';
 switch(type){
 case 'thorn_warden':
  return path('M83 172Q59 151 42 124Q33 111 23 118Q25 137 52 169L61 201 95 199Z',base)+
  path('M156 169Q177 152 198 106L216 102Q206 141 181 181L179 205 144 200Z',base)+
  path('M77 170Q58 122 84 77Q123 45 158 79Q187 119 165 181L139 202 91 199Z')+
  path('M70 89L55 58 89 67 101 41 125 61 153 43 163 75 189 72 167 109Z',light)+
  path('M80 169Q119 194 164 169','none',5)+eyes(97,142,120,blink)+path('M116 139l9 5 -10 5','#e49c78',2)+
  path('M96 205q23 -22 45 0','none',7)+circle(55,66,10,light,2)+circle(184,69,8,light,2);
 case 'bone_regent':
  return path('M77 146L54 172 35 183M165 147L187 170 206 176','none',14)+
  ellipse(119,166,50,48,'#bbb2a6')+
  Array.from({length:4},(_,i)=>path('M'+(83+i*23)+' 146Q119 '+(156+i*10)+' '+(154-i*21)+' 151','none',5)).join('')+
  ellipse(119,93,61,56,'#f2e7ca')+path('M66 77L48 48 85 63 101 35 116 57 146 35 158 59 190 44 174 77Z','#d1ab62')+
  eyes(97,143,89,blink)+path('M103 115l14 -13 11 13Z','#594c56')+
  path('M91 128Q121 138 150 127','none',5)+
  path('M91 193l-10 23M144 193l12 23','none',12);
 case 'silk_empress':
  return Array.from({length:4},(_,i)=>{
   const yy=123+i*19;
   return path('M91 '+yy+' Q'+(51-i*5)+' '+(70-i*3)+' '+(21+i*5)+' '+(80+i*30),'none',8)+path('M150 '+yy+' Q'+(187+i*6)+' '+(70-i*3)+' '+(219-i*5)+' '+(80+i*30),'none',8);
  }).join('')+ellipse(126,154,62,59,'#69436f')+path('M98 106Q119 57 149 105L155 158 92 158Z',light)+
  ellipse(120,89,49,35,base)+
  Array.from({length:6},(_,i)=>circle(88+i*13,85-(i%2)*9,5,'#e99f65',2)).join('')+
  path('M112 107l9 12 9 -12','none',3)+circle(120,156,21,'#d1a4d6',3);
 case 'glacier_serpent':
  return path('M49 193Q8 147 56 121Q105 99 137 150Q170 196 204 169Q220 157 212 134Q210 183 182 202Q135 218 93 188Q59 158 71 165Z','#5ba7c6')+
  path('M85 165Q65 124 91 89Q115 66 149 77L166 54 172 82Q206 103 181 129L165 141 120 125Z')+
  path('M90 81L107 46 118 76 142 39 149 79 179 64 162 91Z','#c6efff')+
  eyes(134,172,101,blink)+path('M170 121Q187 130 204 123','none',4)+
  Array.from({length:4},(_,i)=>path('M'+(52+i*25)+' 173l10 -24 12 22Z','#b2efff',3)).join('');
 case 'ember_salamander':
  return path('M63 167Q42 160 22 116Q16 95 36 70Q24 115 66 122L97 140Z','#f08c4c')+
  ellipse(122,157,67,43,'#c86548')+
  path('M79 150L61 189 92 192 115 162M143 161l13 36 35 -5 -19 -42','none',16)+
  path('M104 122Q102 72 153 67Q185 71 199 111L181 133 141 139Z',base)+
  path('M94 124l-2 -23 22 10 5 -37 23 28 11 -39 19 38Z','#f7bd60')+
  eyes(145,181,106,blink)+path('M158 126L195 136 172 149Z','#fff0b0',3)+
  path('M34 102Q7 78 41 39Q24 67 54 80Z','#ffd274',3);
 case 'spore_monarch':
  return path('M92 194Q73 154 93 112L154 113Q169 160 143 196Z','#e1c8aa')+
  ellipse(121,170,40,26,'#e7d4bf')+
  path('M36 116Q39 40 117 45Q188 38 207 113Q125 137 36 116Z',base)+
  path('M53 97Q86 46 119 54Q162 45 189 100Z',light,3)+
  Array.from({length:7},(_,i)=>ellipse(65+i*19,84-(i%3)*10,7+(i%2)*3,6,'#fff2c9',2)).join('')+
  eyes(103,142,147,blink)+path('M112 167q7 6 14 0','none',3)+
  path('M90 187l-15 21M149 187l19 21','none',12);
 case 'abyss_jelly':
  return Array.from({length:7},(_,i)=>path('M'+(72+i*16)+' 132Q'+(51+i*19)+' 180 '+(59+i*16)+' 204','none',8)).join('')+
  path('M36 125Q42 29 122 36Q206 28 208 125Q138 150 36 125Z','#778fcd')+
  path('M51 103Q62 53 123 50Q170 49 195 103Z',light,3)+
  eyes(100,145,108,blink)+path('M106 129Q123 137 139 127','none',4)+
  Array.from({length:5},(_,i)=>circle(60+i*30,93+(i%2)*17,4,'#e8d5ff',0)).join('');
 case 'granite_colossus':
  return path('M44 119L15 153 50 183 86 150M161 145L196 183 222 148 188 112','none',23)+
  path('M70 96L111 71 162 86 180 160 150 202 82 196 59 158Z',base)+
  path('M73 79L102 40 160 53 184 95 170 139 86 140 52 107Z','#9a9da3')+
  path('M119 136l19 26 -20 23 -19 -23Z','#ffcc79',3)+
  eyes(99,148,104,blink)+path('M80 193L69 218M160 189L178 216','none',17)+
  path('M93 54l20 36-12 16M159 61l-24 33 15 33','none',5);
 case 'mirror_moth':
  return path('M119 119Q51 -5 24 57Q5 105 66 142L116 149Z','#98aedf')+
  path('M126 119Q193 -5 216 57Q236 111 169 142L129 149Z','#c6a8df')+
  path('M109 132Q36 109 41 170Q64 198 117 155Z','#d7a1cf')+
  path('M134 132Q207 109 202 170Q179 198 127 155Z','#96cbd7')+
  path('M114 91Q132 85 145 102L143 183 118 190Z',base)+
  path('M120 93L101 59M142 91l20 -33','none',5)+eyes(122,139,113,blink)+
  circle(55,95,20,'#e4e1fc',3)+circle(189,95,20,'#e4e1fc',3);
 case 'treasure_mimic':
  return path('M39 126L48 59Q120 32 197 60L207 127Z','#a26b47')+
  path('M41 75Q120 38 202 75L200 111Q120 91 45 111Z','#d9ae66')+
  path('M36 120Q117 149 207 120L198 185Q124 217 44 185Z',base)+
  path('M48 130Q116 159 199 133L183 172Q126 188 62 172Z','#442c46')+
  Array.from({length:8},(_,i)=>path('M'+(51+i*19)+' 144l9 19 9 -20Z','#fff1d8',2)).join('')+
  eyes(98,146,86,blink)+path('M115 172Q111 199 138 190','#dc6d8b',3)+
  path('M120 58v35','none',9)+circle(123,93,9,'#ffe789');
 case 'root_titan':
  return path('M86 160Q52 154 32 119L18 111Q17 140 56 181M164 153Q196 139 209 105L224 103Q225 147 181 179','none',22)+
  path('M84 213Q71 156 84 117L70 86Q83 68 101 82L141 76 168 106Q177 161 150 212Z','#8b7045')+
  path('M66 90Q33 58 71 45Q81 12 118 35Q147 6 161 39Q201 32 190 76Q171 114 70 105Z','#648b50')+
  path('M92 161Q116 126 145 161Q133 183 110 185Z','#b38d60')+
  eyes(102,137,137,blink)+path('M85 196l-20 22M153 194l20 22','none',16)+
  Array.from({length:5},(_,i)=>circle(75+i*19,60+(i%2)*9,8,'#bbcf86',2)).join('');
 case 'storm_basilisk':
  return path('M54 172Q22 196 20 145Q42 161 62 142L104 125Z','#4b759c')+
  ellipse(120,159,70,36,'#4c9cba')+
  path('M83 163L58 201 88 207 115 173M149 172l23 33 26 -7 -20 -41','none',17)+
  path('M111 128Q116 77 164 81L185 57 187 92 211 106 184 135Z',base)+
  path('M89 128L106 94 121 123 145 85 158 119 175 76 179 132Z','#b0f2fa')+
  eyes(167,182,105,blink)+
  path('M205 120L224 104 214 136','none',5)+path('M28 122l13 -30 10 24 9 -15','none',5);
 case 'shadow_knight':
  return path('M74 154L39 182 54 204 91 184M165 155l35 26 -18 23 -36 -24','none',19)+
  path('M73 113L100 86 150 87 178 123 164 192 78 190Z','#555577')+
  path('M88 132L115 113 146 135 125 173 96 164Z',light)+
  path('M81 87L97 52 117 31 140 52 160 91 153 136 87 136Z',base)+
  path('M105 102h35l-7 19h-25Z','#242338',3)+
  path('M109 112h5M126 112h5','none',4)+
  path('M165 135l42 -38 13 14 -40 49Z','#c1b2ed')+
  path('M91 187L77 216M149 186L170 215','none',17);
 case 'elder_dragon':
  return path('M104 133Q44 8 14 56Q5 94 83 154L106 156Z','#855482')+
  path('M141 135Q190 1 226 56Q229 102 169 158L141 158Z','#6e477d')+
  path('M86 172Q43 172 30 205L68 207 100 178Z',base)+
  ellipse(126,154,60,53,base)+path('M86 120Q101 70 148 71L173 48 171 90 205 117 171 143Z',base)+
  path('M97 99L81 53 110 77 117 40 146 77 169 45 172 91Z',light)+
  eyes(155,186,110,blink)+
  path('M179 136L210 147 187 157Z','#f5bfbb')+
  path('M88 181l-21 35M155 179l18 36','none',18)+
  path('M37 182Q10 165 15 122Q27 144 64 139','none',14);
 }
 return ellipse(120,130,65,70,base)+eyes(100,140,105,blink);
}
const cache=new Map();
export function megaBossFrameSvg(type,phase='attack',index=0){
 const b=megaBossByType(type);
 if(!b)throw Error('Unknown mega boss '+type);
 if(!['attack','hurt'].includes(phase))throw Error('Invalid mega animation '+phase);
 const i=Math.min(5,Math.max(0,Math.trunc(Number(index)||0)));
 const [dx,dy,r,sx,sy]=(phase==='attack'?A:H)[i];
 const wounded=phase==='hurt',impact=wounded&&i>=1&&i<=4;
 const effect=!wounded&&i===3?'<path d="M211 32Q239 97 198 152" fill="none" stroke="'+b.accent+'" stroke-width="14" opacity=".84" stroke-linecap="round"/>':'';
 const stun=impact?'<path d="M29 50l12 13 13 -17M191 40l-11 15 15 10" fill="none" stroke="#fff0a3" stroke-width="7" stroke-linecap="round" opacity=".88"/>':'';
 const opacity=impact&&i===2?'.83':'1';
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 230" width="240" height="230">'+
 '<defs><linearGradient id="shell" x1="0" y1="0" x2=".9" y2="1"><stop stop-color="'+b.accent+'"/><stop offset=".68" stop-color="'+b.base+'"/><stop offset="1" stop-color="#383044"/></linearGradient>'+
 '<radialGradient id="aura"><stop stop-color="'+b.accent+'" stop-opacity=".23"/><stop offset="1" stop-color="'+b.base+'" stop-opacity="0"/></radialGradient></defs>'+
 '<ellipse cx="120" cy="206" rx="94" ry="13" fill="#24232b" opacity=".19"/>'+
 '<ellipse cx="120" cy="111" rx="111" ry="109" fill="url(#aura)"/>'+
 '<g opacity="'+opacity+'" transform="translate('+dx+' '+dy+') translate(120 124) rotate('+r+') scale('+sx+' '+sy+') translate(-120 -124)">'+
 silhouette(type,b,phase,i===2&&wounded)+
 '</g>'+effect+stun+
 (wounded&&i===3?'<g fill="#fff6d2" opacity=".75"><circle cx="42" cy="82" r="5"/><circle cx="194" cy="156" r="4"/></g>':'')+
 '</svg>';
}
export function megaBossFrameUrl(type,phase='attack',index=0){
 const key=type+'/'+phase+'/'+index;if(cache.has(key))return cache.get(key);
 const url='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(megaBossFrameSvg(type,phase,index));
 cache.set(key,url);return url;
}
export const MEGA_ANIMATION_COUNT=MEGA_BOSSES.length*MEGA_FRAME_COUNT*2;
