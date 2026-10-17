/** Hrabrolap merchant: one consistent illustrated kitten, 6+6+6 hand-keyed states.
 * No animation updates to saves/timers, and no external dependencies.
 */
export const MERCHANT_FRAME_COUNT=Object.freeze({arrive:6,idle:6,leave:6});
export const MERCHANT_VISIT_MS=15000;
const imgCache=new Map();
const stroke='#41323b';
const paths=(p)=>p.join('');
function face(expression='smile'){
 const blink=expression==='blink', wink=expression==='wink';
 const eye=(x,closed)=>closed?`<path d="M${x-13} 111 Q${x} 102 ${x+13} 112" stroke="${stroke}" stroke-width="4.4" stroke-linecap="round" fill="none"/>`:`<g><ellipse cx="${x}" cy="112" rx="13.3" ry="16" fill="#f7e7c9" stroke="${stroke}" stroke-width="3.5"/><ellipse cx="${x+2}" cy="112.5" rx="8.4" ry="13.3" fill="url(#eyes)"/><ellipse cx="${x+3}" cy="108.5" rx="3.7" ry="7.8" fill="#151923"/><circle cx="${x+5}" cy="106" r="3" fill="white"/><circle cx="${x-2}" cy="117" r="1.7" fill="#ffecc9"/></g>`;
 return `<g>
 <path d="M28 95Q21 69 27 52L29 20Q30 11 38 19L69 48Q97 41 124 47L157 17Q168 10 169 28L169 67Q181 90 172 119Q162 148 124 153Q83 170 52 147Q29 132 28 95Z" fill="url(#fur)" stroke="${stroke}" stroke-width="6" stroke-linejoin="round"/>
 <path d="M37 34 38 68 66 57Z" fill="#f6afa8" stroke="#9c706f" stroke-width="2"/><path d="M157 32 160 70 134 58Z" fill="#efa5ac" stroke="#9c706f" stroke-width="2"/>
 <path d="M72 58Q80 68 85 77M96 50Q102 65 103 73M118 59Q119 65 126 77" stroke="#68646b" stroke-width="6" stroke-linecap="round" opacity=".7"/>
 <path d="M31 111 15 107 30 120 15 130 39 130M163 110 184 102 171 122 188 130 161 137" fill="url(#fur)" stroke="${stroke}" stroke-width="3.3" stroke-linejoin="round"/>
 <path d="M49 134Q65 120 86 130Q105 123 119 130Q141 119 159 133Q139 153 111 158Q73 160 49 134Z" fill="#faf0d9" opacity=".98"/>
 ${eye(72,blink)}${eye(128,blink||wink)}
 <path d="M95 131 Q103 126 113 132L104 140Z" fill="#eb938e" stroke="#b76f75" stroke-width="2"/>
 <path d="M104 140Q100 149 92 145M104 140Q107 149 116 145" fill="none" stroke="${stroke}" stroke-width="2.7" stroke-linecap="round"/>
 <path d="M49 141 26 135M48 148 29 151M151 141 177 135M148 148 172 154" stroke="#f4e8d9" stroke-width="2.2" stroke-linecap="round"/>
 <path d="M63 82Q74 76 85 82M115 81Q126 76 138 84" stroke="#6e6261" stroke-width="2.8" fill="none" opacity=".7"/>
 <circle cx="52" cy="131" r="5" fill="#eeb6a4" opacity=".65"/><circle cx="147" cy="133" r="5" fill="#eeb6a4" opacity=".65"/>
 </g>`;
}
function backHead(){return `<g><path d="M28 95Q21 69 27 52L29 20Q30 11 38 19L69 48Q97 41 124 47L157 17Q168 10 169 28L169 67Q181 90 172 119Q162 148 124 153Q83 170 52 147Q29 132 28 95Z" fill="url(#fur)" stroke="${stroke}" stroke-width="6" stroke-linejoin="round"/>
 <path d="M31 35 39 69 63 56M160 35 156 69 135 56" fill="#eea6a2"/>
 <path d="M85 64 93 91M108 61 110 88M132 67 126 89M61 104 75 112M143 104 130 112" fill="none" stroke="#736971" stroke-width="7" stroke-linecap="round"/>
 <path d="M50 141Q100 170 151 143" fill="none" stroke="#f0e3d3" stroke-width="8"/></g>`}
