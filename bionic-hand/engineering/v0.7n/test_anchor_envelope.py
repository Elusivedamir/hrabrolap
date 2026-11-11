import unittest
from anchor_envelope import *
class TestEnvelope(unittest.TestCase):
    def test_sweep(self): self.assertAlmostEqual(sweep(hub_radius=5),222.653,places=2)
    def test_r4_reject(self): self.assertLess(angular_margin(4),0)
    def test_r5_angle(self): self.assertGreater(angular_margin(5),0)
    def test_r6_angle(self): self.assertGreater(angular_margin(6),0)
    def test_r8_angle(self): self.assertGreater(angular_margin(8),0)
    def test_head_nominal(self): self.assertAlmostEqual(head_clearance(7.4),0)
    def test_head_tight(self): self.assertLess(head_clearance(7),0)
    def test_stack(self): self.assertAlmostEqual(axial_stack(),9.6)
    def test_z_fail(self): self.assertLess(verdict(5,8,9)['axial_margin_mm'],0)
    def test_z_pass(self): self.assertTrue(verdict(5,8,10)['screen_pass'])
    def test_bad_radius(self):
        with self.assertRaises(ValueError): sweep(hub_radius=0)
    def test_bad_sector(self):
        with self.assertRaises(ValueError): angular_margin(5,guard=-1)
    def test_bad_head(self):
        with self.assertRaises(ValueError): head_clearance(8,positioning_error=-1)
if __name__=='__main__': unittest.main()
