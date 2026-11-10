#!/usr/bin/env python3
"""Render projection of actual v0.5h CAD solids in 3 poses, NOT strength validation."""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
from pathlib import Path
from build_reinforced_mcp import components
P=Path(__file__).parent
colors={'clevis_guide':'#718b91','phalanx_print':'#a1bbc7',
        'steel_strip':'#b7925b','capstan_print':'#e0a35b','pivot_mock':'#697781'}
fig=plt.figure(figsize=(15,5.8),dpi=130)
for i,angle in enumerate((0,30,60),start=1):
 ax=fig.add_subplot(1,3,i,projection='3d')
 for name,part in components(angle).items():
  vertices,faces=part.tessellate(.4)
  vert=np.array([v.toTuple() for v in vertices]);idx=np.array(faces,int)
  if len(idx)>1600:idx=idx[np.linspace(0,len(idx)-1,1600,dtype=int)]
  color='#697781' if name.startswith('m3_bolt') else '#677d83' if name.startswith('m3_nut') else colors.get(name,'#80909a')
  ax.add_collection3d(Poly3DCollection(vert[idx],facecolors=color,edgecolors='none',alpha=.84))
 ax.set(xlim=(-18,40),ylim=(-18,37),zlim=(-12,16))
 ax.set_box_aspect((58,55,28));ax.view_init(elev=28,azim=-58)
 ax.set_title(f'Joint flexion {angle}°')
 ax.tick_params(labelsize=7)
 ax.set_xlabel('x mm');ax.set_ylabel('y mm');ax.set_zlabel('z mm')
fig.suptitle('v0.5h | Isolated reinforced thumb joint (CAD only) — not verified strength')
fig.tight_layout()
fig.savefig(P/'cad_three_poses_v05h.png',bbox_inches='tight')
plt.close(fig)
