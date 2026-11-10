#!/usr/bin/env python3
"""v0.5e: reproducible LOCAL 2D tendon-route screening, not full-hand CAD.

A moving tendon anchor and a fixed guide co-rotate with the CMC clevis.
The actual 3D thumb from v0.5d is not imported or claimed collision-free.
No purchased motor, shell, cable termination, Bowden entry, emergency release,
or IP seal is represented. Numbers above 20 deg are exploratory only.
Run: python thumb_flex_study_v05e.py
"""
from __future__ import annotations
import json, math
from pathlib import Path

DEG = math.pi / 180.0
# Design hypotheses in mm, not production dimensions.
P = {
    "palm_mm": [122, 85],
    "thumb_phalanges_mm": [33, 25],
    "mcp_offset_along_cmc_mm": 14,
    "mcp_previous_sampled_deg": [0, 20],
    "mcp_exploratory_deg": [0, 60],
    "boot_keepout_local_mm": {"x": [-16, 7], "y": [-7, 7], "z": [-10, 10]},
    "guide_x_mm": -12,
    "anchor_x_mm": 12,
    "tendon_lateral_y_candidates_mm": [5, 6, 7, 8],
    "proxy_eye_radius_mm": 6.25,
    "proxy_eye_clearance_mm": 0.75,
    "spool_radius_hypothesis_mm": 3,
    "drivetrain_efficiency_hypothesis": 0.6,
    "tip_moment_arm_conservative_mm": 58,
    "target_tip_force_study_N": [2, 5, 10],
    "open_or_close_time_target_s": 1.5,
    "mg90s_stall_torque_comparison_only_Nm": 0.1765,
}

def point_rotated(angle_deg: float, x: float, y: float) -> tuple[float, float]:
    a = angle_deg * DEG
    return (x * math.cos(a) - y * math.sin(a),
            x * math.sin(a) + y * math.cos(a))

def length_at(angle_deg: float, y: float) -> float:
    ax, ay = point_rotated(angle_deg, P["anchor_x_mm"], y)
    return math.hypot(ax - P["guide_x_mm"], ay - y)

def effective_moment_arm(angle_deg: float, y: float) -> float:
    """-dL/dtheta, mm/rad, positive for flexion tendon winding."""
    a = angle_deg * DEG
    x, yy = P["anchor_x_mm"], y
    ax, ay = point_rotated(angle_deg, x, yy)
    gx = P["guide_x_mm"]
    dx, dy = ax - gx, ay - y
    dax = -x * math.sin(a) - yy * math.cos(a)
    day = x * math.cos(a) - yy * math.sin(a)
    L = math.hypot(dx, dy)
    if L < 1e-9:
        raise ValueError("degenerate tendon geometry")
    return -(dx * dax + dy * day) / L

def cable_span(angle_deg: float, y: float) -> tuple[tuple[float,float], tuple[float,float]]:
    return ((P["guide_x_mm"], y), point_rotated(angle_deg, P["anchor_x_mm"], y))

def closest_distance_origin(a: tuple[float,float], b: tuple[float,float]) -> float:
    dx, dy = b[0]-a[0], b[1]-a[1]
    t = max(0., min(1., -(a[0]*dx + a[1]*dy)/(dx*dx+dy*dy)))
    return math.hypot(a[0]+t*dx, a[1]+t*dy)

def cable_y_in_boot_x(angle_deg: float, y: float) -> tuple[float,float]:
    (gx, gy), (ax, ay) = cable_span(angle_deg,y)
    a, b = P["boot_keepout_local_mm"]["x"]
    ts = [0.0,1.0]
    if abs(ax-gx)>1e-9:
        ts += [(a-gx)/(ax-gx),(b-gx)/(ax-gx)]
    ts = [t for t in ts if 0 <= t <= 1 and a-1e-9 <= gx+t*(ax-gx) <= b+1e-9]
    if not ts:
        return (float("nan"),float("nan"))
    vals=[gy+t*(ay-gy) for t in ts]
    return min(vals),max(vals)

