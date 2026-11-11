"""v0.7f: geometric emergency release human-factors screen; NOT a physical test."""
import math
from dataclasses import dataclass

@dataclass(frozen=True)
class Gate:
    stroke_mm: float = 8.0
    lead_mm_per_rev: float = 1.0
    knob_radius_mm: float = 19.0
    pin_holes: int = 6
    tendon_force_N: float = 281.8002873563
    cable_offset_mm: float = 12.0
    guide_spacing_mm: float = 22.0

def evaluate(g=Gate(), target_s=(2.0, 5.0, 10.0)):
    if min(g.stroke_mm,g.lead_mm_per_rev,g.knob_radius_mm,g.pin_holes,g.guide_spacing_mm) <= 0:
        raise ValueError('Positive geometric inputs required')
    turns=g.stroke_mm/g.lead_mm_per_rev
    circumference_m=2*math.pi*g.knob_radius_mm/1000
    return {'turns':turns,'hand_path_m':turns*circumference_m,
            'indexed_step_mm':g.lead_mm_per_rev/g.pin_holes,
            'target_s':{str(t):{'rpm':60*turns/t,'tangential_speed_m_s':turns*circumference_m/t} for t in target_s},
            'guide_moment_Nm':g.tendon_force_N*g.cable_offset_mm/1000,
            'nominal_guide_reaction_each_N':g.tendon_force_N*g.cable_offset_mm/g.guide_spacing_mm,
            'status':'GEOMETRIC_SCREEN_ONLY'}

if __name__=='__main__':
    import json
    print(json.dumps(evaluate(),indent=2))
