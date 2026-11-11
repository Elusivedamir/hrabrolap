from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from sizing import V07I_TRAVEL_MM, analyze_trials, example, screen


class ScreenTests(unittest.TestCase):
    def test_full_stroke_speed_at_six_mm(self):
        self.assertAlmostEqual(screen(V07I_TRAVEL_MM, 2)[0]["mean_rpm"],23.08955,places=4)

    def test_torque_uses_force_radius_and_reserve(self):
        self.assertAlmostEqual(screen(22,2)[0]["torque_with_reserve_Nm"],.018)

    def test_four_newton_rejects_both_reference_models(self):
        self.assertTrue(all(not r["conditional_pass"] for r in screen(22,4)))

    def test_three_newton_passes_only_150_at_six_mm(self):
        self.assertEqual([r["conditional_pass"] for r in screen(22,3)],[False,True,False,False])

    def test_high_speed_does_not_pass(self):
        self.assertTrue(all(not r["speed_screen"] for r in screen(100,0,.1)))

    def test_negative_and_nonfinite(self):
        for args in ((22,-1),(0,1),(22,float("nan")),(22,1,0)):
            with self.subTest(args=args),self.assertRaises(ValueError):
                screen(*args)

    def test_missing_trials(self):
        with self.assertRaises(ValueError):
            analyze_trials(Path(__file__).with_name("measurements.csv"))

    def test_duplicate_trial_rejected(self):
        with TemporaryDirectory() as d:
            path=Path(d)/"trials.csv"
            path.write_text("run,stroke_mm,peak_force_N,duration_s\n1,22,2,1.5\n1,21,2,1.6\n3,23,2,1.5\n")
            with self.assertRaises(ValueError):
                analyze_trials(path)

    def test_measured_uses_worst_values_independently(self):
        with TemporaryDirectory() as d:
            path=Path(d)/"trials.csv"
            path.write_text("run,stroke_mm,peak_force_N,duration_s\n1,22,2,1.5\n2,21,3,1.6\n3,23,2,1.5\n")
            r=analyze_trials(path)
            self.assertEqual((r["max_stroke_mm"],r["max_peak_force_N"]),(23,3))
            self.assertEqual(r["max_stroke_spread_mm"],2)

    def test_example_discloses_no_measurements(self):
        self.assertIn("NO_PHYSICAL_MEASUREMENTS",example()["status"])
