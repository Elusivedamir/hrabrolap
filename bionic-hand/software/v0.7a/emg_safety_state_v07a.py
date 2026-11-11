#!/usr/bin/env python3
"""SOFTWARE-ONLY two-channel EMG command intent simulator.
NO electrodes, motors or verified medical-grade isolation.
hardware_power_permission is always False by construction.
"""
from dataclasses import dataclass
from enum import Enum

class State(str,Enum):
    DISARMED='DISARMED'
    READY='READY'
    FAULT='FAULT'

@dataclass(frozen=True)
class Input:
    flex:float=0.0
    extend:float=0.0
    age_ms:int=0
    enable_switch:bool=False
    release_latch:bool=False
    reset_button:bool=False
    supply_ok:bool=True
    current_ok:bool=True
    temperature_ok:bool=True

@dataclass(frozen=True)
class Output:
    state:State
    request:str
    hardware_power_permission:bool
    note:str

class SafetyIntent:
    TICK_MS=20
    NEUTRAL_TICKS=25
    GESTURE_TICKS=3
    EMG_TH=0.65
    REST_TH=0.25
    MAX_AGE_MS=100

    def __init__(self):
        self.state=State.DISARMED
        self.neutral_count=0
        self.gesture='NONE'
        self.gesture_count=0

    def _out(self,note=''):
        # No physical driver permission: a demonstration must not power a prosthesis.
        if self.state!=State.READY:return Output(self.state,'NONE',False,note)
        req=self.gesture if self.gesture_count>=self.GESTURE_TICKS else 'NONE'
        return Output(self.state,req,False,note)

    def tick(self,x:Input)->Output:
        healthy=(x.supply_ok and x.current_ok and x.temperature_ok and
                 0<=x.age_ms<=self.MAX_AGE_MS and
                 0<=x.flex<=1 and 0<=x.extend<=1)
        neutral=(x.flex<=self.REST_TH and x.extend<=self.REST_TH)
        if x.release_latch:
            self.state=State.FAULT
            self.gesture='NONE';self.gesture_count=0
            return self._out('MANUAL RELEASE REQUEST: physical hardware still required')
        if not healthy:
            self.state=State.FAULT
            self.gesture='NONE';self.gesture_count=0
            return self._out('SENSOR/POWER/THERMAL FAULT LATCHED')
        if self.state==State.FAULT:
            if x.reset_button and not x.enable_switch and neutral:
                self.state=State.DISARMED
                self.neutral_count=0
                self.gesture='NONE';self.gesture_count=0
                return self._out('RESET WHILE DISABLED; rearm required')
            return self._out('FAULT LATCHED; disable and reset required')
        if not x.enable_switch:
            self.state=State.DISARMED
            self.neutral_count=0
            self.gesture='NONE';self.gesture_count=0
            return self._out('DISABLED BY SWITCH')
        if self.state==State.DISARMED:
            self.neutral_count=self.neutral_count+1 if neutral else 0
            if self.neutral_count>=self.NEUTRAL_TICKS:
                self.state=State.READY
            return self._out('ARMING REQUIRES CLEAN NEUTRAL')
        if x.flex>=self.EMG_TH and x.extend>=self.EMG_TH:
            new='NONE'
        elif x.flex>=self.EMG_TH and x.extend<=self.REST_TH:
            new='CLOSE'
        elif x.extend>=self.EMG_TH and x.flex<=self.REST_TH:
            new='OPEN'
        else:
            new='NONE'
        if new!=self.gesture:
            self.gesture=new
            self.gesture_count=1 if new!='NONE' else 0
        elif new!='NONE':
            self.gesture_count+=1
        else:self.gesture_count=0
        return self._out('SIMULATION ONLY; zero hardware permission')
