"""Conservative independent envelope screen. Millimetres; not CAD or strength approval."""
import math

def sweep(stroke=21.7613901229636, hub_radius=5., cable_d=1.2):
    if min(stroke,hub_radius,cable_d)<=0: raise ValueError('positive dimensions required')
    return math.degrees(stroke/(hub_radius+cable_d/2))

def angular_margin(hub_radius, stroke=21.7613901229636, cable_d=1.2, reserve=30, access=60, guard=15):
    if min(reserve,access,guard)<0: raise ValueError('nonnegative sectors required')
    return 360-sweep(stroke,hub_radius,cable_d)-reserve-access-guard

def head_clearance(slot_width, head_diameter=5.4, positioning_error=0.5, clearance=0.5):
    if min(slot_width,head_diameter)<0 or positioning_error<0 or clearance<0: raise ValueError('invalid dimensions')
    return slot_width-(head_diameter+2*(positioning_error+clearance))

def axial_stack(plate=2., washer=0.8, head=3., both_sides=True):
    if min(plate,washer,head)<=0: raise ValueError('positive dimensions required')
    return plate+(2 if both_sides else 1)*(washer+head)

def verdict(hub,slot,available_z):
    return {'hub_R_mm':hub,'angular_margin_deg':round(angular_margin(hub),3), 'head_slot_margin_mm':round(head_clearance(slot),3), 'stack_mm':axial_stack(), 'axial_margin_mm':round(available_z-axial_stack(),3), 'screen_pass':angular_margin(hub)>=0 and head_clearance(slot)>=0 and available_z>=axial_stack()}

if __name__=='__main__':
    for r in (4,5,6,8): print(verdict(r,7.0,9.0))
