import unittest

from common_release import Channel, STEPS, Transfer, max_step_mm, payout, report


class ReleaseTests(unittest.TestCase):
    def test_full_payout(self):
        self.assertEqual(payout(180), 12)

    def test_twelve_monotonic_strokes(self):
        steps = report()["payout_mm"]
        self.assertEqual(len(steps), 13)
        self.assertTrue(all(b > a for a, b in zip(steps, steps[1:])))

    def test_full_handoff_cycle(self):
        state = Transfer()
        for index in range(STEPS):
            self.assertEqual(state.index, index)
            states = [state.latch_drive()]
            states.append(states[-1].unlatch_park())
            states.append(states[-1].swing(7.5))
            states.append(states[-1].swing(15))
            states.append(states[-1].latch_park())
            states.append(states[-1].unlatch_drive())
            states.append(states[-1].reset())
            self.assertTrue(all(p.valid() for p in states))
            state = states[-1]
        self.assertEqual(state.rotor_deg, 180)

    def test_no_park_withdrawal_until_drive_seats(self):
        with self.assertRaises(ValueError):
            Transfer().unlatch_park()

    def test_no_drive_withdrawal_until_park_seats(self):
        with self.assertRaises(ValueError):
            Transfer().latch_drive().unlatch_park().unlatch_drive()

    def test_no_parking_mid_step(self):
        with self.assertRaises(ValueError):
            Transfer().latch_drive().unlatch_park().swing(7.5).latch_park()

    def test_no_extra_swing(self):
        with self.assertRaises(ValueError):
            Transfer().latch_drive().unlatch_park().swing(15.01)

    def test_stop_clearance_bound(self):
        self.assertAlmostEqual(max_step_mm(), 1.552914270615124)
        self.assertGreater(max_step_mm(True), max_step_mm())
        self.assertLess(max_step_mm(True), 1.60)

    def test_one_jam_leaves_other_channels_open(self):
        for jam in range(4):
            channels = [Channel(3.0) if i == jam else Channel() for i in range(4)]
            self.assertEqual([c.travel_mm(12) for c in channels], [3 if i == jam else 12 for i in range(4)])

    def test_jam_clearance_can_use_accumulated_slack(self):
        result = report()
        self.assertEqual(result["if_jam_clears_after_full_command_local_uncontrolled_mm"], 9)
        self.assertGreater(result["if_jam_clears_constant_force_upper_scenario_J"], 3)

    def test_one_line_failure_uses_backup_slack(self):
        self.assertAlmostEqual(Channel(lost_tethers=1, backup_lash_mm=.3).travel_mm(5), 5.3)

    def test_two_line_failure_can_expose_full_travel(self):
        self.assertEqual(Channel(lost_tethers=2).travel_mm(0), 12)

    def test_bias_is_required_to_open(self):
        self.assertEqual(Channel(opening_bias=False).travel_mm(12), 0)

    def test_reject_invalid_commands(self):
        for args in ((-1, Channel()), (0, Channel(lost_tethers=3)), (0, Channel(jam_at_mm=-1))):
            with self.subTest(args=args), self.assertRaises(ValueError):
                args[1].travel_mm(args[0])
