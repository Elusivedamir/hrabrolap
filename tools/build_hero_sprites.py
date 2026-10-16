#!/usr/bin/env python3
"""Build 18 swordless Hrabrolap poses from the existing approved kitten art.

The face (embedded PNG) and unchanged outline of the original vector body are kept.
Each pose has an articulated foreground foreleg ending at the same mathematical
contact point as the independently overlaid game SVG weapon. No painted blade.
"""
from __future__ import annotations
from pathlib import Path
from lxml import etree
import json, math, html

ROOT=Path(__file__).resolve().parents[1]
MODEL=ROOT/'art/hero/bare-kitten.svg'
OUT=ROOT/'animations/hero'
SVGNS='http://www.w3.org/2000/svg'
source=etree.parse(str(MODEL)).getroot()
head=etree.tostring(source[12],encoding='unicode').replace('ns0:', '').replace('xmlns:ns0="http://www.w3.org/2000/svg" ', '').replace('xmlns:ns0="http://www.w3.org/2000/svg"','')
# Independent body parts preserved from original file, except front arm (replaced).
elements={i:etree.tostring(source[i],encoding='unicode') for i in range(0,10)}
# A pose: [anchorX, anchorY, swordAngle, bodyX, bodyY, bodyLean, headTilt, capeSway].
# Frame 4 in each attack is the single damage contact; 6 matches the idle grip.
DATA={
 'slash':{'name':'Рубящий удар · v0.7', 'captions':['Стойка','Замах за плечо','Верхняя точка','Удар по дуге','Проводка клинка','Возврат'],
  'poses':[[170,229,-18,0,0,0,0,0],[190,210,25,-5,2,-3,-2,-8],[204,209,47,-5,-5,-4,-3,-11],[205,233,106,11,3,5,2,16],[204,236,122,9,4,3,1,10],[170,229,-18,0,0,0,0,0]]},
 'overhead':{'name':'Тяжёлый удар сверху', 'captions':['Стойка','Подъём меча','Над головой','Удар вниз','Амортизация','Возврат'],
  'poses':[[170,229,-18,0,0,0,0,0],[196,203,3,-3,2,-2,-2,-6],[212,193,-8,-4,-6,-1,-3,-12],[219,231,132,8,7,7,2,13],[213,237,145,7,9,5,2,8],[170,229,-18,0,0,0,0,0]]},
 'thrust':{'name':'Быстрый колющий выпад', 'captions':['Стойка','Наведение','Шаг к врагу','Колющий контакт','Отвод меча','Возврат'],
  'poses':[[170,229,-18,0,0,0,0,0],[194,228,60,-5,2,-3,-1,-6],[211,225,78,4,0,1,0,-8],[226,226,90,13,2,4,1,15],[207,231,85,9,1,2,0,7],[170,229,-18,0,0,0,0,0]]},
}

def sword_grip(pose):
 x,y,a,*_=pose;r=math.radians(a)
 # The sword handle is at local (0,-11) in weapon-slot coordinates.
 return (x + 11*math.sin(r),y - 11*math.cos(r))

def swing_effect(typ,index):
 if index==0 or index==5:return ''
 if typ=='slash':
  if index==2:return '<path d="M347 67Q419 105 423 165" stroke="#7ae0ff" stroke-width="6" opacity=".46" fill="none" stroke-linecap="round"/>'
  if index==3:return '<path d="M343 68Q460 127 436 227" stroke="#dcfdff" stroke-width="17" opacity=".87" fill="none" stroke-linecap="round"/><path d="M358 67Q457 130 438 216" stroke="#4bbcef" stroke-width="7" fill="none" stroke-linecap="round"/>'
  if index==4:return '<path d="M367 128Q429 168 428 218" stroke="#7dd7ff" stroke-width="8" opacity=".48" fill="none" stroke-linecap="round"/>'
 if typ=='overhead':
  if index==2:return '<path d="M314 33Q330 43 332 60" stroke="#70d8f8" stroke-width="7" opacity=".5" fill="none"/>'
  if index==3:return '<path d="M378 62Q439 159 377 253" stroke="#d9f8ff" stroke-width="16" opacity=".8" fill="none" stroke-linecap="round"/><path d="M389 70Q426 159 380 236" stroke="#4dc2f4" stroke-width="6" fill="none"/>'
  if index==4:return '<path d="M382 183L426 202M381 202L412 226" stroke="#b5eaff" stroke-width="6" stroke-linecap="round" opacity=".5"/>'
 if typ=='thrust':
  if index==2:return '<path d="M373 195L412 186" stroke="#b9f8ff" stroke-width="5" fill="none" opacity=".55"/>'
  if index==3:return '<path d="M356 214H471M366 230H458M392 247H453" stroke="#75d6ff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".8"/><path d="M431 196L476 213 431 236" stroke="#ffffff" stroke-width="5" fill="none" stroke-linejoin="round" opacity=".8"/>'
  if index==4:return '<path d="M393 224H454" stroke="#9de1ff" stroke-width="5" fill="none" opacity=".5"/>'
 return ''

