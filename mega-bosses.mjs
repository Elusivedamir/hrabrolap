import {LATE_BOSS_MODELS} from './late-bosses.mjs';
/** Fourteen original milestone bosses, one every 50 waves.
 * Affinities block only spell effects, never ordinary sword damage.
 * Resistances are telegraphed before players choose an enchantment.
 */
const MOVES=Object.freeze({
 thorn_warden:'wriggle',bone_regent:'rattle',silk_empress:'leap',
 glacier_serpent:'swoop',ember_salamander:'ram',spore_monarch:'spores',
 abyss_jelly:'pulse',granite_colossus:'ram',mirror_moth:'swoop',
 treasure_mimic:'bite',root_titan:'spores',storm_basilisk:'pulse',
 shadow_knight:'rattle',elder_dragon:'swoop'
});
const raw=[
 [50,'thorn_warden','Моховой страж','🌿','#5f8c54','#bedc83','poison',1,1,'Плети корней'],
 [100,'bone_regent','Костяной регент','💀','#d8c6a7','#7e667d','vampirism',1,1,'Костяной вихрь'],
 [150,'silk_empress','Хитиновая императрица','🕷️','#684677','#d18aab','',0.35,1,'Паучий шквал'],
 [200,'glacier_serpent','Ледяной змей','❄️','#60bfce','#d3fcff','vampirism',1,1,'Морозный бросок'],
 [250,'ember_salamander','Огненная саламандра','🔥','#c35b3e','#ffc56c','',1,1,'Огненный хвост'],
 [300,'spore_monarch','Король спор','🍄','#ad69aa','#edc6db','poison',1,1,'Облако спор'],
 [350,'abyss_jelly','Медуза бездны','🌊','#6489c8','#b1b6fd','vampirism',1,1,'Глубинный разряд'],
 [400,'granite_colossus','Гранитный колосс','🪨','#817983','#c6a97d','poison',0.65,1,'Каменный кулак'],
 [450,'mirror_moth','Зеркальная моль','🦋','#9473ba','#aee9ff','',0.35,1,'Ослепляющий взмах'],
 [500,'treasure_mimic','Золотой мимик','🧰','#b37a47','#f7d48c','vampirism',1,1,'Зубастый сундук'],
 [550,'root_titan','Древесный исполин','🌳','#7b633f','#bd9d62','poison',1,1,'Гнев корней'],
 [600,'storm_basilisk','Грозовой василиск','⚡','#4d91ae','#c5eef0','',0,1,'Громовой рёв'],
 [650,'shadow_knight','Теневой рыцарь','🛡️','#555074','#b29edb','vampirism',1,1,'Чёрный клинок'],
 [700,'elder_dragon','Древний дракон','🐲','#693c75','#e997c5','poison',0.7,1,'Пламя древних']
];
export const MEGA_BOSSES=Object.freeze([...raw.map(([wave,id,name,icon,base,accent,immunity,lightningMultiplier,vampirismMultiplier,attackName],index)=>Object.freeze({
 wave,id,type:id,name,icon,base,accent,immunity,lightningMultiplier,vampirismMultiplier:immunity==='vampirism'?0:vampirismMultiplier,
 attackName,move:MOVES[id],order:index+1,megaboss:true,
 resistanceText:immunity==='poison'?'☠ Невосприимчив к яду':immunity==='vampirism'?'🩸 Нельзя лечиться вампиризмом':lightningMultiplier===0?'⚡ Иммунитет к молнии':lightningMultiplier<1?'⚡ Сопротивление молнии':'⚔ Без иммунитета'
})),...LATE_BOSS_MODELS.map((b,i)=>Object.freeze({...b,order:i+15,megaboss:true,vampirismMultiplier:b.immunity==='vampirism'?0:1,resistanceText:b.immunity==='poison'?'☠ Невосприимчив к яду':b.immunity==='vampirism'?'🩸 Нельзя лечиться вампиризмом':b.lightningMultiplier===0?'⚡ Иммунитет к молнии':b.lightningMultiplier<1?'⚡ Сопротивление молнии':'⚔ Без иммунитета'}))]);
export const MEGA_BOSS_BY_TYPE=Object.freeze(Object.fromEntries(MEGA_BOSSES.map(b=>[b.id,b])));
export const MEGA_BOSS_TYPES=Object.freeze(MEGA_BOSSES.map(b=>b.id));
export const megaBossForWave=wave=>Number.isInteger(wave)&&wave%50===0&&wave>=50&&wave<=2000?MEGA_BOSSES[wave/50-1]:null;
export const megaBossByType=type=>MEGA_BOSS_BY_TYPE[type]||null;
