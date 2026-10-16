// Stable IDs 0..3 remain unchanged for pre-v0.9.7 saved achievements.
export const QUESTS=Object.freeze([
 {id:0,name:'Победи 5 слизней',kind:'field',key:'killedSlimes',target:5,reward:60},
 {id:1,name:'Продай 3 рыбы',kind:'field',key:'soldFish',target:3,reward:45},
 {id:2,name:'Улучши меч 2 раза',kind:'field',key:'spentSword',target:2,reward:40},
 {id:3,name:'Продай 5 щук',kind:'field',key:'soldPike',target:5,reward:150},
 {id:4,name:'Победи 3 пауков',kind:'monster',key:'spider',target:3,reward:50},
 {id:5,name:'Победи 3 скелетов',kind:'monster',key:'skeleton',target:3,reward:55},
 {id:6,name:'Победи 5 летучих мышей',kind:'monster',key:'bat',target:5,reward:55},
 {id:7,name:'Победи 5 грибов',kind:'monster',key:'mushroom',target:5,reward:55},
 {id:8,name:'Победи 3 призраков',kind:'monster',key:'ghost',target:3,reward:55},
 {id:9,name:'Победи 4 жуков',kind:'monster',key:'beetle',target:4,reward:55},
 {id:10,name:'Победи 4 личинок',kind:'monster',key:'larva',target:4,reward:55},
 {id:11,name:'Победи 2 големов',kind:'monster',key:'golem',target:2,reward:60},
 {id:12,name:'Победи первого босса',kind:'field',key:'bossKills',target:1,reward:70},
 {id:13,name:'Победи 5 боссов',kind:'field',key:'bossKills',target:5,reward:200},
 {id:14,name:'Пройди 10 волн',kind:'field',key:'best',target:10,reward:80},
 {id:15,name:'Пройди 25 волн',kind:'field',key:'best',target:25,reward:150},
 {id:16,name:'Пройди 50 волн',kind:'field',key:'best',target:50,reward:300},
 {id:17,name:'Продай 20 рыб',kind:'field',key:'soldFish',target:20,reward:100},
 {id:18,name:'Победи 100 монстров',kind:'field',key:'kills',target:100,reward:190},
 {id:19,name:'Открой автобой за монету',kind:'boolean',key:'autoUnlocked',target:1,reward:10},
 {id:20,name:'Отрави и победи 3 монстров',kind:'field',key:'poisonKills',target:3,reward:80},
 {id:21,name:'Ударь молнией 10 раз',kind:'field',key:'lightningHits',target:10,reward:85},
 {id:22,name:'Восстанови здоровье вампиризмом 5 раз',kind:'field',key:'vampireHeals',target:5,reward:85},
 {id:23,name:'Улучши ведро',kind:'field',key:'bucketLevel',target:1,reward:50},
 {id:24,name:'Улучши дом 3 раза',kind:'field',key:'home',target:3,reward:70}
]);
export function questProgress(p,q){
 if(q.kind==='monster')return Math.max(0,p.monsterKills?.[q.key]||0);
 if(q.kind==='boolean')return p[q.key]?1:0;
 return Math.max(0,p[q.key]||0);
}
export function claimQuest(p,id){
 const q=QUESTS.find(x=>x.id===id);
 if(!q||p.questClaimed.includes(id)||questProgress(p,q)<q.target)return {ok:false};
 p.questClaimed.push(id);p.gold+=q.reward;return {ok:true,reward:q.reward};
}
