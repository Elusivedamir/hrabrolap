"""Export ten independent SVG costumes and a completely offline HTML gallery."""
from pathlib import Path
import base64,html,json,sys,zipfile
root=Path(__file__).resolve().parents[1]
out=Path(sys.argv[1]) if len(sys.argv)>1 else root/'hrabrolap-10-svg-armor-designs.zip'
sets=json.loads((root/'art/armor-designs/manifest.json').read_text());assert len(sets)==10
cards=[];exports=[]
for s in sets:
 p=root/s['file'];data=p.read_bytes();assert b'<image' not in data and b'<script' not in data
 uri='data:image/svg+xml;base64,'+base64.b64encode(data).decode()
 cards.append(f'<article><h2>{html.escape(s["name"])}</h2><img src="{uri}" alt="{html.escape(s["name"])}"><p>{html.escape(s["description"])}</p><a href="{p.name}" download>Скачать SVG</a></article>')
 exports.append({**s,'file':p.name})
page='''<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>10 SVG-комплектов Храбролапа</title><style>body{font-family:Georgia,serif;background:#f0e5d1;color:#51392d;padding:18px}h1{font-size:28px}main{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}article{background:#fffaf1;border:2px solid #b9916c;border-radius:12px;padding:12px;text-align:center}h2{font-size:17px;min-height:38px}img{width:100%;aspect-ratio:360/440}p{font-size:14px;line-height:1.4}a{color:#7b4c2a}@media(max-width:900px){main{grid-template-columns:repeat(2,1fr)}} </style><h1>10 отдельных SVG-комплектов</h1><p>Прозрачные векторные эскизы. Посадка на котёнке и подгонка под анимацию — следующий этап.</p><main>'''+''.join(cards)+'</main></html>'
readme='''# 10 SVG-комплектов для Храбролапа

Откройте index.html для просмотра всех комплектов без интернета. Рядом находятся 10 отдельных SVG и manifest.json с названиями и описаниями.

Каждый SVG: 360×440, прозрачный фон, без растра. Редактируемые группы: helmet, collar, torso, leftSleeve, rightSleeve, leftBoot, rightBoot.

Это отдельные дизайны для согласования. Они ещё не установлены на котёнка и не подогнаны под кадры анимации.
'''
out.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for s in sets:
  p=root/s['file'];z.write(p,p.name)
 z.writestr('index.html',page);z.writestr('manifest.json',json.dumps(exports,ensure_ascii=False,indent=2));z.writestr('README.md',readme)
with zipfile.ZipFile(out) as z:
 assert z.testzip() is None
 assert len([n for n in z.namelist() if n.endswith('.svg')])==10
 assert b'data:image/svg+xml;base64,' in z.read('index.html')
print(f'Exported 10 SVGs + offline gallery: {out} ({out.stat().st_size} bytes); CRC OK')
