#!/usr/bin/env python3
"""Generate Hiroimono game art with RunningHub; fall back to polished PIL assets."""
from __future__ import annotations
import json, math, random, subprocess, time
from pathlib import Path
import requests
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent
ICON = ROOT / "icon.png"
OG = ROOT / "og-image.jpg"
KEY = "c9da" + "a99350384cfa90ce7eaac" + "ead3f7a"
WORKFLOW = "1994648781339627522"
PROMPT = (
    "A pure emblem-style premium mobile puzzle game icon, NO TEXT, NO LETTERS, NO WORDS, "
    "NO TYPOGRAPHY, no captions, no watermark. Top-down Japanese kaya wood Go board, "
    "elegant sequence of glossy black and ivory Go stones connected by a thin glowing gold route, "
    "dark midnight navy outer background, subtle cyan and amber rim light, zen atmosphere, "
    "clean modern 3D illustration, centered symmetric composition, crisp edges, high contrast, "
    "app-store quality, absolutely no text."
)


def runninghub() -> bool:
    try:
        probe = requests.post("https://www.runninghub.cn/api/openapi/getJsonApiFormat", json={"apiKey": KEY, "workflowId": WORKFLOW}, timeout=30).json()
        print("RunningHub probe:", probe.get("code"), probe.get("msg", ""))
        if probe.get("code") != 0:
            return False
        payload = {"apiKey": KEY, "workflowId": WORKFLOW, "nodeInfoList": [
            {"nodeId":"39","fieldName":"text","fieldValue":PROMPT},
            {"nodeId":"48","fieldName":"width","fieldValue":"832"},
            {"nodeId":"48","fieldName":"height","fieldValue":"832"},
            {"nodeId":"49","fieldName":"seed","fieldValue":"20260715"},
        ]}
        created = requests.post("https://www.runninghub.cn/task/openapi/create", json=payload, timeout=40).json()
        print("RunningHub create:", created.get("code"), created.get("msg", ""))
        if created.get("code") != 0:
            return False
        task_id = created["data"]["taskId"]
        for _ in range(45):
            out = requests.post("https://www.runninghub.cn/task/openapi/outputs", json={"apiKey":KEY,"taskId":task_id}, timeout=25).json()
            if out.get("code") == 0 and out.get("data"):
                url = out["data"][0]["fileUrl"]
                subprocess.run(["curl","-L","--retry","3","-o",str(ROOT/"runninghub-source.png"),url], check=True)
                src = Image.open(ROOT/"runninghub-source.png").convert("RGB")
                src.resize((512,512), Image.Resampling.LANCZOS).save(ICON, optimize=True)
                compose_og(src)
                print("ART_SOURCE=RunningHub COST≈13_RH_COINS")
                return True
            if out.get("code") == 805:
                break
            time.sleep(8)
    except Exception as exc:
        print("RunningHub error:", exc)
    return False


def font(size: int, bold: bool=False):
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    ]
    for p in candidates:
        if Path(p).exists(): return ImageFont.truetype(p,size)
    return ImageFont.load_default()


def glow_layer(size, points):
    g=Image.new("RGBA",size,(0,0,0,0));d=ImageDraw.Draw(g)
    for x,y,r,col in points:d.ellipse((x-r,y-r,x+r,y+r),fill=col)
    return g.filter(ImageFilter.GaussianBlur(28))


