// SVG-каталог предметов. Никакие исходные кадры кота не изменяются.
// Все цены — монеты + (при наличии) ингредиенты, которые сохраняются в инвентаре.
export const MATERIALS=[
 {id:'web',name:'Паутина',icon:'🕸️'},
 {id:'slime',name:'Слизь',icon:'🟢'},
 {id:'bone',name:'Кость',icon:'🦴'},
 {id:'leaf',name:'Листья',icon:'🍃'},
 {id:'chitin',name:'Хитин',icon:'🪲'},
 {id:'essence',name:'Эссенция',icon:'✨'}
];
export const WEAPONS=[
 {id:'iron',name:'Железный меч',price:0,damage:0,svg:'art/weapons/iron.svg'},
 {id:'wood',name:'Лесная палка',price:60,damage:4,materials:{leaf:3},svg:'art/weapons/wood.svg'},
 {id:'fishbone',name:'Рыбий позвоночник',price:160,damage:8,svg:'art/weapons/fishbone.svg'},
 {id:'spiderleg',name:'Лапа паука',price:280,damage:10,materials:{web:4,chitin:2},svg:'art/weapons/spiderleg.svg'},
 {id:'boneblade',name:'Костяной клинок',price:460,damage:15,materials:{bone:5},svg:'art/weapons/boneblade.svg'},
 {id:'slimeblade',name:'Слизневый меч',price:670,damage:18,materials:{slime:5},svg:'art/weapons/slimeblade.svg'},
 {id:'moon',name:'Лунный клинок',price:900,damage:20,svg:'art/weapons/moon.svg'},
 {id:'forest',name:'Клинок чащи',price:1200,damage:23,materials:{leaf:7,chitin:3},svg:'art/weapons/forest.svg'},
 {id:'webfang',name:'Паутинное жало',price:2000,damage:29,materials:{web:8,bone:3},svg:'art/weapons/webfang.svg'},
 {id:'dusk',name:'Меч сумеречного демона',price:4200,damage:40,materials:{essence:10,bone:6},svg:'art/weapons/dusk.svg'}
];
export const ARMORS=[
 {id:'none',name:'Без брони',price:0,health:0,svg:''},
 {id:'forest_guardian',name:'Лесной страж',price:50,health:0,fullCharacter:true,svg:'assets/costumes/forest_guardian/attack_01.png'},
 {id:'steel_knight',name:'Стальной рыцарь',price:50,health:0,fullCharacter:true,svg:'assets/costumes/steel_knight/attack_01.png'},
 {id:'thorn_ranger',name:'Терновый следопыт',price:50,health:0,fullCharacter:true,svg:'assets/costumes/thorn_ranger/attack_01.png'},
 {id:'moon_mage',name:'Лунный чародей',price:50,health:0,fullCharacter:true,svg:'assets/costumes/moon_mage/attack_01.png'},
 {id:'ember_guard',name:'Огненный страж',price:50,health:0,fullCharacter:true,svg:'assets/costumes/ember_guard/attack_01.png'},
 {id:'frost_watcher',name:'Ледяной дозорный',price:50,health:0,fullCharacter:true,svg:'assets/costumes/frost_watcher/attack_01.png'}
];
export function materialName(id){return MATERIALS.find(x=>x.id===id)?.name||id;}
export function requirementsText(item){return Object.entries(item.materials||{}).map(([id,count])=>`${materialName(id)} ×${count}`).join(' · ');}
