"""Two orthographic CAD views and the local travel bound."""
import argparse
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
from matplotlib import colors, pyplot as plt
from matplotlib.collections import PolyCollection
import numpy as np

from local_cad import COLORS, pose

BG="#f3f7fa"
INK="#243846"
MUTED="#486275"


def draw(ax,state,title,callouts):
    faces=[]
    for name,shape in pose(*state).items():
        if name.startswith("frame_") and name not in {"frame_park_guide","frame_shuttle_travel_stop","frame_base"}:
            continue
        tint=np.array(colors.to_rgb(COLORS[name.split("_")[0]]))
        points,triangles=shape.tessellate(.12,.25)
        vertices=np.array([p.toTuple() for p in points])
        for i,j,k in triangles:
            tri=vertices[[i,j,k]]
            normal=np.cross(tri[1]-tri[0],tri[2]-tri[0])
            size=np.linalg.norm(normal)
            if size>1e-10:
                faces.append((tri[:,1].mean(),tri[:,[0,2]],(.75+.25*abs(normal[1]/size))*tint))
    faces.sort(key=lambda f:f[0])
    ax.add_collection(PolyCollection([f[1] for f in faces],facecolors=[f[2] for f in faces],
                                     edgecolors="face",linewidths=.15))
    ax.set(xlim=(-14.8,16),ylim=(-1.8,17.8),aspect="equal")
    ax.set_title(title,loc="left",fontsize=14,color=INK,fontweight="bold")
    ax.axis("off")
    for label,end,start in callouts:
        ax.annotate(label,end,start,color=INK,fontsize=9,arrowprops=dict(arrowstyle="-",color=MUTED))


def render(path):
    fig=plt.figure(figsize=(12,6.2),facecolor=BG)
    gs=fig.add_gridspec(2,2,height_ratios=(2.5,1),left=.06,right=.94,bottom=.155,top=.79,
                        hspace=.43,wspace=.15)
    fig.text(.06,.92,"v0.7h · Локальный стопор у пальца",fontsize=24,weight="bold",color=INK)
    fig.text(.06,.865,"Две встречные защёлки удерживают рейку между командами.",fontsize=12,color=MUTED)
    draw(fig.add_subplot(gs[0,0]),(3,0,0,2.4),"Зафиксирован на 3 мм",
         (("Стояночная защёлка",(0,10),(-13,15)),("Рейка",(4.5,7),(8,13))))
    draw(fig.add_subplot(gs[0,1]),(3.7,.7,2.4,0),"Клин между делениями · 3,7 мм",
         (("Стояночная поднята",(0,14),(-13,16.5)),("Ходовая удерживает",(1,6.7),(3,12.7)),
          ("Выступы блокировки",(1.4,6.45),(4.4,2.8))))
    ax=fig.add_subplot(gs[1,:]); ax.set_facecolor(BG)
    ax.set(xlim=(2.7,12.3),ylim=(-.6,.6),yticks=[],xticks=(3,3.7,4.5,6,9,12))
    ax.spines[:].set_visible(False)
    ax.axhline(0,color="#cad9e3",lw=2)
    ax.plot([3.7,4.5],[0,0],lw=6,color="#bd8740",solid_capstyle="round")
    ax.plot([4.5,12],[0,0],lw=2,color="#ac534b",ls="--")
    ax.scatter([3,3.7,4.5,12],[0]*4,color=["#338891","#bd8740","#aa5149","#aa5149"],zorder=3,s=30)
    ax.text(4.1,.25,"0,8 мм до упора",ha="center",color=INK,fontsize=10)
    ax.text(8.1,.25,"Остальная слабина не выдаётся ползуну",ha="center",color=MUTED,fontsize=10)
    ax.set_xlabel("Ход ползуна, мм · после исчезновения клина без новой команды",color=MUTED,labelpad=8)
    fig.text(.06,.025,"Схема номинальной геометрии. Пружины, привод защёлок и физические испытания впереди.",
             color=MUTED,fontsize=9)
    fig.savefig(path,dpi=145,facecolor=BG)
    plt.close(fig)


if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--output",type=Path,default=Path(__file__).with_name("preview.png"))
    render(p.parse_args().output)
