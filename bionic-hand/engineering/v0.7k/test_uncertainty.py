import unittest
from uncertainty import screen,grid,MOTORS
class ScreeningTests(unittest.TestCase):
    def test_grid(self): self.assertEqual(len(grid()),32)
    def test_zero_force(self): self.assertEqual(screen(21,0,6,MOTORS[0])["torque_Nm"],0)
    def test_radius_increases_torque(self): self.assertGreater(screen(21,3,8,MOTORS[0])["torque_Nm"],screen(21,3,6,MOTORS[0])["torque_Nm"])
    def test_radius_reduces_rpm(self): self.assertLess(screen(21,3,8,MOTORS[0])["mean_rpm"],screen(21,3,6,MOTORS[0])["mean_rpm"])
    def test_force_increases_fraction(self): self.assertGreater(screen(21,4,6,MOTORS[0])["stall_fraction"],screen(21,2,6,MOTORS[0])["stall_fraction"])
    def test_5141_3n_r6(self): self.assertTrue(screen(21.7613901229636,3,6,MOTORS[1])["conditional_pass"])
    def test_5139_3n_r6(self): self.assertFalse(screen(21.7613901229636,3,6,MOTORS[0])["conditional_pass"])
    def test_5141_4n_r6(self): self.assertFalse(screen(21.7613901229636,4,6,MOTORS[1])["conditional_pass"])
    def test_nan(self):
        with self.assertRaises(ValueError):screen(float("nan"),1,6,MOTORS[0])
    def test_negative(self):
        with self.assertRaises(ValueError):screen(21,-1,6,MOTORS[0])
    def test_bad_radius(self):
        with self.assertRaises(ValueError):screen(21,1,0,MOTORS[0])
    def test_worse_derate(self): self.assertLess(screen(21,2,6,MOTORS[1],derate=.6)["linear_model_available_rpm"],screen(21,2,6,MOTORS[1],derate=.8)["linear_model_available_rpm"])
if __name__=="__main__":unittest.main()
