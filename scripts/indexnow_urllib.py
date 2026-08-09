#!/usr/bin/env python3
"""Submit GameZipper sitemap URLs to IndexNow using only stdlib."""
import json
import os
import sys
import urllib.request
import xml.etree.ElementTree as ET

SITEMAP = "https://gamezipper.com/sitemap.xml"
ENDPOINTS = ("https://www.bing.com/indexnow", "https://api.indexnow.org/indexnow")
KEY = "gamezipper2026indexnow"

for key in ("http_proxy", "https_proxy", "HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "all_proxy"):
    os.environ.pop(key, None)
OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def fetch_urls():
    req = urllib.request.Request(SITEMAP, headers={"User-Agent": "GameZipper-IndexNow/1.0"})
    with OPENER.open(req, timeout=30) as response:
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
    with OPENER.open(req, timeout=30) as response:
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