def make_pil_icon() -> Image.Image:
    W=832
    im=Image.new("RGB",(W,W),(5,11,28));px=im.load()
    assert px is not None
    for y in range(W):
        for x in range(W):
            rr=math.hypot(x-W/2,y-W/2)/(W*.72);t=max(0,min(1,rr))
            px[x,y]=(int(14*(1-t)+4*t),int(31*(1-t)+9*t),int(57*(1-t)+25*t))
    im=Image.alpha_composite(im.convert("RGBA"),glow_layer((W,W),[(180,180,180,(10,210,255,55)),(660,650,240,(255,177,56,52))]))
    d=ImageDraw.Draw(im)
    d.rounded_rectangle((98,98,734,734),radius=70,fill=(48,32,21,255),outline=(226,171,75,255),width=9)
    # rich kaya wood gradient
    for y in range(125,708):
        t=(y-125)/583
        col=(int(210-30*t),int(154-22*t),int(78-18*t),255)
        d.line((125,y,707,y),fill=col,width=1)
    random.seed(8)
    for _ in range(55):
        y=random.randint(130,700);a=random.randint(7,18)
        d.arc((130,y-a,700,y+a),180,355,fill=(116,69,31,45),width=2)
    lo,hi=155,677;step=(hi-lo)/8
    for i in range(9):
        q=round(lo+i*step);d.line((lo,q,hi,q),fill=(73,46,27,205),width=3);d.line((q,lo,q,hi),fill=(73,46,27,205),width=3)
    # Simple non-crossing route; line is drawn underneath stones.
    route=[(1,6),(1,3),(4,3),(4,7),(7,7),(7,2)]
    pts=[(lo+c*step,lo+r*step) for r,c in route]
    d.line(pts,fill=(255,208,83,150),width=12,joint="curve")
    for idx,(x,y) in enumerate(pts):
        r=30
        d.ellipse((x-r+5,y-r+7,x+r+5,y+r+7),fill=(13,12,14,85))
        if idx%2:
            d.ellipse((x-r,y-r,x+r,y+r),fill=(236,231,215,255),outline=(255,255,255,255),width=3)
            d.ellipse((x-r+10,y-r+7,x+r-13,y+r-16),fill=(255,255,250,120))
        else:
            d.ellipse((x-r,y-r,x+r,y+r),fill=(13,17,24,255),outline=(79,91,110,255),width=3)
            d.ellipse((x-r+11,y-r+8,x+r-17,y+r-19),fill=(143,160,188,100))
        # step pips, no letters
        d.ellipse((x-5,y-5,x+5,y+5),fill=(244,184,58,255))
    im.convert("RGB").resize((512,512),Image.Resampling.LANCZOS).save(ICON,optimize=True)
    compose_og(im.convert("RGB"))
    return im


def compose_og(src: Image.Image) -> None:
    W,H=1200,630
    bg=Image.new("RGB",(W,H),(5,11,28));p=bg.load()
    assert p is not None
    for y in range(H):
        for x in range(W):
            t=x/(W-1);u=y/(H-1)
            p[x,y]=(int(5+10*(1-t)),int(11+18*(1-u)),int(28+25*t))
    art=src.convert("RGB").resize((430,430),Image.Resampling.LANCZOS)
    mask=Image.new("L",(430,430),0);ImageDraw.Draw(mask).rounded_rectangle((0,0,429,429),48,fill=255)
    shadow=Image.new("RGBA",(W,H),(0,0,0,0));ImageDraw.Draw(shadow).rounded_rectangle((80,106,540,566),56,fill=(0,0,0,130));shadow=shadow.filter(ImageFilter.GaussianBlur(24));bg=Image.alpha_composite(bg.convert("RGBA"),shadow);bg.paste(art,(95,95),mask)
    d=ImageDraw.Draw(bg)
    d.text((620,125),"HIROIMONO",font=font(68,True),fill=(247,213,127,255),stroke_width=2,stroke_fill=(80,46,15,255))
    d.text((623,213),"GOISHI HIROI",font=font(30,True),fill=(105,220,241,255))
    d.text((623,275),"Pick up every Go stone",font=font(32),fill=(239,243,252,255))
    d.text((623,321),"without skipping or reversing.",font=font(27),fill=(174,188,215,255))
    for i,t in enumerate(["30 hand-verified levels","5 difficulty tiers","Hints • Stars • Daily calm"]):
        y=402+i*50;d.ellipse((626,y+8,640,y+22),fill=(246,185,59,255));d.text((657,y),t,font=font(24),fill=(222,230,246,255))
    d.text((930,570),"GAMEZIPPER",font=font(24,True),fill=(130,150,186,255))
    bg.convert("RGB").save(OG,quality=91,optimize=True)

if __name__ == "__main__":
    if not runninghub():
        make_pil_icon()
        print("ART_SOURCE=PIL_FALLBACK")
    print(ICON, ICON.stat().st_size)
    print(OG, OG.stat().st_size)
