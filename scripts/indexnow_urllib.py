#!/usr/bin/env python3
"""Submit GameZipper sitemap URLs to IndexNow using only stdlib."""
import http.client
import json
import os
import socket
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

# R685 / R660 followup: when system DNS is dead (getaddrinfo gaierror), bypass via
# alidns DoH (https://dns.alidns.com/resolve) + IP-direct socket. Mirrors R685 Contents
# API recipe. Activated only on gaierror fallback so we don't waste DoH round-trip when
# system DNS is healthy. Hardcoded IPs verified 2026-09-13:
#   gamezipper.com -> 185.199.108-111.153 (GitHub Pages CDN)
#   www.bing.com   -> 202.89.233.100 (China edge, verified alive in 9-05 + 9-13)
#   api.indexnow.org -> 150.171.73.13 / 150.171.74.13 (Microsoft Edge anycast)
_DOH_FALLBACK_IPS = {
    "gamezipper.com":   ("185.199.108.153", "185.199.109.153", "185.199.110.153", "185.199.111.153"),
    "www.bing.com":     ("202.89.233.100",),
    "api.indexnow.org": ("150.171.73.13", "150.171.74.13"),
}


def _doh_resolve(name, timeout=8):
    """alidns DoH bypass to resolve name -> list of A-record IPs."""
    try:
        req = urllib.request.Request(
            f"https://dns.alidns.com/resolve?name={name}&type=A",
            headers={"User-Agent": "GameZipper-IndexNow/1.0 (+DoH-fallback)"},
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read())
        ips = tuple(a["data"] for a in data.get("Answer", []) if a.get("type") == 1)
        return ips or _DOH_FALLBACK_IPS.get(name, ())
    except Exception:
        return _DOH_FALLBACK_IPS.get(name, ())


def _open_ip_direct(req, ip, timeout=30):
    """Open https URL via direct IP + Host header (bypass DNS resolution).

    Uses raw socket + ssl.wrap_socket instead of http.client.HTTPSConnection,
    because HTTPSConnection still calls socket.getaddrinfo() for the IP (which
    can fail under R660 systemic DNS outage if the IP string triggers a reverse
    DNS lookup or other resolver path). Manual socket skips that entirely.

    Requires request body to be bytes (already true for our POST JSON).
    """
    from urllib.parse import urlparse
    parsed = urlparse(req.full_url)
    host = parsed.hostname or req.host
    port = parsed.port or 443
    body = req.data
    method = req.get_method()
    headers = {k: v for k, v in req.header_items()}
    headers["Host"] = host
    # Drop headers that confuse upstream when sent with an IP literal in Host
    # (urllib already sends Host = req.host, which is the hostname; we override
    # explicitly above so the TLS SNI match works.)
    headers["Host"] = host
    sock = None
    try:
        # IP-direct TCP connect — no getaddrinfo involved
        sock = socket.create_connection((ip, port), timeout=timeout)
        ctx = ssl.create_default_context()
        # Important: server_hostname drives SNI + cert verification
        ssock = ctx.wrap_socket(sock, server_hostname=host)
        # Build the HTTP/1.1 request line + headers
        req_line = f"{method} {req.selector or '/'} HTTP/1.1\r\n"
        header_lines = "".join(f"{k}: {v}\r\n" for k, v in headers.items())
        body_bytes = body if body is not None else b""
        if body_bytes and "Content-Length" not in headers:
            header_lines += f"Content-Length: {len(body_bytes)}\r\n"
        if "Connection" not in headers:
            header_lines += "Connection: close\r\n"
        full = (req_line + header_lines + "\r\n").encode("ascii") + body_bytes
        ssock.sendall(full)
        # Read response
        resp_file = ssock.makefile("rb")
        status_line = resp_file.readline().decode("latin-1", errors="replace").rstrip("\r\n")
        # Parse status: "HTTP/1.1 200 OK"
        parts = status_line.split(" ", 2)
        if len(parts) < 2 or not parts[0].startswith("HTTP/"):
            raise RuntimeError(f"bad HTTP status line: {status_line!r}")
        try:
            status_code = int(parts[1])
        except (ValueError, IndexError):
            raise RuntimeError(f"cannot parse status code from {status_line!r}")
        # Read response headers
        resp_headers = {}
        while True:
            line = resp_file.readline()
            if not line or line in (b"\r\n", b"\n"):
                break
            k, _, v = line.decode("latin-1", errors="replace").rstrip("\r\n").partition(":")
            resp_headers[k.strip().lower()] = v.strip()
        return _IPDirectResponse(status_code, resp_headers, resp_file, ssock)
    except Exception:
        try:
            if sock is not None:
                sock.close()
        except Exception:
            pass
        raise


class _IPDirectResponse:
    """Minimal file-like wrapper around raw HTTP response for `with` + .read().

    Attributes:
        status: int HTTP status code
        headers: dict of lowercase header name -> value
    """
    def __init__(self, status, headers, resp_file, ssock):
        self.status = status
        self.headers = headers
        self._resp_file = resp_file
        self._ssock = ssock

    def read(self, amt=-1):
        return self._resp_file.read(amt)

    def __enter__(self):
        return self

    def __exit__(self, *args):
        try:
            self._resp_file.close()
        except Exception:
            pass
        try:
            self._ssock.close()
        except Exception:
            pass


def _is_dns_dead_error(exc):
    """Detect gaierror-class errors (R660 systemic DNS outage).

    Matches both urllib-wrapped URLError and bare socket.gaierror (which the
    monkey-patch in tests raises directly).
    """
    reason_str = str(getattr(exc, "reason", exc))
    return ("getaddrinfo" in reason_str
            or "Name or service not known" in reason_str
            or "Temporary failure in name resolution" in reason_str
            or "[Errno -3]" in reason_str
            or "[Errno -2]" in reason_str)


def _try_ip_direct_chain(req, timeout=30):
    """Try all known IPs for req.host via _open_ip_direct, return first success.

    Returns the response if any IP yields a non-5xx HTTP status (4xx is fine —
    we got a response, the endpoint is reachable). On connection / TLS errors
    tries next IP. Returns None if host is not in the fallback table.
    """
    ips = _doh_resolve(req.host)
    if not ips:
        return None
    last_err = None
    for ip in ips:
        try:
            resp = _open_ip_direct(req, ip, timeout=timeout)
            status = getattr(resp, "status", 0) or 0
            if 100 <= status < 500:
                return resp
            # 5xx: server answered but errored — close & try next IP
            try:
                resp.__exit__(None, None, None)
            except Exception:
                pass
        except Exception as ip_exc:
            last_err = ip_exc
            continue
    if last_err is not None:
        raise last_err
    return None


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
            # R685 DoH+IP-direct fallback: when DNS is systemically dead (gaierror
            # [-3] or [-2]), resolve via alidns DoH and try every known IP for the
            # host. _try_ip_direct_chain returns first non-5xx response.
            if _is_dns_dead_error(exc):
                try:
                    resp = _try_ip_direct_chain(req, timeout=timeout)
                    if resp is not None:
                        return resp
                except Exception as ip_exc:
                    last_err = ip_exc
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