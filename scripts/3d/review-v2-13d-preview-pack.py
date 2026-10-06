#!/usr/bin/env python3
"""V2.13D.1 automated preview review.

This is an evidence gate, not a substitute for human art direction approval.
It checks every rendered preview for existence, readable dimensions, non-empty
pixel variance, and produces theme contact sheets plus a review manifest.
"""
from pathlib import Path
import json, os, statistics
from PIL import Image, ImageStat, ImageDraw

ROOT=Path(os.environ.get("ALLPHA_V213D_OUT","allpha-theme-v2-13d-production"))
REPORT=Path("3d-v2-13d-preview-review-report.json")
EXPECTED_THEMES=25
EXPECTED_CATEGORIES=14
EXPECTED_SIZE=(720,1080)

if not ROOT.exists(): raise SystemExit("V2.13D_PREVIEW_ROOT_MISSING")
manifest=json.loads((ROOT/"manifest.json").read_text())
if not manifest.get("previewRequested"): raise SystemExit("V2.13D_PREVIEW_NOT_REQUESTED")

themes=sorted(p for p in ROOT.iterdir() if p.is_dir())
errors=[]; rows=[]; contact_dir=ROOT/"contact-sheets"; contact_dir.mkdir(exist_ok=True)

for theme in themes:
    previews=sorted(theme.glob("*.png"))
    if len(previews)!=EXPECTED_CATEGORIES:
        errors.append(f"PREVIEW_COUNT:{theme.name}:{len(previews)}")
        continue
    thumbs=[]; theme_scores=[]
    for p in previews:
        try:
            with Image.open(p) as im:
                im.load()
                size=im.size
                if size!=EXPECTED_SIZE: errors.append(f"DIMENSIONS:{theme.name}:{p.name}:{size}")
                stat=ImageStat.Stat(im.convert("RGB"))
                mean=sum(stat.mean)/3
                spread=sum(stat.stddev)/3
                if spread < 2.0: errors.append(f"LOW_PIXEL_VARIANCE:{theme.name}:{p.name}")
                theme_scores.append({"category":p.stem,"mean":round(mean,3),"spread":round(spread,3),"width":size[0],"height":size[1]})
                thumb=im.convert("RGB"); thumb.thumbnail((180,270))
                canvas=Image.new("RGB",(200,305),"black")
                canvas.paste(thumb,((200-thumb.width)//2,8))
                ImageDraw.Draw(canvas).text((8,284),p.stem,fill="white")
                thumbs.append(canvas)
        except Exception as exc:
            errors.append(f"IMAGE_READ:{theme.name}:{p.name}:{exc}")
    sheet=Image.new("RGB",(1000,915),"black")
    for i,t in enumerate(thumbs):
        sheet.paste(t,((i%5)*200,(i//5)*305))
    sheet.save(contact_dir/f"{theme.name}.jpg",quality=88)
    rows.append({"theme":theme.name,"previews":len(previews),"categories":theme_scores})

if len(themes)!=EXPECTED_THEMES: errors.append(f"THEME_FOLDER_COUNT:{len(themes)}")

report={
 "schema":"allpha-3d-v2-13d-preview-review/1.0",
 "phase":"3D-V2.13D.1",
 "automatedReview":"PASS" if not errors else "FAIL",
 "humanVisualFidelityReview":"PENDING",
 "themes":len(themes),
 "categories":EXPECTED_CATEGORIES,
 "previews":sum(r["previews"] for r in rows),
 "expectedPreviews":EXPECTED_THEMES*EXPECTED_CATEGORIES,
 "expectedSize":{"width":EXPECTED_SIZE[0],"height":EXPECTED_SIZE[1]},
 "contactSheets":str(contact_dir),
 "errors":errors,
 "themeScores":rows,
}
REPORT.write_text(json.dumps(report,indent=2)+"\n")
print(json.dumps({"ok":not errors,"themes":len(themes),"previews":report["previews"],"errors":len(errors),"report":str(REPORT)},indent=2))
raise SystemExit(1 if errors else 0)
