/** Isolated P3 art candidates: these files are NOT visually approved yet.
 * New paths only. Original accepted P1 sprites / backgrounds remain unchanged.
 * P3 review uses the candidate layer by default, game only with ?p3Art=1.
 */
export const P3_ROOM_CANDIDATES=Object.freeze({
 10:Object.freeze({name:'Костяной зал',theme:'Оссуарий: костяной трон, рёберные арки, черепа, останки',url:'assets/prototypes/p3/R010-bone-hall.svg'}),
 15:Object.freeze({name:'Паучье гнездо',theme:'Паучья кладка: сети, яйца, коконы и паучьи нити',url:'assets/prototypes/p3/R015-spider-nest.svg'}),
 20:Object.freeze({name:'Логово ледяного змея',theme:'Морозное логово: змеиные следы, лёд, кристаллы и замёрзшее озеро',url:'assets/prototypes/p3/R020-ice-serpent-lair.svg'})
});
export const P3_BOSS_CANDIDATES=Object.freeze({
 bone_regent:'boss-bone-regent',
 silk_empress:'boss-silk-empress',
 glacier_serpent:'boss-glacier-serpent'
});
export const p3RoomCandidate=stage=>P3_ROOM_CANDIDATES[stage]||null;
export const p3BossCandidate=type=>P3_BOSS_CANDIDATES[type]||null;
export function p3BossFrameUrl(type,phase,index){
 const directory=p3BossCandidate(type);
 if(!directory)return null;
 if(!['attack','hurt'].includes(phase))throw Error('Unknown boss phase '+phase);
 const i=Math.max(0,Math.min(5,Math.trunc(Number(index)||0)));
 return 'assets/prototypes/p3/'+directory+'/'+phase+'_'+String(i+1).padStart(2,'0')+'.svg';
}
