// New editable SVG rigs for the two models explicitly requested in PR #5.
// Approved eight archived monsters and all kitten/equipment assets stay byte-identical.
import fs from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const bone=(d,w=12)=>`<path d="${d}" fill="none" stroke="#44383e" stroke-width="${w+7}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="url(#bone)" stroke-width="${w}" stroke-linecap="round"/>`;
const rock=(d,fill='url(#stone)')=>`<path d="${d}" fill="${fill}" stroke="#3e3d46" stroke-width="5" stroke-linejoin="round"/>`;
const rotate=(angle,x,y,body)=>`<g transform="rotate(${angle} ${x} ${y})">${body}</g>`;
const defs=`<defs><linearGradient id="bone" x2=".6" y2="1"><stop stop-color="#fff2d6"/><stop offset=".6" stop-color="#e6d0a4"/><stop offset="1" stop-color="#b8997d"/></linearGradient><linearGradient id="stone" x2=".65" y2="1"><stop stop-color="#b1bab6"/><stop offset=".55" stop-color="#818f91"/><stop offset="1" stop-color="#5d6c77"/></linearGradient><linearGradient id="moss" x2="0" y2="1"><stop stop-color="#b5c77f"/><stop offset="1" stop-color="#718c61"/></linearGradient></defs>`;
// Each pose articulates head, jaw, shoulders, elbows, hip and individual knees.
const poses={
 skeleton:{attack:[[0,0,0,0,0,0,0],[6,-4,8,-35,15,-10,8],[10,-9,15,-95,35,-20,15],[-23,-3,-13,62,-25,20,-20],[-10,2,-5,30,-10,10,-8],[0,0,0,0,0,0,0]],hurt:[[0,0,0,0,0,0,0],[5,-2,-12,-12,18,-4,8],[15,-7,-23,-40,42,-15,22],[10,8,17,25,-30,25,-15],[4,3,8,12,-10,12,-5],[0,0,0,0,0,0,0]]},
 golem:{attack:[[0,0,0,0,0,0,0],[4,3,3,-22,12,-8,6],[9,-5,8,-62,35,-12,12],[-18,7,-9,55,-15,16,-8],[-8,5,-4,22,-8,8,-4],[0,0,0,0,0,0,0]],hurt:[[0,0,0,0,0,0,0],[3,1,-4,-8,10,-4,4],[9,-3,-12,-25,25,-10,12],[7,9,9,12,-18,18,-9],[3,4,4,7,-8,8,-3],[0,0,0,0,0,0,0]]}
};
function skeleton(p,phase,i,boss){
 const [x,y,tilt,arm,other,knee,back]=p;
 const legs=rotate(back,174,217,bone('M174 213L187 244L180 274')+bone('M176 274L199 274',10))+rotate(knee,144,217,bone('M145 213L133 243L140 275')+bone('M140 275L118 275',10));
 const ribs=`<path d="M130 158Q160 146 190 158L185 207Q160 222 136 205Z" fill="#5c4d4e" stroke="#44383e" stroke-width="5"/>${bone('M161 156L161 216',7)}${[166,179,192].map(n=>bone(`M139 ${n}Q150 ${n+7} 158 ${n+3}M165 ${n+3}Q180 ${n+5} 185 ${n-2}`,6)).join('')}${bone('M143 211Q159 224 178 211',10)}`;
 const arms=rotate(other,184,164,bone('M184 164L210 184L219 205',10)+bone('M214 206L226 212',9))+rotate(arm,136,165,bone('M136 165L114 189L97 205',11)+`<ellipse cx="94" cy="209" rx="12" ry="10" fill="url(#bone)" stroke="#44383e" stroke-width="4"/>`);
 const jaw=rotate(phase==='attack'&&i>1&&i<5?12:phase==='hurt'?8:0,171,143,`<path d="M126 135L131 153Q158 167 180 149L182 131" fill="url(#bone)" stroke="#44383e" stroke-width="5"/><path d="M139 147L141 155M151 148L152 158M164 146L166 154" stroke="#6a5550" stroke-width="3"/>`);
 const skull=rotate(tilt*.5,156,143,`<path d="M118 120Q108 84 129 71Q157 52 187 72Q207 91 193 128L178 145L135 146Z" fill="url(#bone)" stroke="#44383e" stroke-width="5"/><path d="M127 110Q128 92 144 96Q154 99 148 117Q134 126 127 110ZM165 99Q182 86 187 106Q188 119 171 120Z" fill="#44383e"/><circle cx="137" cy="106" r="4" fill="#f0bd74"/><circle cx="176" cy="105" r="4" fill="#f0bd74"/><path d="M155 121L148 132L162 132Z" fill="#826b5e"/><path d="M162 72L153 82L160 89" fill="none" stroke="#b29a7e" stroke-width="3"/>${jaw}${boss?crown(113,38,86):''}`);
 return `<g transform="translate(${x} ${y})">${legs}<g transform="rotate(${tilt} 160 219)">${arms}${ribs}${skull}</g></g>`;
}
function golem(p,phase,i,boss){
 const [x,y,tilt,arm,other,knee,back]=p;
 const leg=(a,cx)=>rotate(a,cx,225,rock(`M${cx-20} 218L${cx+18} 218L${cx+23} 276L${cx-29} 278L${cx-29} 260Z`)+`<path d="M${cx-15} 246L${cx+16} 244" stroke="#c1c8b9" stroke-width="3"/>`);
 const arms=rotate(other,209,165,rock('M205 152L236 164L251 212L222 230L203 199Z'))+rotate(arm,112,165,rock('M114 151L83 160L64 209L78 235L108 225L127 184Z')+rock('M73 206L105 205L113 238L78 248L61 230Z'));
 const body=rock('M112 148L202 141L222 206L198 238L119 235L98 201Z')+`<path d="M120 155L196 151L203 166L117 171Z" fill="#d1d4bc" opacity=".45"/><path d="M166 167L155 185L168 193L157 216" fill="none" stroke="#47535d" stroke-width="5"/><path d="M165 177L179 191L165 208L151 192Z" fill="#a9e4cf" stroke="#4d6966" stroke-width="3"/>`;
 const head=rotate(tilt*.4,158,139,rock('M119 81L170 68L201 85L207 127L183 151L128 146L108 119Z')+`<path d="M121 84L137 72L157 78L175 67L194 82L191 91L169 86L151 93L132 88Z" fill="url(#moss)" stroke="#526750" stroke-width="3"/><path d="M122 109L143 112L141 125L125 122ZM167 111L192 103L190 119L171 124Z" fill="#b8efd6" stroke="#415b5b" stroke-width="3"/><path d="M142 138L170 136" stroke="#43515b" stroke-width="5" stroke-linecap="round"/><path d="M170 88L158 101L164 112" fill="none" stroke="#606f76" stroke-width="3"/>${boss?crown(112,38,88):''}`);
 const chips=phase==='hurt'&&i>0&&i<5?`<g fill="#afb8a3" stroke="#42474f" stroke-width="2"><path d="M88 ${170+i*5}l-10 -8l-3 15Z"/><path d="M226 ${135+i*8}l12 -4l-4 12Z"/></g>`:'';
 return `<g transform="translate(${x} ${y})">${leg(back,185)}${leg(knee,133)}<g transform="rotate(${tilt} 160 232)">${arms}${body}${head}</g>${chips}</g>`;
}
function crown(x,y,w){return `<image href="../../../art/approved/crown.svg" x="${x}" y="${y}" width="${w}" height="48"/>`;}
// Embed the existing crown verbatim as a data URI: standalone frames also work offline.
const crownData=Buffer.from(await fs.readFile(new URL('art/approved/crown.svg',root))).toString('base64');
for(const type of ['skeleton','golem'])for(const variant of ['normal','boss'])for(const phase of ['attack','hurt'])for(let i=0;i<6;i++){
 const art=(type==='skeleton'?skeleton:golem)(poses[type][phase][i],phase,i,variant==='boss');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320" data-model="${type}-articulated" data-phase="${phase}" data-frame="${i+1}"><title>${type} ${variant} ${phase} ${i+1}</title>${defs}<ellipse cx="160" cy="281" rx="74" ry="11" fill="#28272e" opacity=".22"/>${art}</svg>`.replaceAll('../../../art/approved/crown.svg',`data:image/svg+xml;base64,${crownData}`);
 const dir=new URL(`animations/${type}/${variant}/${phase}/`,root);await fs.mkdir(dir,{recursive:true});await fs.writeFile(new URL(`0${i+1}.svg`,dir),svg);
 if(variant==='normal'&&phase==='attack'&&i===0){const d=new URL('art/monsters-v097/',root);await fs.mkdir(d,{recursive:true});await fs.writeFile(new URL(`${type}.svg`,d),svg);}
}
console.log('Built 48 articulated skeleton/golem normal/boss attack/hurt frames + 2 idle models');
