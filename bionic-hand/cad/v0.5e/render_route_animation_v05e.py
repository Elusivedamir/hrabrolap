#!/usr/bin/env python3
"""Render 2D v0.5e screening animation, NOT the unrecovered 36-body CAD.
Requires matplotlib and Pillow; ffmpeg for MP4. Motion is kinematic,
not measured motor speed. Output 30 fps / 1.5 s flexion.
"""
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Circle
from matplotlib.animation import FuncAnimation, PillowWriter, FFMpegWriter
from thumb_flex_study_v05e import P, cable_span, cable_y_in_boot_x, length_at

ROOT = Path(__file__).resolve().parent
Y = 7
fig, ax = plt.subplots(figsize=(9,6), dpi=110)
fig.patch.set_facecolor('#131a22')
ax.set_facecolor('#131a22')
ax.set_xlim(-19,20); ax.set_ylim(-15,20)
ax.set_aspect('equal', adjustable='box')
ax.set_xlabel('Local MCP x (mm)', color='#f0f0f0')
ax.set_ylabel('Local MCP y (mm)', color='#f0f0f0')
ax.tick_params(colors='#d0d0d0')
for spine in ax.spines.values(): spine.set_color('#77818b')
ax.grid(color='#485663',alpha=.25)
boot=Rectangle((-16,-7),23,14,facecolor='#176e8b',edgecolor='#58d8ef',alpha=.20,linewidth=2)
ax.add_patch(boot)
ax.add_patch(Circle((0,0),6.25,fill=False,color='#f1c65e',linestyle='--',linewidth=2))
ax.add_patch(Circle((0,0),1.5,color='#b7bdc6'))
ax.scatter([-12],[Y],s=80,c=['#5be58a'],zorder=6)
shaft,=ax.plot([],[],color='#6a98eb',lw=3)
line,=ax.plot([],[],color='#65e68a',lw=3)
endpoint,=ax.plot([],[],'o',markersize=8,color='#65e68a')
info=ax.text(-18.5,18,'',color='white',size=12,va='top',fontweight='medium')
ax.text(-15.5,-6.0,'Current boot reserve (not a seal)',color='#b5eefa',size=9)
ax.text(0,-10.2,'Dashed circle = approximate MCP eye',color='#f2cf71',size=9,ha='center')

def frame(i):
    a=20*i/44
    (gx,gy),(x,y)=cable_span(a,Y)
    shaft.set_data([0,x],[0,y]);line.set_data([gx,x],[gy,y]);endpoint.set_data([x],[y])
    wind=length_at(0,Y)-length_at(a,Y)
    leak=cable_y_in_boot_x(a,Y)[1]>7+1e-9
    line.set_color('#ff6574' if leak else '#65e68a')
    endpoint.set_color('#ff6574' if leak else '#65e68a')
    info.set_text(f'2D route hypothesis / MCP {a:4.1f}° / ΔL={wind:0.2f} mm\n'+
                 ('OUTSIDE prior boot envelope' if leak else 'within prior boot-Y envelope')+
                 ' | fixed CMC-local guide')
    return shaft,line,endpoint,info

anim=FuncAnimation(fig,frame,frames=45,interval=1000/30,blit=False)
anim.save(str(ROOT/'thumb_route_v05e_2d.gif'),writer=PillowWriter(fps=30))
try: anim.save(str(ROOT/'thumb_route_v05e_2d.mp4'),writer=FFMpegWriter(fps=30,bitrate=1200))
except Exception as e: print('MP4 skipped:',e)
frame(44)
fig.savefig(ROOT/'thumb_route_20deg_v05e.png',bbox_inches='tight')
plt.close(fig)
print('Render complete: analytic 2D route only; 36-body CAD NOT rendered')
