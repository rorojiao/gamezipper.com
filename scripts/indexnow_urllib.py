#!/usr/bin/env python3
"""Submit GameZipper sitemap URLs to IndexNow using only stdlib."""
import json
import os
import ssl
import sys
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET

SITEMAP = "https://gamezipper.com/sitemap.xml"
ENDPOINTS = ("https://www.bing.com/indexnow", "https://api.indexnow.org/indexnow")
KEY = "gamezipper2026indexnow"

for key in ("http_proxy", "https_proxy", "HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "all_proxy"):
    os.environ.pop(key, None)
OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))

# R660/R658 transient international TLS handshake flapping: retry on transport errors
# (URLError, TimeoutError, ssl.SSLError) before declaring failure. Mirror R563a pattern
# in seo_health_check.py: 2 retries with 1.5s/3s backoff.
_RETRIABLE = (urllib.error.URLError, TimeoutError, ssl.SSLError, ConnectionError, OSError)
_RETRIES = 2  # total attempts = 3 (1 initial + 2 retries)


def _open_with_retry(req, timeout=30):
    last_err = None
    for attempt in range(_RETRIES + 1):
        try:
            resp = OPENER.open(req, timeout=timeout)
            if resp is not None:
                return resp
            last_err = RuntimeError("OPENER.open returned None")
        except _RETRIABLE as exc:
            last_err = exc
        if attempt < _RETRIES:
            time.sleep(1.5 * (attempt + 1))  # 1.5s, 3s backoff
            continue
        raise RuntimeError(f"transport failed after {_RETRIES + 1} attempts: {last_err}") from last_err


def fetch_urls():
    req = urllib.request.Request(SITEMAP, headers={"User-Agent": "GameZipper-IndexNow/1.0"})
    with _open_with_retry(req) as response:
        root = ET.fromstring(response.read())
    urls = [node.text.strip() for node in root.findall(".//{*}loc") if node.text]
    if not urls:
        raise RuntimeError("sitemap contains no URLs")
    return urls


def submit(endpoint, urls):
    body = json.dumps({
        "host": "gamezipper.com",
        "key": KEY,
        "keyLocation": "https://gamezipper.com/indexnowkey.txt",
        "urlList": urls,
    }).encode()
    req = urllib.request.Request(endpoint, data=body, method="POST", headers={
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": "GameZipper-IndexNow/1.0",
    })
    with _open_with_retry(req) as response:
        return response.status


def main():
    urls = fetch_urls()
    for start in range(0, len(urls), 10000):
        batch = urls[start:start + 10000]
        errors = []
        for endpoint in ENDPOINTS:
            try:
                status = submit(endpoint, batch)
                if status in (200, 202):
                    print(f"IndexNow submitted {len(batch)} URLs: HTTP {status}")
                    break
            except Exception as exc:
                errors.append(f"{endpoint}: {exc}")
        else:
            raise RuntimeError("; ".join(errors))
    return 0


if __name__ == "__main__":
    sys.exit(main())