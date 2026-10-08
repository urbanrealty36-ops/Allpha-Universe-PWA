#!/usr/bin/env python3
"""V2.13D golden preview machine pre-gate.

This is deliberately NOT a realism approval. It only rejects broken/blank/
degenerate renders before human visual fidelity review.
"""
from __future__ import annotations
import json
from pathlib import Path
from PIL import Image, ImageStat

ROOT = Path("golden-reference-preview/crystal-ai-city")
CATS = ["universe", "galaxy", "world", "district"]
errors = []
rows = []

for category in CATS:
    p = ROOT / f"{category}.png"
    if not p.exists():
        errors.append(f"MISSING:{category}")
        continue
    with Image.open(p).convert("RGB") as im:
        w, h = im.size
        stat = ImageStat.Stat(im)
        mean = sum(stat.mean) / 3.0
        extrema = stat.extrema
        spread = sum((hi-lo) for lo,hi in extrema) / 3.0
        sample = im.resize((32, 32))
        vals = list(sample.getdata())
        unique = len(set(vals))
        dark_ratio = sum(1 for r,g,b in vals if (r+g+b)/3 < 5) / len(vals)
        rows.append({
            "category": category,
            "width": w, "height": h,
            "portrait": h >= w,
            "meanLuma": round(mean, 3),
            "channelSpread": round(spread, 3),
            "sampleUniqueRGB": unique,
            "nearBlackRatio": round(dark_ratio, 4),
        })
        if w < 512 or h < 512:
            errors.append(f"RESOLUTION:{category}")
        if unique < 40:
            errors.append(f"LOW_VARIETY:{category}:{unique}")
        if spread < 8:
            errors.append(f"LOW_DYNAMIC_RANGE:{category}:{spread:.2f}")
        if dark_ratio > 0.995:
            errors.append(f"NEAR_BLACK:{category}")

report = {
    "schema": "allpha-3d-v2-13d-golden-machine-pregate/1.0",
    "phase": "V2.13D-REFERENCE-REAL",
    "goldenReference": "crystal-ai-city",
    "machinePreGate": "PASS" if not errors else "FAIL",
    "humanVisualGate": "REQUIRED",
    "humanApproval": "PENDING",
    "errors": errors,
    "renders": rows,
}
Path("3d-v2-13d-golden-machine-pregate-report.json").write_text(
    json.dumps(report, indent=2) + "\n", encoding="utf-8"
)
print(json.dumps(report, indent=2))
raise SystemExit(1 if errors else 0)
