#!/usr/bin/env python3
"""
Daily SEO Health Check for GameZipper
Checks: robots.txt, sitemap.xml, IndexNow key, site accessibility, HTTP status
"""
import urllib.request
import urllib.error
import ssl
import json
import sys
from datetime import datetime, date

SITES = {
    "gamezipper.com": "https://gamezipper.com",
    "tools.gamezipper.com": "https://tools.gamezipper.com",
}

INDEXNOW_KEYS = {
    "gamezipper.com": "gamezipper2026indexnow",
    "tools.gamezipper.com": "b7e3f8c2d1a94b5e",
}

def check_url(url, name, follow_redirects=False):
    """Check URL accessibility and status code."""
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    try:
        if follow_redirects:
            req = urllib.request.Request(url)
            req.timeout = 15
            resp = urllib.request.urlopen(req, context=ctx)
            final_url = resp.url
            status = resp.status
        else:
            class NoRedirect(urllib.request.HTTPRedirectHandler):
                def redirect_request(self, req, fp, code, msg, headers, newurl):
                    return None
            opener = urllib.request.build_opener(NoRedirect())
            req = urllib.request.Request(url)
            req.timeout = 15
            resp = opener.open(req, context=ctx)
            final_url = resp.url
            status = resp.status
        content = resp.read(500).decode('utf-8', errors='ignore')
        return {"url": url, "name": name, "status": status, "final_url": final_url, "content_preview": content[:200], "ok": True, "error": None}
    except urllib.error.HTTPError as e:
        return {"url": url, "name": name, "status": e.code, "final_url": None, "content_preview": None, "ok": False, "error": f"HTTP {e.code}"}
    except Exception as e:
        return {"url": url, "name": name, "status": None, "final_url": None, "content_preview": None, "ok": False, "error": str(e)}

def main():
    today = date.today().isoformat()
    results = {"date": today, "site_checks": {}, "issues": [], "summary": []}
    
    for site, base_url in SITES.items():
        checks = {}
        
        # 1. robots.txt
        robots = check_url(f"{base_url}/robots.txt", "robots.txt")
        checks["robots_txt"] = robots
        if robots["ok"] and robots["status"] == 200:
            results["summary"].append(f"[OK] {site}/robots.txt → {robots['status']}")
        else:
            results["issues"].append(f"[CRITICAL] {site}/robots.txt failed: {robots.get('error') or robots.get('status')}")
            results["summary"].append(f"[FAIL] {site}/robots.txt → {robots.get('status') or 'ERROR'}")
        
        # 2. sitemap.xml (no follow)
        sitemap = check_url(f"{base_url}/sitemap.xml", "sitemap.xml", follow_redirects=False)
        checks["sitemap_xml"] = sitemap
        if sitemap["ok"] and sitemap["status"] == 200:
            results["summary"].append(f"[OK] {site}/sitemap.xml → {sitemap['status']}")
        elif sitemap.get("status") == 301 and sitemap.get("final_url") == f"{base_url}/sitemap.xml":
            results["issues"].append(f"[CRITICAL] {site}/sitemap.xml redirect loop: 301 to itself")
            results["summary"].append(f"[CRITICAL] {site}/sitemap.xml → 301 redirect loop")
        else:
            results["issues"].append(f"[WARN] {site}/sitemap.xml returned {sitemap.get('status')}")
            results["summary"].append(f"[WARN] {site}/sitemap.xml → {sitemap.get('status')}")
        
        # 3. IndexNow key URL
        key_name = INDEXNOW_KEYS.get(site, "unknown")
        key_url = f"{base_url}/indexnowkey.txt"
        key = check_url(key_url, "indexnowkey.txt", follow_redirects=False)
        checks["indexnow_key"] = key
        if key["ok"] and key["status"] == 200:
            content = key.get("content_preview", "")
            if key_name in content:
                results["summary"].append(f"[OK] {site}/indexnowkey.txt → {key['status']} (key: {key_name})")
            else:
                results["issues"].append(f"[WARN] {site}/indexnowkey.txt content mismatch, expected: {key_name}")
                results["summary"].append(f"[WARN] {site}/indexnowkey.txt content mismatch")
        elif key.get("status") == 301 and key.get("final_url") == key_url:
            results["issues"].append(f"[CRITICAL] {site}/indexnowkey.txt redirect loop: key URL not accessible")
            results["summary"].append(f"[CRITICAL] {site}/indexnowkey.txt → 301 redirect loop")
        else:
            results["issues"].append(f"[WARN] {site}/indexnowkey.txt returned {key.get('status')}: {key.get('error')}")
            results["summary"].append(f"[WARN] {site}/indexnowkey.txt → {key.get('status') or 'ERROR'}")
        
        # 4. Homepage
        home = check_url(base_url, "homepage", follow_redirects=False)
        checks["homepage"] = home
        if home["ok"] and home["status"] in (200, 301):
            if home["status"] == 301 and home.get("final_url") == base_url:
                results["issues"].append(f"[CRITICAL] {site} homepage redirect loop: 301 to itself")
                results["summary"].append(f"[CRITICAL] {site}/ → 301 redirect loop")
            elif home["status"] == 200:
                results["summary"].append(f"[OK] {site}/ → {home['status']}")
            else:
                results["issues"].append(f"[WARN] {site}/ returned unexpected status: {home['status']}")
        else:
            results["issues"].append(f"[CRITICAL] {site}/ inaccessible: {home.get('error')}")
            results["summary"].append(f"[FAIL] {site}/ → {home.get('status') or 'ERROR'}")
        
        # 5. Test a game page (for gamezipper.com)
        if site == "gamezipper.com":
            game = check_url(f"{base_url}/2048/", "game page", follow_redirects=False)
            checks["game_page"] = game
            if game["ok"] and game["status"] == 200:
                results["summary"].append(f"[OK] {site}/2048/ → {game['status']}")
            elif game.get("status") == 301 and game.get("final_url", "").endswith("/2048/"):
                results["issues"].append(f"[CRITICAL] {site}/2048/ redirect loop")
                results["summary"].append(f"[CRITICAL] {site}/2048/ → 301 redirect loop")
            else:
                results["issues"].append(f"[WARN] {site}/2048/ returned {game.get('status')}")
        
        results["site_checks"][site] = checks
    
    # Print report
    print(f"\n{'='*60}")
    print(f"SEO Health Check - {today}")
    print(f"{'='*60}")
    for line in results["summary"]:
        print(line)
    
    if results["issues"]:
        print(f"\n{len(results['issues'])} ISSUE(S) FOUND:")
        for issue in results["issues"]:
            print(f"  ⚠️  {issue}")
    else:
        print("\n✅ All checks passed!")
    
    # Save JSON report
    report_path = f"/home/msdn/gamezipper.com/scripts/seo_health_report_{today}.json"
    with open(report_path, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\nReport saved: {report_path}")
    
    return 0 if not results["issues"] else 1

if __name__ == "__main__":
    sys.exit(main())
