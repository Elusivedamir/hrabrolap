/** Unique 50-wave bosses. Art is native transparent SVG: 14 bodies x 12 individually animated poses. */
export const MAJOR_BOSSES=Object.freeze([
 {wave:50,id:'marsh_toad',name:'Болотная жаба',family:'toad',color:'#81b85e',dark:'#345743',accent:'#d9ed7b',immune:['poison'],move:'jump'},
 {wave:100,id:'spider_queen',name:'Паучья матка',family:'spider',color:'#84536a',dark:'#39243b',accent:'#ed6eaa',immune:['poison'],move:'leap'},
 {wave:150,id:'bone_leviathan',name:'Костяной левиафан',family:'serpent',color:'#ddd2a7',dark:'#6c6372',accent:'#b5f1fd',immune:['vampirism'],move:'rattle'},
 {wave:200,id:'phantom_knight',name:'Призрачный рыцарь',family:'knight',color:'#7094ba',dark:'#293c66',accent:'#9de8ff',immune:['vampirism'],move:'pulse'},
 {wave:250,id:'crystal_queen',name:'Королева кристаллов',family:'crystal',color:'#65b2d1',dark:'#294672',accent:'#c7f6fb',immune:['lightning'],move:'ram'},
 {wave:300,id:'granite_colossus',name:'Гранитный исполин',family:'golem',color:'#988775',dark:'#544f52',accent:'#f1cc77',immune:['poison'],move:'ram'},
 {wave:350,id:'fungal_colossus',name:'Грибной колосс',family:'fungus',color:'#c95c75',dark:'#5a394e',accent:'#fbe4a1',immune:['poison'],move:'spores'},
 {wave:400,id:'ember_fiend',name:'Пламенный бес',family:'imp',color:'#ee8052',dark:'#78343c',accent:'#fce477',immune:['lightning'],move:'leap'},
 {wave:450,id:'winged_chimera',name:'Крылатая химера',family:'chimera',color:'#ac8e6c',dark:'#56415b',accent:'#d9ed8b',immune:['vampirism'],move:'swoop'},
 {wave:500,id:'ancient_automaton',name:'Древний автоматон',family:'machine',color:'#77a3ae',dark:'#364758',accent:'#b4ffd8',immune:['lightning'],move:'ram'},
 {wave:550,id:'frost_basilisk',name:'Ледяной василиск',family:'basilisk',color:'#86cddd',dark:'#346b8a',accent:'#e3fbff',immune:['vampirism'],move:'bite'},
 {wave:600,id:'infernal_demon',name:'Инфернальный демон',family:'demon',color:'#d84b53',dark:'#58283b',accent:'#ffbd61',immune:['poison'],move:'spores'},
 {wave:650,id:'void_worm',name:'Червь пустоты',family:'worm',color:'#805ca3',dark:'#302646',accent:'#d8a4ff',immune:['lightning'],move:'wriggle'},
 {wave:700,id:'cave_overlord',name:'Повелитель пещер',family:'overlord',color:'#725388',dark:'#29243f',accent:'#eeadff',immune:['vampirism'],move:'pulse'}
].map(x=>Object.freeze({...x,immune:Object.freeze(x.immune)})));
const byWave=new Map(MAJOR_BOSSES.map(b=>[b.wave,b])), byId=new Map(MAJOR_BOSSES.map(b=>[b.id,b]));
export const majorBossForWave=n=>byWave.get(n)||null;
export const majorBossByType=id=>byId.get(id)||null;
const O='#292535';
const ellipse=(cx,cy,rx,ry,fill,stroke=O,sw=6)=>'<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+sw+'"/>';
const path=(d,fill,stroke=O,sw=6)=>'<path d="'+d+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+sw+'" stroke-linejoin="round" stroke-linecap="round"/>';
const circle=(cx,cy,r,fill,stroke=O,sw=5)=>'<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+sw+'"/>';
const eyes=(y=99,dx=28,glow='#fff5d7')=>circle(110-dx,y,10,glow,O,3)+circle(110+dx,y,10,glow,O,3)+circle(110-dx+2,y,4,O,O,1)+circle(110+dx+2,y,4,O,O,1);
const limbs=(c,d,extent=0)=>path('M61 154 Q'+(44-extent)+' 162 37 187L56 190 78 169Z',d)+path('M158 158Q'+(174+extent)+' 156 184 185L166 191 148 174Z',d)+ellipse(77,191,23,11,c)+ellipse(153,191,23,11,c);
function body(b){
 const c=b.color,d=b.dark,a=b.accent;
 switch(b.family){
 case 'toad':return ellipse(110,150,85,51,c)+circle(69,110,26,c)+circle(149,110,26,c)+ellipse(107,145,64,38,c)+ellipse(110,163,55,20,a,'none',0)+eyes(108,40)+path('M72 151Q111 177 149 150','none',d,5)+circle(57,142,9,d,'none',0)+circle(167,154,7,d,'none',0)+limbs(c,d);
 case 'spider':return Array.from({length:4},(_,i)=>{let y=102+i*17;return path('M88 '+y+'Q'+(34-i*5)+' '+(y-45)+' '+(17-i*3)+' '+(y-10)+'M135 '+y+'Q'+(185+i*5)+' '+(y-45)+' '+(209+i*3)+' '+(y-9),'none',d,8)}).join('')+ellipse(115,143,66,45,c)+ellipse(111,91,42,34,d)+circle(92,95,11,a)+circle(131,95,11,a)+Array.from({length:4},(_,i)=>circle(94+i*13,119,4,a,'none',0)).join('')+path('M94 135L102 151 112 137 123 151 133 135','none',O,3);
 case 'serpent':return path('M51 180Q20 146 62 117T127 120Q166 135 186 95Q210 75 188 52','none',d,34)+path('M51 180Q20 146 62 117T127 120Q166 135 186 95Q210 75 188 52','none',c,23)+Array.from({length:6},(_,i)=>path('M'+(45+i*20)+' '+(133+i%2*18)+'l-5 -22 16 13Z',a,d,3)).join('')+path('M141 70Q177 40 206 62L203 106Q159 123 141 100Z',c)+eyes(85,23,'#ff626c')+path('M169 109l9 18 10 -19 7 15','none',O,4);
 case 'knight':return path('M76 82L111 53 150 82 166 174 50 180Z',d)+path('M78 77L111 62 144 77 137 153 84 153Z',c)+path('M78 87Q109 98 144 86L137 122Q107 130 84 122Z',d)+path('M94 93h37l-6 10H99Z',a)+path('M88 46l24 -20 23 21 -22 12Z',d)+path('M169 93l11 57 16 18 -18 10 -20 -35Z',a)+circle(65,149,24,c)+path('M50 179L71 162 87 178',d);
 case 'crystal':return path('M106 26L135 67 152 41 179 120 149 185 76 185 39 121 68 52 88 75Z',c)+path('M107 32L125 113 111 177 84 121Z',a,'none',0)+path('M40 109L17 63 62 83 73 107M158 104L179 68 207 115 166 135Z',a)+path('M90 142L131 142L117 153 103 155Z',d)+eyes(117,25,'#fff');
 case 'golem':return path('M59 78L91 49 142 56 170 87 170 160 144 195 71 196 44 158Z',d)+path('M62 86L92 59 137 67 157 96 154 157 134 181 79 180 59 150Z',c)+path('M35 104L10 132 35 176 68 162 64 104Z',c)+path('M175 99L209 129 189 177 159 166Z',c)+circle(93,119,10,a)+circle(132,120,10,a)+path('M85 155H141','none',d,8)+path('M87 86L117 105 138 77', 'none',d,4);
 case 'fungus':return path('M65 108Q51 134 64 188L150 189Q169 143 147 107Z',c)+path('M29 116Q39 28 114 30Q189 24 203 117Q111 149 29 116Z',d)+path('M30 111Q51 35 113 34Q179 28 200 111Q110 139 30 111Z',c)+circle(67,78,14,a,'none',0)+circle(145,66,18,a,'none',0)+circle(110,100,11,a,'none',0)+eyes(148,30)+path('M88 175q25 10 45 0','none',d,4)+limbs(c,d);
 case 'imp':return path('M65 72L48 27 91 56 110 37 134 55 180 24 158 78Q184 120 168 164Q130 202 85 177Q47 142 65 72Z',c)+path('M88 66L69 39 98 58M135 58L164 36 151 73',a,'none',0)+eyes(119,28,a)+path('M78 149Q110 172 151 144L140 164 125 154 111 174 92 154Z',d)+path('M155 161Q211 149 200 94','none',d,14)+circle(202,89,13,a)+limbs(c,d);
 case 'chimera':return path('M61 117Q29 43 13 59Q24 151 84 146Z',a)+path('M159 115Q191 43 211 60Q205 149 143 145Z',a)+ellipse(110,145,61,49,c)+path('M73 123Q53 60 81 60L92 90M141 94Q162 45 183 67L153 128Z',d)+circle(110,94,41,c)+path('M77 70L54 37 93 57M146 62L171 36 155 82',d)+eyes(92,25,a)+path('M94 119L109 134 130 118', 'none',d,5)+limbs(c,d);
 case 'machine':return path('M76 64h67l31 29 -12 85 -44 22 -58 -25 -17 -86Z',d)+path('M82 74h53l25 25 -8 69 -38 17 -45 -18 -13 -69Z',c)+circle(110,121,37,d)+circle(110,121,27,a)+circle(110,121,15,d)+Array.from({length:6},(_,i)=>{let x=43+i*27;return path('M'+x+' 79l9 -14 9 14',a,d,3)}).join('')+path('M48 119l-25 25 14 31 31 -12M171 119l25 25 -14 31 -31 -12',c);
 case 'basilisk':return path('M21 173Q20 129 80 145T174 122Q211 105 203 69','none',d,33)+path('M23 173Q26 132 83 144T174 124Q205 105 203 69','none',c,22)+path('M94 143Q85 82 120 60Q144 45 175 79L159 131 135 143Z',c)+Array.from({length:5},(_,i)=>path('M'+(70+i*23)+' '+(126-i%2*9)+'l9 -26 16 22Z',a)).join('')+circle(136,99,8,a)+circle(139,99,3,d)+path('M153 119l14 10 13 -16', 'none',d,6);
 case 'demon':return path('M64 90L43 19 91 53 128 46 184 15 158 86Q191 123 167 171Q113 209 70 169Q42 136 64 90Z',d)+path('M68 98Q97 64 148 90Q172 111 156 154Q128 183 86 161Q58 133 68 98Z',c)+path('M49 150l-30 32 58 -10M171 151l29 30 -50 -3',a)+eyes(113,31,a)+path('M78 150l20 22 12 -16 15 16 23 -22','none',a,5)+path('M69 59l-21 -38 33 34 M144 48l37 -34 -16 58',a);
 case 'worm':return path('M40 185Q15 149 65 136Q100 123 66 91Q47 45 110 42Q163 37 175 84Q204 133 158 172Q104 213 40 185Z',d)+path('M49 179Q26 145 76 131Q110 117 80 89Q67 57 114 53Q157 47 164 91Q179 132 147 161Q102 196 49 179Z',c)+ellipse(119,92,32,28,d)+ellipse(119,92,18,a,'none',0)+circle(119,92,10,d)+path('M53 176l14 -17 15 19M88 182l17 -19 16 15M128 170l15 -23', 'none',a,6);
 case 'overlord':return path('M52 84L27 23 87 55 114 22 144 55 192 24 166 90Q193 157 161 186Q104 212 58 176Q26 142 52 84Z',d)+path('M60 91Q110 59 156 91L149 166Q108 191 73 164Z',c)+path('M65 66L52 31 92 64 111 35 132 67 175 28 158 77',a)+path('M35 129L10 101 23 173 55 162M182 132L209 98 198 173 163 161',d)+eyes(114,28,a)+path('M76 149l20 20 14 -12 16 15 20 -24','none',a,5)+circle(111,86,9,a)+path('M111 50V27','none',a,5);
 default:throw Error('Missing boss shape: '+b.family);
 }
}
const POSES=Object.freeze({
 attack:[[0,0,0,1],[5,-3,-6,1.035],[11,-8,-11,1.075],[19,-11,7,1.11],[9,-4,4,1.03],[0,0,0,1]],
 hurt:[[0,0,0,1],[-5,3,-5,.96],[-14,5,9,.88],[-8,8,-9,.92],[-2,4,4,.98],[0,0,0,1]]
});
const cache=new Map();
export function majorBossFrameSvg(id,phase='attack',frame=0){
 const b=majorBossByType(id);if(!b)throw Error('Unknown major boss '+id);
 if(!POSES[phase])throw Error('Unknown phase '+phase);
 const i=Math.max(0,Math.min(5,Math.floor(frame)));
 const [dx,dy,rot,scale]=POSES[phase][i];
 const glow=phase==='attack'&&i>=2&&i<=4;
 const flash=phase==='hurt'&&i>=1&&i<=4;
 const limbsFlare=glow?path('M167 129Q209 124 212 98','none',b.accent,6)+circle(210,94,8,b.accent,'none',0):'';
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" width="220" height="220" aria-label="'+b.name+'">'+
 '<ellipse cx="110" cy="205" rx="81" ry="9" fill="#201c2b" opacity=".22"/>'+
 '<g transform="translate('+dx+' '+dy+') rotate('+rot+' 110 131) translate('+(110-110*scale)+' '+(130-130*scale)+') scale('+scale+')">'+body(b)+limbsFlare+
 (flash?'<ellipse cx="110" cy="118" rx="81" ry="67" fill="#ffeddf" opacity="'+(i===2?.33:.13)+'"/>':'')+
 '</g>'+(glow?'<path d="M186 88l10 -19 5 16 13 -8" fill="none" stroke="'+b.accent+'" stroke-width="6" stroke-linecap="round"/>':'')+'</svg>';
}
export function majorBossFrameUrl(id,phase='attack',index=0){
 const key=id+':'+phase+':'+index;
 if(!cache.has(key))cache.set(key,'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(majorBossFrameSvg(id,phase,index)));
 return cache.get(key);
}
