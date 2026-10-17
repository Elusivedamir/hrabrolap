/** New boss vector art: 26 individually shaped species, not just recolored old sprites. */
const path=(d,c,w=5)=>'<path d="'+d+'" fill="'+c+'" stroke="#2c293a" stroke-width="'+w+'" stroke-linejoin="round"/>';
const oval=(x,y,w,h,c)=>'<ellipse cx="'+x+'" cy="'+y+'" rx="'+w+'" ry="'+h+'" fill="'+c+'" stroke="#2c293a" stroke-width="5"/>';
const eye=(x,y)=>'<circle cx="'+x+'" cy="'+y+'" r="9" fill="#fff6db" stroke="#343144" stroke-width="2"/><circle cx="'+(x+2)+'" cy="'+(y+1)+'" r="4" fill="#2b2639"/>';
const limbs=(n,start=67,end=173)=>Array.from({length:n},(_,i)=>path('M'+(start+(end-start)*i/Math.max(1,n-1))+' 158l'+(i%2?15:-13)+' 43','none',9)).join('');
const spines=(n,y,c)=>Array.from({length:n},(_,i)=>path('M'+(55+130*i/Math.max(1,n-1))+' '+y+'l11 -'+(25+(i*7)%24)+' 12 '+(25+(i*7)%24)+'Z',c,2)).join('');
function body(b){
 const c=b.base,a=b.accent;
 switch(b.family){
 case 'crab':return oval(120,147,63,43,c)+limbs(6)+path('M72 114L26 62 12 98 53 141Z',a)+path('M168 114L214 62 228 98 187 141Z',a);
 case 'witch':return path('M61 194L85 112 153 112 184 194Z',c)+oval(120,103,44,41,a)+path('M47 89L121 14 191 89Z',c)+path('M176 166l39 -99','none',10);
 case 'chimera':return oval(120,157,57,43,c)+oval(86,100,30,29,a)+oval(158,100,31,29,c)+path('M72 141L17 35 102 96Z',a)+path('M163 141L226 34 145 96Z',c);
 case 'guardian':return path('M47 192L74 88 165 88 194 192Z',c)+path('M73 92L120 25 168 92 150 134 91 134Z',a)+path('M105 146l16 -20 20 23 -19 29Z',a);
 case 'phoenix':return path('M109 166Q35 20 17 81Q35 164 107 178Z',a)+path('M138 168Q202 17 224 79Q208 165 139 179Z',c)+oval(121,136,40,53,c)+path('M112 101l25 -71 23 75Z',a);
 case 'centipede':return Array.from({length:7},(_,i)=>oval(120+(i%2)*8,33+i*25,34-i*1.5,18,c)+path('M86 '+(34+i*25)+'l-34 14M150 '+(34+i*25)+'l33 13','none',6)).join('');
 case 'golem':return path('M54 100L96 39 165 66 196 134 164 204 86 199 45 151Z',c)+path('M82 92L126 76 109 158 70 141Z',a)+path('M160 85L141 145 179 162Z',a)+path('M55 141l-35 49M180 142l40 45','none',18);
 case 'octopus':return Array.from({length:8},(_,i)=>path('M'+(68+i*15)+' 148q'+(i%2?30:-26)+' 25 '+(i*9-34)+' 64','none',9)).join('')+oval(120,112,71,72,c)+oval(120,140,34,29,a);
 case 'manticore':return oval(120,151,56,49,c)+path('M69 132L28 62 92 94Z',a)+path('M168 134L207 65 148 96Z',a)+path('M90 96L113 51 143 95Z',c)+path('M172 168q58 21 33 -45','none',14);
 case 'worm':return path('M63 208Q31 151 80 115Q93 40 161 71Q205 101 165 153Q173 195 137 215Z',c)+spines(5,113,a)+path('M88 157Q123 198 164 151','none',12);
 case 'storm':return oval(120,133,61,63,c)+path('M99 47L76 110 111 103 91 157 156 76 126 83 150 46Z',a)+path('M64 129l-43 38M175 131l41 37','none',17);
 case 'smith':return path('M74 111L166 111 182 197 59 197Z',c)+oval(120,91,47,43,a)+path('M167 147l43 -78 15 8 -42 83Z',a)+path('M180 91h48v27h-48Z',c);
 case 'moth':return path('M119 136Q57 6 18 70Q14 132 118 156Z',a)+path('M126 136Q188 6 223 70Q229 132 126 156Z',c)+path('M108 129L46 154 95 196Z',c)+path('M135 129L196 154 150 196Z',a)+oval(121,132,23,63,c);
 case 'treant':return path('M83 212L81 108 159 110 159 213Z',c)+path('M66 115Q19 68 64 53Q73 8 120 34Q165 3 179 44Q215 60 171 112Z',a)+path('M78 160l-51 -21M160 166l52 -33','none',19);
 case 'hydra':return oval(121,170,64,38,c)+[69,121,171].map((x,i)=>path('M'+x+' 159Q'+(x-29)+' 116 '+x+' 79','none',21)+oval(x,67,24,23,i%2?c:a)).join('');
 case 'scorpion':return oval(125,157,52,40,c)+limbs(6)+path('M102 120L41 71 24 101 79 143Z',a)+path('M156 121L205 74 222 107 173 144Z',a)+path('M166 156q62 13 41 -63l-13 -19','none',12);
 case 'titan':return path('M63 192L70 97 102 43 159 57 186 136 167 201Z',c)+path('M70 112l35 -48 30 51 -14 31Z',a)+path('M147 102l25 -34 22 58 -35 41Z',a)+path('M60 149l-37 38M184 151l29 38','none',18);
 case 'wraith':return path('M63 212Q50 176 74 126Q55 66 121 49Q186 71 164 126Q199 187 178 213Q146 194 121 211Q98 194 63 212Z',c)+path('M70 135Q113 83 174 134','none',10);
 case 'beetle':return oval(120,148,62,57,c)+path('M120 91Q61 99 60 157Q91 189 120 192Z',a)+path('M120 91Q176 99 183 157Q151 189 120 192Z',c)+path('M99 101L75 58M145 101l23 -43','none',8)+limbs(6);
 case 'clockwork':return oval(120,144,58,63,c)+oval(120,144,29,33,a)+Array.from({length:8},(_,i)=>path('M120 49l'+(Math.round(Math.cos(i*Math.PI/4)*12))+' -19','none',7)).join('')+path('M65 138L32 176M175 138l34 38','none',17);
 case 'abyss':return path('M67 191L77 103 172 103 187 191Z',c)+oval(120,92,53,47,c)+path('M63 74L48 40 88 53 115 19 145 51 192 36 176 80Z',a)+path('M91 119l28 38 27 -40Z',a);
 case 'fungal':return path('M90 200L94 109 149 109 155 200Z',c)+path('M28 121Q36 36 118 41Q202 33 215 121Q122 145 28 121Z',a)+Array.from({length:8},(_,i)=>oval(55+i*19,81-(i%3)*8,7,5,'#fff0d0')).join('');
 case 'serpent':return path('M25 196Q48 124 104 154Q164 197 194 149Q223 96 166 83Q114 63 107 110Q142 83 175 122Q162 167 98 180Q56 155 25 196Z',c)+spines(5,108,a)+path('M172 89l36 -27 -11 33Z',a);
 case 'siren':return path('M101 144Q38 151 37 213L108 179Z',a)+path('M136 144Q204 150 218 213L130 183Z',c)+oval(120,113,55,66,c)+path('M66 93Q89 39 121 59Q168 26 181 104','none',19)+path('M105 157l15 16 18 -16Z',a);
 case 'knight':return path('M70 198L70 95 170 95 170 199Z',c)+path('M83 95L103 47 142 48 160 95 147 143 96 143Z',a)+path('M105 108h34','none',9)+path('M173 138l45 -79','none',16);
 case 'dragon':return path('M110 153Q47 -8 18 67Q11 143 95 160Z',a)+path('M142 153Q206 -8 227 68Q230 140 153 159Z',c)+oval(120,151,55,48,c)+path('M94 113Q96 64 144 71L173 51 172 97 198 127 164 145Z',c)+spines(5,91,a);
 default:return oval(120,135,64,66,c)+spines(5,99,a);
 }
}
export function lateBossFrameSvg(b,phase='attack',index=0){
 if(!b?.family)throw Error('Late boss lacks species rig');
 if(!['attack','hurt'].includes(phase))throw Error('Bad pose '+phase);
 const i=Math.max(0,Math.min(5,Math.floor(index)));
 const attacks=[[0,0,0,1],[-5,-3,-9,1.03],[-13,-9,-17,1.07],[-28,-4,14,1.12],[-12,2,6,1.06],[1,-2,2,.99]];
 const hurts=[[0,1,-2,1],[8,0,9,.97],[15,5,-13,.89],[18,8,16,.84],[5,2,-8,.94],[-2,-1,1,1.01]];
 const [dx,dy,rotation,scale]=(phase==='attack'?attacks:hurts)[i];
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 230" width="240" height="230">'+
 '<defs><linearGradient id="shell" x2=".8" y2="1"><stop stop-color="'+b.accent+'"/><stop offset=".77" stop-color="'+b.base+'"/><stop offset="1" stop-color="#2c293b"/></linearGradient></defs>'+
 '<ellipse cx="120" cy="209" rx="84" ry="12" fill="#232334" opacity=".23"/>'+
 '<g transform="translate('+dx+' '+dy+') translate(120 120) rotate('+rotation+') scale('+scale+') translate(-120 -120)">'+body(b)+eye(101,108)+eye(141,108)+'</g>'+
 (phase==='hurt'&&i>=1&&i<=4?path('M26 55l15 -19 10 18M194 52l10 -20 13 15','none',6):'')+
 (phase==='attack'&&i===3?path('M207 29q24 59 -6 118','none',10):'')+'</svg>';
}
export const lateBossFrameUrl=(b,phase='attack',index=0)=>'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(lateBossFrameSvg(b,phase,index));
