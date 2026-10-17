#!/usr/bin/env python3
"""Bake 5 distinct wearable outfits into the existing canonical kitten frames.
Each result is one completed character PNG, without a sword or runtime layers.
Requires Pillow, cairosvg, numpy; never mutates the approved canonical sprites.
"""
from io import BytesIO
from pathlib import Path
import hashlib,json
import cairosvg,numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
THEMES={
 'steel_knight': ('Стальной рыцарь','#c6d4df','#6b8291','#e7ba57','#354555'),
 'thorn_ranger':('Терновый следопыт','#6c8b51','#314b33','#cfab6a','#243527'),
 'moon_mage':('Лунный чародей','#906ebb','#53416e','#e9c3fc','#382949'),
 'ember_guard':('Огненный страж','#cc6247','#4b3439','#ffb75e','#493039'),
 'frost_watcher':('Ледяной дозорный','#97cadc','#4a7994','#ecf7fa','#2c5066')}
POSE={
 'attack':[(171,256,0,105,302,209,304,100,248,225,250),(177,258,-6,108,303,210,304,104,169,215,251),(174,257,-5,108,303,209,304,106,155,216,246),(173,258,8,124,304,213,304,159,252,216,250),(179,261,-9,140,301,213,302,179,249,220,246),(171,256,0,105,302,209,304,100,248,225,250)],
 'hurt':[(171,256,0,105,302,209,304,100,248,225,250),(175,260,-6,108,302,211,305,110,238,214,258),(173,262,-5,110,308,214,309,108,249,213,263),(177,270,19,120,289,208,308,121,209,219,267),(188,291,-15,181,323,244,323,152,308,227,312),(171,256,0,105,302,209,304,100,248,225,250)]}
def art(theme,p):
 cx,cy,angle,lx,ly,rx,ry,wx,wy,wx2,wy2=p
 title,bright,dark,trim,ink=THEMES[theme]
 sleeve=f'''<path d="M{cx-36} {cy-22} Q{wx} {wy-17} {wx} {wy}" stroke="{ink}" stroke-width="26" fill="none" stroke-linecap="round"/>
 <path d="M{cx-36} {cy-22} Q{wx} {wy-17} {wx} {wy}" stroke="{bright}" stroke-width="18" fill="none" stroke-linecap="round"/>
 <path d="M{cx+33} {cy-22} Q{wx2} {wy2-12} {wx2} {wy2}" stroke="{ink}" stroke-width="26" fill="none" stroke-linecap="round"/>
 <path d="M{cx+33} {cy-22} Q{wx2} {wy2-12} {wx2} {wy2}" stroke="{bright}" stroke-width="18" fill="none" stroke-linecap="round"/>'''
 vest=f'''<path d="M-31 -31Q-46 -31 -43 -8L-40 28Q-23 52 0 45Q30 49 40 27L40 -8Q42 -28 25 -31L0 -13Z" fill="{dark}" stroke="{ink}" stroke-width="5"/>
 <path d="M-30 -28Q-41 -20 -36 -5L-32 24Q0 41 34 22L34 -5Q36 -21 23 -27L0 -8Z" fill="{bright}" stroke="{trim}" stroke-width="3"/>'''
 motifs={
 'steel_knight':f'''<path d="M-29 -20L-5 -13 -3 21 -27 20Z M30 -20L9 -13 5 21 29 20Z" fill="#e3edf4" stroke="{ink}" stroke-width="3"/><path d="M0 -3L11 11 0 26 -11 11Z" fill="{trim}" stroke="{ink}" stroke-width="2"/><path d="M-48 -22Q-53 -42 -30 -43L-12 -27 -31 -15Z M47 -23Q53 -42 27 -43L12 -27 28 -15Z" fill="#a9c1d3" stroke="{ink}" stroke-width="3"/><path d="M-34 24Q0 38 34 24" stroke="{ink}" stroke-width="6" fill="none"/>''',
 'thorn_ranger':f'''<path d="M-42 -14L-50 49 -26 40 -11 56 0 39 13 56 32 42 48 49 40 -13" fill="#496d3d" stroke="{ink}" stroke-width="3"/><path d="M-34 -27L0 17 32 -27" stroke="#9a704c" stroke-width="13" fill="none"/><path d="M-34 -28L0 17 33 -28" stroke="{trim}" stroke-width="3" fill="none"/><path d="M-10 32Q-14 1 17 -10Q14 17 -10 32" fill="#b1d77c" stroke="{ink}" stroke-width="3"/><path d="M-47 -22L-55 -39 -36 -41 -13 -30 -34 -13Z M45 -22L52 -40 32 -43 14 -28 29 -12Z" fill="#7b9d57" stroke="{ink}" stroke-width="3"/>''',
 'moon_mage':f'''<path d="M-39 -11Q-52 20 -53 56L-34 48 -15 59 0 48 18 58 37 49 50 57Q50 12 39 -12Z" fill="#624887" stroke="{ink}" stroke-width="3"/><path d="M-36 -22L-7 8 0 36 10 8 37 -22" fill="{bright}" stroke="{trim}" stroke-width="4"/><path d="M0 -14Q-14 -1 0 16Q14 -1 0 -14" fill="#f9e3fa" stroke="{ink}" stroke-width="2"/><path d="M0 21L0 35M-7 28H7" stroke="{trim}" stroke-width="3"/><path d="M-45 -24Q-52 -47 -28 -43L-12 -27 -29 -12Z M43 -24Q52 -47 29 -43L12 -27 29 -12Z" fill="#a790d5" stroke="{ink}" stroke-width="3"/>''',
 'ember_guard':f'''<path d="M-44 -28L-58 -52 -42 -42 -40 -54 -12 -25 -32 -13Z M43 -27L58 -52 49 -33 60 -38 31 -12 15 -24Z" fill="#ce613e" stroke="{ink}" stroke-width="3"/><path d="M-31 -21L-8 -27 0 -2 9 -27 29 -22 35 20 20 35 0 25 -21 34 -34 21Z" fill="#46343a" stroke="{trim}" stroke-width="4"/><path d="M-29 -11L0 1 27 -11M-30 2L0 14 29 2M-29 15L0 26 30 15" stroke="#ec9450" stroke-width="6" fill="none"/><path d="M0 -12L9 3 0 19 -9 3Z" fill="{trim}" stroke="{ink}" stroke-width="2"/>''',
 'frost_watcher':f'''<path d="M-38 -28Q-13 -45 0 -20Q16 -46 36 -29L36 29Q0 46 -36 29Z" fill="#8db9d1" stroke="#e0f5fb" stroke-width="4"/><path d="M-43 -29Q-47 -47 -28 -43L0 -17 29 -43Q49 -46 42 -29L21 -8 -17 -8Z" fill="#eefaff" stroke="{ink}" stroke-width="2"/><path d="M-30 2V28M-12 -5V30M12 -5V30M30 3V28" stroke="#e3f6fa" stroke-width="3" stroke-dasharray="4 6"/><path d="M0 -12L10 3 0 20 -10 3Z" fill="#e5ffff" stroke="{ink}" stroke-width="2"/><path d="M-38 32Q0 46 38 32" fill="none" stroke="#f5ffff" stroke-width="9"/>'''}
 boots=''
 for x,y in ((lx,ly),(rx,ry)):
  boots+=f'<path d="M{x-16} {y-18}Q{x} {y-26} {x+17} {y-17}L{x+12} {y-6}Q{x} {y+1} {x-14} {y-5}Z" fill="{dark}" stroke="{ink}" stroke-width="3"/><path d="M{x-13} {y-16}Q{x} {y-23} {x+14} {y-15}" stroke="{trim}" stroke-width="3" fill="none"/>'
 return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 279 370" width="279" height="370">{sleeve}<g transform="translate({cx} {cy}) rotate({angle})" stroke-linecap="round" stroke-linejoin="round">{vest}{motifs[theme]}</g>{boots}</svg>'
