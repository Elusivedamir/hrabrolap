"""Unloaded spool cable-termination packaging screen; not a strength rating."""
import math
from dataclasses import dataclass

@dataclass(frozen=True)
class Case:
    stroke_mm: float = 21.7613901229636
    hub_radius_mm: float = 5.0
    cable_diameter_mm: float = 1.2
    reserve_angle_deg: float = 30.0
    anchor_sector_deg: float = 60.0
    guard_sector_deg: float = 15.0

def screen(c: Case):
    if min(c.stroke_mm, c.hub_radius_mm, c.cable_diameter_mm) <= 0:
        raise ValueError('lengths must be positive')
    if not (0 <= c.reserve_angle_deg < 360 and 0 <= c.anchor_sector_deg < 360 and 0 <= c.guard_sector_deg < 360):
        raise ValueError('invalid angle')
    effective_radius = c.hub_radius_mm + c.cable_diameter_mm / 2
    sweep_deg = math.degrees(c.stroke_mm / effective_radius)
    occupied_deg = sweep_deg + c.reserve_angle_deg + c.anchor_sector_deg + c.guard_sector_deg
    return dict(effective_radius_mm=effective_radius, sweep_deg=sweep_deg,
                occupied_deg=occupied_deg, margin_deg=360-occupied_deg,
                geometrically_feasible=occupied_deg <= 360,
                bend_D_over_d=2*effective_radius/c.cable_diameter_mm)

if __name__ == '__main__':
    for r in (4, 5, 6, 8):
        c=Case(hub_radius_mm=r)
        v=screen(c)
        print(f'Rhub={r} mm: sweep={v["sweep_deg"]:.2f} deg, margin={v["margin_deg"]:.2f} deg, pass={v["geometrically_feasible"]}')