def run():
    rows=[]
    for y in P["tendon_lateral_y_candidates_mm"]:
        samples=[]
        for angle in (0,5,10,15,20,30,45,60):
            p,q=cable_span(angle,y)
            ymax=cable_y_in_boot_x(angle,y)[1]
            samples.append({
                "mcp_deg":angle,
                "path_straight_length_mm":round(length_at(angle,y),5),
                "tendon_wind_mm":round(length_at(0,y)-length_at(angle,y),5),
                "effective_moment_arm_mm":round(effective_moment_arm(angle,y),5),
                "closest_to_mcp_axis_mm":round(closest_distance_origin(p,q),5),
                "max_y_in_boot_x_mm":round(ymax,5),
                "boot_y_limit_exceeded":ymax>P["boot_keepout_local_mm"]["y"][1]+1e-9,
                "beyond_v05d_checked_MCP":angle>20,
            })
        min_arm=min(s["effective_moment_arm_mm"] for s in samples if s["mcp_deg"]<=20)
        max_wind=max(s["tendon_wind_mm"] for s in samples if s["mcp_deg"]<=20)
        eye_clearance=all(s["closest_to_mcp_axis_mm"] >=
                          P["proxy_eye_radius_mm"]+P["proxy_eye_clearance_mm"]
                          for s in samples if s["mcp_deg"]<=20)
        boot_fit=all(not s["boot_y_limit_exceeded"] for s in samples if s["mcp_deg"]<=20)
        forces={}
        for f in P["target_tip_force_study_N"]:
            tendon_N=f*P["tip_moment_arm_conservative_mm"]/min_arm
            motor_Nm=(tendon_N * P["spool_radius_hypothesis_mm"] / 1000.0 /
                      P["drivetrain_efficiency_hypothesis"])
            forces[str(f)]={"required_tendon_N":round(tendon_N,4),
                            "required_motor_Nm":round(motor_Nm,5),
                            "MG90S_stall_exceeded": motor_Nm>P["mg90s_stall_torque_comparison_only_Nm"]}
        rows.append({"guide_and_anchor_y_mm":y,"samples":samples,
            "min_effective_arm_0_to_20_mm":round(min_arm,5),
            "max_straight_cable_wind_0_to_20_mm":round(max_wind,5),
            "spool_rotation_0_to_20_deg":round(max_wind/P["spool_radius_hypothesis_mm"]/DEG,4),
            "spool_rpm_for_1p5s_0_to_20":round((max_wind/P["spool_radius_hypothesis_mm"])/(2*math.pi)/P["open_or_close_time_target_s"]*60,5),
            "clear_of_proxy_eye_0_to_20":eye_clearance,
            "within_previous_boot_y_0_to_20":boot_fit,
            "passes_both_proxy_checks":eye_clearance and boot_fit,
            "force_study":forces})
    report={"version":"v0.5e","study":"2D straight tendon route screening co-rotating with CMC; NOT 3D full-assembly CAD",
     "input":P,"candidates":rows,"accepted_candidates":[r["guide_and_anchor_y_mm"] for r in rows if r["passes_both_proxy_checks"]],
     "result":"No candidate passes BOTH conservative eye clearance and existing stationary boot Y envelope across 0-20 degrees",
     "status":"GEOMETRY_ROUTE_CONFLICT_NOT_BUILD_READY",
     "limitations":[
      "No CadQuery collision audit run against v0.5d complete 25-body assembly",
      "Eye obstacle is a radius proxy, not real thumb proximal geometry",
      "Boot is an old reserved rectangular keepout, not fitted seal: crossing is a packaging warning, not proof of physical interference",
      "Cable is a straight ideal segment and may actually need pulley, sheath, offset plane or guide changes",
      "The CMC rotating wire/sheath transfer and 3D guide bracket are absent",
      "Cannot infer ability to actuate thumb IP; IP remains prescribed",
      "0-60 degree numbers are exploratory, v0.5d only checks 0-20 at selected poses",
      "0.6 efficiency, motor spool, contact forces are what-if assumptions",
      "MG90S stall torque is not continuous torque; do NOT approve any motor from these figures",
      "No thermal, strength, water ingress, loaded 1.5s, 10kg, EMG or hardware tests"]}
    dest=Path(__file__).with_name("route_study_v05e.json")
    dest.write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print("Route candidates",len(rows),"accepted",report["accepted_candidates"])
    for r in rows:
        print("y",r["guide_and_anchor_y_mm"],"eye",r["clear_of_proxy_eye_0_to_20"],
              "boot",r["within_previous_boot_y_0_to_20"],
              "wind",r["max_straight_cable_wind_0_to_20_mm"])
    return report

if __name__=='__main__':
    run()
