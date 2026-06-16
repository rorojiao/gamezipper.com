#!/usr/bin/env python3
"""Submit only the 10 new /zh/blog/ URLs to IndexNow endpoints.

Created 2026-06-16 for kanban t_38208efa — capturing Chinese AI search traffic
(Doubao/文心/通义/Kimi). Submits only the new zh URLs (not all 660 sitemap URLs)
because:
1. They're brand-new, so engines need explicit notification
2. Smaller batch = faster result
3. Sitemap-level submission happens daily via indexnow-full-submit.py daily mode

Endpoints (in priority order):
  bing.com/indexnow          — primary, powers cn.bing.com
  yandex.com/indexnow        — Russian, but shared IndexNow network
  api.indexnow.org           — shared fallback
"""
import sys, time
from datetime import datetime
from curl_cffi import requests as cc_requests

HOST = "gamezipper.com"
KEY = "gamezipper2026indexnow"
KEY_LOC = "https://gamezipper.com/indexnowkey.txt"

# Endpoints (v6.1 priority from indexnow-full-submit.py)
ENDPOINTS = [
    "https://www.bing.com/indexnow",
    "https://yandex.com/indexnow",
    "https://searchadvisor.naver.com/indexnow",
    "https://search.seznam.cz/indexnow",
    "https://api.indexnow.org/indexnow",
]

URLS_FILE = "/home/msdn/gamezipper.com/scripts/zh_blog_urls.txt"


def load_urls(path):
    with open(path) as f:
        return [line.strip() for line in f if line.strip().startswith("http")]


def submit(urls, endpoint):
    payload = {
        "host": HOST,
        "key": KEY,
        "keyLocation": KEY_LOC,
        "urlList": urls,
    }
    try:
        resp = cc_requests.post(
            endpoint, json=payload, timeout=30, impersonate="chrome120"
        )
        return resp.status_code, None
    except Exception as e:
        return 0, str(e)


def main():
    urls = load_urls(URLS_FILE)
    print(f"[{datetime.now().isoformat()}] IndexNow ZH submission")
    print(f"Host: {HOST}")
    print(f"URLs: {len(urls)}")
    print("=" * 60)

    # First verify URLs are live
    print("\n🔍 Pre-flight: verify URLs return 200")
    live = 0
    for u in urls:
        try:
            r = cc_requests.get(u, timeout=15, impersonate="chrome120", allow_redirects=True)
            if r.status_code == 200:
                live += 1
                print(f"   ✅ {r.status_code}  {u}")
            else:
                print(f"   ⚠️  {r.status_code}  {u}")
        except Exception as e:
            print(f"   ❌ ERR {u}: {e}")
    print(f"   Live: {live}/{len(urls)}")
    if live < len(urls):
        print(f"   ⚠️  {len(urls)-live} URLs not live yet — may fail IndexNow validation")

    # Submit to endpoints
    print(f"\n📤 Submitting to {len(ENDPOINTS)} endpoints...")
    for endpoint in ENDPOINTS:
        name = endpoint.split("//")[1].split("/")[0]
        status, err = submit(urls, endpoint)
        if 200 <= status < 300:
            print(f"   ✅ {name}: HTTP {status} (success)")
            print(f"   ⏭️  Stopping — IndexNow auto-distributes from winning endpoint")
            # Save success log
            log = f"{datetime.now().isoformat()}  {name} HTTP {status}  {len(urls)} URLs\n"
            with open("/home/msdn/gamezipper.com/scripts/indexnow_submitted_2026-06-16_zh.txt", "a") as f:
                f.write(log)
                for u in urls:
                    f.write(f"  {u}\n")
            return 0
        else:
            print(f"   ↳ {name}: HTTP {status} ({err})")
        time.sleep(0.5)

    print("\n❌ All endpoints failed")
    return 1


if __name__ == "__main__":
    sys.exit(main())
