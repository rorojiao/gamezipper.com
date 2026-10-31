#!/usr/bin/env python3
"""Re-embed set-quest/levels.json into set-quest/index.html.

The game embeds its level table as a single JS literal:

    window.__LEVELS_DATA = {"LEVELS":[ ... ]};

This script rewrites that literal from the canonical levels.json so the two
can never drift. It is idempotent: running it twice produces the same file.

The embedded form drops the generator's "id" key and renumbers "i" from 0,
which is what the engine expects (level 1 == index 0).

Implementation note: the literal is located by BRACE-BALANCED scanning, not by
a regex. The literal is NOT followed by a semicolon in the source file, so a
naive `\\{.*?\\};` pattern silently matches a much later `};` and deletes every
line of engine code in between. Balanced scanning cannot do that.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
LEVELS = os.path.join(HERE, 'levels.json')
HTML = os.path.join(HERE, 'index.html')

MARKER = 'window.__LEVELS_DATA = '


def find_literal_end(html, start):
    """Return the index just past the closing '}' of the JSON object at start.

    Scans with a depth counter, skipping over string literals and their
    escapes so that a '}' or '{' inside a string cannot unbalance the scan.
    """
    i = start
    depth = 0
    n = len(html)
    while i < n:
        ch = html[i]
        if ch == '"':
            i += 1
            while i < n:
                if html[i] == '\\':
                    i += 2
                    continue
                if html[i] == '"':
                    i += 1
                    break
                i += 1
            continue
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                return i + 1
        i += 1
    raise SystemExit('unbalanced braces: could not find the end of the '
                     'window.__LEVELS_DATA literal')


def main():
    with open(LEVELS) as f:
        data = json.load(f)
    levels = data['levels']
    if len(levels) != 30:
        sys.exit(f'expected 30 levels, got {len(levels)}')

    embedded = []
    for i, lv in enumerate(levels):
        embedded.append({
            'i': i,
            'tier': lv['tier'],
            'features': lv['features'],
            'cards': lv['cards'],
            'solution': lv['solution'],
            'par': lv['par'],
        })
    payload = json.dumps({'LEVELS': embedded}, separators=(',', ':'),
                          ensure_ascii=False)
    # The literal must not contain a literal "</script>" sequence.
    if '</script>' in payload:
        sys.exit('payload contains </script> and would break the HTML parser')

    with open(HTML, encoding='utf-8') as f:
        html = f.read()

    marker_at = html.find(MARKER)
    if marker_at < 0:
        sys.exit('could not locate window.__LEVELS_DATA in index.html')

    obj_start = marker_at + len(MARKER)
    while html[obj_start] in ' \t\r\n':
        obj_start += 1
    if html[obj_start] != '{':
        sys.exit(f'expected "{{" after the marker, found {html[obj_start]!r}')

    obj_end = find_literal_end(html, obj_start)

    new_html = html[:obj_start] + payload + html[obj_end:]

    if new_html == html:
        print('index.html already in sync with levels.json (no change)')
        return

    with open(HTML, 'w', encoding='utf-8') as f:
        f.write(new_html)
    print(f're-embedded {len(embedded)} levels into index.html '
          f'({len(payload)} bytes of level data); '
          f'file is now {len(new_html)} bytes')


if __name__ == '__main__':
    main()
