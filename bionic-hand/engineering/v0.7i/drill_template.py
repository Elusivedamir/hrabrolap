"""Printable A4 outline and bench reference for the unloaded finger."""
from pathlib import Path
from math import cos, radians, sin

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

from geometry import (BASE_X, BASE_Y, CHEEK_X, CHEEK_Y, FINGER_X, GUIDE_XY, MOUNTS_X,
                      PIN_HOLE_R_MM, TIE_HOLE_R_MM, TIE_X, anchor)

HERE = Path(__file__).resolve().parent
INK = HexColor("#243846")
MUTED = HexColor("#4d6477")
ACCENT = HexColor("#216877")
LIGHT = HexColor("#a5bac5")
FONT_DIR = Path("/usr/share/fonts/truetype/dejavu")


def render(output):
    for family, file in (("Regular", "DejaVuSans.ttf"), ("Bold", "DejaVuSans-Bold.ttf")):
        pdfmetrics.registerFont(TTFont(family, str(FONT_DIR / file)))
    pdf = canvas.Canvas(str(output), pagesize=A4, invariant=1)
    pdf.setTitle("v0.7i - шаблон пальца")
    pdf.setAuthor("Bionic Hand Project")

    def label(x,y,text,size=8.5,font="Regular",tone=INK):
        pdf.setFillColor(tone)
        pdf.setFont(font,size)
        pdf.drawString(x*mm,y*mm,text)

    def line(x1,y1,x2,y2,dash=False,tone=INK):
        pdf.setStrokeColor(tone)
        pdf.setLineWidth(.52)
        pdf.setDash(3,2) if dash else pdf.setDash()
        pdf.line(x1*mm,y1*mm,x2*mm,y2*mm)
        pdf.setDash()

    def hole(x,y,r):
        pdf.setStrokeColor(INK)
        pdf.setLineWidth(.50)
        pdf.circle(x*mm,y*mm,r*mm)
        line(x-2.1,y,x+2.1,y,tone=LIGHT)
        line(x,y-2.1,x,y+2.1,tone=LIGHT)

    label(16,279,"Шаблон пальца v0.7i",21,"Bold")
    label(16,270,"А4 · фактический размер 100% · ручной настольный макет",10,tone=MUTED)
    label(16,260,"Сначала проверьте контрольную линию 50 мм. Выключите подгонку к странице.",8.6)
    line(16,253,66,253,tone=ACCENT)
    line(16,251.4,16,254.6,tone=ACCENT)
    line(66,251.4,66,254.6,tone=ACCENT)
    label(70,252,"50 мм",8.5,"Bold",ACCENT)

    label(16,235,"Детали из листа 4 мм",11,"Bold")
    ox,oy=61,212
    pdf.setStrokeColor(INK)
    pdf.rect((ox+CHEEK_X[0])*mm,(oy+CHEEK_Y[0])*mm,
             (CHEEK_X[1]-CHEEK_X[0])*mm,(CHEEK_Y[1]-CHEEK_Y[0])*mm)
    for x in (0,*MOUNTS_X):
        hole(ox+x,oy,PIN_HOLE_R_MM)
    label(17,194,"Щека × 2 · отверстия Ø3,3 мм",8.3)
    label(17,189,"Два крепления: 36 и 20 мм от оси.",8.0,tone=MUTED)

    x0,y0=100,212
    pdf.setStrokeColor(INK)
    pdf.roundRect((x0+FINGER_X[0])*mm,(y0-8)*mm,(FINGER_X[1]-FINGER_X[0])*mm,
                  16*mm,8*mm,fill=0)
    hole(x0,y0,PIN_HOLE_R_MM)
    for x in TIE_X:
        hole(x0+x,y0,TIE_HOLE_R_MM)
    label(92,194,"Палец × 1 · ось Ø3,3 мм, отверстия нити Ø2 мм",8.2)
    label(92,189,"От оси до кончика 75 мм. Для начала используйте среднее отверстие.",7.4,tone=MUTED)

    label(16,175,"Разметка основания · вид сверху",11,"Bold")
    label(16,168,"Разметка по точкам. Контур основания можно перенести на любой жёсткий обрезок.",8.1,tone=MUTED)
    bx,by=67,124
    pdf.setStrokeColor(LIGHT)
    pdf.rect((bx+BASE_X[0])*mm,(by+BASE_Y[0])*mm,(BASE_X[1]-BASE_X[0])*mm,
             (BASE_Y[1]-BASE_Y[0])*mm)
    for x in MOUNTS_X:
        hole(bx+x,by,PIN_HOLE_R_MM)
    hole(bx,by,PIN_HOLE_R_MM)
    label(bx+3,by+3,"Ось",8.1,"Bold",ACCENT)
    label(20,by+6,"Крепления щёк",8.1)
    for a in (0,30,60):
        angle=radians(a)
        x=bx+51*cos(angle)
        y=by-51*sin(angle)
        line(bx,by,x,y,dash=True,tone=LIGHT)
        label(x+1,y+1,f"{a}°",8.1,tone=MUTED)
    gx,gy=bx+GUIDE_XY[0],by+GUIDE_XY[1]
    hole(gx,gy,2)
    ax,ay=anchor(TIE_X[1],0)
    line(bx+ax,by+ay,gx,gy,dash=True,tone=ACCENT)
    label(gx+3,gy-1,"Гладкая направляющая нити",8.0,"Bold",ACCENT)
    label(16,65,"Точка направляющей: 11 мм к кончику и 38 мм в сторону сгибания от оси.",8.4)
    label(16,56,"Крепите основание к столу. 60° на разметке - визуальный предел хода.",8.4)
    label(16,48,"Вращайте палец слабым натяжением нити и вручную возвращайте обратно.",8.4)
    line(16,38,194,38,tone=LIGHT)
    label(16,30,"Макет для проверки движения. Собирается без мотора, нагрузки и контакта с телом.",8.4,"Bold")
    pdf.showPage()
    pdf.save()


if __name__=="__main__":
    render(HERE / "finger-template-A4.pdf")
