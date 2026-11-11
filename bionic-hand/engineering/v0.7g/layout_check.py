"""Compare the common actuator's conservative swept box with the v0.5d open STEP."""
import argparse
import gzip
from hashlib import sha256
from itertools import product
import json
from pathlib import Path
from tempfile import TemporaryDirectory

import cadquery as cq

from common_cad import box, overlap

HERE = Path(__file__).resolve().parent
REFERENCE = HERE.parents[1] / "cad/v0.5d/hand_v05d_reference.step.gz"


def inspect(reference):
    raw = reference.read_bytes()
    with TemporaryDirectory() as tmp:
        local = Path(tmp) / "hand.step"
        local.write_bytes(gzip.decompress(raw))
        hand = cq.importers.importStep(str(local)).val().Solids()
    if len(hand) != 25:
        raise ValueError("Expected the published 25-body open hand")
    bbs = [body.BoundingBox() for body in hand]
    limits = json.loads((HERE/"cad_results.json").read_text())["limits_xyz_mm"]
    body = box(*[value for pair in limits for value in pair]).rotate((0, 0, 0), (1, 0, 0), -90)
    bounds = body.BoundingBox()
    lateral_center = -(bounds.zmin + bounds.zmax)/2
    results = []
    for x,y,z in product((-89, -74, -58, -42), (0, 10, 20, 30, 40, 50),
                         (lateral_center-1, lateral_center, lateral_center+1)):
        candidate = body.translate((x, y, z))
        bb = candidate.BoundingBox()
        if bb.xmin < -122 or bb.xmax > 0 or bb.zmin < -42.5 or bb.zmax > 42.5:
            raise ValueError("Sample outside nominal palm plan")
        hits = []
        for idx,(solid, sbb) in enumerate(zip(hand, bbs)):
            if overlap(bb,sbb):
                volume = candidate.intersect(solid).Volume()
                if volume > .01:
                    hits.append([idx,round(volume,3)])
        results.append({"origin_xyz_mm":[x,y,z], "intersections": hits})
    return {"reference_sha256":sha256(raw).hexdigest(),
            "scope":"conservative swept box against one open snapshot; not assembly integration",
            "count":len(results),
            "minimum_noninterfering_tested_height_mm":min((row["origin_xyz_mm"][1] for row in results if not row["intersections"]), default=None),
            "clear_by_height":{str(y):sum(row["origin_xyz_mm"][1]==y and not row["intersections"] for row in results)
                               for y in (0,10,20,30,40,50)},
            "results":results}


if __name__ == "__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--reference",type=Path,default=REFERENCE)
    args=parser.parse_args()
    result=inspect(args.reference)
    print(json.dumps({k:v for k,v in result.items() if k!="results"},indent=2))
    (HERE/"packaging_results.json").write_text(json.dumps(result,indent=2)+"\n")
