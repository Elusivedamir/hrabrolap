import unittest
from anchor_screen import Case, screen

class TestScreen(unittest.TestCase):
    def test_reference_centerline(self): self.assertAlmostEqual(screen(Case())['effective_radius_mm'],5.6)
    def test_reference_sweep(self): self.assertAlmostEqual(screen(Case())['sweep_deg'],222.615,delta=.1)
    def test_margin(self): self.assertAlmostEqual(screen(Case())['margin_deg'],32.385,delta=.1)
    def test_positive(self): self.assertTrue(screen(Case())['geometrically_feasible'])
    def test_small_hub_rejected(self): self.assertFalse(screen(Case(hub_radius_mm=3))['geometrically_feasible'])
    def test_increasing_hub_reduces_sweep(self): self.assertLess(screen(Case(hub_radius_mm=8))['sweep_deg'],screen(Case())['sweep_deg'])
    def test_zero_stroke_invalid(self):
        with self.assertRaises(ValueError): screen(Case(stroke_mm=0))
    def test_negative_cable_invalid(self):
        with self.assertRaises(ValueError): screen(Case(cable_diameter_mm=-1))
    def test_invalid_sector(self):
        with self.assertRaises(ValueError): screen(Case(anchor_sector_deg=360))
    def test_large_anchor_rejected(self): self.assertFalse(screen(Case(anchor_sector_deg=120))['geometrically_feasible'])
    def test_ratio(self): self.assertAlmostEqual(screen(Case())['bend_D_over_d'],9.333333333333334)
    def test_boundary(self):
        c=Case(reserve_angle_deg=0,anchor_sector_deg=0,guard_sector_deg=0)
        self.assertGreater(screen(c)['margin_deg'],0)

if __name__=='__main__': unittest.main()