def frame_svg(typ,index,p):
 x,y,angle,dx,dy,lean,headtilt,capeflap=p
 gripx,gripy=sword_grip(p)
 # Shoulder joint is the same across frames, while wrist exactly follows weapon.
 shoulder=(199,222)
 midx=(shoulder[0]+gripx)/2-2
 midy=min(shoulder[1],gripy)-7
 forearm=f'<path d="M{shoulder[0]} {shoulder[1]} Q{midx:.2f} {midy:.2f} {gripx:.2f} {gripy:.2f}" fill="none" stroke="#38252b" stroke-width="25" stroke-linecap="round"/><path d="M{shoulder[0]} {shoulder[1]} Q{midx:.2f} {midy:.2f} {gripx:.2f} {gripy:.2f}" fill="none" stroke="#e78a3c" stroke-width="18" stroke-linecap="round"/><path d="M{shoulder[0]-1} {shoulder[1]-5} Q{midx-4:.2f} {midy-4:.2f} {gripx-4:.2f} {gripy-4:.2f}" fill="none" stroke="#ffd18a" stroke-width="3" opacity=".67" stroke-linecap="round"/>'
 # Shadow unchanged; tail, body, hind legs and scarf from original art.
 parts='<g transform="translate(468 0) scale(-1 1)">'+elements[1]+elements[2]+'</g>'+''.join(elements[i] for i in range(3,10))
 sw=capeflap
 cape=f'<path d="M194 210Q{171-sw//2} {224-sw//3} {155-sw} {235+abs(sw)//3}Q{175-sw//2} 234 207 230Z" fill="#d63645" stroke="#6c2635" stroke-width="5" stroke-linejoin="round"/>'
 # Draw torso+arm, then head ON TOP so the face is never occluded by fake body parts.
 # Effects after model, but in external SVG, no weapon is present at all.
 return (f'<svg xmlns="{SVGNS}" viewBox="0 0 488 305" data-attack="{typ}" data-frame="{index+1}" data-grip-x="{gripx:.3f}" data-grip-y="{gripy:.3f}" data-has-painted-sword="false">'
         f'<g id="hero-sprite-pose"><g>{elements[0]}{cape}{parts}{forearm}</g>'
         f'<g transform="rotate({headtilt} 234 183)"><g data-facing="right" transform="translate(468 0) scale(-1 1)">{head}</g></g>'
         f'{swing_effect(typ,index)}</g></svg>')

if __name__=='__main__':
 for name,data in DATA.items():
  pdir=OUT/name;pdir.mkdir(parents=True,exist_ok=True)
  for i,pose in enumerate(data['poses']):
   (pdir/f'{i+1:02}.svg').write_text(frame_svg(name,i,pose),encoding='utf-8')
 # Fully shared timeline for game and studio; avoid diverging pose definitions.
 lines=[]
 for k,v in DATA.items():
  lines.append(json.dumps({'id':k,'name':v['name'],'captions':v['captions'],'frames':[p[:6] for p in v['poses']]},ensure_ascii=False))
 (ROOT/'hero-poses.mjs').write_text('// Generated by tools/build_hero_sprites.py; 18 swordless frames / one interchangeable weapon.\nexport const ATTACKS = [\n'+',\n'.join(lines)+'\n];\nexport function gripForPose(pose){const [x,y,a]=pose;const r=a*Math.PI/180;return [x+11*Math.sin(r),y-11*Math.cos(r)];}\n',encoding='utf-8')
 print('Built 18 swordless hero poses and shared gameplay timeline.')
