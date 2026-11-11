"""v0.7p: illustrative exterior hatch clearance screen; not CAD or safety proof."""
from dataclasses import dataclass
import math

@dataclass(frozen=True)
class Box:
    xmin: float; xmax: float; ymin: float; ymax: float; zmin: float; zmax: float
    def __post_init__(self):
        for a,b in ((self.xmin,self.xmax),(self.ymin,self.ymax),(self.zmin,self.zmax)):
            if not (math.isfinite(a) and math.isfinite(b) and a < b):
                raise ValueError('invalid bounds')

def intersects(a: Box, b: Box, clearance: float = 0.0) -> bool:
    if clearance < 0 or not math.isfinite(clearance): raise ValueError('clearance')
    return all(lo1 < hi2+clearance and lo2 < hi1+clearance for lo1,hi1,lo2,hi2 in ((a.xmin,a.xmax,b.xmin,b.xmax),(a.ymin,a.ymax,b.ymin,b.ymax),(a.zmin,a.zmax,b.zmin,b.zmax)))

def dorsal_tool_box(x:float,y:float,z_top:float,reach:float,diameter:float=6.,margin:float=.5)->Box:
    if reach<=0 or diameter<=0 or margin<0 or not all(map(math.isfinite,(x,y,z_top,reach,diameter,margin))): raise ValueError('tool')
    r=diameter/2+margin
    return Box(x-r,x+r,y-r,y+r,z_top-reach,z_top)

def hatch_width(head_d:float=5.4, tool_d:float=6., margin:float=.5)->float:
    if min(head_d,tool_d)<=0 or margin<0 or not all(map(math.isfinite,(head_d,tool_d,margin))):raise ValueError('dimensions')
    return max(head_d,tool_d)+2*margin

def outer_hatch_margin(width:float, required:float=7.,edge:float=1.5)->float:
    if width<=0 or required<=0 or edge<0 or not all(map(math.isfinite,(width,required,edge))):raise ValueError('dimensions')
    return width-required-2*edge

def sweep_clearance(tool:Box, moving:list[Box], clearance:float=.5)->bool:
    return all(not intersects(tool, b, clearance) for b in moving)

def example():
    # All positions are artificial local coordinates, NOT from actual MCP CAD.
    # x: along palm; y: finger pitch; z: dorsal height. Tool enters from z=+25 to +5.
    tool=dorsal_tool_box(x=0,y=0,z_top=25,reach=20)
    static_sidewall=Box(6,9,-7,7,0,25)
    # Hypothetical moving fastener, not registered to the actual MCP assembly.
    moving=[Box(-3,3,3,9,11.4,12.3), Box(-3,3,9,15,11.4,12.3)]
    print('required_hatch_opening_mm',hatch_width())
    for w in (8.,10.,12.):
        print('opening',w,'margin_after_1.5mm_edge_each_side',round(outer_hatch_margin(w),3))
    print('tool_path_vs_hypothetical_fasteners_clear',sweep_clearance(tool,moving))
    print('tool_path_vs_sidewall_clear',sweep_clearance(tool,[static_sidewall]))
    print('note: assumed tool center and moving obstacles; actual 3D CAD and boot needed')
if __name__=='__main__':example()
