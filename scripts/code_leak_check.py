#!/usr/bin/env python3
"""
Code Leak Detector — checks if any CSS/JS code is rendered as visible text
outside of <style>/<script> tags. Prevents bugs where code leaks to page.

Detects 3 leak categories:
1. CSS leaks: rules outside <style> blocks (after </style>, before <head>, etc.)
2. JS leaks: code outside <script> blocks (after </script>, before next tag)
3. Mixed leaks: any code-like text in unexpected positions

Usage:
  python3 code_leak_check.py <url_or_file>
  python3 code_leak_check.py https://gamezipper.com
  python3 code_leak_check.py /home/msdn/gamezipper.com/index.html
"""

import sys
import re
import json


def check_code_leaks(content: str, source: str = "unknown") -> dict:
    """
    Check if CSS/JS code appears outside their respective tags.
    Returns dict with results.
    """
    results = {
        "source": source,
        "has_leak": False,
        "leaked_items": [],
        "details": "",
        "stats": {
            "script_blocks": len(re.findall(r'<script[^>]*>.*?</script>', content, re.DOTALL)),
            "style_blocks": len(re.findall(r'<style[^>]*>.*?</style>', content, re.DOTALL)),
        }
    }

    # ===== CSS LEAK CHECKS =====

    css_rule_re = re.compile(
        r'(?:'
        r'\.[a-zA-Z][\w-]*\s*\{|'
        r'\#[a-zA-Z][\w-]*\s*\{|'
        r'@media\s|'
        r'@keyframes\s|'
        r':root\s*\{|'
        r'[a-zA-Z][\w-]*\s*\{[^}]*:[^}]*\}'
        r')'
    )

    # CSS CHECK 1: After </style> tags
    for m in re.finditer(r'</style>', content):
        end_pos = m.end()
        next_tag = re.search(r'<', content[end_pos:])
        next_tag_pos = end_pos + next_tag.start() if next_tag else len(content)
        gap = content[end_pos:next_tag_pos].strip()
        if gap and (re.search(r'\.[a-zA-Z][\w-]*\{', gap) or
                    re.search(r'@[a-zA-Z-]+\s', gap) or
                    re.search(r':root\s*\{', gap)):
            leaked = [x[:100] for x in re.findall(r'[.#:@]?[\w-]+\s*\{[^}]*\}', gap)]
            if leaked:
                results["has_leak"] = True
                for item in leaked:
                    results["leaked_items"].append({"type": "css", "rule": item, "zone": f"after </style> at pos {end_pos}"})
            elif any(c in gap for c in ['{', '}', ':', ';']):
                results["has_leak"] = True
                results["leaked_items"].append({"type": "css", "rule": gap[:200], "zone": f"after </style> at pos {end_pos}"})

    # CSS CHECK 2: Between <html> and <head>
    html_pos = content.find('<html')
    head_pos = content.find('<head')
    if html_pos >= 0 and head_pos >= 0:
        preamble = content[html_pos:head_pos]
        html_tag = re.match(r'<html[^>]*>', preamble)
        if html_tag:
            after = preamble[html_tag.end():].strip()
            if after:
                leaked = [x[:100] for x in re.findall(r'[.#:@]?[\w-]+\s*\{[^}]*\}', after)]
                if leaked or re.search(r':root\s*\{', after):
                    results["has_leak"] = True
                    for item in (leaked or [after[:200]]):
                        results["leaked_items"].append({"type": "css", "rule": item, "zone": "between <html> and <head>"})

    # CSS CHECK 3: Between </head> and <body>
    head_close = content.find('</head>')
    body_pos = content.find('<body')
    if head_close >= 0 and body_pos >= 0 and body_pos > head_close:
        gap = content[head_close + 7:body_pos].strip()
        if gap:
            leaked = [x[:100] for x in re.findall(r'[.#:@]?[\w-]+\s*\{[^}]*\}', gap)]
            if leaked:
                results["has_leak"] = True
                for item in leaked:
                    results["leaked_items"].append({"type": "css", "rule": item, "zone": "between </head> and <body>"})

    # ===== JS LEAK CHECKS =====

    js_indicators = ['function(', 'var ', 'const ', 'let ', 'document.', 'window.',
                     'addEventListener', 'getElementById', 'querySelector',
                     'createElement', 'innerHTML', 'textContent', '// ', '/*']

    # JS CHECK 1: After </script> tags — find code that's not in a script block
    # Strategy: strip all <script>...</script> blocks, then check remaining text for JS
    stripped = re.sub(r'<script[^>]*>.*?</script>', '', content, flags=re.DOTALL)
    stripped = re.sub(r'<style[^>]*>.*?</style>', '', stripped, flags=re.DOTALL)
    # Remove HTML tags
    text_only = re.sub(r'<[^>]+>', '\n', stripped)

    leaked_js = []
    for line in text_only.split('\n'):
        line = line.strip()
        if not line or len(line) < 10:
            continue
        # Check for strong JS indicators (need at least 2 for confidence)
        matches = sum(1 for ind in js_indicators if ind in line)
        if matches >= 2:
            leaked_js.append(line[:200])
        # Also check for single very strong indicators
        elif any(s in line for s in ['document.querySelectorAll', 'document.getElementById',
                                       'function()', 'function (', '.forEach(function',
                                       'createElement(', 'innerHTML =', 'addEventListener(']):
            leaked_js.append(line[:200])

    if leaked_js:
        results["has_leak"] = True
        # Deduplicate
        seen = set()
        for item in leaked_js:
            key = item[:50]
            if key not in seen:
                seen.add(key)
                results["leaked_items"].append({"type": "js", "rule": item, "zone": "outside <script> tags"})

    # ===== Build details string =====
    css_count = sum(1 for i in results["leaked_items"] if i["type"] == "css")
    js_count = sum(1 for i in results["leaked_items"] if i["type"] == "js")
    if results["has_leak"]:
        results["details"] = f"Found {css_count} CSS leak(s) and {js_count} JS leak(s)."

    return results


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 code_leak_check.py <url_or_file>")
        print("  URL: fetches and checks the page")
        print("  File path: reads local file and checks")
        sys.exit(1)

    source = sys.argv[1]

    if source.startswith("http://") or source.startswith("https://"):
        import urllib.request
        try:
            req = urllib.request.Request(source, headers={"User-Agent": "CodeLeakCheck/2.0"})
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

    results = check_code_leaks(content, source)
    print(json.dumps(results, indent=2, ensure_ascii=False))
    sys.exit(1 if results["has_leak"] else 0)


if __name__ == "__main__":
    main()
