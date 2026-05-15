#!/usr/bin/env python3
"""Phase 3: Commercial Standards Batch Check"""
import urllib.request, re, sys, json, time
from datetime import datetime

BASE = "https://gamezipper.com"

games = sorted(set([
    "2048","sudoku","crossword","nonogram","minesweeper","word-puzzle","pipe-connect",
    "pixel-logic","memory-match","jigsaw-puzzle","color-sort","chess","tetris","snake",
    "flappy-wings","slope","neon-run","whack-a-mole","reaction-time","idle-clicker",
    "parking-jam","tile-dynasty","triple-tile","ball-catch","brick-breaker",
    "fruit-slash","marble-run","watermelon-merge","little-alchemy","sushi-stack",
    "dessert-blast","bubble-pop","stacker","typing-speed","wordscapes",
    "tangram","magic-sort","wood-block-puzzle","hex-block","flow-connect",
    "fill-fridge","bolt-jam-3d","impossible-quiz","solitaire","pong"
]))

results = []
for game in games:
    r = {"game": game}
    try:
        req = urllib.request.Request(f"{BASE}/{game}/", headers={"User-Agent": "Mozilla/5.0 Chrome/120"})
        resp = urllib.request.urlopen(req, timeout=8)
        html = resp.read().decode("utf-8", errors="ignore")
        r["http"] = resp.status
        r["size"] = len(html)
        
        # SEO checks
        title_m = re.search(r'<title[^>]*>(.*?)</title>', html, re.I)
        r["title"] = title_m.group(1).strip() if title_m else ""
        r["has_title"] = bool(r["title"])
        
        meta_m = re.search(r'<meta[^>]+name=["\x27]description["\x27][^>]+content=["\x27](.*?)["\x27]', html, re.I)
        if not meta_m:
            meta_m = re.search(r'<meta[^>]+content=["\x27](.*?)["\x27][^>]+name=["\x27]description["\x27]', html, re.I)
        r["meta_desc"] = meta_m.group(1).strip() if meta_m else ""
        r["has_meta_desc"] = len(r["meta_desc"]) > 50
        
        r["og_title"] = bool(re.search(r'og:title', html))
        r["og_desc"] = bool(re.search(r'og:description', html))
        r["og_image"] = bool(re.search(r'og:image', html))
        r["canonical"] = bool(re.search(r'<link[^>]+rel=["\x27]canonical["\x27]', html))
        r["json_ld"] = bool(re.search(r'application/ld\+json', html))
        r["h1"] = bool(re.search(r'<h1[^>]*>', html))
        r["viewport"] = bool(re.search(r'viewport', html))
        
        # Monetag
        r["monetag"] = bool(re.search(r'monetag-manager\.js', html))
        
        # Touch events
        r["touch"] = bool(re.search(r'touchstart|touchmove|touchend|ontouchstart', html))
        
        # Home link
        r["home_link"] = bool(re.search(r'href=["\x27]https?://gamezipper\.com/?["\x27]', html))
        
        # Responsive (media queries)
        r["media_query"] = bool(re.search(r'@media', html))
        
    except Exception as e:
        r["http"] = 0
        r["error"] = str(e)[:80]
    
    results.append(r)
    status = "✅" if r.get("http") == 200 else "❌"
    print(f"  {status} {game:25s} title={r.get('has_title')} meta={r.get('has_meta_desc')} og_img={r.get('og_image')} monetag={r.get('monetag')} touch={r.get('touch')} home={r.get('home_link')}", flush=True)

# Sitemap & robots
print("\n--- Sitemap & Robots ---")
for url in [f"{BASE}/sitemap.xml", f"{BASE}/robots.txt"]:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 Chrome/120"})
        resp = urllib.request.urlopen(req, timeout=8)
        content = resp.read().decode("utf-8", errors="ignore")
        lines = content.strip().split("\n")
        print(f"  ✅ {url} ({len(content)} bytes, {len(lines)} lines)")
    except Exception as e:
        print(f"  ❌ {url}: {e}")

# Summary
print("\n--- Summary ---")
total = len(results)
passed = sum(1 for r in results if r.get("http") == 200)
print(f"Games checked: {total}, HTTP 200: {passed}")

# Count issues
issues = {}
for key, label in [("has_title","Title"),("has_meta_desc","Meta>50"),("og_image","og:image"),
                    ("canonical","Canonical"),("json_ld","JSON-LD"),("h1","H1"),
                    ("viewport","Viewport"),("monetag","Monetag"),("touch","Touch"),
                    ("home_link","Home Link"),("media_query","Media Query")]:
    missing = sum(1 for r in results if r.get("http")==200 and not r.get(key))
    if missing > 0:
        issues[label] = missing
        missing_games = [r["game"] for r in results if r.get("http")==200 and not r.get(key)]
        print(f"  ⚠️ {label}: {missing} missing ({', '.join(missing_games)})")

if not issues:
    print("  ✅ All checks passed!")

# Save results
out = f"/home/msdn/gamezipper.com/tests/results/phase3-{datetime.now().strftime('%m%d-%H%M')}.json"
with open(out, 'w') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)
print(f"\n📄 Results saved: {out}")
