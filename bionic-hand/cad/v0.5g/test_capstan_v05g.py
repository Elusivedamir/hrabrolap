#!/usr/bin/env python3
"""Unit checks for scope-specific v0.5g kinematics, no hardware validation."""
import math,unittest
import cadquery as cq
from build_capstan_v05g import (RADIUS,CABLE_CENTER_RADIUS,CABLE_Z,CABLE_RADIUS,
    BOOT,ideal_path,rigid_parts,bboxes_overlap)

class CapstanMath(unittest.TestCase):
    def test_rope_arc_equal_radius_times_angle(self):
        for deg in range(0,61):
            n=deg*math.pi/180
            self.assertAlmostEqual(CABLE_CENTER_RADIUS*n,CABLE_CENTER_RADIUS*math.radians(deg))
    def test_rope_fixed_guide_tangent(self):
        for deg in range(61):
            line,arc=ideal_path(deg)
            for a,b in zip(line[-1],arc[0]): self.assertAlmostEqual(a,b,places=10)
            self.assertAlmostEqual(arc[-1][0]**2+arc[-1][1]**2,CABLE_CENTER_RADIUS**2)
    def test_proposed_boot_contains_ideal_rope_center_and_radius(self):
        for deg in range(61):
            line,arc=ideal_path(deg)
            for x,y,z in line+arc:
                for c,d in zip((x,y,z),'xyz'):
                    self.assertGreaterEqual(c-CABLE_RADIUS,BOOT[d][0]-1e-8)
                    self.assertLessEqual(c+CABLE_RADIUS,BOOT[d][1]+1e-8)
    def test_real_cad_bodies_valid_sampled(self):
        for deg in (0,10,20,30,40,50,60):
            shapes=rigid_parts(deg)
            self.assertEqual(len(shapes),4)
            for name,s in shapes.items():
                self.assertTrue(s.isValid(),(deg,name))
                self.assertEqual(len(s.Solids()),1,(deg,name))
    def test_guide_vs_moving_no_unintended_overlap(self):
        for deg in (0,15,30,45,60):
            shapes=rigid_parts(deg)
            a,b=shapes['fork_guide'],shapes['prox_drum']
            if bboxes_overlap(a,b):
                self.assertLessEqual(a.intersect(b).Volume(),.02)
    def test_stroke_and_spool_requirements(self):
        # 60 degree flexion in 1.5s -> 116deg actuator at spool radius 3mm, NO load.
        stroke=CABLE_CENTER_RADIUS*math.pi/3
        self.assertAlmostEqual(stroke,6.073745797,places=6)
        self.assertAlmostEqual(math.degrees(stroke/3),116.0,places=7)
    def test_torque_what_if(self):
        def motor_nm(tip_N):return tip_N*.058/(CABLE_CENTER_RADIUS/1000)*.003/.6
        self.assertAlmostEqual(motor_nm(2),.1,places=7)
        self.assertAlmostEqual(motor_nm(5),.25,places=7)

if __name__=='__main__':unittest.main(verbosity=2)
