import unittest
from local_hold import LocalStop, PITCH_MM, command, evaluate, pair_overlap_screen


class LocalStopTests(unittest.TestCase):
    def test_start_parked(self):
        self.assertEqual(LocalStop().advance(12).position_mm,0)

    def test_one_pulse_one_step(self):
        self.assertEqual(command(LocalStop(),12).position_mm,PITCH_MM)

    def test_insufficient_payout_not_queued(self):
        stop = LocalStop().pulse_on(1).advance(1).pulse_off()
        self.assertEqual(stop.advance(12).position_mm,0)

    def test_stuck_input_cannot_cycle(self):
        stop = LocalStop().pulse_on(12)
        for _ in range(20):
            stop = stop.advance(12).pulse_on(12)
        self.assertEqual(stop.position_mm,1.5)

    def test_aligned_jam_zero_nominal_motion_after_clear(self):
        state = command(LocalStop(3),12,jam_mm=3)
        self.assertEqual(state.advance(12).position_mm,3)

    def test_intermediate_jam_only_remaining_stroke(self):
        state = command(LocalStop(3),12,jam_mm=3.7)
        self.assertEqual(state.advance(12).position_mm,4.5)

    def test_stale_pulses_do_not_queue(self):
        state = command(LocalStop(3),12,jam_mm=3.7)
        for _ in range(100):
            state = command(state,12,jam_mm=3.7)
        settled = state.advance(12)
        self.assertEqual(settled.advance(12).position_mm,4.5)

    def test_press_during_pending_motion_not_rearmed_at_settling(self):
        state = command(LocalStop(3),12,jam_mm=3.7).pulse_on(12).advance(12)
        self.assertEqual(state.pulse_on(12).advance(12).position_mm,4.5)

    def test_fresh_command_after_settling(self):
        state = command(LocalStop(3),12,jam_mm=3.7).advance(12)
        self.assertEqual(command(state,12).position_mm,6)

    def test_others_can_continue(self):
        states = [LocalStop(3) for _ in range(4)]
        for _ in range(6):
            states = [command(state,12,jam_mm=3.7 if i==0 else None) for i,state in enumerate(states)]
        self.assertEqual([state.position_mm for state in states],[3.7,12,12,12])

    def test_no_overtravel(self):
        self.assertEqual(command(LocalStop(12),12).position_mm,12)

    def test_no_force_no_opening(self):
        self.assertEqual(LocalStop().pulse_on(12).advance(12,opening_force=False).position_mm,0)

    def test_adverse_interlock_overlap(self):
        self.assertAlmostEqual(pair_overlap_screen(2.1,2.55),.825)

    def test_schedule_reaches_twelve(self):
        self.assertEqual(evaluate()["common_nominal_schedule"][-1]["local_mm"],12)

    def test_reject_invalid_input(self):
        with self.assertRaises(ValueError):
            LocalStop().pulse_on(float("nan"))
        with self.assertRaises(ValueError):
            LocalStop(3).advance(12, jam_mm=2)
