// Ten separately constructed garments; never writes the approved cat, swords or shop icons.
import fs from 'node:fs/promises';
import {ARMOR_SET_IDS,ARMOR_POSES} from '../armor-frames.mjs';
const root=new URL('../',import.meta.url);
const themes={
 web:['#81718e','#efe2f3','#413047','#b8a3c6'],steel:['#71899d','#e3f2f9','#293b4a','#aec4d0'],
 bone_slime:['#77b593','#dcf3c8','#364e41','#efdfb1'],chitin:['#744c38','#e5b570','#352b2b','#b47e46'],
 leaf:['#43815b','#b7d87c','#294c36','#7caf57'],moss:['#795844','#b6cb76','#3e3e2d','#647c3d'],
 shadow:['#4a3a60','#bda2d5','#292335','#776186'],moon_armor:['#566d9d','#e1eafa','#303d60','#9fbae1'],
 star:['#9d7137','#fff0ae','#58402b','#e7b64d'],king:['#933d4a','#ffe5a1','#502b34','#d5a453']
};
const g=(x,y,a,body)=>`<g transform="translate(${x} ${y}) rotate(${a})">${body}</g>`;
// Every design has its own outline, seams and load-bearing construction. Coordinates
// are local to the torso; no old rectangular inventory icon is pasted onto the cat.
function construction(id,t){
 const [b,l,k,a]=t;
 const P=(d,f=b,s=k,w=3)=>`<path d="${d}" fill="${f}" stroke="${s}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
 const L=(d,s=l,w=2)=>P(d,'none',s,w);
 const C=(x,y,r,f=l)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" stroke="${k}" stroke-width="1.4"/>`;
 let chest,head,shoe;
 switch(id){
 case 'web':
  chest=P('M-39 -39Q-17 -31 -5 -27Q15 -38 37 -39L44 -8L34 30L17 37L0 31L-18 38L-37 28L-45 -8Z')+
   P('M-37 -35L-27 -34L-23 24L-32 29Z',a)+P('M27 -35L36 -36L34 26L26 31Z',a)+
   L('M0 -25V31M-29 -22L28 24M29 -23L-27 25M-35 0H37M-30 -14Q0 3 31 -14M-32 15Q0 36 32 15M-20 -26Q0 -12 21 -26',l,1.7)+
   P('M-39 19Q0 31 37 18L35 27Q0 40 -37 28Z',k)+C(0,27,4,a);
  head=P('M-60 -27L-57 -58Q-35 -62 -20 -56L-8 -64L12 -59L32 -63L53 -48L60 -24L44 -30L25 -40L4 -34L-18 -40L-42 -29Z',a)+
   L('M-50 -50L45 -30M-37 -58L20 -36M-15 -59L-23 -38M10 -57L1 -36M33 -56L25 -40M-52 -37Q-15 -58 42 -43',l,1.7);
  shoe=P('M-17 -18L12 -19L17 -5L25 2L19 10L-24 9L-25 0L-18 -5Z')+L('M-17 -10L12 0M10 -12L-15 1M-18 5H20',l,2);
  break;
 case 'steel':
  chest=P('M-33 -40L-15 -34Q0 -27 15 -34L33 -40L42 -18L36 21Q22 36 0 39Q-25 35 -37 20L-42 -18Z','url(#metal)')+
   P('M-42 -39L-29 -37L-32 -15L-51 -13L-54 -28Z',a)+P('M31 -38L43 -38L53 -27L48 -12L33 -15Z',a)+
   P('M0 -29L10 -13L7 19L0 29L-8 18L-10 -13Z',a,k,2)+L('M-29 -27Q-33 -8 -25 8M16 -25Q28 -23 31 -13',l,3)+
   P('M-36 16Q0 30 36 16L33 26Q0 40 -33 26Z',b)+P('M-32 27L-4 33L-5 43L-34 37ZM4 33L31 27L34 37L5 43Z',a)+C(-42,-27,2)+C(42,-27,2);
  head=P('M-63 -24L-58 -56Q-30 -82 8 -75Q42 -73 57 -49L65 -22L53 -17L44 -35Q0 -53 -43 -35L-52 -16Z','url(#metal)')+
   P('M-7 -76L4 -77L8 -42L-3 -41Z',a)+L('M-50 -51Q-29 -70 -13 -68M15 -65Q34 -63 43 -48',l,3)+C(-48,-29,2.4)+C(51,-28,2.4);
  shoe=P('M-17 -23L11 -24L15 -8L27 -2L30 7Q6 15 -25 8L-26 0L-18 -7Z','url(#metal)')+
   L('M-16 -15H12M-18 -6L17 -5M-22 2L24 3',k,2)+L('M-10 -20L-8 -10M-17 6H19',l,2.5);
  break;
 case 'bone_slime':
  chest=P('M-31 -37Q0 -47 32 -36Q42 -16 38 10L43 25Q38 43 23 31Q12 46 0 34Q-15 44 -24 32Q-43 38 -41 20L-36 3Z',b)+
   P('M-4 -33Q0 -36 5 -32L6 25L0 33L-6 25Z',a)+
   [-22,-8,7].map((y,n)=>P(`M-6 ${y}Q-29 ${y-12} -34 ${y+1}Q-24 ${y+12} -7 ${y+8}L-7 ${y+2}Q-23 ${y+4} -25 ${y}Q-17 ${y-3} -6 ${y+1}Z`,a,k,2)+P(`M6 ${y}Q29 ${y-12} 34 ${y+1}Q24 ${y+12} 7 ${y+8}L7 ${y+2}Q23 ${y+4} 25 ${y}Q17 ${y-3} 6 ${y+1}Z`,a,k,2)).join('')+
   C(-29,23,3,l)+C(27,21,4,l);
  head=P('M-58 -32Q-60 -55 -39 -57Q-28 -74 -6 -65Q11 -77 27 -63Q48 -61 55 -39L56 -24Q39 -38 22 -35L6 -42L-13 -37L-30 -43Z',b)+
   P('M-32 -54Q-25 -68 -12 -57L17 -42Q30 -46 31 -35Q18 -26 15 -38L-16 -51Q-30 -43 -32 -54Z',a,k,2.5)+C(29,-55,4,l)+C(42,-45,2,l);
  shoe=P('M-15 -19Q-2 -27 12 -17L15 -6Q31 -1 23 9Q12 15 3 9Q-6 16 -15 10Q-31 14 -24 1Z',b)+
   P('M-15 -12Q0 -17 13 -11L11 -5L-13 -5Z',a,k,2)+C(-8,2,3,a)+C(3,3,3,a)+C(14,3,3,a);
  break;
 case 'chitin':
  chest=P('M-28 -42L0 -47L30 -40L42 -19L38 18L24 35L0 45L-27 34L-40 14L-42 -20Z',k)+
   P('M-29 -39Q-43 -22 -35 -7L0 0L-2 -42Z','url(#metal)')+P('M3 -42L0 0L36 -7Q44 -23 29 -39Z',a)+
   P('M-36 -4L0 5L36 -4L31 13L0 24L-32 13Z',b)+P('M-31 16L0 28L31 16L23 32L0 43L-23 32Z',a)+
   P('M-39 -32L-54 -20L-50 -5L-38 -11ZM39 -32L52 -20L49 -5L38 -11Z',b)+L('M-28 -31L-30 -18L-8 -12M11 13L25 7M-18 29L0 36',l,2);
  head=P('M-62 -28L-52 -55L-29 -68L-8 -64L3 -78L17 -63L37 -62L55 -46L61 -24L41 -31L22 -44L0 -37L-23 -42L-43 -31Z','url(#metal)')+
   P('M-4 -65L3 -89L13 -67L6 -43Z',a)+L('M-46 -51L-32 -54L-23 -43M29 -54L43 -44',l,2.5);
  shoe=P('M-14 -23L10 -23L17 -10L29 2L23 11L-24 9L-27 -1L-20 -10Z',k)+P('M-15 -20L10 -20L15 -8L-20 -6Z',a)+P('M-20 -2L16 -5L25 2L20 7L-23 5Z',b)+L('M-9 -16L6 -16M-15 1L11 0',l,2);
  break;
 case 'leaf':
  chest=P('M-9 -33L5 -32L13 19L-3 28L-14 11Z',k)+
   P('M-5 -29Q-26 -51 -49 -40Q-52 -13 -24 5Q-3 -3 -5 -29Z',a)+P('M7 -29Q32 -55 48 -43Q54 -19 22 5Q2 -5 7 -29Z',b)+
   P('M-14 -12Q-52 -6 -50 18Q-45 35 -30 43Q-10 26 -14 -12Z',b)+P('M14 -13Q46 -14 49 7Q48 22 36 32Q7 16 14 -13Z',a)+
   P('M0 -7Q-15 5 -8 23L3 49Q26 15 0 -7Z',b)+L('M0 1V33M-11 -24L-28 -10M12 -24L28 -10M-19 4L-23 21M20 3L23 21',l,2.2);
  head=P('M-58 -28Q-52 -49 -25 -52Q-34 -75 -10 -74Q10 -68 9 -51Q27 -74 45 -57Q48 -39 31 -36L54 -27L40 -21Q0 -47 -45 -22Z',b)+
   L('M-15 -68L3 -45M36 -56L11 -42M-45 -35Q0 -56 41 -30',l,2.5);
  shoe=P('M-13 -19Q0 -26 13 -18L15 -5Q25 -6 27 4L18 11L-22 9L-25 2Z',b)+P('M-18 3Q-10 -15 10 -11Q20 -1 24 5Q2 15 -18 3Z',a,k,2)+L('M-14 4L15 1M-11 -13L-3 -4',l,2);
  break;
 case 'moss':
  chest=P('M-31 -40L-15 -32L1 -38L17 -34L29 -42L37 -19L33 6L40 32L19 29L4 41L-13 32L-35 37L-39 15L-34 -4Z',b)+
   P('M-32 -36L-21 -30L-19 28L-30 31L-34 9Z',a)+P('M-11 -31L1 -34L6 32L-7 29Z','#a17b50')+P('M15 -30L27 -36L31 27L19 25Z',b)+
   L('M-26 -24L-28 -4L-23 10M-4 -22L-1 -4L-4 13M23 -19L21 0L27 15',k,2)+
   P('M-42 -30Q-54 -42 -42 -48Q-35 -57 -29 -46Q-14 -50 -15 -35L-23 -21Z',a)+
   P('M-38 24Q-28 16 -22 26Q-12 16 -5 29Q5 19 12 29Q23 16 35 25L39 36L21 32L6 42L-14 35L-34 39Z',a)+C(-36,-38,3,l);
  head=P('M-55 -25L-57 -54L-38 -60L-32 -49L-18 -65L-1 -62L9 -70L28 -59L32 -47L50 -46L57 -23L34 -31L15 -35L-5 -32L-25 -38Z',b)+
   P('M-46 -50Q-49 -67 -34 -64Q-32 -78 -19 -68Q-5 -81 3 -66Q21 -77 29 -61Q44 -66 45 -47L30 -49L17 -44L2 -50L-17 -45L-29 -51Z',a)+L('M-40 -36L-34 -46M-14 -42L-10 -54M15 -40L22 -50',l,2);
  shoe=P('M-16 -21L9 -24L15 -6L27 0L25 10L-23 9L-26 -1Z',b)+L('M-11 -17L-10 -4M3 -17L6 -5',k,2)+P('M-24 2Q-15 -7 -8 1Q1 -7 7 1Q18 -7 26 2L25 9L-23 8Z',a,k,2);
  break;
 case 'shadow':
  chest=P('M-27 -42L-11 -30L11 -37L32 -45L39 -19L30 6L37 39L5 30L-7 44L-35 32L-30 9L-42 -21Z',b)+
   P('M-39 -29L-22 -36L31 13L26 24L-1 5Z',a,k,2)+P('M27 -37L37 -27L-25 26L-35 18Z',k)+
   P('M-29 18L31 10L34 20L-31 29Z',a)+P('M-4 15L9 13L10 25L-3 27Z',l,k,2)+
   P('M-38 -31L-49 -21L-44 -4L-31 -13Z',k)+L('M-28 -24L-14 -12M12 2L24 13M-22 33L-11 36',l,1.5);
  head=P('M-64 -25L-59 -59L-34 -73L-11 -62L12 -70L36 -57L53 -39L66 -29L54 -17L34 -30L10 -35L-16 -32L-40 -22Z',b)+
   P('M-34 -71L-21 -47L-42 -27L-53 -23L-48 -49Z',a)+P('M-20 -43L27 -54L42 -41L-2 -32Z',k,k,2)+L('M-46 -53L-39 -43M-34 -61L-28 -52M10 -60L20 -54',l,2);
  shoe=P('M-14 -25L10 -25L10 -9L21 -5L31 3L20 10L-22 9L-25 3L-16 -5Z',b)+P('M-15 -18L10 -14L10 -7L-16 -10Z',a,k,2)+P('M-18 -3L17 -6L21 0L-21 4Z',k)+L('M-13 5L17 5',l,1.5);
  break;
 case 'moon_armor':
  chest=P('M-27 -43Q0 -24 28 -43L40 -19Q29 -7 34 11L28 29L0 43L-28 29L-34 11Q-30 -9 -40 -20Z','url(#metal)')+
   P('M-35 -32Q-51 -20 -45 -7Q-34 5 -23 -9L-15 -26Z',l)+P('M24 -29Q47 -40 49 -17Q48 -5 35 -2Q27 -13 24 -29Z',a)+
   P('M13 -23Q-20 -14 -6 12Q-22 4 -22 -10Q-20 -28 13 -23Z',l,k,2)+
   P('M-28 16Q0 29 28 16L25 28Q0 41 -25 28Z',a)+P('M-22 30L0 40L22 30L15 41L0 48L-15 41Z',l,k,2)+L('M23 -18Q26 -4 22 7M-19 22Q0 31 19 22',l,2);
  head=P('M-61 -25Q-65 -61 -32 -69L-15 -61Q5 -72 27 -62L49 -57L60 -23L48 -19L35 -37Q0 -48 -39 -33L-51 -16Z',b)+
   P('M12 -78Q-21 -65 -1 -45Q-28 -46 -29 -64Q-27 -82 12 -78Z',l,k,2.5)+L('M-52 -40L-43 -53M25 -54Q43 -49 47 -35',a,3)+C(27,-66,2,l);
  shoe=P('M-16 -23L12 -25L13 -6Q22 -7 28 2L21 11L-23 9L-26 1Z',b)+P('M-15 -17Q-2 -9 12 -18L11 -8Q-2 1 -16 -8Z',a,k,2)+P('M8 -4Q-6 2 1 8Q-15 8 -13 0Q-7 -5 8 -4Z',l,k,1.5);
  break;
 case 'star':
  chest=P('M-27 -39L-8 -33L0 -44L10 -32L28 -41L39 -20L31 4L38 25L18 32L0 44L-18 32L-39 25L-31 3L-40 -20Z',b)+
   P('M-36 -38L-54 -35L-48 -20L-58 -11L-35 -9L-20 -26Z',a)+P('M35 -37L53 -33L48 -20L57 -9L35 -8L21 -25Z',a)+
   P('M0 -29L9 -10L29 -6L14 9L16 30L0 20L-17 30L-14 9L-30 -6L-9 -10Z',l)+
   P('M0 -15L5 -4L16 -2L8 6L9 17L0 12L-9 17L-8 6L-16 -2L-5 -4Z',a,k,1.6)+L('M-30 19L-22 25M29 20L22 25',l,2);
  head=P('M-62 -25L-51 -58L-35 -53L-22 -72L-6 -59L13 -76L24 -59L44 -62L59 -26L45 -22L25 -38L3 -33L-22 -39L-45 -23Z',a)+
   P('M0 -77L6 -64L20 -62L10 -52L12 -39L0 -45L-12 -39L-10 -52L-20 -62L-6 -64Z',l,k,2.5)+L('M-48 -43L-40 -47M34 -48L43 -41',l,3);
  shoe=P('M-15 -22L1 -28L13 -22L15 -8L30 -2L25 9L4 12L-24 9L-28 -1L-17 -8Z',a)+P('M-5 -18L0 -24L5 -18L12 -17L7 -11L8 -4L0 -8L-8 -4L-7 -11L-12 -17Z',l,k,1.6)+L('M-20 4L-6 7M11 7L22 4',l,2);
  break;
 case 'king':
  chest=P('M-35 -43L-17 -35L0 -39L17 -35L35 -44L48 -20L39 4L43 34L19 28L0 45L-20 29L-43 35L-39 4L-49 -20Z',b)+
   P('M-33 -34Q0 -20 33 -35L34 -6L28 14Q0 33 -29 14L-35 -6Z','url(#metal)')+
   P('M-44 -39Q-60 -29 -50 -12L-33 -8L-25 -26Z',a)+P('M44 -40Q60 -28 49 -11L33 -8L26 -26Z',a)+
   L('M-26 -26Q0 -12 26 -27M-26 -20L-24 8Q0 25 24 8L26 -20',l,2.4)+
   P('M-29 14L-4 24L-6 40L-34 30ZM4 24L29 14L34 30L6 40Z',a)+
   P('M-10 -10L-13 -21L-4 -17L0 -25L5 -17L13 -21L10 -10Z',l,k,2)+C(0,-3,4,b)+C(-44,-24,3,l)+C(43,-24,3,l);
  head=P('M-59 -24L-54 -44L-58 -73L-34 -58L-23 -80L-5 -60L12 -83L26 -59L51 -73L50 -44L60 -24L44 -21Q0 -44 -44 -21Z',a)+
   P('M-51 -43Q0 -65 49 -43L49 -32Q0 -50 -50 -30Z',b)+C(-30,-42,3,l)+C(3,-47,4,'#c45458')+C(32,-41,3,l)+L('M-40 -58L-35 -50M20 -63L17 -53',l,2);
  shoe=P('M-16 -25L12 -25L16 -8L29 -3L27 8Q3 16 -25 8L-27 -1L-18 -7Z',b)+P('M-15 -20L12 -20L14 -11L-16 -10Z',a,k,2)+P('M-23 2Q0 -7 26 1L24 7Q0 13 -23 7Z',a,k,2)+C(2,1,3,b)+L('M-10 -16H8',l,2);
 }
 return {chest,head,shoe};
}
for(const id of ARMOR_SET_IDS){
 const t=themes[id],[base,trim]=t,{chest,head,shoe}=construction(id,t);
 for(const kind of ['attack','hurt'])for(let i=0;i<6;i++){
  const p=ARMOR_POSES[kind][i],[cx,cy,angle,w,h]=p.torso;
  const cutouts=`<ellipse data-protect="flower" cx="${p.flower[0]}" cy="${p.flower[1]}" rx="35" ry="33"/>${p.paws.map(([x,y,rx,ry])=>`<ellipse data-protect="paw" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`).join('')}<polygon data-protect="scarf" points="${p.scarf}"/>`;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="279" height="370" viewBox="0 0 279 370" data-armor="${id}" data-phase="${kind}" data-frame="${i+1}"><title>${id} ${kind} ${i+1}: fitted ${id} construction</title><defs><linearGradient id="metal" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="${trim}"/><stop offset=".55" stop-color="${base}"/><stop offset="1" stop-color="${trim}"/></linearGradient><mask id="details" maskUnits="userSpaceOnUse" x="0" y="0" width="279" height="370"><rect width="279" height="370" fill="white"/><g fill="black">${cutouts}</g></mask></defs><g mask="url(#details)">${p.feet.map(b=>g(...b,`<g data-part="boot">${shoe}</g>`)).join('')}${g(cx,cy,angle,`<g data-part="chestplate" transform="scale(${w/100} ${h/90})">${chest}</g>`)}${g(...p.head,`<g data-part="helmet">${head}</g>`)}</g></svg>`;
  const dir=new URL(`art/armor-frames/${id}/${kind}/`,root);await fs.mkdir(dir,{recursive:true});await fs.writeFile(new URL(`0${i+1}.svg`,dir),svg);
 }
}
console.log('Built 120 pose-fitted SVGs from ten distinct constructions; approved cat, swords and icons untouched.');
