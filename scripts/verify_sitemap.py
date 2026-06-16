#!/usr/bin/env python3
"""Verify sitemap.xml is well-formed and not polluted by line-number prefixes.

This is the offline counterpart to the in-line guard in gen_sitemap.py.
Where gen_sitemap.py refuses to write a broken sitemap, this script can be
run any time on a sitemap file (the local working copy, a freshly fetched
production copy, an IndexNow submission payload, etc.) and will report
problems.

Usage:
    python3 scripts/verify_sitemap.py                       # check ./sitemap.xml
    python3 scripts/verify_sitemap.py path/to/sitemap.xml   # check another file
    python3 scripts/verify_sitemap.py --url https://gamezipper.com/sitemap.xml
    python3 scripts/verify_sitemap.py --min-urls 600 --strict
    python3 scripts/verify_sitemap.py --json               # machine-readable output

Exit codes:
    0  healthy (>= MIN_URLS, no line-number pollution, XML well-formed)
    1  line-number pollution detected (cat -n / nl output)
    2  XML parse error
    3  URL count below MIN_URLS
    4  missing/wrong root tag or namespace
    5  read error (file not found, network failure)
"""
import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from typing import Any

# Mirrors the regex in gen_sitemap.py — if you change one, change both.
LINE_NUMBER_RE = re.compile(r'^\s*\d+\s*[|\t]\s*\S')

DEFAULT_MIN_URLS = 600
EXPECTED_ROOT = '{http://www.sitemaps.org/schemas/sitemap/0.9}urlset'
EXPECTED_NS = 'http://www.sitemaps.org/schemas/sitemap/0.9'


def check_line_numbered(body: str) -> list[dict[str, Any]]:
    """Return a list of {line_no, text} for any line that looks line-numbered."""
    findings = []
    for i, line in enumerate(body.splitlines(), 1):
        if LINE_NUMBER_RE.match(line):
            findings.append({'line_no': i, 'text': line[:120]})
    return findings


def fetch_local(path: str) -> str:
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()


def fetch_url(url: str, timeout: float = 30.0) -> str:
    req = urllib.request.Request(url, headers={'User-Agent': 'gz-verify-sitemap/1.0'})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode('utf-8')


def verify(body: str, min_urls: int = DEFAULT_MIN_URLS) -> dict[str, Any]:
    """Run all checks against `body`. Returns a result dict."""
    result = {
        'checks': {},
        'ok': True,
    }

    # 1. Line-number pollution
    polluted = check_line_numbered(body)
    result['checks']['line_number_pollution'] = {
        'ok': not polluted,
        'count': len(polluted),
        'samples': polluted[:5],
    }
    if polluted:
        result['ok'] = False

    # 2. XML well-formedness + structure
    xml_ok = True
    xml_err = None
    root_tag = None
    ns_ok = False
    url_count = 0
    lastmod_count = 0
    loc_count = 0
    try:
        root = ET.fromstring(body)
        root_tag = root.tag
        ns_ok = root_tag == EXPECTED_ROOT
        for url in root.findall(f'{{{EXPECTED_NS}}}url'):
            url_count += 1
            if url.find(f'{{{EXPECTED_NS}}}loc') is not None:
                loc_count += 1
            if url.find(f'{{{EXPECTED_NS}}}lastmod') is not None:
                lastmod_count += 1
    except ET.ParseError as e:
        xml_ok = False
        xml_err = str(e)

    result['checks']['xml_parse'] = {
        'ok': xml_ok,
        'error': xml_err,
    }
    result['checks']['root_namespace'] = {
        'ok': ns_ok,
        'expected': EXPECTED_ROOT,
        'actual': root_tag,
    }
    result['checks']['url_count'] = {
        'ok': url_count >= min_urls,
        'count': url_count,
        'min': min_urls,
        'loc_count': loc_count,
        'lastmod_count': lastmod_count,
        'lastmod_pct': (lastmod_count / url_count * 100) if url_count else 0.0,
    }

    if not xml_ok or not ns_ok or url_count < min_urls:
        result['ok'] = False

    return result


def render_text(result: dict[str, Any], source: str) -> str:
    lines = []
    lines.append(f'sitemap verify: {source}')
    lines.append('-' * 60)
    for name, check in result['checks'].items():
        mark = '✅' if check.get('ok') else '❌'
        if name == 'line_number_pollution':
            lines.append(f'{mark} {name}: {check["count"]} polluted line(s)')
            for sample in check.get('samples', [])[:3]:
                lines.append(f'    line {sample["line_no"]}: {sample["text"]!r}')
        elif name == 'xml_parse':
            err = check.get('error') or ''
            lines.append(f'{mark} {name}: {err if err else "well-formed"}')
        elif name == 'root_namespace':
            lines.append(
                f'{mark} {name}: root={check.get("actual")!r} '
                f'expected={check.get("expected")!r}'
            )
        elif name == 'url_count':
            lines.append(
                f'{mark} {name}: {check["count"]} URL(s) '
                f'(min={check["min"]}), '
                f'<loc>={check["loc_count"]}, '
                f'<lastmod>={check["lastmod_count"]} '
                f'({check["lastmod_pct"]:.1f}%)'
            )
        else:
            lines.append(f'{mark} {name}: {check}')
    lines.append('-' * 60)
    lines.append('OVERALL: ' + ('PASS ✅' if result['ok'] else 'FAIL ❌'))
    return '\n'.join(lines)


def main(argv: list[str]) -> int:
    p = argparse.ArgumentParser(
        description='Verify sitemap.xml — checks for line-number pollution, '
                    'XML well-formedness, namespace, and URL count.',
    )
    p.add_argument(
        'path',
        nargs='?',
        default='sitemap.xml',
        help='Local path to sitemap.xml (default: ./sitemap.xml)',
    )
    p.add_argument(
        '--url', metavar='URL', default=None,
        help='Fetch sitemap from URL instead of reading local file',
    )
    p.add_argument(
        '--min-urls', type=int, default=DEFAULT_MIN_URLS,
        help=f'Minimum expected URL count (default: {DEFAULT_MIN_URLS})',
    )
    p.add_argument(
        '--strict', action='store_true',
        help='Treat any warning (e.g. <lastmod> missing on some URLs) as a failure',
    )
    p.add_argument(
        '--json', action='store_true', help='Emit JSON instead of human text',
    )
    args = p.parse_args(argv)

    source = args.path
    try:
        if args.url:
            source = args.url
            body = fetch_url(args.url)
        else:
            body = fetch_local(args.path)
    except (OSError, urllib.error.URLError) as e:
        msg = f'read error: {e}'
        if args.json:
            print(json.dumps({'ok': False, 'error': msg}))
        else:
            print(msg, file=sys.stderr)
        return 5

    result = verify(body, min_urls=args.min_urls)

    # In strict mode, also fail if lastmod coverage < 100%
    if args.strict:
        uc = result['checks']['url_count']
        if uc['lastmod_count'] < uc['count']:
            result['ok'] = False
            result['checks']['strict_lastmod'] = {
                'ok': False,
                'missing': uc['count'] - uc['lastmod_count'],
            }

    result['source'] = source
    result['min_urls'] = args.min_urls
    result['strict'] = args.strict

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(render_text(result, source))

    if not result['ok']:
        lnp = result['checks']['line_number_pollution']
        if lnp['count'] > 0:
            return 1
        if not result['checks']['xml_parse']['ok']:
            return 2
        if not result['checks']['url_count']['ok']:
            return 3
        if not result['checks']['root_namespace']['ok']:
            return 4
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))