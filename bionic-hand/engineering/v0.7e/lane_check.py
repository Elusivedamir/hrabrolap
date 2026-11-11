"""Axial packaging comparison against the published v0.5d open snapshot."""
import argparse
import gzip
from hashlib import sha256
import json
from pathlib import Path
from tempfile import TemporaryDirectory

import cadquery as cq

HERE = Path(__file__).resolve().parent
REFERENCE = HERE.parents[1] / "cad/v0.5d/hand_v05d_reference.step.gz"
PROXIMAL_PARTS = {"little": 4, "ring": 7, "middle": 10, "index": 13}


def inspect_lanes(reference, module_width_mm):
    zipped = reference.read_bytes()
    with TemporaryDirectory() as folder:
        p = Path(folder) / "hand.step"
        p.write_bytes(gzip.decompress(zipped))
        solids = cq.importers.importStep(str(p)).val().Solids()
    if len(solids) != 25:
        raise ValueError("Expected the published 25-body v0.5d open snapshot")
    centers = {}
    for name, index in PROXIMAL_PARTS.items():
        bb = solids[index].BoundingBox()
        centers[name] = (bb.zmin + bb.zmax) / 2
    values = list(centers.values())
    spacings = [b-a for a, b in zip(values, values[1:])]
    min_pitch = min(spacings)
    boot_per_side_mm = 0.50
    stack_per_lane_mm = 0.20
    operating_gap_mm = 0.25
    raw_gap = min_pitch - module_width_mm
    return {"scope": "width screen, not BRep assembly or true joint-axis reconstruction",
            "reference_sha256": sha256(zipped).hexdigest(),
            "proximal_open_bounding_box_centers_z_mm": centers,
            "nominal_lane_pitch_mm": spacings, "module_width_mm": module_width_mm,
            "bare_nominal_gap_mm": raw_gap,
            "boot_reserve_per_facing_side_mm": boot_per_side_mm,
            "gap_with_boots_mm": raw_gap - 2*boot_per_side_mm,
            "tolerance_allowance_per_lane_mm": stack_per_lane_mm,
            "target_operating_gap_mm": operating_gap_mm,
            "margin_with_boot_tolerance_and_target_gap_mm": (
                raw_gap - 2*boot_per_side_mm - 2*stack_per_lane_mm - operating_gap_mm),
            "envelope_target_module_max_mm_for_assumed_reserves": (
                min_pitch - 2*boot_per_side_mm - 2*stack_per_lane_mm - operating_gap_mm)}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--reference", type=Path, default=REFERENCE)
    args = parser.parse_args()
    width = json.loads((HERE / "cad_results.json").read_text())["bare_axial_width_mm"]
    report = inspect_lanes(args.reference, width)
    print(json.dumps(report, indent=2))
    (HERE / "lane_results.json").write_text(json.dumps(report, indent=2) + "\n")
