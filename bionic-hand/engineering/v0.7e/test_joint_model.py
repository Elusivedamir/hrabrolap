import unittest

from joint_model import DESIGN, analyze, angle_from_stroke, backdrive_Nm, follower, gate_force, open_with_jam, stroke


class JointTests(unittest.TestCase):
    def test_twelve_mm_travel(self):
        self.assertAlmostEqual(stroke(60), 12)

    def test_accepts_rounded_maximum_travel(self):
        self.assertAlmostEqual(angle_from_stroke(12.0), 60)

    def test_twice_half_travel(self):
        self.assertAlmostEqual(stroke(30) * 2, stroke(60))

    def test_geometry_inverts(self):
        for angle in range(61):
            self.assertAlmostEqual(angle_from_stroke(stroke(angle)), angle)

    def test_gate_advance_monotonic(self):
        self.assertTrue(all(stroke(a + 1) > stroke(a) for a in range(60)))

    def test_frozen_drive_opens_at_all_angles(self):
        for frozen in range(61):
            self.assertAlmostEqual(open_with_jam(frozen, stroke(frozen) / DESIGN.pitch_mm), 0)

    def test_no_negative_overtravel_in_model(self):
        self.assertEqual(open_with_jam(15, 200), 0)

    def test_locked_gate_does_not_open(self):
        self.assertAlmostEqual(open_with_jam(45, 0), 45)

    def test_force_agrees_with_virtual_work(self):
        dt = 1e-4
        displacement_per_rad_mm = (stroke(35 + dt) - stroke(35 - dt)) / (2 * dt * 3.141592653589793 / 180)
        self.assertAlmostEqual(gate_force(1.0, 35) * displacement_per_rad_mm / 1000, 1, places=7)

    def test_symmetric_peak_force(self):
        self.assertAlmostEqual(gate_force(1, 0), gate_force(1, 60))
        self.assertGreater(gate_force(1, 0), gate_force(1, 30))

    def test_worst_share_exceeds_assumed_brake(self):
        cases = analyze()["scenarios"]
        self.assertGreater(cases["equal_10kg_one_finger"]["margin_if_brake_min_measured_Nm"], 0)
        self.assertLess(cases["full_10kg_one_finger"]["margin_if_brake_min_measured_Nm"], 0)

    def test_invalid_geometry(self):
        with self.assertRaises(ValueError):
            follower(61)

    def test_brake_force_to_torque_scaling(self):
        self.assertAlmostEqual(backdrive_Nm(200), backdrive_Nm(100) * 2)
