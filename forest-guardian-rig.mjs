// Complete character frames from Damir's manually edited PSDs, not armor overlays.
// Replace the body only while this costume is equipped; the sword stays separate.
export const FOREST_GUARDIAN_ID = 'forest_guardian';
export const FRAME_COUNT = 6;
export function forestFrameUrl(kind,index) {
 if(kind!=='attack'&&kind!=='hurt')throw new Error('Unknown forest animation: '+kind);
 const i=Math.min(5,Math.max(0,Math.trunc(Number(index)||0)));
 return 'assets/costumes/forest_guardian/'+kind+'_'+String(i+1).padStart(2,'0')+'.png';
}
