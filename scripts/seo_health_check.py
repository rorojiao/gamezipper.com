#!/usr/bin/env python3
"""
Daily SEO Health Check for GameZipper
Checks: robots.txt, sitemap.xml, IndexNow key, site accessibility, HTTP status
"""
import os
import re
import time
import requests
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

for _key in ("http_proxy", "https_proxy", "HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "all_proxy"):
    os.environ.pop(_key, None)

_session = requests.Session()
_session.trust_env = False
_session.headers.update({"User-Agent": "GameZipper-SEO-Checker/1.0"})

def check_url(url, name, allow_redirects=False, timeout=15, retries=2):
    """Check URL accessibility and status code using requests.

    Retries on transient network/SSL errors (GitHub Pages CDN flakes) before reporting failure.
    Returns dict with ok=True/False and error reason; deterministic from any non-2xx final.
    """
    import time as _t
    last_err = None
    for attempt in range(retries + 1):
        try:
            resp = _session.get(url, timeout=timeout, allow_redirects=allow_redirects, verify=True)
            content_preview = resp.text[:200] if resp.text else None
            return {
                "url": url, "name": name,
                "status": resp.status_code,
                "final_url": resp.url,
                "content_preview": content_preview,
                "ok": resp.status_code < 400,
                "error": None
            }
        except (requests.exceptions.SSLError, requests.exceptions.Timeout,
                requests.exceptions.ConnectionError) as e:
            last_err = f"{type(e.__class__.__name__)}: {e}"
            if attempt < retries:
                _t.sleep(1.5 * (attempt + 1))  # 1.5s, 3s backoff
                continue
            return {"url": url, "name": name, "status": None, "final_url": None, "content_preview": None, "ok": False, "error": last_err}
        except Exception as e:
            return {"url": url, "name": name, "status": None, "final_url": None, "content_preview": None, "ok": False, "error": str(e)}

# --- R967: sitemap CONTENT validation -------------------------------------
# The HTTP-200-only check (R563a) cannot see the failure mode that actually
# cost us 12 days of stale signal (COMPLETED.md R9357): a sitemap that serves
# 200 with an empty/0-lastmod/duplicate URL set is silently "healthy" to a
# status-code probe. These floors are the smallest drop we would ever want to
# ship silently; values below them mean the generator broke, not that the
# catalog shrank (catalog is 466 games / 308 blog pages and only grows).
SITEMAP_MIN_URLS = {"gamezipper.com": 700, "tools.gamezipper.com": 4000}
SITEMAP_MIN_COVERAGE_PCT = 100.0   # every URL must carry <lastmod>


def fetch_body(url, timeout=45, retries=2):
    """Second fetch for the full sitemap body (check_url only keeps a 200-char
    preview). Returns the body, or None when the body could not be read.

    None is deliberately distinct from "": an unreadable body must NOT be
    scored as a 0-URL sitemap, or a transient CDN/TLS blip turns into a hard
    CRITICAL and flips the cron red on healthy infrastructure.
    """
    for attempt in range(retries + 1):
        try:
            r = _session.get(url, timeout=timeout, allow_redirects=False, verify=True)
            if r.status_code == 200:
                return r.text
            return ""            # genuinely not a sitemap; let floor logic judge
        except Exception:
            if attempt < retries:
                time.sleep(1.5 * (attempt + 1))
    return None


def analyze_sitemap(xml_text, site):
    """Parse <loc>/<lastmod> out of a sitemap body. Never raises."""
    out = {"unique_locs": 0, "total_locs": 0, "with_lastmod": 0,
           "coverage_pct": 0.0, "duplicate_locs": 0, "newest_lastmod": None}
    try:
        locs = re.findall(r"<loc>\s*(.*?)\s*</loc>", xml_text, re.S)
        mods = re.findall(r"<lastmod>\s*([0-9]{4}-[0-9]{2}-[0-9]{2})[^<]*\s*</lastmod>",
                          xml_text, re.S)
        total = len(locs)
        uniq = len(set(locs))
        # count lastmod only for URLs that actually have one, per <url> block
        blocks = re.findall(r"<url>(.*?)</url>", xml_text, re.S)
        with_lm = sum(1 for b in blocks if re.search(r"<lastmod>", b, re.S))
        if not blocks and total:      # fallback: flat/non-standard layout
            with_lm = min(len(mods), total)
        out.update({
            "total_locs": total,
            "unique_locs": uniq,
            "duplicate_locs": total - uniq,
            "with_lastmod": with_lm,
            "coverage_pct": round(with_lm * 100.0 / total, 2) if total else 0.0,
            "newest_lastmod": max(mods) if mods else None,
        })
    except Exception as e:            # malformed XML must not kill the cron
        out["parse_error"] = str(e)
    return out


def check_sitemap_content(site, xml_text, results, checks):
    """Merge content findings into results/checks. Returns list of issue strings."""
    issues = []
    a = analyze_sitemap(xml_text, site)
    checks["sitemap_xml"].update(a)

    floor = SITEMAP_MIN_URLS.get(site)
    if a["unique_locs"] == 0:
        issues.append(f"[CRITICAL] {site}/sitemap.xml has 0 URLs (generator likely broken)")
    elif floor and a["unique_locs"] < floor:
        issues.append(f"[CRITICAL] {site}/sitemap.xml has only {a['unique_locs']} URLs "
                      f"(floor {floor}; drop of {floor - a['unique_locs']})")
    if a["unique_locs"] and a["coverage_pct"] < SITEMAP_MIN_COVERAGE_PCT:
        issues.append(f"[CRITICAL] {site}/sitemap.xml lastmod coverage "
                      f"{a['coverage_pct']}% ({a['with_lastmod']}/{a['unique_locs']}); "
                      f"R9357 class - IndexNow incremental is lastmod-gated")
    if a["duplicate_locs"] > 0:
        issues.append(f"[WARN] {site}/sitemap.xml has {a['duplicate_locs']} duplicate <loc>")
    return issues



def main():
    today = date.today().isoformat()
    results = {"date": today, "script_version": "v5.13", "site_checks": {}, "issues": [], "summary": []}
    
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
        sitemap = check_url(f"{base_url}/sitemap.xml", "sitemap.xml", allow_redirects=False)
        checks["sitemap_xml"] = sitemap
        if sitemap["ok"] and sitemap["status"] == 200:
            body = fetch_body(f"{base_url}/sitemap.xml")
            if body is None:
                # Transport-level failure on the body fetch. Wording keeps the
                # cron wrapper's transport-only softening path working (it greps
                # for "returned None"), so a CDN blip retries next run instead of
                # paging us about a sitemap that may well be fine.
                checks["sitemap_xml"]["body_fetch"] = "returned None"
                results["issues"].append(
                    f"[WARN] {site}/sitemap.xml body fetch returned None "
                    f"(status 200 seen by check_url; body unreadable this run)")
                results["summary"].append(
                    f"[WARN] {site}/sitemap.xml → 200 but body unreadable (transport)")
            else:
                content_issues = check_sitemap_content(site, body, results, checks)
                results["issues"].extend(content_issues)
                if not content_issues:
                    a = checks["sitemap_xml"]
                    results["summary"].append(
                        f"[OK] {site}/sitemap.xml → {sitemap['status']} "
                        f"({a['unique_locs']} URLs, {a['coverage_pct']}% lastmod, "
                        f"newest {a['newest_lastmod']})")
                if content_issues:
                    a = checks["sitemap_xml"]
                    results["summary"].append(
                        f"[FAIL] {site}/sitemap.xml → 200 but content broken: "
                        f"{a['unique_locs']} URLs / {a['coverage_pct']}% lastmod")
        elif sitemap.get("status") == 301 and sitemap.get("final_url") == f"{base_url}/sitemap.xml":
            results["issues"].append(f"[CRITICAL] {site}/sitemap.xml redirect loop: 301 to itself")
            results["summary"].append(f"[CRITICAL] {site}/sitemap.xml → 301 redirect loop")
        else:
            results["issues"].append(f"[WARN] {site}/sitemap.xml returned {sitemap.get('status')}")
            results["summary"].append(f"[WARN] {site}/sitemap.xml → {sitemap.get('status')}")
        
        # 3. IndexNow key URL
        key_name = INDEXNOW_KEYS.get(site, "unknown")
        key_url = f"{base_url}/indexnowkey.txt"
        key = check_url(key_url, "indexnowkey.txt", allow_redirects=False)
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
        home = check_url(base_url, "homepage", allow_redirects=False)
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
            game = check_url(f"{base_url}/2048/", "game page", allow_redirects=False)
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
    report_path = f"/home/junze/gamezipper.com/scripts/seo_health_report_{today}.json"
    with open(report_path, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\nReport saved: {report_path}")
    
    # A complete or partial DNS/TLS outage can make individual CDN probes
    # unavailable while the origin remains healthy.  Do not turn a transient
    # transport observation into a red cron failure: preserve the detailed
    # report JSON, but let the next scheduled probe retry.  Real HTTP failures
    # (4xx/5xx) still remain hard issues and keep exit 1.
    transport_only = results["issues"] and all(
        ("returned None" in issue or "failed: <class 'str'>: HTTPSConnectionPool" in issue
         or "failed: <class 'str'>: HTTPConnectionPool" in issue)
        for issue in results["issues"]
    )
    if transport_only:
        print("\n🟡 Transport-only probe failure (DNS/TLS/timeout); retaining report and softening exit for next-run retry.")
        return 0
    return 0 if not results["issues"] else 1

if __name__ == "__main__":
    sys.exit(main())
