"""Limited v0.5d open-hand STEP fit screen. No integration or moving boot."""
import argparse
import gzip
import hashlib
from itertools import product
import json
from pathlib import Path
from tempfile import TemporaryDirectory

import cadquery as cq

from release_cad import bbox_overlap, box, pose

HERE = Path(__file__).resolve().parent
REFERENCE = HERE.parents[1] / "cad/v0.5d/hand_v05d_reference.step.gz"
PALM_WIDTH_MM = 85
PALM_LENGTH_MM = 122
WRIST_AXIAL_LIMIT_MM = 50
DORSAL_OFFSETS_MM = (2, 8, 14, 20, 26, 32, 38, 44, 50)


def run(reference):
    reference_bytes = reference.read_bytes()
    with TemporaryDirectory() as folder:
        step = Path(folder) / "hand.step"
        step.write_bytes(gzip.decompress(reference_bytes))
        hand = cq.importers.importStep(str(step)).val().Solids()
    if len(hand) != 25 or not all(solid.isValid() for solid in hand):
        raise ValueError("Expected the published 25-solid v0.5d STEP snapshot")
    hand_bounds = [solid.BoundingBox() for solid in hand]

    # Bounding volume reserves the operational envelope over both modelled
    # ends of carriage stroke and the two positions of the parking pin.
    envelopes = [pose(payout, engaged) for payout, engaged in product((0, 8), (False, True))]
    bounds = cq.Compound.makeCompound([solid for parts in envelopes for solid in parts.values()]).BoundingBox()
    reserve = box(bounds.xmin, bounds.xmax, bounds.ymin, bounds.ymax, bounds.zmin, bounds.zmax)
    reserve = reserve.rotate((0, 0, 0), (1, 0, 0), -90)
    size = [bounds.xlen, bounds.ylen, bounds.zlen]
    data = []
    for x, y, z in product((-110, -96, -82), DORSAL_OFFSETS_MM, (-12, 0, 12)):
        if not (-PALM_LENGTH_MM <= bounds.xmin + x and bounds.xmax + x <= 0):
            continue
        if not (-PALM_WIDTH_MM / 2 <= -bounds.ymax + z and -bounds.ymin + z <= PALM_WIDTH_MM / 2):
            continue
        candidate = reserve.translate((x, y, z))
        bb = candidate.BoundingBox()
        contacts = []
        for i, solid in enumerate(hand):
            if bbox_overlap(bb, hand_bounds[i]):
                volume = candidate.intersect(solid).Volume()
                if volume > 0.01:
                    contacts.append({"reference_solid_zero_based": i, "volume_mm3": round(volume, 3)})
        data.append({"offset_xyz_mm": [x, y, z], "interferences": contacts})

    single_footprint = size[0] * size[1]
    palm_footprint = PALM_LENGTH_MM * PALM_WIDTH_MM
    return {
        "status": "PACKAGING_SCREEN_ONLY_NO_HAND_INTEGRATION",
        "reference": "cad/v0.5d/hand_v05d_reference.step.gz",
        "reference_sha256": hashlib.sha256(reference_bytes).hexdigest(),
        "reference_bodies": len(hand),
        "reference_pose": "as-exported open CAD snapshot only",
        "axes": "local x -> hand x; local y -> minus hand z; local z -> hand y",
        "reserve_mm_length_width_depth": size,
        "single_reserve_footprint_mm2": single_footprint,
        "four_nonoverlap_reserves_mm2": 4 * single_footprint,
        "palm_envelope_footprint_mm2": palm_footprint,
        "direct_axial_wrist_fit": size[0] <= WRIST_AXIAL_LIMIT_MM,
        "four_nonoverlapping_rectangles_single_layer_fit_area_bound": 4 * single_footprint <= palm_footprint,
        "placement_count": len(data),
        "nominal_noninterfering_reserves_by_height": {
            str(y): sum(row["offset_xyz_mm"][1] == y and not row["interferences"] for row in data)
            for y in DORSAL_OFFSETS_MM
        },
        "placements": data,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--reference", type=Path, default=REFERENCE)
    args = parser.parse_args()
    result = run(args.reference)
    print(json.dumps({k: v for k, v in result.items() if k != "placements"}, indent=2))
    (HERE / "packaging_results.json").write_text(json.dumps(result, indent=2) + "\n")
