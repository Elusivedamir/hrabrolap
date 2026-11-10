#!/usr/bin/env python3
"""Recreate original v0.4 palm chassis geometry as STEP baseline for v0.5.
Geometry-only, not safety-rated. Requires CadQuery.
"""
from pathlib import Path
import cadquery as cq
P=Path(__file__).resolve().parent/"baseline_v04_chassis.step"
def bb(x0,x1,y0,y1,z0,z1):
    return cq.Workplane("XY").box(x1-x0,y1-y0,z1-z0).translate(((x0+x1)/2,(y0+y1)/2,(z0+z1)/2)).val()
def cutaxis(s,axis,point,d,h):
    vec={"x":cq.Vector(1,0,0),"y":cq.Vector(0,1,0),"z":cq.Vector(0,0,1)}[axis]
    return s.cut(cq.Solid.makeCylinder(d/2,h,cq.Vector(*point),vec))
frame=bb(-120,-31,-13.5,-8.5,-40,40)
for x0,x1 in [(-105,-80),(-71,-47)]:
    for z0,z1 in [(-28,-9),(9,28)]:
        frame=frame.cut(bb(x0,x1,-15,-7,z0,z1))
for z0,z1 in [(-40,-32),(32,40)]:
    frame=frame.fuse(bb(-114,-34,-8.5,0.5,z0,z1))
frame=frame.fuse(bb(-110,-39,-8.5,-3.5,-4,4))
frame=frame.fuse(bb(-40,-31,-13.5,-6.5,-40,40))
centres=[-30.75,-10.25,10.25,30.75]
for zc in centres:
    frame=frame.fuse(bb(-35,-7,-13.5,-7.5,zc-7,zc+7))
frame=frame.fuse(bb(-122,-116,-15,11,-26,26))
for z0,z1 in [(-26,-19),(19,26)]:
    frame=frame.fuse(bb(-116,-103,-13.5,0,z0,z1))
for zc in centres:
    for x in [-23,-13]:
        frame=cutaxis(frame,"y",(x,-15,zc),3.4,12)
for y in [-6,6]:
    for z in [-18,18]:
        frame=cutaxis(frame,"x",(-123,y,z),4.5,9)
frame=frame.clean()
assert frame.isValid() and len(frame.Solids())==1
cq.exporters.export(frame,str(P))
print("generated",P.name,"volume_mm3",round(frame.Volume(),5),"solids",len(frame.Solids()))
