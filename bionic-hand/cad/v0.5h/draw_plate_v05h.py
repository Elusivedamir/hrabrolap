#!/usr/bin/env python3
"""Reference-only 34x12x2 plate drill drawing, NOT a load-rated shop release.
Paper scale must be independently checked using calipers.
"""
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle,Circle
P=Path(__file__).parent
fig,ax=plt.subplots(figsize=(11,4.6),dpi=170)
ax.set_aspect('equal')
ax.add_patch(Rectangle((-5,-6),34,12,fill=False,linewidth=2))
for x in (0.,7.5,14.,23.):
 ax.add_patch(Circle((x,0),1.65,fill=False,linewidth=1.6))
 ax.plot([x,x],[-1,1],linewidth=.8)
 ax.plot([x-1,x+1],[0,0],linewidth=.8)
 ax.annotate(f'{x:g}',xy=(x,1.7),xytext=(x,9.3),ha='center',fontsize=10,
             arrowprops={'arrowstyle':'-','linewidth':.8})
ax.annotate('',xy=(-5,-8),xytext=(29,-8),arrowprops={'arrowstyle':'<->'})
ax.text(12,-9.8,'34 mm',ha='center')
ax.annotate('',xy=(31,-6),xytext=(31,6),arrowprops={'arrowstyle':'<->'})
ax.text(32,0,'12 mm',rotation=90,va='center')
ax.set_xlim(-10,42);ax.set_ylim(-15,16)
ax.grid(alpha=.14)
ax.set_xlabel('mm; hole diameters 3.3 mm, centerline Y=0')
ax.set_title('v0.5h | BENCH SAMPLE ONLY: metal strip 34 x 12 x 2 mm, 4x Ø3.3 mm')
ax.text(16,-13,'Not a production drawing. Drill tolerances, alloy and actual fit NOT VERIFIED.',ha='center',fontsize=9)
fig.tight_layout()
fig.savefig(P/'drill_pattern_REFERENCE.png')
fig.savefig(P/'drill_pattern_REFERENCE.svg')
plt.close(fig)
