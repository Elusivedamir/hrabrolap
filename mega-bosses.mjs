/** Unified epic-boss registry: combat balance + original 2D artwork use ONE identity. */
import {MAJOR_BOSSES,majorBossForWave,majorBossByType} from './major-bosses.mjs';
const iconMap=['🐸','🕷️','💀','👻','💎','🪨','🍄','🔥','🐉','⚙️','❄️','👹','🪱','🐲'];
const elementLabel={poison:'☠ Иммунитет к яду',vampirism:'🩸 Вампиризм не лечит',lightning:'⚡ Иммунитет к молнии'};
export const MEGA_BOSSES=Object.freeze(MAJOR_BOSSES.map((b,i)=>Object.freeze({
 ...b,type:b.id,icon:iconMap[i],base:b.color,accent:b.accent,order:i+1,megaboss:true,
 immunity:b.immune[0]||'',lightningMultiplier:b.immune.includes('lightning')?0:1,
 vampirismMultiplier:b.immune.includes('vampirism')?0:1,
 resistanceText:elementLabel[b.immune[0]]||'⚔ Без иммунитета',
 attackName:['Тяжёлый прыжок','Паучья сеть','Костяной вихрь','Призрачный выпад','Осколки льда','Обвал','Ядовитые споры','Пламенный удар','Крылатый рывок','Стальной кулак','Морозный укус','Инфернальное пламя','Сдавливающий бросок','Удар повелителя'][i]
})));
export const MEGA_BOSS_BY_TYPE=Object.freeze(Object.fromEntries(MEGA_BOSSES.map(b=>[b.id,b])));
export const MEGA_BOSS_TYPES=Object.freeze(MEGA_BOSSES.map(b=>b.id));
export const megaBossForWave=wave=>Number.isInteger(wave)&&wave%50===0&&wave>=50&&wave<=700?MEGA_BOSSES[wave/50-1]:null;
export const megaBossByType=type=>MEGA_BOSS_BY_TYPE[type]||null;
