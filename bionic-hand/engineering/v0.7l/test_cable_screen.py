import unittest
from math import pi
from cable_screen import screen, STROKE_MM

class TestScreen(unittest.TestCase):
    def test_centerline(self): self.assertAlmostEqual(screen(10,1.2,5)["centerline_radius_mm"],5.6)
    def test_turn(self): self.assertAlmostEqual(screen(2*pi*5.6,1.2,5)["turns"],1)
    def test_under_one_turn(self): self.assertTrue(screen(STROKE_MM,1.2,5)["single_turn_geometrically_possible"])
    def test_bend_ratio(self): self.assertAlmostEqual(screen(10,1.2,5)["bend_D_over_d"],11.2/1.2)
    def test_channel(self): self.assertAlmostEqual(screen(10,1.2,5)["nominal_channel_width_mm"],3.2)
    def test_zero(self):
        with self.assertRaises(ValueError): screen(0,1.2,5)
    def test_nan(self):
        with self.assertRaises(ValueError): screen(float("nan"),1.2,5)
    def test_negative_clearance(self):
        with self.assertRaises(ValueError): screen(10,1.2,5,-1)
    def test_hub_is_not_centerline(self): self.assertGreater(screen(10,1.2,5)["centerline_radius_mm"],5)
    def test_angle(self): self.assertAlmostEqual(screen(2*pi*5.6,1.2,5)["swept_angle_deg"],360)

if __name__ == "__main__": unittest.main()
