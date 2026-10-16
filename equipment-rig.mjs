// Система наложения сменных SVG-слоёв на УЖЕ УТВЕРЖДЁННУЮ анимацию кота.
// Изображение кота и канонические движения игры не редактируются.
// Таблица ниже — точная копия существующих ATTACKS из game.mjs для предпросмотра.
export const REFERENCE_ATTACKS=[
 {id:'slash',name:'Рубящий удар',frames:[
  [170,229,-18,0,0,0],[167,228,-58,-5,1,-5],[174,225,-83,-7,-1,-6],[189,237,74,10,3,6],[195,241,105,12,1,8],[170,229,-18,0,0,0]]},
 {id:'overhead',name:'Сверху вниз',frames:[
  [173,229,-18,0,0,0],[208,202,-7,0,-6,-4],[212,206,36,-4,2,6],[210,234,132,11,10,12],[208,241,149,12,7,11],[170,229,-18,0,0,0]]},
 {id:'thrust',name:'Колющий рывок',frames:[
  [170,229,-18,0,0,0],[161,224,-64,-11,0,-10],[161,231,15,4,-5,-3],[227,227,88,22,-1,4],[236,226,84,26,-2,3],[170,229,-18,0,0,0]]}
];
// Независимый от самого кота слой брони. Сдвиги маленькие,
// чтобы грудная пластина никогда не перескакивала на морду/цветок.
export const ARMOR_ATTACK_POSES=[
 [[0,0,0],[-1,-1,-2],[-2,-1,-3],[2,0,3],[2,1,4],[0,0,0]],
 [[0,0,0],[-1,-2,-1],[-1,-3,-3],[2,1,4],[3,2,5],[0,0,0]],
 [[0,0,0],[-1,0,-2],[-2,0,-2],[3,0,3],[4,-1,3],[0,0,0]]
];
// Шесть реакций на урон. Никакие исходные PNG/SVG персонажа не изменяются.
// [bodyDeltaX, bodyDeltaY, bodyAngle, armorDx, armorDy, armorAngle, swordX, swordY, swordAngle]
export const HURT_FRAMES=[
 [0,0,0,0,0,0,170,229,-18],
 [-5,0,-3,-1,-1,-1,165,225,-24],
 [-9,-3,-7,-1,-1,-3,162,222,-34],
 [-12,-12,-10,-2,-2,-4,168,215,-38],
 [-9,5,7,1,1,3,170,238,14],
 [0,0,0,0,0,0,170,229,-18]
];
export const HURT_FRAME_MS=75;
const frameNo=i=>Math.max(0,Math.min(5,Number.isFinite(i)?Math.trunc(i):0));
export function armorAttackTransform(attack=0,index=0){
 const [x,y,a]=ARMOR_ATTACK_POSES[attack]?.[frameNo(index)]||ARMOR_ATTACK_POSES[0][0];
 return `translate(${x} ${y}) rotate(${a} 236 243)`;
}
export function armorHurtTransform(index=0){
 const f=HURT_FRAMES[frameNo(index)];
 return `translate(${f[3]} ${f[4]}) rotate(${f[5]} 236 243)`;
}
export function hurtMotionTransform(index=0){
 const [dx,dy,lean]=HURT_FRAMES[frameNo(index)];
 return `translate(${dx} ${dy}) rotate(${lean} 238 252)`;
}
export function hurtWeaponTransform(index=0){
 const f=HURT_FRAMES[frameNo(index)];
 return `translate(${f[6]} ${f[7]}) rotate(${f[8]})`;
}
