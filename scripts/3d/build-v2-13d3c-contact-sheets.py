#!/usr/bin/env python3
import json, os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(os.environ.get("ALLPHA_V213D3C_OUT","allpha-theme-v2-13d3c-visual-remediation")).resolve()
OUT=Path(os.environ.get("ALLPHA_V213D3C_SHEETS","v2-13d3c-review-sheets")).resolve()
CATS=["universe","galaxy","world","district"]
OUT.mkdir(parents=True,exist_ok=True)
manifest=json.loads((ROOT/"manifest.json").read_text(encoding="utf-8"))
assets=manifest["assets"]
font=ImageFont.load_default()

for category in CATS:
    rows=sorted([a for a in assets if a["category"]==category],key=lambda x:x["themeKey"])
    if len(rows)!=25: raise SystemExit(f"D3C_CONTACT_SHEET_ASSET_COUNT:{category}:{len(rows)}")
    thumb_w,thumb_h,label_h=180,270,24
    canvas=Image.new("RGB",(5*thumb_w,5*(thumb_h+label_h)),(8,10,18))
    draw=ImageDraw.Draw(canvas)
    for i,asset in enumerate(rows):
        im=Image.open(asset["preview"]).convert("RGB")
        im.thumbnail((thumb_w-10,thumb_h-10))
        tile=Image.new("RGB",(thumb_w,thumb_h),(12,15,25))
        tile.paste(im,((thumb_w-im.width)//2,(thumb_h-im.height)//2))
        x=(i%5)*thumb_w; y=(i//5)*(thumb_h+label_h)
        canvas.paste(tile,(x,y))
        draw.text((x+6,y+thumb_h+4),asset["themeKey"][:24],fill=(235,240,250),font=font)
    path=OUT/f"{category}-25-theme-contact-sheet.jpg"
    canvas.save(path,quality=94)
    print(path)