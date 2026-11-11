"""Orthographic sketch from audited assembly solids and numerical travel."""
import argparse
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
from matplotlib import colors, pyplot as plt
from matplotlib.collections import PolyCollection
from matplotlib.patches import Rectangle
import numpy as np

from common_cad import COLORS, pose
from common_release import report

BG = "#f4f7fa"
INK = "#253947"
MUTED = "#466276"


def plan(ax, state):
    parts = pose(*state)
    faces = []
    for name, solid in parts.items():
        if name in {"frame_base", "frame_bridge"}:
            continue
        tint = np.array(colors.to_rgb(COLORS[name.split("_")[0]]))
        vertices, indices = solid.tessellate(.4,.27)
        points = np.array([v.toTuple() for v in vertices])
        for i,j,k in indices:
            tri=points[[i,j,k]]
            normal=np.cross(tri[1]-tri[0],tri[2]-tri[0])
            size=np.linalg.norm(normal)
            if size>1e-9:
                faces.append((tri[:,2].mean(),tri[:,:2],(.75+.25*abs(normal[2]/size))*tint))
    faces.sort(key=lambda face:face[0])
    ax.add_collection(PolyCollection([f[1] for f in faces],facecolors=[f[2] for f in faces],
                                     edgecolors="face",linewidths=.15))
    yoke = parts["yoke_anchor_bar"].BoundingBox()
    ax.add_patch(Rectangle((yoke.xmin, yoke.ymin), yoke.xlen, yoke.ylen,
                           fill=False, edgecolor="#284b6a", linestyle="--", linewidth=1.1))
    ax.set(xlim=(-44,48),ylim=(-29,61),aspect="equal")
    ax.axis("off")
    opts=dict(color=INK,fontsize=9,arrowprops=dict(arrowstyle="-",color=MUTED))
    ax.annotate("Рычаг",(-6.5,51),(-37,52),**opts)
    ax.annotate("Паз ограничителя",(-9,38),(15,48),**opts)
    ax.annotate("Каретка под диском",(-3,-19),(-41,-25),**opts)
    ax.annotate("Тяги", (31.6,-18.35),(28,-27),**opts)


def render(path):
    fig=plt.figure(figsize=(12,6),facecolor=BG)
    gs=fig.add_gridspec(1,2,width_ratios=(1.05,1),left=.05,right=.945,bottom=.20,top=.77,wspace=.25)
    fig.text(.05,.92,"v0.7g · Один рычаг на четыре пальца",fontsize=25,weight="bold",color=INK)
    fig.text(.05,.86,"Стендовый механизм и проверка отказа одного канала",fontsize=12,color=MUTED)
    left=fig.add_subplot(gs[0,0]); plan(left,(82.5,7.5,False,True))
    left.set_title("Вид сверху · промежуточный ход",loc="left",color=INK,fontsize=13,weight="bold")
    ax=fig.add_subplot(gs[0,1]); ax.set_facecolor(BG)
    y=report()["payout_mm"]; x=list(range(len(y)))
    ax.plot(x,y,color="#247f89",marker="o",markersize=4,label="Три свободных канала")
    ax.plot(x,[min(v,3) for v in y],color="#ae514a",marker=".",label="Канал, зажатый на 3 мм")
    ax.vlines(12,3,12,color="#ae514a",linestyle="--",lw=1)
    ax.annotate("9 мм накопленной\nслабины", (11.8,8), (7.1,7.2), fontsize=9,color="#873f39",
                arrowprops=dict(arrowstyle="-",color="#ae514a"))
    ax.set(xlim=(-.15,12.4),ylim=(0,12.9),xticks=(0,2,4,6,8,10,12),yticks=(0,3,6,9,12),
           xlabel="Качания рычага",ylabel="Ход ползуна, мм")
    ax.grid(axis="y",color="#d3dfe7")
    ax.spines[["top","right"]].set_visible(False)
    ax.set_title("Расчёт · один зажатый канал",loc="left",color=INK,fontsize=13,weight="bold")
    ax.legend(loc="upper left",fontsize=8,frameon=False)
    fig.text(.05,.085,"Полный ход 12 мм  ·  12 качаний по 15°  ·  до 1,60 мм хода общей каретки за шаг",fontsize=12,weight="bold",color=INK)
    fig.text(.05,.046,"Вид без основания и верхней перемычки. Динамика и физические испытания впереди.",fontsize=9,color=MUTED)
    fig.savefig(path,dpi=145,facecolor=BG)
    plt.close(fig)


if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",type=Path,default=Path(__file__).with_name("preview.png"))
    render(parser.parse_args().output)
