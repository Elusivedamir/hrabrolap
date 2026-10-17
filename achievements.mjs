/** Non-repeatable achievements. Existing quest IDs and purchases stay untouched.
 * Small one-time gold rewards; titles are collectibles, not combat multipliers.
 */
const A=[
 ['Первые шаги','🥾','Пройди 10 волн','best',10,40],
 ['Гроза слизней','🟢','Победи 50 слизней','killedSlimes',50,90],
 ['Первая корона','👑','Победи первого босса','bossKills',1,60],
 ['Уверенная лапа','⚔️','Победи 100 монстров','kills',100,150],
 ['Рыбацкая удача','🐟','Поймай 10 рыб','caughtTotal',10,55],
 ['Торговая жилка','🪙','Продай 50 рыб','soldFish',50,160],
 ['Крепкий клинок','🗡️','Улучши меч 10 раз','spentSword',10,120],
 ['Герой пятидесятой','🏆','Пройди 50 волн','best',50,190],
 ['Охотник на владык','🐲','Победи первого великого босса','megaBossWins',1,240],
 ['Сотня позади','🎖️','Пройди 100 волн','best',100,320],
 ['Повелитель яда','☠️','Добей ядом 20 врагов','poisonKills',20,180],
 ['Дитя грозы','⚡','Ударь молнией 100 раз','lightningHits',100,160],
 ['Дар жизни','🩸','Восстановись вампиризмом 30 раз','vampireHeals',30,160],
 ['Истребитель пауков','🕷️','Победи 30 пауков','monster:spider',30,180],
 ['Мечник арсенала','🗡️','Открой 5 разных мечей','ownedWeapons',5,270],
 ['Одет с иголочки','🧥','Открой 4 комплекта брони','ownedArmors',4,270],
 ['Глубже некуда?','⛏️','Пройди 250 волн','best',250,550],
 ['Пятеро титанов','🐉','Победи 5 великих боссов','megaBossWins',5,650],
 ['Умелый рыбак','🎣','Поймай 100 рыб','caughtTotal',100,220],
 ['Сокровища пещеры','💰','Заработай всего 100 000 монет','totalGold',100000,850],
 ['Война на полтысячи','⭐','Пройди 500 волн','best',500,1350],
 ['Десять легенд','👑','Победи 10 великих боссов','megaBossWins',10,1250],
 ['Завоеватель глубин','🏅','Пройди все 700 волн','best',700,2300],
 ['Покоритель титанов','🏆','Победи первых 14 великих боссов','megaBossWins',14,2800],
 ['Тысяча приключений','🧭','Пройди 1000 волн','best',1000,650],
 ['Путь в подземные дали','⛏️','Пройди 1500 волн','best',1500,950],
 ['Две тысячи побед','🌟','Пройди все 2000 волн','best',2000,1500],
 ['Коллекция сорока','👑','Победи всех 40 великих боссов','megaBossWins',40,1800]
];
export const ACHIEVEMENTS=Object.freeze(A.map(([name,icon,description,metric,target,gold],id)=>Object.freeze({id,name,icon,description,metric,target,gold})));
export function achievementProgress(p,a){
 const key=a.metric;
 if(key==='megaBossWins'||key==='ownedWeapons'||key==='ownedArmors')return p[key]?.length||0;
 if(key.startsWith('monster:'))return p.monsterKills?.[key.split(':')[1]]||0;
 return Math.max(0,Number(p[key])||0);
}
export function claimAchievement(p,id){
 const a=ACHIEVEMENTS.find(x=>x.id===id);
 if(!a)return {ok:false,reason:'missing'};
 if(!Array.isArray(p.achievementClaimed))p.achievementClaimed=[];
 if(p.achievementClaimed.includes(id))return {ok:false,reason:'claimed'};
 if(achievementProgress(p,a)<a.target)return {ok:false,reason:'progress'};
 p.achievementClaimed.push(id);p.gold+=a.gold;p.totalGold+=a.gold;
 return {ok:true,reward:a.gold,title:a.name};
}
