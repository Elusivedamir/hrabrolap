// Extend existing approved vector chestplates into registered clothing layers.
// No cat, sword, old armor icon, gameplay price or stat is changed.
import fs from 'node:fs/promises';
import {ARMOR_SET_IDS,ARMOR_POSES} from '../armor-frames.mjs';
const root=new URL('../',import.meta.url);
const themes={
 web:['#b3adce','#f2f1ff','#4d445b','#d5cbef'],steel:['#9da9b9','#e9f4f6','#303842','#ccd5df'],
 bone_slime:['#9fc9af','#e5f4d6','#4b4a47','#f1e0bb'],chitin:['#a27d50','#f5d394','#493a3b','#765b48'],
 leaf:['#5a8461','#a6cf76','#334e3d','#d2dba0'],moss:['#638b5b','#b5d69a','#3d4538','#d2a770'],
 shadow:['#53466c','#9887b7','#31283e','#ceb1ef'],moon_armor:['#546b9f','#d4dcfb','#343e5f','#a6b9e9'],
 star:['#a88954','#ffefab','#5c433e','#f8cd72'],king:['#a74f58','#ffe7a3','#59333b','#d6a65b']
};
const g=(x,y,a,body)=>`<g transform="translate(${x} ${y}) rotate(${a})">${body}</g>`;
function emblem(id,t){
 const [base,trim,ink,accent]=t;
 if(id==='web')return `<path d="M0 -62V-34M-23 -55L23 -39M23 -55L-23 -39M-20 -49Q0 -62 20 -49M-13 -40Q0 -48 13 -40" fill="none" stroke="${trim}" stroke-width="2.2"/>`;
 if(id==='steel')return `<path d="M-5 -64L-3 -35L5 -37L6 -62Z" fill="${trim}" stroke="${ink}" stroke-width="2"/><circle cx="-38" cy="-38" r="2.5" fill="${trim}"/><circle cx="39" cy="-42" r="2.5" fill="${trim}"/>`;
 if(id==='bone_slime')return `<path d="M-13 -52L10 -38M11 -54L-11 -37" stroke="${accent}" stroke-width="6" stroke-linecap="round"/><circle cx="0" cy="-47" r="8" fill="${trim}" stroke="${ink}" stroke-width="2"/>`;
 if(id==='chitin')return `<path d="M-32 -55L-24 -40L-9 -56L0 -42L13 -61L23 -47L36 -57" fill="none" stroke="${trim}" stroke-width="3.5" stroke-linejoin="round"/>`;
 if(id==='moss')return `<path d="M-29 -48Q-34 -66 -19 -64Q-18 -79 -5 -67Q8 -80 16 -66Q34 -70 30 -50Q5 -63 -29 -48Z" fill="${trim}" stroke="${ink}" stroke-width="2.5"/><path d="M-19 -53L-17 -60M-5 -57L-4 -65M10 -58L12 -65M24 -55L24 -61" stroke="${base}" stroke-width="2.5"/>`;
 if(id==='leaf')return `<path d="M-3 -38Q-27 -63 3 -66Q25 -46 -3 -38Z" fill="${trim}" stroke="${ink}" stroke-width="2.5"/><path d="M0 -43L2 -61M1 -52L-8 -57M1 -48L9 -52" stroke="${themes[id][0]}" fill="none" stroke-width="2"/>`;
 if(id==='shadow')return `<path d="M0 -66L-14 -52L-5 -50L-10 -37L14 -53L5 -54L12 -66Z" fill="${accent}" stroke="${ink}" stroke-width="2"/><path d="M-29 -47L-24 -52M25 -49L31 -55" stroke="${trim}" stroke-width="3" stroke-linecap="round"/>`;
 if(id==='moon_armor')return `<path d="M10 -65Q-18 -53 3 -36Q-19 -33 -20 -49Q-20 -62 10 -65Z" fill="${trim}" stroke="${ink}" stroke-width="1.5"/><circle cx="18" cy="-57" r="3" fill="${accent}"/>`;
 if(id==='star')return `<path d="M0 -67L5 -56L18 -54L9 -46L11 -34L0 -40L-11 -34L-9 -46L-18 -54L-5 -56Z" fill="${trim}" stroke="${ink}" stroke-width="2"/>`;
 return `<path d="M-20 -39L-25 -63L-10 -54L0 -68L10 -54L25 -63L20 -39Z" fill="${accent}" stroke="${ink}" stroke-width="3"/><circle cx="0" cy="-47" r="4" fill="#e57466"/>`;
}
function helmet(id,pose,t){
 const [base,trim,ink]=t;
 return g(...pose,`<g data-part="helmet"><path d="M-69 -26Q-66 -57 -33 -61Q15 -72 56 -47L68 -23L55 -16Q20 -44 -16 -33Q-42 -26 -58 -10Z" fill="url(#metal)" stroke="${ink}" stroke-width="4.5" stroke-linejoin="round"/><path d="M-58 -24Q-24 -49 13 -44Q39 -42 59 -26" fill="none" stroke="${trim}" stroke-width="3.8" stroke-linecap="round"/><path d="M-52 -46Q-22 -61 10 -57" fill="none" stroke="${trim}" stroke-width="3" opacity=".55"/>${emblem(id,t)}</g>`);
}
function boot(p,t){
 const [base,trim,ink,accent]=t;
 return g(...p,`<g data-part="boot"><path d="M-19 -17Q0 -24 17 -16L20 -6Q28 -2 26 6Q4 13 -25 7Q-29 2 -22 -6Z" fill="url(#metal)" stroke="${ink}" stroke-width="3.4" stroke-linejoin="round"/><path d="M-18 -13Q-2 -19 15 -12M-22 4Q0 9 23 4" fill="none" stroke="${trim}" stroke-width="3"/><path d="M-15 -5Q0 -10 16 -5" fill="none" stroke="${ink}" stroke-width="2.5"/><circle cx="3" cy="-7" r="3" fill="${accent}"/></g>`);
}
for(const id of ARMOR_SET_IDS){
 const old=await fs.readFile(new URL(`art/armor/${id}.svg`,root),'utf8');
 const chest=old.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
 const t=themes[id],[base,trim,ink]=t;
 for(const kind of ['attack','hurt'])for(let i=0;i<6;i++){
  const p=ARMOR_POSES[kind][i],[cx,cy,angle,w,h]=p.torso;
  const cutouts=`<ellipse data-protect="flower" cx="${p.flower[0]}" cy="${p.flower[1]}" rx="35" ry="33"/>${p.paws.map(([x,y,rx,ry])=>`<ellipse data-protect="paw" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`).join('')}<polygon data-protect="scarf" points="${p.scarf}"/>`;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="279" height="370" viewBox="0 0 279 370" data-armor="${id}" data-phase="${kind}" data-frame="${i+1}"><title>${id} ${kind} ${i+1}: independent fitted armor</title><defs><linearGradient id="metal" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="${trim}"/><stop offset=".4" stop-color="${base}"/><stop offset="1" stop-color="${base}"/></linearGradient><mask id="details" maskUnits="userSpaceOnUse" x="0" y="0" width="279" height="370"><rect width="279" height="370" fill="white"/><g fill="black">${cutouts}</g></mask></defs><g mask="url(#details)">${p.feet.map(b=>boot(b,t)).join('')}${g(cx,cy,angle,`<g data-part="chestplate" transform="translate(${-w/2} ${-h/2}) scale(${w/100} ${h/80})">${chest}</g>`)}${helmet(id,p.head,t)}</g></svg>`;
  const dir=new URL(`art/armor-frames/${id}/${kind}/`,root);await fs.mkdir(dir,{recursive:true});await fs.writeFile(new URL(`0${i+1}.svg`,dir),svg);
 }
}
console.log('Built 120 pure SVG armor overlays: 10 sets × 6 attack + 6 hurt; original kitten and icon files unchanged.');
