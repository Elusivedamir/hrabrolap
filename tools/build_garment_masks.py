"""Vectorize foreground scarf protection from unchanged approved reference pixels."""
from pathlib import Path
from PIL import Image, ImageFilter
import json
root=Path(__file__).resolve().parents[1]
result={}
for kind in ('attack','hurt'):
 result[kind]=[]
 for n in range(1,7):
  source=Image.open(root/f'assets/canonical/{kind}_{n:02}.png').convert('RGB').resize((279,370),Image.Resampling.BICUBIC)
  mask=Image.new('L',source.size);pix=mask.load()
  for y in range(185,345):
   for x in range(279):
    r,g,b=source.getpixel((x,y))
    # Red cloth and its warm red folds; orange fur is excluded by blue/green.
    if r>65 and g<r*.30 and r>b*1.3 and b>g*.70:pix[x,y]=255
  # Discard tiny red-brown antialias fragments on the fur/feet outline.
  visited=set()
  for y in range(185,345):
   for x in range(279):
    if not pix[x,y] or (x,y) in visited:continue
    component=[];todo=[(x,y)];visited.add((x,y))
    while todo:
     u,v=todo.pop();component.append((u,v))
     for q in ((u-1,v),(u+1,v),(u,v-1),(u,v+1)):
      if 0<=q[0]<279 and 185<=q[1]<345 and q not in visited and pix[q]:visited.add(q);todo.append(q)
    if len(component)<40:
     for q in component:pix[q]=0
  mask=mask.filter(ImageFilter.MaxFilter(7));pix=mask.load();runs=[]
  for y in range(185,348):
   x=0
   while x<279:
    if not pix[x,y]:x+=1;continue
    begin=x
    while x<279 and pix[x,y]:x+=1
    runs.append(f'M{begin} {y}h{x-begin}v1H{begin}Z')
  result[kind].append(''.join(runs))
path=root/'art/armor-frames/steel/foreground-masks.json'
path.write_text(json.dumps(result,separators=(',',':'))+'\n')
print('Built 12 pure-vector foreground masks; reference PNG files read only.')
