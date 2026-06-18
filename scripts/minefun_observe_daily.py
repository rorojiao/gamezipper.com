#!/usr/bin/env python3
"""
MineFun 2-week observation daily collector.
Runs once per day at 09:00 CST. Collects:
  1. Google Suggest variants (4 queries)
  2. MineFun.io poki status
  3. 5 blog HTTP 200 (prod + local)
  4. GSC data (if credentials present)

Output:
  /home/msdn/.openclaw/workspace/data/minefun-observe-{date}.json  (full snapshot)
  /home/msdn/.openclaw/workspace/data/minefun-observe-master-{date}.json  (consolidated, same as 1 but rolled)
  Append to /home/msdn/gamezipper.com/scripts/minefun_observe_2w_report_2026-07-02.md (the running 2-week report)
  TG notification to 老公 on day-1 and day-7 and day-14

Usage:
  python3 /home/msdn/gamezipper.com/scripts/minefun_observe_daily.py
  # or with a specific date for backfill:
  python3 /home/msdn/gamezipper.com/scripts/minefun_observe_daily.py --date 2026-06-19
"""
import urllib.parse
import urllib.request
import ssl
import re
import json
import os
import sys
import argparse
import time
from datetime import datetime, timezone, timedelta

# === Config ===
DATA_DIR = "/home/msdn/.openclaw/workspace/data"
REPORT_PATH = "/home/msdn/gamezipper.com/scripts/minefun_observe_2w_report_2026-07-02.md"
TASK_ID = "t_25b55835"
PROD = "https://gamezipper.com"
LOCAL = "http://127.0.0.1:8899"

QUERIES = [
    "games like minefun",
    "games like minefun io",
    "minefun io",
    "minefun",
]

BLOGS = [
    "blog/games-like-minefun-free",
    "blog/minefun-io-wiki",
    "blog/best-free-sandbox-games-browser",
    "blog/games-like-bloxd-free",
    "blog/games-like-krunker-free",
]

POKI_URL = "https://poki.com/en/g/minefun-io"
SITEMAP = f"{PROD}/sitemap.xml"

CST = timezone(timedelta(hours=8))
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE


# === Helpers ===
def http_get(url, timeout=15):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=timeout) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, b""
    except Exception as e:
        return None, str(e).encode()


def fetch_gs(q):
    url = "https://suggestqueries.google.com/complete/search?client=firefox&q=" + urllib.parse.quote(q)
    status, body = http_get(url, timeout=10)
    if status != 200:
        return []
    try:
        data = json.loads(body.decode("utf-8"))
        if isinstance(data, list) and len(data) >= 2 and isinstance(data[1], list):
            return data[1][:8]
    except Exception:
        pass
    return []


def fetch_poki():
    status, body = http_get(POKI_URL, timeout=20)
    if status != 200:
        return {"http_status": status, "error": "fetch failed"}
    html = body.decode("utf-8", errors="replace")
    data = {"http_status": status}

    # Likes/Dislikes
    likes_m = re.search(r'>\s*(\d+(?:\.\d+)?K)\s*</span>\s*<span[^>]*tz2DEu5qBC9Yd6hJGjoW">Like', html)
    if likes_m:
        data["likes"] = likes_m.group(1)
    dislikes_m = re.search(r'>\s*(\d+(?:\.\d+)?K)\s*</span>\s*<span[^>]*tz2DEu5qBC9Yd6hJGjoW">Dislike', html)
    if dislikes_m:
        data["dislikes"] = dislikes_m.group(1)

    # isNew
    if '"isNew":true' in html:
        data["isNew"] = True
    elif '"isNew":false' in html:
        data["isNew"] = False

    # datePublished
    m = re.search(r'"datePublished"\s*:\s*"([^"]+)"', html)
    if m:
        data["datePublished"] = m.group(1)

    # Categories
    m = re.search(r'"categories":\s*(\[[^\]]+\])', html)
    if m:
        try:
            cats = json.loads(m.group(1))
            data["categories"] = [{"title": c.get("title"), "slug": c.get("slug")} for c in cats]
        except Exception:
            pass

    # Developer
    if 'Vectaria' in html:
        data["developer"] = "Vectaria"

    # Parse counts
    def parse_count(s):
        if not s: return 0
        s = s.strip()
        mult = 1
        if s.endswith('K'): mult = 1000; s = s[:-1]
        elif s.endswith('M'): mult = 1000000; s = s[:-1]
        try: return float(s) * mult
        except: return 0
    data["likes_num"] = parse_count(data.get("likes", "0"))
    data["dislikes_num"] = parse_count(data.get("dislikes", "0"))
    if data["likes_num"] and data["dislikes_num"]:
        data["ratio"] = round(data["likes_num"] / data["dislikes_num"], 2)
    return data


def check_blogs():
    results = {"prod": {}, "local": {}}
    for b in BLOGS:
        for label, base in [("prod", PROD), ("local", LOCAL)]:
            status, body = http_get(f"{base}/{b}.html", timeout=15)
            results[label][b] = {"http": status, "size": len(body) if body else 0, "ok": status == 200}
    return results


def check_gsc():
    """Check if GSC credentials are now available, fetch basic data if so."""
    creds = []
    for p in ['/home/msdn/.openclaw/secrets/gsc.json', '/home/msdn/.openclaw/secrets/gsc-sa.json']:
        if os.path.exists(p):
            creds.append(p)
    if not creds:
        return {
            "status": "auth_required",
            "creds_present": [],
            "creds_needed": ['/home/msdn/.openclaw/secrets/gsc.json', '/home/msdn/.openclaw/secrets/gsc-sa.json'],
            "data_collectible": False,
        }
    # Credentials present - try fetch
    # TODO: implement actual GSC API call when creds land
    return {
        "status": "creds_present_but_not_implemented",
        "creds_present": creds,
        "data_collectible": True,
        "todo": "Implement GSC API call using creds",
    }


