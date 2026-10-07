#!/usr/bin/env python3
import json, os
from pathlib import Path
from PIL import Image, ImageFilter

ROOT=Path(os.environ.get("ALLPHA_V213D3C_OUT","allpha-theme-v2-13d3c-visual-remediation")).resolve()
MANIFEST=ROOT/"manifest.json"
CATS=["universe","galaxy","world","district"]
THRESHOLD=0.12
if not MANIFEST.is_file(): raise SystemExit("V2.13D3C_MANIFEST_MISSING")
assets=json.loads(MANIFEST.read_text(encoding="utf-8"))["assets"]

def ahash(im):
    im=im.convert("L").resize((24,24)); px=list(im.getdata()); avg=sum(px)/len(px)
    return [1 if x>=avg else 0 for x in px]
def edgehash(im):
    im=im.convert("L").resize((24,24)).filter(ImageFilter.FIND_EDGES); px=list(im.getdata()); avg=sum(px)/len(px)
    return [1 if x>=avg else 0 for x in px]
def dist(a,b): return sum(x!=y for x,y in zip(a,b))/len(a)
def fingerprint(path):
    im=Image.open(path)
    return ahash(im),edgehash(im)

errors=[]; rows=[]
for category in CATS:
    paths=[Path(x["preview"]) if Path(x["preview"]).is_absolute() else Path(x["preview"]).resolve() for x in assets if x["category"]==category and x.get("preview")]
    if len(paths)!=25:
        errors.append(f"PREVIEW_COUNT:{category}:{len(paths)}"); continue
    fps=[fingerprint(p) for p in paths]
    pairs=[]
    for i in range(25):
        for j in range(i+1,25):
            pairs.append(0.65*dist(fps[i][0],fps[j][0])+0.35*dist(fps[i][1],fps[j][1]))
    mean=sum(pairs)/len(pairs); maximum=max(pairs); passed=mean>=THRESHOLD
    if not passed: errors.append(f"STRUCTURAL_VARIATION_BELOW_THRESHOLD:{category}:{mean:.4f}<{THRESHOLD}")
    rows.append({"category":category,"themes":25,"meanStructuralDistance":round(mean,4),"maxStructuralDistance":round(maximum,4),"threshold":THRESHOLD,"status":"PASS" if passed else "FAIL"})
report={"schema":"allpha-3d-v2-13d3c-cinematic-visual-review/1.0","phase":"V2.13D.3C","goldenReference":"crystal-ai-city","themes":25,"categories":4,"rows":rows,"automatedStructuralReview":"PASS" if not errors else "FAIL","errors":errors,"gatePolicy":"threshold unchanged; human visual review remains authoritative"}
Path("3d-v2-13d3c-cinematic-visual-review.json").write_text(json.dumps(report,indent=2)+"\n")
print(json.dumps(report,indent=2))
raise SystemExit(1 if errors else 0)