#!/usr/bin/env python3
"""Regression suite: previously omitted tendon must fail old capstan."""
import unittest
from cable_sweep_v06b import reel, cable_segments, intersection_sum

class CableSweepRegression(unittest.TestCase):
    def test_new_reel_solids_are_valid(self):
        for a in (0,15,30,45,60):
            self.assertEqual(len(reel(a,2.8).Solids()),1)
            self.assertTrue(reel(a,2.8).isValid())
    def test_original_reel_hits_the_added_cable_at_60(self):
        self.assertGreater(intersection_sum(cable_segments(60),reel(60,5.2)),3.9)
    def test_slim_reel_avoids_sampled_cable_at_60(self):
        self.assertLessEqual(intersection_sum(cable_segments(60),reel(60,2.8)),.02)
    def test_bolt_hole_nominal_web_is_only_1p15mm(self):
        self.assertAlmostEqual(2.8-1.65,1.15)
    def test_centerline_rope_is_tangent_to_ideal_disc(self):
        self.assertAlmostEqual(5.8-.6,5.2)

if __name__=='__main__':unittest.main(verbosity=2)
