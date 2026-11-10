#!/usr/bin/env python3
"""Headless preview of exported CAD meshes. Image is not a collision/strength test."""
from pathlib import Path
import numpy as np
import trimesh
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection

ROOT=Path(__file__).resolve().parent
for tag,title in [('opposed','Большой палец противопоставлен'),('mcp20','Пробное сгибание MCP на 20°')]:
    scene=trimesh.load(ROOT/f'hand_v05d_{tag}.glb',force='scene')
    fig=plt.figure(figsize=(10.4,7.2),dpi=130,facecolor='#f3f6fa')
    ax=fig.add_axes((0,.10,1,.78),projection='3d',facecolor='#f3f6fa')
    for n in scene.graph.nodes_geometry:
        transform,g=scene.graph[n];mesh=scene.geometry[g].copy();mesh.apply_transform(transform)
        colors=mesh.visual.face_colors.astype(float)/255
        shade=.65+.35*np.clip(mesh.face_normals@np.array([.3,.7,.64]),0,1)
        colors[:,:3]*=shade[:,None]
        poly=Poly3DCollection(mesh.vertices[mesh.faces],facecolors=colors,edgecolors='none',linewidths=0,zsort='average')
        ax.add_collection3d(poly)
    ax.set_xlim(-130,95);ax.set_ylim(-35,100);ax.set_zlim(-50,105)
    ax.set_box_aspect((225,135,155),zoom=1.7);ax.view_init(elev=25,azim=60);ax.set_axis_off()
    fig.text(.045,.935,'БИОНИЧЕСКАЯ КИСТЬ · v0.5d · ВИЛКА И ОСЬ БОЛЬШОГО ПАЛЬЦА',fontsize=17,weight='bold',color='#19334b')
    fig.text(.045,.885,title+' · CAD-модель',fontsize=12,color='#43617b')
    fig.text(.045,.065,'Вилка, поперечная ось и условный стопор построены в CAD.',fontsize=11,color='#19334b')
    fig.text(.045,.033,'Привода сгибания и пыльника пока нет. Прочность и 10 кг не проверены.',fontsize=10,color='#a34242')
    fig.savefig(ROOT/f'preview_{tag}_v05d.png',dpi=130);plt.close(fig)
    print('rendered',tag,flush=True)
