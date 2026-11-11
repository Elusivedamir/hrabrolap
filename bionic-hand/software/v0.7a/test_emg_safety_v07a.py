#!/usr/bin/env python3
import unittest
from emg_safety_state_v07a import SafetyIntent,State,Input

class SafetyTests(unittest.TestCase):
    def setUp(self):self.s=SafetyIntent()
    def ready(self):
        for _ in range(25):out=self.s.tick(Input(enable_switch=True))
        self.assertEqual(out.state,State.READY)
    def test_never_enables_hardware(self):
        self.ready()
        for _ in range(10):
            out=self.s.tick(Input(enable_switch=True,flex=.9))
            self.assertFalse(out.hardware_power_permission)
    def test_initial_state_disabled(self):
        self.assertEqual(self.s.tick(Input()).request,'NONE')
    def test_neutral_required(self):
        for _ in range(100):o=self.s.tick(Input(enable_switch=True,flex=.9))
        self.assertEqual(o.state,State.DISARMED)
    def test_arming_duration(self):
        for _ in range(24):o=self.s.tick(Input(enable_switch=True))
        self.assertEqual(o.state,State.DISARMED)
        self.assertEqual(self.s.tick(Input(enable_switch=True)).state,State.READY)
    def test_close_debounce(self):
        self.ready()
        for _ in range(2):self.assertEqual(self.s.tick(Input(enable_switch=True,flex=.9)).request,'NONE')
        self.assertEqual(self.s.tick(Input(enable_switch=True,flex=.9)).request,'CLOSE')
    def test_open_debounce(self):
        self.ready()
        for _ in range(2):self.assertEqual(self.s.tick(Input(enable_switch=True,extend=.9)).request,'NONE')
        self.assertEqual(self.s.tick(Input(enable_switch=True,extend=.9)).request,'OPEN')
    def test_both_channels_rejected(self):
        self.ready()
        for _ in range(10):out=self.s.tick(Input(enable_switch=True,flex=.9,extend=.9))
        self.assertEqual(out.request,'NONE')
    def test_stale_sensor_fault(self):
        self.ready()
        o=self.s.tick(Input(enable_switch=True,age_ms=101))
        self.assertEqual(o.state,State.FAULT);self.assertEqual(o.request,'NONE')
    def test_fault_latches_until_physical_reset_while_off(self):
        self.ready();self.s.tick(Input(enable_switch=True,supply_ok=False))
        o=self.s.tick(Input(enable_switch=True))
        self.assertEqual(o.state,State.FAULT)
        o=self.s.tick(Input(enable_switch=False,reset_button=True))
        self.assertEqual(o.state,State.DISARMED)
    def test_switch_off_stops_software_request(self):
        self.ready()
        for _ in range(3):self.s.tick(Input(enable_switch=True,flex=.9))
        o=self.s.tick(Input(enable_switch=False,flex=.9))
        self.assertEqual(o.request,'NONE')
    def test_release_latches_fault(self):
        self.ready()
        o=self.s.tick(Input(enable_switch=True,release_latch=True))
        self.assertEqual(o.state,State.FAULT)
    def test_overcurrent_latches(self):
        self.ready()
        self.assertEqual(self.s.tick(Input(enable_switch=True,current_ok=False)).state,State.FAULT)
    def test_overtemp_latches(self):
        self.ready()
        self.assertEqual(self.s.tick(Input(enable_switch=True,temperature_ok=False)).state,State.FAULT)
    def test_intent_stops_immediately_on_neutral(self):
        self.ready()
        for _ in range(3):self.s.tick(Input(enable_switch=True,flex=.9))
        self.assertEqual(self.s.tick(Input(enable_switch=True)).request,'NONE')

if __name__=='__main__':unittest.main(verbosity=2)
