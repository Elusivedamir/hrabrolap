import unittest
from hatch_screen import *
class ScreenTests(unittest.TestCase):
    def test_intersect(self):
        self.assertTrue(intersects(Box(0,1,0,1,0,1),Box(.5,1.5,.5,1.5,.5,1.5)))
    def test_touch_not_intersect(self):
        self.assertFalse(intersects(Box(0,1,0,1,0,1),Box(1,2,0,1,0,1)))
    def test_clearance(self):
        self.assertTrue(intersects(Box(0,1,0,1,0,1),Box(1.2,2,0,1,0,1),.3))
    def test_invalid_box(self):
        with self.assertRaises(ValueError): Box(1,1,0,1,0,1)
    def test_negative_clearance(self):
        with self.assertRaises(ValueError): intersects(Box(0,1,0,1,0,1),Box(2,3,0,1,0,1),-1)
    def test_tool_dimensions(self):
        b=dorsal_tool_box(0,0,25,20)
        self.assertEqual((b.xmin,b.xmax,b.zmin,b.zmax),(-3.5,3.5,5,25))
    def test_tool_invalid(self):
        with self.assertRaises(ValueError): dorsal_tool_box(0,0,25,0)
    def test_hatch_width(self): self.assertEqual(hatch_width(),7.)
    def test_hatch_invalid(self):
        with self.assertRaises(ValueError): hatch_width(-1,6)
    def test_width_8_fails(self):self.assertEqual(outer_hatch_margin(8),-2.)
    def test_width_10_boundary(self):self.assertEqual(outer_hatch_margin(10),0.)
    def test_width_12_positive(self):self.assertEqual(outer_hatch_margin(12),2.)
    def test_hatch_negative(self):
        with self.assertRaises(ValueError):outer_hatch_margin(0)
    def test_sweep_blocked(self):
        t=dorsal_tool_box(0,0,25,20)
        self.assertFalse(sweep_clearance(t,[Box(-3,3,3,9,11.4,12.3)]))
    def test_sweep_clear(self):
        t=dorsal_tool_box(0,0,25,20)
        self.assertTrue(sweep_clearance(t,[Box(6,9,-7,7,0,25)]))
    def test_sweep_empty(self):
        self.assertTrue(sweep_clearance(dorsal_tool_box(0,0,25,20),[]))
if __name__=='__main__':unittest.main()
