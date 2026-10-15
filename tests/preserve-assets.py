from pathlib import Path
import hashlib,json
r=Path(__file__).resolve().parents[1]
original=json.loads((r/'qa/original-v0.8-sha256.json').read_text())
protected={p:h for p,h in original.items() if p.startswith(('art/','assets/')) or p=='art-proof-v07.jpg'}
for p,h in protected.items():
 assert (r/p).is_file(),p
 assert hashlib.sha256((r/p).read_bytes()).hexdigest()==h, 'Changed protected asset: '+p
print(f'PASS: {len(protected)} original art/assets files match v0.8 byte for byte')
