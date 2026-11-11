"""Analytical emergency-release gate. Not hardware qualification. Python 3 stdlib."""
from dataclasses import dataclass
from math import pi
G=9.80665
@dataclass(frozen=True)
class Scenario:
    mass_kg:float=10
    finger_count:int=4
    lever_m:float=.04
    drum_m:float=.0058
    efficiency:float=.6
    close_time_s:float=1.5
    angle_deg:float=60
def compute(s:Scenario):
    assert s.mass_kg>0 and s.finger_count>0 and s.lever_m>0 and s.drum_m>0
    assert 0<s.efficiency<=1 and s.close_time_s>0 and 0<s.angle_deg<=180
    load=s.mass_kg*G
    per=load/s.finger_count
    torque=per*s.lever_m
    tension=torque/(s.drum_m*s.efficiency)
    travel=s.drum_m*s.angle_deg*pi/180
    return dict(load_N=load,per_finger_N=per,torque_per_mcp_Nm=torque,cable_tension_per_finger_N=tension,travel_mm=travel*1000,cable_speed_mm_s=travel*1000/s.close_time_s)
def gate(power_off,gear_backdrivable,manual_disengagement,release_accessible,cable_jammed):
    if not power_off:return 'OUT_OF_SCOPE'
    if cable_jammed:return 'BLOCKED_JAM'
    if gear_backdrivable:return 'POSSIBLE_NOT_PROVEN'
    if manual_disengagement and release_accessible:return 'POSSIBLE_NOT_PROVEN'
    return 'BLOCKED_SELF_LOCKING'
if __name__=='__main__':
    from json import dumps
    print(dumps(compute(Scenario()),indent=2))