def append_to_report(master, day_num):
    """Append Day N section to the running 2-week report."""
    m = master["metrics"]
    with open(REPORT_PATH, "a") as f:
        f.write(f"\n\n## Day {day_num} 追加 ({master['date']})\n\n")
        f.write(f"### Google Suggest\n")
        f.write(f"- `games like minefun`: {m['google_suggest']['games_like_minefun_count']} 变体\n")
        f.write(f"- `games like minefun io`: {m['google_suggest']['games_like_minefun_io_count']} 变体\n")
        f.write(f"- `minefun io`: {m['google_suggest']['minefun_io_count']} 变体\n")
        f.write(f"- `minefun`: {m['google_suggest']['minefun_count']} 变体\n")
        f.write(f"\n### Poki\n")
        f.write(f"- Likes: {m['minefun_io_poki'].get('likes', 'N/A')}\n")
        f.write(f"- Dislikes: {m['minefun_io_poki'].get('dislikes', 'N/A')}\n")
        f.write(f"- /en/new: {m['minefun_io_poki'].get('is_new_position', 'N/A')}\n")
        f.write(f"\n### Blog\n")
        f.write(f"- Prod HTTP 200: {m['blog_health']['prod_blogs_200']}/5\n")
        f.write(f"- Local HTTP 200: {m['blog_health']['local_blogs_200']}/5\n")
        f.write(f"- Deployment: {m['blog_health']['deployment_status']}\n")
        f.write(f"\n### GSC\n- {m['gsc_data']['status']}\n")


# === Main ===
def collect(target_date=None):
    now = datetime.now(CST)
    date = target_date or now.strftime("%Y-%m-%d")

    print(f"=== MineFun Daily Observation: {date} ===\n")

    # 1. Google Suggest
    print("[1/4] Google Suggest...")
    gs = {q: fetch_gs(q) for q in QUERIES}
    for q, v in gs.items():
        print(f"  {q}: {len(v)} variants")

    # 2. Poki
    print("\n[2/4] Poki MineFun.io...")
    poki = fetch_poki()
    print(f"  likes={poki.get('likes', 'N/A')} dislikes={poki.get('dislikes', 'N/A')} isNew={poki.get('isNew', 'N/A')}")

    # 3. Blogs
    print("\n[3/4] Blog HTTP check...")
    blogs = check_blogs()
    prod_ok = sum(1 for v in blogs["prod"].values() if v["ok"])
    local_ok = sum(1 for v in blogs["local"].values() if v["ok"])
    print(f"  prod: {prod_ok}/5, local: {local_ok}/5")

    # 4. GSC
    print("\n[4/4] GSC check...")
    gsc = check_gsc()
    print(f"  status: {gsc['status']}")

    # Build master
    master = {
        "date": date,
        "timestamp": now.isoformat(),
        "task_id": TASK_ID,
        "metrics": {
            "google_suggest": {
                q: v for q, v in gs.items()
            } | {
                "games_like_minefun_count": len(gs.get("games like minefun", [])),
                "games_like_minefun_io_count": len(gs.get("games like minefun io", [])),
                "minefun_io_count": len(gs.get("minefun io", [])),
                "minefun_count": len(gs.get("minefun", [])),
            },
            "minefun_io_poki": poki,
            "blog_health": {
                "prod_blogs_200": prod_ok,
                "local_blogs_200": local_ok,
                "total": 5,
                "deployment_status": "DEPLOYED" if prod_ok == 5 else "PENDING_PUSH" if prod_ok == 0 else "PARTIAL",
                "details": blogs,
            },
            "gsc_data": gsc,
        },
    }

    # Save individual files
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(f"{DATA_DIR}/minefun-observe-{date}.json", "w") as f:
        json.dump(gs, f, indent=2, ensure_ascii=False)
    with open(f"{DATA_DIR}/minefun-poki-{date}.json", "w") as f:
        json.dump(poki, f, indent=2, ensure_ascii=False)
    with open(f"{DATA_DIR}/minefun-blogs-{date}.json", "w") as f:
        json.dump(blogs, f, indent=2, ensure_ascii=False)
    with open(f"{DATA_DIR}/minefun-observe-master-{date}.json", "w") as f:
        json.dump(master, f, indent=2, ensure_ascii=False)

    # Compute day number
    start = datetime(2026, 6, 18, tzinfo=CST)
    target_dt = datetime.strptime(date, "%Y-%m-%d").replace(tzinfo=CST)
    day_num = (target_dt - start).days + 1

    # Append to report (only if not Day 1 which is already in skeleton)
    if day_num > 1:
        try:
            append_to_report(master, day_num)
            print(f"\n  Report appended: {REPORT_PATH}")
        except Exception as e:
            print(f"\n  Report append error: {e}")

    print(f"\n=== Summary ===")
    print(f"  Date: {date} (Day {day_num}/14)")
    print(f"  GS games-like-minefun: {len(gs.get('games like minefun', []))} (target: 5)")
    print(f"  Poki likes: {poki.get('likes', 'N/A')}")
    print(f"  Blog prod: {prod_ok}/5")
    print(f"  GSC: {gsc['status']}")

    return master


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", help="YYYY-MM-DD (default: today CST)")
    args = parser.parse_args()
    collect(args.date)
