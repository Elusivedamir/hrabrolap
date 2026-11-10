#!/usr/bin/env python3
"""Dependency-free regression tests for v0.5e tendon geometry feasibility study."""
import math, unittest
from thumb_flex_study_v05e import P, DEG, length_at, effective_moment_arm, cable_y_in_boot_x, run

class StudyTest(unittest.TestCase):
    def test_length_at_rest_is_24mm(self):
        for y in P['tendon_lateral_y_candidates_mm']:
            self.assertAlmostEqual(length_at(0,y),24.,places=9)

    def test_effective_arm_equals_numerical_derivative(self):
        h=0.0002
        for y in P['tendon_lateral_y_candidates_mm']:
            for angle in range(0,21,2):
                deriv=-(length_at(angle+h,y)-length_at(angle-h,y))/(2*h*DEG)
                self.assertAlmostEqual(effective_moment_arm(angle,y),deriv,places=5)

    def test_winding_positive_for_flexion(self):
        for y in P['tendon_lateral_y_candidates_mm']:
            self.assertGreater(length_at(0,y)-length_at(20,y),0)

    def test_conflict_at_y7(self):
        self.assertGreater(cable_y_in_boot_x(20,7)[1],7)

    def test_no_candidate_passes_proxy_criteria(self):
        report=run()
        self.assertEqual(report['accepted_candidates'],[])
        self.assertEqual(report['status'],'GEOMETRY_ROUTE_CONFLICT_NOT_BUILD_READY')
        self.assertTrue(all(len(x['samples'])==8 for x in report['candidates']))

if __name__=='__main__': unittest.main()
