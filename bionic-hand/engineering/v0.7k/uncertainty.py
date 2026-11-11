"""v0.7k independent sensitivity screen; model only, not physical motor validation."""
import math
from dataclasses import dataclass

@dataclass(frozen=True)
class Motor:
    name: str
    rpm: float
    stall_kgfcm: float

MOTORS=(Motor("Pololu 5139",220,0.94),Motor("Pololu 5141",150,1.30))
KGFCM_NM=0.0980665

def screen(stroke_mm,force_N,radius_mm,motor,reserve=1.5,derate=0.8,seconds=1.5,torque_fraction=0.25):
    vals=(stroke_mm,force_N,radius_mm,reserve,derate,seconds,torque_fraction,motor.rpm,motor.stall_kgfcm)
    if any(not math.isfinite(v) for v in vals) or stroke_mm<=0 or force_N<0 or radius_mm<=0 or reserve<1 or not 0<derate<=1 or seconds<=0 or not 0<torque_fraction<1 or motor.rpm<=0 or motor.stall_kgfcm<=0:
        raise ValueError("invalid screening parameter")
    torque=force_N*radius_mm/1000*reserve
    stall=motor.stall_kgfcm*KGFCM_NM
    fraction=torque/stall
    mean_rpm=60*stroke_mm/(seconds*2*math.pi*radius_mm)
    peak_rpm=2*mean_rpm
    available_rpm=max(0,derate*motor.rpm*(1-fraction))
    return dict(motor=motor.name,stroke_mm=stroke_mm,force_N=force_N,radius_mm=radius_mm,torque_Nm=torque,stall_fraction=fraction,mean_rpm=mean_rpm,triangular_peak_rpm=peak_rpm,linear_model_available_rpm=available_rpm,torque_pass=fraction<=torque_fraction,speed_pass=available_rpm>=peak_rpm,conditional_pass=fraction<=torque_fraction and available_rpm>=peak_rpm)

def grid():
    return [screen(21.7613901229636,f,r,m) for f in (1,2,3,4) for r in (5,6,7,8) for m in MOTORS]

if __name__=="__main__":
    import json
    print(json.dumps({"status":"MODEL_ONLY_NO_MEASUREMENTS","cases":grid()},indent=2))
