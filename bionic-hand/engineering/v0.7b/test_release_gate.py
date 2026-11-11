import unittest
from release_gate import Scenario,compute,gate
class GateTests(unittest.TestCase):
 def test_load(self):self.assertAlmostEqual(compute(Scenario())['load_N'],98.0665)
 def test_share(self):self.assertAlmostEqual(compute(Scenario())['per_finger_N'],24.516625)
 def test_torque(self):self.assertAlmostEqual(compute(Scenario())['torque_per_mcp_Nm'],.980665)
 def test_travel(self):self.assertAlmostEqual(compute(Scenario())['travel_mm'],6.07374579694,places=5)
 def test_efficiency(self):self.assertGreater(compute(Scenario(efficiency=.4))['cable_tension_per_finger_N'],compute(Scenario(efficiency=.8))['cable_tension_per_finger_N'])
 def test_self_lock(self):self.assertEqual(gate(True,False,False,True,False),'BLOCKED_SELF_LOCKING')
 def test_inaccessible(self):self.assertEqual(gate(True,False,True,False,False),'BLOCKED_SELF_LOCKING')
 def test_accessible(self):self.assertEqual(gate(True,False,True,True,False),'POSSIBLE_NOT_PROVEN')
 def test_jam(self):self.assertEqual(gate(True,True,True,True,True),'BLOCKED_JAM')
 def test_backdrive(self):self.assertEqual(gate(True,True,False,False,False),'POSSIBLE_NOT_PROVEN')
 def test_scope(self):self.assertEqual(gate(False,True,True,True,False),'OUT_OF_SCOPE')
 def test_invalid(self):
  with self.assertRaises(AssertionError):compute(Scenario(efficiency=0))
if __name__=='__main__':unittest.main()