function basket(bob=0){return `<g transform="translate(0 ${bob})">
 <path d="M150 177Q171 160 193 178Q191 207 182 225Q169 235 153 226Z" fill="url(#basket)" stroke="${stroke}" stroke-width="4.7" stroke-linejoin="round"/>
 <path d="M150 181Q164 152 193 181" fill="none" stroke="#6f4b34" stroke-width="5"/>
 <g><path d="M155 180Q160 160 172 172L177 161 178 177Q169 187 155 180Z" fill="#75b8dc" stroke="#3a5267" stroke-width="2.4"/><circle cx="160" cy="174" r="1.6" fill="#142734"/>
 <path d="M173 178Q176 156 188 170L195 165 194 179Q185 187 173 178Z" fill="#92d4ed" stroke="#35566b" stroke-width="2.4"/><circle cx="181" cy="172" r="1.6" fill="#142734"/>
 <path d="M165 186Q171 168 185 184L192 175 190 190Q179 197 165 186Z" fill="#e6ab68" stroke="#745447" stroke-width="2.4"/><circle cx="177" cy="183" r="1.5" fill="#182e35"/></g>
 <path d="M151 188Q169 196 192 189M152 201Q169 210 190 202M154 214Q169 223 187 215" fill="none" stroke="#88613e" stroke-width="3.3"/>
 <path d="M162 183Q156 197 160 221M177 183Q173 196 177 225" fill="none" stroke="#bc8951" stroke-width="2.8"/></g>`}
function scenery(phase,i){
 const moving=phase!=='idle', back=phase==='leave'&&i>0;
 const sway=[0,-3,0,3,0,0][i],foot=[0,-4,2,-3,0,0][i];
 return `<g transform="translate(0 ${moving?sway:0})">
 <!-- plush striped tail --> <path d="M57 179 Q15 155 13 184Q5 214 38 219Q62 218 65 197" fill="url(#fur)" stroke="${stroke}" stroke-width="6" stroke-linecap="round"/>
 <path d="M22 179 32 185M22 198 36 200" stroke="#726d72" stroke-width="7" opacity=".7"/>
 <!-- feet stay behind the tunic --> <g transform="translate(0 ${moving?foot:0})"><path d="M65 213Q53 236 64 239L90 240Q102 228 91 214" fill="#e9e4dc" stroke="${stroke}" stroke-width="4"/><path d="M116 213Q109 235 119 240L147 240Q157 225 143 214" fill="#efeee4" stroke="${stroke}" stroke-width="4"/><path d="M69 233 72 238M81 233 83 239M128 233 131 239M142 233 144 237" stroke="#c9bfc0" stroke-width="2"/></g>
 <!-- merchant's travelling backpack --> <path d="M40 156 Q35 129 48 121L74 128 72 204 35 197Z" fill="url(#leather)" stroke="${stroke}" stroke-width="5"/>
 <path d="M41 149 67 144 65 175 41 183Z" fill="#a77b4b" stroke="#6d4b34" stroke-width="3"/><path d="M42 154 60 154" stroke="#e3ac5d" stroke-width="3"/>
 <path d="M42 174 48 189 46 213" stroke="#6e583f" stroke-width="3.5"/>
 <!-- green coat and cloak --> <path d="M59 143Q96 132 147 144Q166 180 157 224Q112 234 57 224Q46 191 59 143Z" fill="url(#coat)" stroke="${stroke}" stroke-width="5.3" stroke-linejoin="round"/>
 <path d="M70 157Q95 168 109 212L89 223Q73 190 70 157M129 158Q124 189 113 226" fill="#225b42" opacity=".8"/>
 <path d="M61 143Q95 151 123 139" fill="none" stroke="#b7ce84" stroke-width="5"/>
 <!-- leather sash and coin --> <path d="M66 154 127 215" stroke="#6d4b35" stroke-width="12"/><path d="M67 154 124 211" stroke="#ba8550" stroke-width="5"/>
 <path d="M62 197Q108 209 158 198" fill="none" stroke="#764f36" stroke-width="10"/><path d="M61 197Q108 207 158 198" fill="none" stroke="#c39663" stroke-width="3"/>
 <rect x="96" y="196" width="17" height="13" rx="3" fill="#deb46d" stroke="#6a4b35" stroke-width="3"/>
 <circle cx="104" cy="159" r="12" fill="#f5c66c" stroke="#7a5a36" stroke-width="3"/><circle cx="104" cy="159" r="7" fill="#e0a54a"/><path d="M100 158Q103 152 109 158L104 165Z" fill="#ffdf9a"/>
 <!-- red scarf --> <path d="M63 145Q102 136 145 145L129 161 107 168 87 160Z" fill="#b75345" stroke="${stroke}" stroke-width="3"/><path d="M134 153 149 181 131 176" fill="#b94f48" stroke="#6f3f3f" stroke-width="2"/>
 <!-- paws --> <ellipse cx="62" cy="180" rx="18" ry="17" fill="#ecebe2" stroke="${stroke}" stroke-width="4"/><path d="M53 178 56 184M62 176 65 182" stroke="#b6abb0" stroke-width="2"/>
 ${basket(moving?([0,-3,0,-2,0,0][i]):([0,0,1,0,0,-1][i]))}
 </g>`;
}
function backBody(i){const sway=[0,1,-3,2,-3,0][i];return `<g transform="translate(0 ${sway})">
 <path d="M38 172Q12 171 14 194Q19 221 54 212" fill="url(#fur)" stroke="${stroke}" stroke-width="6"/>
 <path d="M65 218Q52 229 61 242L90 242Q102 230 95 216M115 219Q111 236 124 242L152 242Q160 226 143 218" fill="#ebe6dc" stroke="${stroke}" stroke-width="4"/>
 <path d="M51 145Q103 131 149 145L155 222Q105 239 55 220Z" fill="url(#coat)" stroke="${stroke}" stroke-width="6"/>
 <path d="M68 145 63 205Q102 220 143 204L138 145" fill="#427d56" stroke="#345940" stroke-width="2"/>
 <path d="M76 136Q103 125 135 136" stroke="#dac48a" stroke-width="7"/>
 <rect x="61" y="151" width="87" height="67" rx="15" fill="url(#leather)" stroke="${stroke}" stroke-width="5"/>
 <path d="M62 171Q104 186 145 171M80 160 80 213M127 158 127 215" stroke="#7d5238" stroke-width="6" fill="none"/>
 <rect x="87" y="190" width="39" height="23" rx="6" fill="#996942" stroke="#67442f" stroke-width="4"/><rect x="100" y="191" width="14" height="10" rx="2" fill="#e2bd75" stroke="#6d4a30" stroke-width="3"/>
 <path d="M70 150 76 213M138 151 132 216" stroke="#db9e56" stroke-width="5"/>
 </g>`;}