def main():
 for id,(name,*_) in THEMES.items():
  dest=ROOT/'assets'/'costumes'/id;dest.mkdir(parents=True,exist_ok=True);frames=[]
  for kind in ('attack','hurt'):
   for n,pose in enumerate(POSE[kind],1):
    file=ROOT/'assets'/'canonical'/f'{kind}_{n:02}.png'
    base=Image.open(file).convert('RGBA')
    if base.height!=370 or base.width not in (278,279):raise ValueError(f'{file}: unexpected canonical size {base.size}')
    if base.width==278:
     full=Image.new('RGBA',(279,370));full.alpha_composite(base);base=full
    layer=Image.open(BytesIO(cairosvg.svg2png(bytestring=art(id,pose).encode(),output_width=558,output_height=740))).convert('RGBA').resize((279,370),Image.Resampling.LANCZOS)
    pix=np.asarray(base).astype('float32');r,g,b,a=np.rollaxis(pix,2)
    orange=(r>120)&(g>r*.35)&(g<r*.98)&(b<r*.84)&(r>b*1.23)
    cream=(r>215)&(g>180)&(b>112)&(b<g*.92)&(g<r*.98)
    mask=((orange|cream)&(a>100))
    over=np.array(layer);over[:,:,3]=(over[:,:,3]*mask).astype('uint8')
    base.alpha_composite(Image.fromarray(over,'RGBA'))
    out=dest/f'{kind}_{n:02}.png';base.save(out,optimize=True)
    frames.append({'file':out.name,'sha256':hashlib.sha256(out.read_bytes()).hexdigest()})
  (dest/'manifest.json').write_text(json.dumps({'id':id,'name':name,'price':50,'type':'complete-character','sword':'separate-svg','frames':frames},ensure_ascii=False,indent=2)+'\n')
 print('Generated five unique full-costume variants: 60 complete kitten PNGs, original 12 preserved')
if __name__=='__main__':main()
