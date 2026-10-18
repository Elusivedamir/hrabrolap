/** Forty Dawn Seals, not pieces of the Spark itself.
 * Canon: the Guardian sealed away the existing Spark of Dawn behind these locks.
 * A seal belongs to the FIRST clear of its matching super-boss (every 50 waves).
 * Old saved records already persist "megaBossWins"; never renumber those waves.
 */
import {MEGA_BOSSES} from './mega-bosses.mjs';

export const CHAPTER_NAMES=Object.freeze([
 'Пробуждение глубин','Забытые шахты','Ядовитые сады','Ледяное царство',
 'Дворец теней','Потерянная цивилизация','Огненная бездна','Мёртвое королевство',
 'Сердце тьмы','Последний рассвет'
]);
const FIRST_SEALS=['Мха','Кости','Хитина','Льда'];
export const DAWN_SEALS=Object.freeze(MEGA_BOSSES.map((boss,index)=>Object.freeze({
 id:'dawn_'+boss.id,
 wave:boss.wave,
 chapter:Math.floor(index/4)+1,
 number:index+1,
 name:index<4?'Печать '+FIRST_SEALS[index]:'Печать стража: '+boss.name,
 boss:boss.name,
 bossId:boss.id,
 // A unique artistic concept for every seal is required before this can be approved.
 artStatus:index<4?'P3-концепт':'Графический эскиз'
})));
export const dawnSealForWave=wave=>Number.isInteger(wave)&&wave>=50&&wave<=2000&&wave%50===0?DAWN_SEALS[wave/50-1]:null;
export const dawnSealForStage=stage=>Number.isInteger(stage)&&stage>=1&&stage<=200&&stage%5===0?dawnSealForWave(stage*10):null;
export const ownsDawnSeal=(progress,wave)=>!!dawnSealForWave(wave)&&(
 Array.isArray(progress?.megaBossWins)&&progress.megaBossWins.includes(wave)||
 // Backfill earlier legitimate first-clears without changing the original save.
 Number.isInteger(progress?.best)&&progress.best>=wave
);
export const collectedDawnSeals=progress=>DAWN_SEALS.filter(s=>ownsDawnSeal(progress,s.wave));
export const chapterSealCount=(progress,chapter)=>DAWN_SEALS.filter(s=>s.chapter===chapter&&ownsDawnSeal(progress,s.wave)).length;
