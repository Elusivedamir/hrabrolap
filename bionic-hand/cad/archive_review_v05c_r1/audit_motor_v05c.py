#!/usr/bin/env python3
"""Compatibility entry point. Use the complete modeled-pair audit in revision 1."""
from audit_all_pairs_v05c import run
if __name__ == '__main__':
    report=run()
    raise SystemExit(1 if report['status']=='FAIL' else 0)
