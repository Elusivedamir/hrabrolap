"""Shared millimetre dimensions for the drill template and unloaded CAD."""
from math import cos, hypot, radians, sin

CHEEK_X = (-44.0, 6.5)
CHEEK_Y = (-10.0, 10.0)
MOUNTS_X = (-36.0, -20.0)
FINGER_X = (-8.0, 75.0)
FINGER_Y = (-8.0, 8.0)
TIE_X = (17.0, 23.0, 29.0)
GUIDE_XY = (11.0, -38.0)
BASE_X = (-50.0, 91.0)
BASE_Y = (-49.0, 36.0)
SHEET_THICK_MM = 4.0
PIN_HOLE_R_MM = 1.65
TIE_HOLE_R_MM = 1.0
STUD_GAP_MM = 6.0
MAX_ANGLE_DEG = 60
CORD_R_MM = .45


def anchor(radius_mm, angle_deg):
    theta = radians(angle_deg)
    return radius_mm * cos(theta), -radius_mm * sin(theta)


def cord_measure(radius_mm, angle_deg):
    x, y = anchor(radius_mm, angle_deg)
    dx, dy = GUIDE_XY[0] - x, GUIDE_XY[1] - y
    length = hypot(dx, dy)
    return length, (x * dy - y * dx) / length
