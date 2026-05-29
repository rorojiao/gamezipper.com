#!/usr/bin/env python3
"""
CSS Leak Detector — checks if any CSS rules are rendered as visible text
outside of <style> tags. Prevents bugs where CSS leaks to page top.

Detects two leak patterns:
1. CSS between </style> and next HTML tag (gap after style blocks)
2. CSS between <html> and <head> or before first <style> (head-preamble leaks)

Usage:
  python3 css_leak_check.py <url_or_file>
  python3 css_leak_check.py https://gamezipper.com
  python3 css_leak_check.py /home/msdn/gamezipper.com/index.html
"""

import sys
import re
import json


def check_css_leaks(content: str, source: str = "unknown") -> dict:
    """
    Check if CSS rules appear outside <style> tags in HTML content.
    Returns dict with results.
    """
    results = {
        "source": source,
        "has_leak": False,
        "leaked_rules": [],
        "details": ""
    }

    # CSS rule detection pattern
    css_rule_re = re.compile(
        r'(?:'
        r'\.[a-zA-Z][\w-]*\s*\{|'          # .class {
        r'\#[a-zA-Z][\w-]*\s*\{|'           # #id {
        r'@media\s|'                         # @media
        r'@keyframes\s|'                     # @keyframes
        r':root\s*\{|'                       # :root {
        r'[a-zA-Z][\w-]*\s*\{[^}]*:[^}]*\}' # tag { prop: val }
        r')'
    )

    # ===== CHECK 1: CSS in gap after </style> tags =====
    style_end_positions = [m.end() for m in re.finditer(r'</style>', content)]

    for end_pos in style_end_positions:
        next_tag_match = re.search(r'<', content[end_pos:])
        next_tag_pos = end_pos + next_tag_match.start() if next_tag_match else len(content)
        gap_text = content[end_pos:next_tag_pos].strip()

        if gap_text and (re.search(r'\.[a-zA-Z][\w-]*\{', gap_text) or
                         re.search(r'@[a-zA-Z-]+\s', gap_text) or
                         re.search(r':root\s*\{', gap_text)):

            leaked = [m.group()[:100] for m in re.finditer(r'[.#:@]?[\w-]+\s*\{[^}]*\}', gap_text)]

            if leaked:
                results["has_leak"] = True
                results["leaked_rules"].extend(leaked)
                results["details"] += (
                    f"Found {len(leaked)} CSS rule(s) between </style> (pos {end_pos}) "
                    f"and next tag (pos {next_tag_pos}). "
                )
            elif any(c in gap_text for c in ['{', '}', ':', ';']):
                results["has_leak"] = True
                results["leaked_rules"].append(gap_text[:200])
                results["details"] += f"Potential CSS text after </style>: {gap_text[:200]} "

    # ===== CHECK 2: CSS before <head> (head-preamble leak) =====
    # This catches patterns like :root{...} between <html> and <head>
    head_pos = content.find('<head')
    html_pos = content.find('<html')

    if html_pos >= 0 and head_pos >= 0:
        preamble = content[html_pos:head_pos]
        # Remove the <html ...> tag itself
        html_tag_match = re.match(r'<html[^>]*>', preamble)
        if html_tag_match:
            preamble_after_html = preamble[html_tag_match.end():].strip()

            if preamble_after_html:
                # Check if it looks like CSS
                leaked = []
                for m in re.finditer(r'[.#:@]?[\w-]+\s*\{[^}]*\}', preamble_after_html):
                    leaked.append(m.group()[:100])

                if leaked or re.search(r':root\s*\{', preamble_after_html):
                    results["has_leak"] = True
                    results["leaked_rules"].extend(leaked if leaked else [preamble_after_html[:200]])
                    results["details"] += (
                        f"Found {len(leaked)} CSS rule(s) between <html> and <head>. "
                        f"This renders as visible text at the very top of the page. "
                    )

    # ===== CHECK 3: CSS between </head> and <body> =====
    head_close = content.find('</head>')
    body_pos = content.find('<body')

    if head_close >= 0 and body_pos >= 0 and body_pos > head_close:
        head_body_gap = content[head_close + len('</head>'):body_pos].strip()
        if head_body_gap:
            leaked = [m.group()[:100] for m in re.finditer(r'[.#:@]?[\w-]+\s*\{[^}]*\}', head_body_gap)]
            if leaked:
                results["has_leak"] = True
                results["leaked_rules"].extend(leaked)
                results["details"] += f"Found {len(leaked)} CSS rule(s) between </head> and <body>. "

    # ===== CHECK 4: Specific .gz- CSS after </style> =====
    if re.search(r'</style>\s*\n\s*\.gz-', content):
        results["has_leak"] = True
        results["leaked_rules"].append("gz-* CSS rules after </style>")
        if "gz-" not in results["details"]:
            results["details"] += "Found .gz- CSS immediately after </style> tag. "

    # Deduplicate leaked rules
    if results["leaked_rules"]:
        results["leaked_rules"] = list(dict.fromkeys(results["leaked_rules"]))

    return results


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 css_leak_check.py <url_or_file>")
        print("  URL: fetches and checks the page")
        print("  File path: reads local file and checks")
        sys.exit(1)

    source = sys.argv[1]

    if source.startswith("http://") or source.startswith("https://"):
        import urllib.request
        try:
            req = urllib.request.Request(source, headers={"User-Agent": "CSSLeakCheck/1.0"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                content = resp.read().decode("utf-8", errors="replace")
        except Exception as e:
            print(json.dumps({
                "source": source,
                "error": f"Failed to fetch: {e}",
                "has_leak": False
            }))
            sys.exit(1)
    else:
        try:
            with open(source, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
        except Exception as e:
            print(json.dumps({
                "source": source,
                "error": f"Failed to read file: {e}",
                "has_leak": False
            }))
            sys.exit(1)

    results = check_css_leaks(content, source)
    print(json.dumps(results, indent=2, ensure_ascii=False))
    sys.exit(1 if results["has_leak"] else 0)


if __name__ == "__main__":
    main()
