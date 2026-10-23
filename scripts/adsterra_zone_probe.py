#!/usr/bin/env python3
"""
Adsterra zone liveness probe — R987 (2026-10-23)

WHY THIS EXISTS
---------------
`adsterra-manager.js::probeCdn()` probes each Adsterra zone from the browser
with `fetch(url, {mode:'no-cors'})`. A no-cors fetch resolves on **any** HTTP
response and returns an *opaque* response — the body and status code are
unreadable by design. So the probe reports `status:'reachable'` for:

  * a healthy zone serving real ad HTML
  * the 118-byte "Anonymous Proxy detected." policy-block page  (HTTP 200!)
  * HTTP 403 / 404 / 410 (revoked key, publisher suspension)
  * HTTP 500 from a dead origin

All four are indistinguishable from inside the browser. Measured on this host
2026-10-23 12:40 UTC, both zones return:

    HTTP/1.1 200 OK
    Content-Type: text/html
    Content-Length: 118
    <!DOCTYPE html>...<p>Anonymous Proxy detected.</p>

i.e. `reachable` was a **false green** on a response that serves no ad at all.
`cdn_health` is the largest gz_ad_event type (11,019/7d) and the Adsterra cron
prompt (9488d0a3a7d6) reads it as a zone-liveness gate, so a total zone outage
would have stayed green.

This probe is the server-side half: a plain HTTP GET with browser-shaped
headers *can* read the body, so it produces a real 4-state verdict.

VERDICTS
--------
  zone_ok            HTTP 200, no policy-block / block-page marker in body
  blocked_by_policy  HTTP 200 but body is a block/deny page  <- the false green
  zone_blocked       HTTP 4xx/5xx (revoked key, suspension, dead origin)
  down               DNS failure / TCP refused / TLS error (transport never spoke)

IMPORTANT INTERPRETATION RULE
-----------------------------
`blocked_by_policy` means **this host's IP is blocked**, NOT that the zone is
dead for users. Residential browsers are served normally (proven by BI: real
`fill` events with real browser UAs). Never report `blocked_by_policy` as an
Adsterra outage — report it as "cannot verify from this host".

OUTPUT
------
  ~/.hermes/state/adsterra-zone-probe.json   last verdict (for cron gates)
  stdout                                     human summary + `VERDICT=` lines
"""

import json
import os
import re
import ssl
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
MANAGER = os.path.join(REPO, "adsterra-manager.js")
STATE = os.path.join(os.path.expanduser("~"), ".hermes", "state", "adsterra-zone-probe.json")

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")
REFERER = "https://gamezipper.com/"

# Markers that mean "an HTTP 200 that serves no ad". Lower-cased match.
BLOCK_MARKERS = (
    "anonymous proxy detected",
    "proxy detected",
    "access denied",
    "forbidden",
    "not authorized",
    "your ip has been",
    "blocked by policy",
    "bot detected",
    "verify you are not a robot",
    "captcha",
    "cloudflare error",
    "error 1015",
)

TIMEOUT = 20
RETRIES = 2
BACKOFF = 1.5


def load_zones():
    """Parse zone URLs + keys straight out of adsterra-manager.js so the probe
    can never drift from the code that actually serves ads."""
    try:
        src = open(MANAGER, encoding="utf-8").read()
    except OSError as e:
        return None, f"cannot read {MANAGER}: {e}"
    zones = {}
    patterns = {
        "popunder": r"var\s+POPUNDER_URL\s*=\s*'([^']+)'",
        "smartlink": r"var\s+SMARTLINK_URL\s*=\s*'([^']+)'",
    }
    for name, pat in patterns.items():
        m = re.search(pat, src)
        if not m:
            return None, f"POPUNDER_URL/SMARTLINK_URL not found in adsterra-manager.js ({name})"
        zones[name] = m.group(1)
    m = re.search(r"var\s+ZONES\s*=\s*\{([^}]*)\}", src, re.S)
    if m:
        for k, v in re.findall(r"(\w+)\s*:\s*'([^']+)'", m.group(1)):
            if k in zones:
                zones[k + "_id"] = v
    return zones, None


def classify(code, body_lower, transport_ok=True):
    if not transport_ok:
        return "down"
    if code is None:
        return "down"
    if 200 <= code < 300:
        for mk in BLOCK_MARKERS:
            if mk in body_lower:
                return "blocked_by_policy"
        return "zone_ok"
    return "zone_blocked"


