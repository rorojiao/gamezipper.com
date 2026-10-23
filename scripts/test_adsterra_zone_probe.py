#!/usr/bin/env python3
"""R987 negative-control test for adsterra_zone_probe.py.

A detector that cannot detect anything is worse than no detector. This spins up
a local HTTP server that plays each of the four real-world outcomes and asserts
classify() calls each one correctly — including the case the browser-side
no-cors probe structurally CANNOT see (HTTP 200 + block-page body).

Run:  python3 scripts/test_adsterra_zone_probe.py
Exit 0 = all cases PASS.
"""
import importlib.util
import os
import sys
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("azp", os.path.join(HERE, "adsterra_zone_probe.py"))
assert spec is not None and spec.loader is not None
azp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(azp)

REAL_AD = (b"<!DOCTYPE html><html><head><title>Ad</title></head><body>"
           b"<script>window.open=1</script></body></html>")
BLOCK_PAGE = b"<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"></head><body><p>Anonymous Proxy detected.</p></body></html>"


class Handler(BaseHTTPRequestHandler):
    mode = "healthy"

    def do_GET(self):
        m = self.path.split("?")[0]
        if self.mode == "healthy":
            body, code, ctype = REAL_AD, 200, "text/html"
        elif self.mode == "blocked":
            body, code, ctype = BLOCK_PAGE, 200, "text/html"
        elif self.mode == "revoked":
            body, code, ctype = b"Forbidden", 403, "text/html"
        elif self.mode == "dead":
            body, code, ctype = b"", 500, "text/html"
        elif self.mode == "captcha":
            body, code, ctype = b"<html>Please complete the captcha</html>", 200, "text/html"
        else:
            body, code, ctype = b"?", 404, "text/html"
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        if body:
            self.wfile.write(body)

    def log_message(self, format, *args):
        pass


CASES = [
    ("healthy", "zone_ok", "real ad HTML on HTTP 200 must be green"),
    ("blocked", "blocked_by_policy", "HTTP 200 + 118-byte deny page must NOT be green"),
    ("captcha", "blocked_by_policy", "HTTP 200 + captcha wall must NOT be green"),
    ("revoked", "zone_blocked", "HTTP 403 (revoked key) must be red"),
    ("dead", "zone_blocked", "HTTP 500 (dead origin) must be red"),
]


def main():
    srv = HTTPServer(("127.0.0.1", 0), Handler)
    port = srv.server_address[1]
    t = threading.Thread(target=srv.serve_forever, daemon=True)
    t.start()
    base = f"http://127.0.0.1:{port}/zone?key=testkey"

    setattr(azp, "RETRIES", 0)  # keep the test fast; retry logic exercised by the real run
    failures = []
    print(f"R987 negative-control test (server on 127.0.0.1:{port})\n")

    for mode, want, why in CASES:
        Handler.mode = mode
        r = azp.probe(mode, base, "999")
        ok = r["verdict"] == want
        print(f"  {'PASS' if ok else 'FAIL'}  {mode:<9} -> {r['verdict']:<18} (want {want:<18}) http={r['http']} bytes={r['bytes']}")
        if not ok:
            failures.append(f"{mode}: got {r['verdict']} want {want} — {why}")
    # marker must be surfaced for forensics
    Handler.mode = "blocked"
    r = azp.probe("blocked", base, "999")
    if r["block_marker"] != "anonymous proxy detected":
        failures.append(f"block_marker not surfaced: {r['block_marker']!r}")
    else:
        print(f"  PASS  marker surfaced: {r['block_marker']!r}")

    # transport failure must classify as down
    r = azp.probe("down", "http://127.0.0.1:1/nope?key=x", "999")
    print(f"  {'PASS' if r['verdict'] == 'down' else 'FAIL'}  down       -> {r['verdict']:<18} (want down)            err={str(r.get('err'))[:40]}")
    if r["verdict"] != "down":
        failures.append(f"transport failure got {r['verdict']} want down")

    srv.shutdown()

    print()
    if failures:
        print(f"❌ {len(failures)} case(s) FAILED:")
        for f in failures:
            print(f"   - {f}")
        return 1
    print(f"✅ all {len(CASES) + 2} cases PASS — probe detects healthy, policy-blocked, "
          f"403, 500 and transport failure")
    return 0


if __name__ == "__main__":
    sys.exit(main())