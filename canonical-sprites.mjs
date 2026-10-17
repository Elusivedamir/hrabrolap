/**
 * CANONICAL SPRITES — extracted pixel-for-pixel in pose from the user-approved reference sheets.
 * No procedural transformations of the cat body are applied: only frame swaps.
 * Original image content and motions remain in the twelve PNG files.
 * Forest Guardian uses the user's complete fitted character frames when equipped.
 */
import {FOREST_GUARDIAN_ID,forestFrameUrl} from './forest-guardian-rig.mjs';
export const CANONICAL_FRAME_COUNT = 6;
export const CANONICAL_FRAME_PATHS = Object.freeze({
  attack: Object.freeze(Array.from({length: 6}, (_, i) => `assets/canonical/attack_${String(i+1).padStart(2, '0')}.png`)),
  hurt: Object.freeze(Array.from({length: 6}, (_, i) => `assets/canonical/hurt_${String(i+1).padStart(2, '0')}.png`))
});
const NATIVE_WIDTH=279, NATIVE_HEIGHT=370;
const X=114,Y=-22,W=260,H=346;
const kx = W/NATIVE_WIDTH, ky=H/NATIVE_HEIGHT;
// Reference coordinates sampled at the grasp paw, in the exact original cropped frame canvas.
// [paw_x, paw_y, clockwise_degrees, weapon_scale]
export const WEAPON_HANDLES = Object.freeze({
 attack: [
  [104,233,-15,.64], [89,151,-24,.64], [90,149,-29,.64],
  [99,233,86,.64], [180,230,57,.64], [104,233,-15,.64]
 ],
 hurt: [
  [107,233,-15,.62], [91,241,-20,.62], [105,245,-22,.62],
  [82,201,-35,.62], [84,273,15,.62], [107,233,-15,.62]
 ]
});
// Position of each separate chestplate in reference frame coordinates.
// [center_x, center_y, body_relative_rotation, scale_factor]. These are adjustable
// equipment anchors, not transformations applied to the source kitten frames.
export const ARMOR_HANDLES = Object.freeze({
 attack: [
  [156,249,0,1], [166,257,-5,1], [153,251,-7,1],
  [169,247,6,1], [140,252,4,.95], [156,249,0,1]
 ],
 hurt: [
  [163,248,0,1], [160,246,-5,1], [165,258,-4,1],
  [144,248,-12,.95], [152,275,7,.95], [163,248,0,1]
 ]
});
function attr(element,name,value){element.setAttribute(name,String(value));}
export function applyCanonicalFrame(kind,index,rig){
 if(kind!=='attack'&&kind!=='hurt')throw new Error('Unknown canonical animation: '+kind);
 const i=Math.max(0,Math.min(5,Math.trunc(index)||0));
 const {body,heroMotion,weaponSlot,armorSlot,armorImage,armorId='none'}=rig;
 if(!body||!heroMotion||!weaponSlot||!armorSlot||!armorImage)throw new Error('Incomplete SVG equipment rig');
 const costume=armorId===FOREST_GUARDIAN_ID;
 const complete=new Set(['steel_knight','thorn_ranger','moon_mage','ember_guard','frost_watcher']);
 const baked=complete.has(armorId);
 const file=kind+'_'+String(i+1).padStart(2,'0')+'.png';
 attr(body,'href',costume?forestFrameUrl(kind,i):baked?'assets/costumes/'+armorId+'/'+file:CANONICAL_FRAME_PATHS[kind][i]);
 attr(body,'data-costume',costume||baked?armorId:'none');
 for(const [key,value] of Object.entries({x:X,y:Y,width:W,height:H}))attr(body,key,value);
 // The cat itself is NEVER rotated, stretched or translated between frames.
 attr(heroMotion,'transform','translate(0 0)');
 let [handX,handY,angle,scale]=WEAPON_HANDLES[kind][i];
 // The user's first attack PSD contains the original pose exactly 15 pixels
 // lower on its canvas. Keep that artwork intact and put the sword in its paw.
 if(costume&&kind==='attack'&&i===0)handY+=15;
 const wx=X+handX*kx,wy=Y+handY*ky;
 attr(weaponSlot,'transform',`translate(${wx.toFixed(2)} ${wy.toFixed(2)}) rotate(${angle}) scale(${scale})`);
 const [cx,cy,rot,sz]=ARMOR_HANDLES[kind][i];
 const ax=X+cx*kx,ay=Y+cy*ky;
 // Existing armor SVG is 100×80; overlay size is restricted to chest/shoulder region.
 for(const [key,value] of Object.entries({x:-40,y:-25,width:80,height:64}))attr(armorImage,key,value);
 attr(armorSlot,'transform',`translate(${ax.toFixed(2)} ${ay.toFixed(2)}) rotate(${rot}) scale(${sz})`);
 attr(body,'data-reference-frame',`${kind}-${i+1}`);
 return {kind,frame:i+1,weaponX:wx,weaponY:wy,armorX:ax,armorY:ay};
}