export function merchantFrameSvg(phase='idle',frame=0){
 if(!Object.hasOwn(MERCHANT_FRAME_COUNT,phase))throw new Error('Unknown merchant animation '+phase);
 const i=Math.max(0,Math.min(5,Math.trunc(frame)||0));
 const move=phase==='arrive'?[29,22,15,9,4,0][i]:phase==='leave'?[0,6,13,20,28,34][i]:0;
 const bob=phase==='idle'?[0,-1,-2,0,1,0][i]:0;
 const expression=phase==='idle'&&i===2?'blink':phase==='idle'&&i===5?'wink':phase==='arrive'&&i===2?'blink':'smile';
 const back=phase==='leave'&&i>0;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 255" width="210" height="255" role="img" aria-label="Кот-торговец, ${phase}, кадр ${i+1}">
 <defs>
 <linearGradient id="fur" x1="0" y1="0" x2=".95" y2="1"><stop stop-color="#eee5d9"/><stop offset=".55" stop-color="#a2a0a6"/><stop offset="1" stop-color="#777985"/></linearGradient>
 <linearGradient id="eyes" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#bc7441"/><stop offset=".55" stop-color="#804720"/><stop offset="1" stop-color="#2e2830"/></linearGradient>
 <linearGradient id="coat" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#91b276"/><stop offset=".45" stop-color="#467f58"/><stop offset="1" stop-color="#26513e"/></linearGradient>
 <linearGradient id="leather" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#cc985f"/><stop offset="1" stop-color="#734930"/></linearGradient>
 <linearGradient id="basket" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e0ae66"/><stop offset="1" stop-color="#a16b3f"/></linearGradient>
 </defs>
 <g transform="translate(${move} ${bob})">
 ${back?backBody(i)+backHead():scenery(phase,i)+`<g transform="translate(0 ${phase==='idle'?[0,-1,-1,0,1,0][i]:0})">${face(expression)}</g>`}
 </g>
 </svg>`;
}
export function merchantFrameUrl(phase='idle',index=0){
 const i=Math.max(0,Math.min(5,Math.trunc(index)||0)),key=phase+':'+i;
 if(!imgCache.has(key))imgCache.set(key,'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(merchantFrameSvg(phase,i)));
 return imgCache.get(key);
}
export function merchantVisual(merchantPhase,merchantMs,now=0,exitUntil=0){
 if(merchantPhase!=='waiting'){
  if(now<exitUntil){const n=Math.max(0,Math.min(5,Math.floor((720-(exitUntil-now))/120)));return {visible:true,phase:'leave',frame:n};}
  return {visible:false,phase:'idle',frame:0};
 }
 const remaining=Math.max(0,Math.min(15000,Number(merchantMs)||0)),elapsed=15000-remaining;
 if(elapsed<720)return {visible:true,phase:'arrive',frame:Math.min(5,Math.floor(elapsed/120))};
 if(remaining<720)return {visible:true,phase:'leave',frame:Math.min(5,Math.floor((720-remaining)/120))};
 return {visible:true,phase:'idle',frame:Math.floor((elapsed-720)/400)%6};
}
