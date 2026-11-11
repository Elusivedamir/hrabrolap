"""v0.7l: geometric spool/cable screening only; NOT a strength or wear rating."""
from math import pi, isfinite

STROKE_MM = 21.7613901229636  # CAD-derived v0.7j, NOT measured

def screen(stroke_mm, cable_d_mm, hub_radius_mm, flange_clearance_mm=1.0):
    vals = (stroke_mm, cable_d_mm, hub_radius_mm, flange_clearance_mm)
    if not all(isfinite(x) for x in vals) or min(vals[:3]) <= 0 or flange_clearance_mm < 0:
        raise ValueError("invalid dimensions")
    center_radius = hub_radius_mm + cable_d_mm / 2
    turns = stroke_mm / (2*pi*center_radius)
    return {
        "centerline_radius_mm": center_radius,
        "turns": turns,
        "single_turn_geometrically_possible": turns <= 1,
        "nominal_channel_width_mm": cable_d_mm + 2*flange_clearance_mm,
        "bend_D_over_d": 2*center_radius/cable_d_mm,
        "swept_angle_deg": turns*360,
        "free_angle_deg": 360*(1-turns),
    }

if __name__ == "__main__":
    for d in (0.8, 1.2, 1.5):
        for hub in (4, 5, 6, 8):
            print(d, hub, screen(STROKE_MM, d, hub))
