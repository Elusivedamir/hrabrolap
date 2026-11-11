"""Render the checked bench envelope and conditional force comparison."""
import argparse
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
from matplotlib import pyplot as plt
from matplotlib.patches import Circle, Rectangle

from mount_cad import AXLE_X, CORD_Y, GUIDE_X, load_base, pose
from sizing import screen, V07I_TRAVEL_MM

HERE=Path(__file__).resolve().parent
BG="#f4f7fa"
INK="#263948"
MUTED="#496477"
BLUE="#3e7c88"
GOLD="#b78442"


def render(baseline):
    prior=load_base(baseline)
    parts=pose(prior,0)
    figure=plt.figure(figsize=(12,5.8),facecolor=BG)
    figure.text(.055,.91,"v0.7j · Один палец, один привод",fontsize=24,color=INK,weight="bold")
    figure.text(.055,.85,"Крепление на настольной доске и предварительный выбор редуктора",
                fontsize=11.5,color=MUTED)
    gs=figure.add_gridspec(1,2,width_ratios=(1.28,1),left=.055,right=.95,top=.77,bottom=.22,wspace=.28)
    ax=figure.add_subplot(gs[0,0])
    for name,tint in (("board","#dce5eb"),("motor_shim_block","#7c9eaa"),
                      ("motor_proxy_10x12",BLUE),("upper_cheek","#7890a1")):
        b=parts[name].BoundingBox()
        ax.add_patch(Rectangle((b.xmin,b.ymin),b.xlen,b.ylen,color=tint))
    finger=parts["finger"].BoundingBox()
    ax.plot([finger.xmin+8,finger.xmax-8],[0,0],color="#607b56",lw=15,solid_capstyle="round")
    ax.plot([23,GUIDE_X,AXLE_X],[0,CORD_Y,CORD_Y],color="#354851",lw=1.5,ls="--")
    ax.add_patch(Circle((GUIDE_X,CORD_Y),1.7,color=GOLD))
    ax.add_patch(Rectangle((AXLE_X-7.45,CORD_Y-2.45),14.9,4.9,color=GOLD))
    for txt,end,start in (("Мотор",(AXLE_X,-19),(-63,21)),
                          ("Направляющая",(GUIDE_X,CORD_Y),(23,-34)),
                          ("Палец",(48,0),(37,19))):
        ax.annotate(txt,end,start,color=INK,fontsize=9,arrowprops=dict(arrowstyle="-",color=MUTED))
    ax.set(xlim=(-72,95),ylim=(-53,40),aspect="equal")
    ax.axis("off")
    ax.set_title("Размещение на доске 158 × 85 мм",loc="left",fontsize=12,weight="bold",color=INK)

    chart=figure.add_subplot(gs[0,1]);chart.set_facecolor(BG)
    rows=screen(V07I_TRAVEL_MM,0)
    labels=["100:1 · R6","150:1 · R6","100:1 · R8","150:1 · R8"]
    values=[r["max_force_under_torque_rule_N"] for r in rows]
    chart.barh(labels,values,color=[BLUE,GOLD,BLUE,GOLD],height=.53)
    for i,value in enumerate(values):
        chart.text(value+.065,i,f"{value:.2f}".replace(".",","),va="center",fontsize=9,color=INK)
    chart.invert_yaxis()
    chart.set_xlim(0,4.1)
    chart.spines[["right","top","left"]].set_visible(False)
    chart.tick_params(axis="y",length=0)
    chart.set_xlabel("Предельная тяга по принятому расчёту, Н",fontsize=9,color=MUTED)
    chart.set_title("Оценка по моменту · Pololu MP 6 В",loc="left",fontsize=12,weight="bold",color=INK)
    chart.grid(axis="x",alpha=.20)
    chart.set_axisbelow(True)
    figure.text(.055,.105,"Ход из CAD 21,76 мм  ·  барабан R6  ·  23,09 об/мин в среднем при цели 1,5 с",
                fontsize=11,color=INK,weight="bold")
    figure.text(.055,.058,"Условная оценка. Реальная тяга, температура и срабатывание защит ещё не измерены.",
                fontsize=9.5,color=MUTED)
    figure.savefig(HERE/"preview.png",dpi=145,facecolor=BG)
    plt.close(figure)


if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--baseline",type=Path,default=HERE.parent/"v0.7i")
    render(p.parse_args().baseline.resolve())
