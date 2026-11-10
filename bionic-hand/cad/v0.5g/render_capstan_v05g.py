#!/usr/bin/env python3
"""CAD previews + conceptual rope-path animation; no physical actuator timing proof."""
from pathlib import Path
import math
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection
from matplotlib.patches import Rectangle, Circle
from matplotlib.animation import FuncAnimation, PillowWriter, FFMpegWriter
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
from build_capstan_v05g import rigid_parts,ideal_path,CABLE_CENTER_RADIUS
P=Path(__file__).resolve().parent
palette={'fork_guide':'#8fadb9','prox_drum':'#eab46c','pin_mock':'#c3d0d7','retainer_envelope':'#a98bd9'}

def solids_subplot(ax,theta):
    shapes=rigid_parts(theta)
    for name,shape in shapes.items():
        v,f=shape.tessellate(.6)
        vs=np.asarray([p.toTuple() for p in v])
        ff=np.asarray(f,dtype=int)
        # Keep stable deterministic subset for rendering only.
        if len(ff)>1700: ff=ff[np.linspace(0,len(ff)-1,1700,dtype=int)]
        patches=Poly3DCollection(vs[ff],facecolor=palette[name],edgecolors=(.16,.23,.30,.19),linewidths=.06,alpha=.85)
        ax.add_collection3d(patches)
    line,arc=ideal_path(theta)
    for pts in (line,arc):
        p=np.asarray(pts)
        ax.plot(p[:,0],p[:,1],p[:,2],color='#37dca6',lw=3,alpha=.95)
    ax.set_xlim(-17,38);ax.set_ylim(-14,36);ax.set_zlim(-10,14)
    ax.set_box_aspect((55,50,24))
    ax.view_init(elev=28,azim=-53)
    ax.set_title(f'MCP {theta}°',fontsize=14,fontweight='bold')
    ax.set_xlabel('x, mm');ax.set_ylabel('y, mm');ax.set_zlabel('z, mm')
    ax.tick_params(labelsize=7)

fig=plt.figure(figsize=(16,5.5),dpi=150)
for i,a in enumerate((0,30,60),start=1):
    ax=fig.add_subplot(1,3,i,projection='3d')
    solids_subplot(ax,a)
fig.suptitle('v0.5g | Isolated MCP capstan 3D — FDM shape study, not a wearable prosthesis',fontsize=13)
fig.tight_layout()
fig.savefig(P/'preview_capstan_v05g.png',bbox_inches='tight',dpi=150)
plt.close(fig)

fig,ax=plt.subplots(figsize=(8,5),dpi=100)
ax.set_xlim(-17,21); ax.set_ylim(-11,20);ax.set_aspect('equal')
ax.set_facecolor('#f6f8fb');ax.grid(alpha=.18)
ax.add_patch(Rectangle((-16,-7),23,14,facecolor='#e6f4f7',edgecolor='#137c86',lw=1.4,alpha=.4))
ax.add_patch(Circle((0,0),5.2,fill=False,edgecolor='#d78f40',lw=3))
ax.add_patch(Circle((0,0),1.5,facecolor='#7b8791',lw=0))
ax.plot([-12],[5.8],'o',color='#078a75',ms=7)
fixed,=ax.plot([-12,0],[5.8,5.8],color='#159f82',lw=3)
arc_line,=ax.plot([],[],color='#0a826c',lw=3)
shaft,=ax.plot([],[],color='#f09d45',lw=5,alpha=.75)
anchor,=ax.plot([],[],'o',color='#c45151',ms=6)
info=ax.text(-16,19,'',fontweight='bold',size=11,va='top')
ax.text(-15,-5.8,'Boot keepout (only a 2D envelope)',size=9,color='#147e87')
ax.set_xlabel('MCP x, mm');ax.set_ylabel('MCP y, mm')
def update(i):
    angle=60*(1-abs(i-20)/20) if i<=40 else 0
    path,arc=ideal_path(angle,50)
    arr=np.array(arc)
    arc_line.set_data(arr[:,0],arr[:,1])
    a=math.radians(angle)
    shaft.set_data([0,12*math.cos(a)],[0,12*math.sin(a)])
    anchor.set_data([arr[-1,0]],[arr[-1,1]])
    info.set_text(f'Angle: {angle:.1f}° | Ideal rope travel: {CABLE_CENTER_RADIUS*math.radians(angle):.2f} mm\nSynthetic 1.5s close + 1.5s open; NO real drive measurement')
    return arc_line,shaft,anchor,info
anim=FuncAnimation(fig,update,frames=41,interval=75,blit=False)
anim.save(str(P/'capstan_motion_concept_v05g.gif'),writer=PillowWriter(fps=13.33))
try:anim.save(str(P/'capstan_motion_concept_v05g.mp4'),writer=FFMpegWriter(fps=13.33,bitrate=1250))
except Exception as e: print('MP4 not available:',e)
plt.close(fig)
print('render complete')
