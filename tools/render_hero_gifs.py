#!/usr/bin/env python3
from pathlib import Path
from PIL import Image,ImageDraw
import cairosvg, io, math, json, re
ROOT=Path(__file__).resolve().parents[1]
DATA=[json.loads(line) for line in re.findall(r'(?m)^\{.*\}(?=,?$)',(ROOT/'hero-poses.mjs').read_text())]
SCALE=2;W,H=488*SCALE,305*SCALE
OUT=ROOT/'preview';OUT.mkdir(exist_ok=True)

def draw_frame(attack, index, sword='iron'):
 p=attack['frames'][index];x,y,a,dx,dy,lean=p
 sprite=Image.open(io.BytesIO(cairosvg.svg2png(url=str(ROOT/'animations/hero'/attack['id']/f'{index+1:02}.svg'),output_width=W,output_height=H))).convert('RGBA')
 weapon=Image.open(io.BytesIO(cairosvg.svg2png(url=str(ROOT/'art/weapons'/f'{sword}.svg'),output_width=100*SCALE,output_height=240*SCALE))).convert('RGBA')
 weaponLayer=Image.new('RGBA',(W,H));weaponLayer.alpha_composite(weapon,(int(x*SCALE-50*SCALE),int(y*SCALE-211*SCALE)))
 weaponLayer=weaponLayer.rotate(-a,Image.Resampling.BICUBIC,center=(x*SCALE,y*SCALE))
 sprite.alpha_composite(weaponLayer)
 gripx=x+11*math.sin(math.radians(a));gripy=y-11*math.cos(math.radians(a))
 d=ImageDraw.Draw(sprite)
 X,Y=gripx*SCALE,gripy*SCALE
 d.ellipse((X-22,Y-22,X+22,Y+18),fill='#38252b')
 d.ellipse((X-17,Y-17,X+17,Y+13),fill='#f4a452')
 d.arc((X-9,Y-14,X+10,Y+3),190,300,fill='#ffe0a2',width=3)
 sprite=sprite.rotate(-lean,Image.Resampling.BICUBIC,center=(238*SCALE,252*SCALE))
 moved=Image.new('RGBA',(W,H))
 moved.alpha_composite(sprite,(int(dx*SCALE),int(dy*SCALE)))
 # Keep sprite inside a simple preview stage without artificial game art.
 frame=Image.new('RGBA',(W,H),(32,47,66,255));frame.alpha_composite(moved)
 return frame.convert('RGB')

for attack in DATA:
 arr=[draw_frame(attack,i) for i in range(6)]
 out=OUT/f'hero-{attack["id"]}-six-frames.gif'
 arr[0].save(out,save_all=True,append_images=arr[1:],duration=[150,150,170,180,160,260],loop=0,optimize=True)
 print(out)
# Show action variants with the fishbone replacement (third cycle).
arr=[draw_frame(DATA[2],i,sword='fishbone') for i in range(6)]
arr[0].save(OUT/'hero-fishbone-thrust.gif',save_all=True,append_images=arr[1:],duration=180,loop=0,optimize=True)