def probe(name, url, id_):
    sep = "&" if "?" in url else "?"
    target = f"{url}{sep}gzprobe={int(time.time() * 1000)}"
    req = urllib.request.Request(target, method="GET", headers={
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": REFERER,
        "Sec-Fetch-Dest": "script",
        "Sec-Fetch-Mode": "no-cors",
        "Sec-Fetch-Site": "cross-site",
        "Cache-Control": "no-cache",
    })
    ctx = ssl.create_default_context()
    last_err = None
    for attempt in range(RETRIES + 1):
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT, context=ctx) as r:
                raw = r.read(64 * 1024)
                code = r.getcode()
                ctype = r.headers.get("Content-Type", "")
                clen = r.headers.get("Content-Length", "")
            body = raw.decode("utf-8", "replace").lower()
            verdict = classify(code, body)
            hit = next((mk for mk in BLOCK_MARKERS if mk in body), None)
            return {
                "zone": id_ or name,
                "name": name,
                "verdict": verdict,
                "http": code,
                "content_type": ctype,
                "content_length": clen,
                "bytes": len(raw),
                "block_marker": hit,
                "attempt": attempt + 1,
                "ts": datetime.now(timezone.utc).isoformat(),
                "url": url,
            }
        except urllib.error.HTTPError as e:
            # An HTTP error IS a spoken transport: read it and classify.
            try:
                raw = e.read(4096)
            except Exception:
                raw = b""
            body = raw.decode("utf-8", "replace").lower()
            verdict = classify(e.code, body)
            return {
                "zone": id_ or name,
                "name": name,
                "verdict": verdict,
                "http": e.code,
                "content_type": e.headers.get("Content-Type", "") if e.headers else "",
                "content_length": "",
                "bytes": len(raw),
                "block_marker": next((mk for mk in BLOCK_MARKERS if mk in body), None),
                "attempt": attempt + 1,
                "ts": datetime.now(timezone.utc).isoformat(),
                "url": url,
                "err": f"HTTPError {e.code}",
            }
        except Exception as e:
            last_err = f"{type(e).__name__}: {e}"
            if attempt < RETRIES:
                time.sleep(BACKOFF * (attempt + 1))
                continue
            return {
                "zone": id_ or name,
                "name": name,
                "verdict": "down",
                "http": None,
                "content_type": "",
                "content_length": "",
                "bytes": 0,
                "block_marker": None,
                "attempt": attempt + 1,
                "ts": datetime.now(timezone.utc).isoformat(),
                "url": url,
                "err": last_err,
            }


def main():
    zones, err = load_zones()
    if err:
        print(f"❌ adsterra_zone_probe: {err}")
        return 2

    assert zones is not None  # guarded by `err` check above
    results = [probe(n, zones[n], zones.get(n + "_id")) for n in ("popunder", "smartlink")]

    ICON = {
        "zone_ok": "✅",
        "blocked_by_policy": "🛡️",
        "zone_blocked": "🚫",
        "down": "❌",
    }
    print(f"🔎 Adsterra zone probe — {datetime.now(timezone.utc).isoformat()}")
    for r in results:
        print(f"  {ICON.get(r['verdict'], '?')} zone {r['zone']} ({r['name']}): "
              f"{r['verdict']}  http={r['http']} bytes={r['bytes']} "
              f"ctype={r['content_type'][:30]}"
              + (f"  marker={r['block_marker']!r}" if r['block_marker'] else "")
              + (f"  err={r['err']}" if r.get("err") else ""))
    for r in results:
        print(f"VERDICT zone={r['zone']} {r['verdict']} http={r['http']} bytes={r['bytes']}")

    verdicts = {r["verdict"] for r in results}
    if verdicts == {"zone_ok"}:
        overall = "zone_ok"
        note = "both zones serve real ad HTML from this host"
    elif verdicts <= {"zone_ok", "blocked_by_policy"}:
        overall = "blocked_by_policy"
        note = ("zone serves HTTP 200 but body is a block page FROM THIS HOST's IP. "
                "This is NOT a user-facing outage — do not page on it.")
    elif "zone_blocked" in verdicts or "down" in verdicts:
        overall = "zone_unhealthy"
        note = "at least one zone returned HTTP error or failed transport"
    else:
        overall = "mixed"
        note = ", ".join(sorted(verdicts))

    payload = {
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "overall": overall,
        "note": note,
        "zones": results,
    }
    try:
        os.makedirs(os.path.dirname(STATE), exist_ok=True)
        tmp = STATE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as fh:
            json.dump(payload, fh, indent=2, ensure_ascii=False)
        os.replace(tmp, STATE)
    except Exception as e:
        print(f"⚠️ could not write {STATE}: {e}")

    print(f"OVERALL {overall} — {note}")
    print(f"STATE {STATE}")
    # exit 0 for every "server answered" verdict; only a total transport failure
    # is a script-level failure worth a cron non-zero exit.
    return 0


if __name__ == "__main__":
    sys.exit(main())