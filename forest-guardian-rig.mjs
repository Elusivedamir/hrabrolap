// Independent frame-specific Forest Guardian PNG outfit. Original kitten frames are never modified.
export const FOREST_GUARDIAN_ID = 'forest_guardian';
export const FRAME_COUNT = 6;
const attacks = [
 [[154,158],[102,232],[215,256]],
 [[177,157],[89,151],[207,242]],
 [[172,159],[90,149],[190,246]],
 [[159,160],[99,233],[178,240]],
 [[158,161],[180,230],[203,237]],
 [[154,158],[102,232],[215,256]]
];
const hurts = [
 [[154,158],[107,233],[205,246]],
 [[158,156],[91,241],[195,246]],
 [[156,163],[105,245],[197,252]],
 [[166,154],[82,201],[200,226]],
 [[167,166],[84,273],[212,278]],
 [[154,158],[107,233],[205,246]]
];
const check = (kind, index) => {
 if (kind !== 'attack' && kind !== 'hurt') throw new Error('Unknown forest animation: '+kind);
 return Math.min(5,Math.max(0,Math.trunc(Number(index)||0)));
};
export function forestArmorUrl(kind,index) {
 const i=check(kind,index);
 return 'assets/armor/forest_guardian/forest_'+kind+'_'+String(i+1).padStart(2,'0')+'.png';
}
// The foreground is the SAME immutable original kitten frame, clipped to the face and exposed
// hands. It cannot move or redraw a paw; only the clothing underneath it is different.
export function forestForegroundPath(kind,index,geometry={x:114,y:-22,width:260,height:346}) {
 const i=check(kind,index);
 const [head,primary,secondary]=(kind==='attack'?attacks:hurts)[i];
 const sx=geometry.width/279,sy=geometry.height/370;
 const ellipse=(cx,cy,rx,ry)=>{
  const x=geometry.x+cx*sx,y=geometry.y+cy*sy,a=rx*sx,b=ry*sy;
  return 'M'+(x-a).toFixed(2)+' '+y.toFixed(2)+' a'+a.toFixed(2)+' '+b.toFixed(2)+' 0 1 0 '+(2*a).toFixed(2)+' 0 a'+a.toFixed(2)+' '+b.toFixed(2)+' 0 1 0 '+(-2*a).toFixed(2)+' 0 Z';
 };
 return [ellipse(head[0],head[1],96,81),ellipse(primary[0],primary[1],29,29),ellipse(secondary[0],secondary[1],29,28)].join(' ');
}
