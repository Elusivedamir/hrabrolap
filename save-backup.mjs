// P0: portable saves across browser origins (including ports 8080/8090).
// Pure module: parse/validate before any browser writes. Does not touch canonical game data.
import {freshProgress,validateProgress,restoreFight,VERSION,WAVE_COUNT} from './game-core.mjs';

export const CURRENT_SAVE_KEY='hrabrolap-v0.2-save';
export const LEGACY_SAVE_KEY='hrabrolap-v0.1-save';
export const BACKUP_FORMAT='hrabrolap-save-backup';
export const MAX_BACKUP_BYTES=2_000_000;
export const supportedSaveVersion=v=>Number.isInteger(v)&&v>=1&&v<=VERSION;

export function makeBackup(raw,createdAt=new Date().toISOString()){
 if(!raw||typeof raw!=='object'||!supportedSaveVersion(raw.version))throw Error('Сохранение не найдено или версия не поддерживается');
 return JSON.stringify({format:BACKUP_FORMAT,backupVersion:1,createdAt,save:raw},null,2);
}
export function parseBackup(text){
 if(typeof text!=='string'||text.length>MAX_BACKUP_BYTES||!text.trim())throw Error('Файл пустой или слишком большой');
 let document;
 try{document=JSON.parse(text);}catch{throw Error('Это не файл JSON');}
 const raw=document?.format===BACKUP_FORMAT?document.save:document;
 if(document?.format&&document.format!==BACKUP_FORMAT)throw Error('Неизвестный формат резервной копии');
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||!supportedSaveVersion(raw.version))throw Error('Неподдерживаемое сохранение игры');
 // Do not let a valid-version but empty/tampered file silently wipe a real save.
 if(!Number.isFinite(raw.gold)||!Number.isFinite(raw.room)||!Number.isFinite(raw.best))throw Error('В файле отсутствует игровой прогресс');
 const p=validateProgress(raw);
 // Archived final-boss battles never override an already-unlocked next chapter.
 const completedLegacyChapter=Boolean(raw.cleared&&p.room>(raw?.battleState?.level??raw?.room??0));
 const battle=restoreFight(p,raw.battleState,completedLegacyChapter);
 const normalized={...p,battleState:{
  level:battle.level,hp:battle.hp,enemyHp:battle.enemyHp,phase:battle.phase,
  heroTimer:battle.heroTimer,enemyTimer:battle.enemyTimer,rest:battle.rest,
  monsterType:battle.monster.type,poisonRemaining:battle.poisonRemaining||0,
  poisonTick:battle.poisonTick||0
 },lastSeen:Date.now()};
 return {json:JSON.stringify(normalized),summary:{
  version:normalized.version,best:normalized.best,room:normalized.room,
  gold:normalized.gold,weapon:normalized.weapon,equippedArmor:normalized.equippedArmor,
  ownedWeapons:normalized.ownedWeapons.length,ownedArmors:normalized.ownedArmors.length,
  achievements:normalized.achievementClaimed.length,megaBossWins:normalized.megaBossWins.length
 }};
}
