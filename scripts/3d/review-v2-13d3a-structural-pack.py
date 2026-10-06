#!/usr/bin/env python3
import json, os
from pathlib import Path
from PIL import Image
ROOT=Path(os.environ.get("ALLPHA_V213D3A_OUT","allpha-theme-v2-13d3a-remediation"))
THEMES=json.loads((ROOT/"manifest.json").read_text())["assets"]
CATS=["universe","galaxy","world","district"]
def ahash(p):
    im=Image.open(p).convert("L").resize((16,16)); px=list(im.getdata()); avg=sum(px)/len(px)
    return [1 if x>=avg else 0 for x in px]
def dist(a,b): return sum(x!=y for x,y in zip(a,b))/len(a)
errors=[]; rows=[]
for c in CATS:
    files=[Path(x["preview"]) for x in THEMES if x["category"]==c and x.get("preview")]
    if len(files)!=25: errors.append(f"PREVIEW_COUNT:{c}:{len(files)}"); continue
    hashes=[ahash(p) for p in files]
    pairs=[dist(hashes[i],hashes[j]) for i in range(25) for j in range(i+1,25)]
    mean=sum(pairs)/len(pairs); maximum=max(pairs); threshold=0.12; passed=mean>=threshold
    if not passed: errors.append(f"STRUCTURAL_VARIATION_BELOW_THRESHOLD:{c}:{mean:.4f}<{threshold}")
    rows.append({"category":c,"themes":25,"meanPerceptualDistance":round(mean,4),"maxPerceptualDistance":round(maximum,4),"threshold":threshold,"status":"PASS" if passed else "FAIL"})
report={"schema":"allpha-3d-v2-13d3a-structural-visual-review/1.0","phase":"V2.13D.3A","goldenReference":"crystal-ai-city","categories":4,"themes":25,"rows":rows,"automatedStructuralReview":"PASS" if not errors else "FAIL","errors":errors,"baselineNote":"Prior V2.13D review observed approximately 0.061/0.061/0.071/0.071 mean distances for Universe/Galaxy/World/District."}
Path("3d-v2-13d3a-structural-visual-review.json").write_text(json.dumps(report,indent=2)+"\n")
print(json.dumps(report,indent=2)); raise SystemExit(1 if errors else 0)