import unittest

from release_model import DESIGN, brake_case, build_report, guide_case, parking_pin_case, screw_torque_Nm, tendon_payout_mm


class ReleaseModelTests(unittest.TestCase):
    def test_upstream_reference_load(self):
        result = build_report()
        self.assertAlmostEqual(result["cases"]["10kg_equal_one_of_four"]["input_tendon_N"], 281.8002873563)
        self.assertAlmostEqual(result["reference_payout_mm"], 6.07374579694)
        self.assertAlmostEqual(result["equal_four_fingers_work_J_if_constant"], 6.84633103, places=5)

    def test_payout_is_limited_by_end_stops(self):
        self.assertEqual([tendon_payout_mm(t) for t in (-1, 0, 2, 8, 9)], [0, 0, 2, 8, 8])

    def test_downstream_jam_still_blocks_joint(self):
        self.assertEqual(tendon_payout_mm(8, distal_jam=True), 0)

    def test_low_friction_can_backdrive(self):
        self.assertLess(screw_torque_Nm(281.8, 0.03, 0), 0)

    def test_threshold_has_zero_payout_torque(self):
        self.assertAlmostEqual(screw_torque_Nm(281.8, build_report()["thread_mu_threshold_collar_mu_0"], 0), 0)

    def test_collar_drag_adds_required_torque(self):
        self.assertGreater(screw_torque_Nm(281.8, 0.12, 0.15), screw_torque_Nm(281.8, 0.12, 0))

    def test_rewind_torque_at_zero_friction(self):
        self.assertAlmostEqual(screw_torque_Nm(100, 0, 0, payout=False), -screw_torque_Nm(100, 0, 0))

    def test_fourfold_load_increases_pin_force_fourfold(self):
        self.assertAlmostEqual(parking_pin_case(1127.2)["ideal_pin_tangent_N"], 4 * parking_pin_case(281.8)["ideal_pin_tangent_N"])

    def test_guide_couple_reacts_offset_load(self):
        guide = guide_case(281.8, 0.25)
        self.assertAlmostEqual(guide["nominal_normal_each_N"] * DESIGN.guide_spacing_mm, 281.8 * 12)
        self.assertAlmostEqual(guide["nominal_drag_N"], 0.5 * guide["nominal_normal_each_N"])

    def test_brake_target_only_covers_screened_bench_case(self):
        self.assertGreater(brake_case(50)["margin_if_target_min_measured_Nm"], 0)
        self.assertLess(brake_case(281.8)["margin_if_target_min_measured_Nm"], 0)

    def test_index_pitch(self):
        self.assertAlmostEqual(build_report()["index_increment_mm_if_catch_engages"], 1 / 6)

    def test_invalid_force_or_friction(self):
        for force, friction in ((-1, 0), (1, -0.01)):
            with self.subTest(force=force, friction=friction), self.assertRaises(ValueError):
                screw_torque_Nm(force, friction, 0)
