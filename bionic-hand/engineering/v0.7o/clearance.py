"""Conservative AABB screening for unloaded anchor access; NOT 3D CAD."""
from dataclasses import dataclass
@dataclass(frozen=True)
class Box:
    xmin:float; xmax:float; ymin:float; ymax:float; zmin:float; zmax:float
    def overlaps(self,b):
        return all(a0 < b1 and b0 < a1 for a0,a1,b0,b1 in [(self.xmin,self.xmax,b.xmin,b.xmax),(self.ymin,self.ymax,b.ymin,b.ymax),(self.zmin,self.zmax,b.zmin,b.zmax)])
def service_box(x,y,z,head_d=5.4,tool_d=6.0,reach=20.0,allowance=.5):
    if min(head_d,tool_d,reach)<=0 or allowance<0: raise ValueError('invalid size')
    r=max(head_d,tool_d)/2+allowance
    return Box(x-r,x+r,y-r,y+r,z,z+reach)
def gap_needed(head_d=5.4,tool_d=6.0,allowance=.5):
    if min(head_d,tool_d)<=0 or allowance<0: raise ValueError('invalid')
    return max(head_d,tool_d)+2*allowance
def nominal_neighbor_gap(pitch=17.0,finger_width=12.0):
    if pitch<=0 or finger_width<=0: raise ValueError('invalid')
    return pitch-finger_width
def screen(pitch=17.0,width=12.0,tool=6.0,allowance=.5):
    gap=nominal_neighbor_gap(pitch,width)
    return {'gap_mm':gap,'required_mm':gap_needed(tool_d=tool,allowance=allowance),'margin_mm':gap-gap_needed(tool_d=tool,allowance=allowance),'pass':gap>=gap_needed(tool_d=tool,allowance=allowance)}
if __name__=='__main__':
    for pitch in [15,17,19,21]:print(pitch,screen(pitch=pitch))
