import test from 'node:test';
import assert from 'node:assert/strict';
import {makeBackup,parseBackup,BACKUP_FORMAT} from '../save-backup.mjs';
import {freshProgress,restoreFight,validateProgress} from '../game-core.mjs';

test('P0 backups retain inventory, materials, fish, achievements and forty bosses',()=>{
 const p=freshProgress();
 p.gold=45678;p.room=1801;p.best=1800;p.autoLevel=49;
 p.ownedWeapons=['iron'];p.ownedArmors=['none'];
 p.questClaimed=[0,1,24];p.achievementClaimed=[0,5,27];
 p.megaBossWins=[50,100,1800];p.enchantment='vampirism';
 p.battleState={level:1801,hp:50,enemyHp:35,phase:'fight',heroTimer:.3,enemyTimer:1.2,rest:0,monsterType:'slime'};
 const data=makeBackup(p,'2026-10-17T10:00:00.000Z');
 assert.equal(JSON.parse(data).format,BACKUP_FORMAT);
 const parsed=parseBackup(data);
 const restored=JSON.parse(parsed.json);
 assert.equal(restored.gold,45678);
 assert.equal(restored.room,1801);
 assert.equal(restored.autoLevel,49);
 assert.equal(restored.enchantment,'vampirism');
 assert.deepEqual(restored.questClaimed,[0,1,24]);
 assert.deepEqual(restored.achievementClaimed,[0,5,27]);
 assert.deepEqual(restored.megaBossWins,[50,100,1800]);
 assert.equal(restored.battleState.level,1801);
 assert.equal(restored.battleState.enemyHp,35);
});
test('P0 v5 cleared wave 700 restarts at wave 701, without old finale battle',()=>{
 const p={...freshProgress(),version:5,best:700,room:700,cleared:true,gold:7543,sword:20,armor:17,
  megaBossWins:[50,700],battleState:{level:700,hp:50,enemyHp:5000,phase:'fight',monsterType:'depth_700'}};
 const parsed=parseBackup(makeBackup(p));
 const restored=JSON.parse(parsed.json);
 assert.equal(restored.version,6);
 assert.equal(restored.room,701);
 assert.equal(restored.best,700);
 assert.equal(restored.cleared,false);
 assert.equal(restored.gold,7543);
 assert.equal(restored.sword,20);
 assert.equal(restored.armor,17);
 assert.equal(restored.battleState.level,701);
 assert.deepEqual(restored.megaBossWins,[50,700]);
});
test('P0 v4 cleared wave 100 restarts wave 101',()=>{
 const old={...freshProgress(),version:4,best:100,room:100,cleared:true,gold:1000,
  battleState:{level:100,hp:30,phase:'rest',monsterType:'slime'}};
 const after=JSON.parse(parseBackup(makeBackup(old)).json);
 assert.equal(after.room,101);assert.equal(after.battleState.level,101);assert.equal(after.gold,1000);
});
test('P0 backups reject arbitrary JSON, unsupported versions and accidental defaults',()=>{
 for(const raw of ['','foo','{}','{"version":6}','{"version":777,"room":1,"best":0,"gold":0}',JSON.stringify({format:'other',save:freshProgress()})]){
  assert.throws(()=>parseBackup(raw));
 }
 const p=freshProgress();
 assert.throws(()=>parseBackup('x'.repeat(2_000_001)));
 assert.equal(parseBackup(JSON.stringify(p)).summary.room,1,'allow legacy plain save JSON');
});
test('P0 imported data cannot exceed legal campaign limits',()=>{
 const raw={...freshProgress(),version:6,room:100000,best:100000,gold:-10,autoLevel:9999};
 const result=parseBackup(makeBackup(raw));
 const restored=JSON.parse(result.json);
 assert.equal(restored.room,2000);assert.equal(restored.best,2000);
 assert.equal(restored.gold,0);assert.equal(restored.autoLevel,100);
});
