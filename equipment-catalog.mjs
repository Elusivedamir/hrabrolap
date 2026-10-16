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
 {id:'forest_guardian',name:'Лесной страж',price:50,health:0,svg:'assets/armor/forest_guardian/forest_attack_01.png'},
 {id:'web',name:'Паутинная броня',price:300,health:35,materials:{web:6},svg:'art/armor/web.svg'},
 {id:'steel',name:'Рыцарский панцирь',price:230,health:28,svg:'art/armor/steel.svg'},
 {id:'bone_slime',name:'Броня из костей и слизи',price:550,health:60,materials:{bone:5,slime:5},svg:'art/armor/bone_slime.svg'},
 {id:'chitin',name:'Хитиновая броня',price:800,health:74,materials:{chitin:6},svg:'art/armor/chitin.svg'},
 {id:'leaf',name:'Лесная броня',price:1100,health:85,svg:'art/armor/leaf.svg'},
 {id:'moss',name:'Мшистый панцирь',price:1500,health:135,materials:{leaf:8,slime:3},svg:'art/armor/moss.svg'},
 {id:'shadow',name:'Теневая броня',price:2100,health:190,materials:{essence:6,bone:3},svg:'art/armor/shadow.svg'},
 {id:'moon_armor',name:'Лунное облачение',price:3000,health:260,materials:{essence:8,web:5},svg:'art/armor/moon_armor.svg'},
 {id:'star',name:'Звёздная броня',price:4400,health:360,materials:{essence:10,web:10},svg:'art/armor/star.svg'},
 {id:'king',name:'Королевский доспех',price:6000,health:450,materials:{bone:12,chitin:12},svg:'art/armor/king.svg'}
];
export function materialName(id){return MATERIALS.find(x=>x.id===id)?.name||id;}
export function requirementsText(item){return Object.entries(item.materials||{}).map(([id,count])=>`${materialName(id)} ×${count}`).join(' · ');}
