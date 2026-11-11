import unittest
from actuation_gate import Gate,evaluate
class TestGate(unittest.TestCase):
    def test_turns(self): self.assertEqual(evaluate()['turns'],8)
    def test_hand_path(self): self.assertAlmostEqual(evaluate()['hand_path_m'],2*3.141592653589793*.019*8)
    def test_speed(self): self.assertEqual(evaluate()['target_s']['2.0']['rpm'],240)
    def test_five_seconds(self): self.assertEqual(evaluate()['target_s']['5.0']['rpm'],96)
    def test_index(self): self.assertAlmostEqual(evaluate()['indexed_step_mm'],1/6)
    def test_guide(self): self.assertAlmostEqual(evaluate()['guide_moment_Nm'],3.3816034482756)
    def test_invalid(self):
        with self.assertRaises(ValueError): evaluate(Gate(lead_mm_per_rev=0))
    def test_lead_sensitivity(self): self.assertEqual(evaluate(Gate(lead_mm_per_rev=2))['turns'],4)
if __name__=='__main__': unittest.main()
