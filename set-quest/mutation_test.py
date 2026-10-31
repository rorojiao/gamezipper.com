#!/usr/bin/env python3
"""Mutation-test set-quest/qa_checklist.js.

A QA checklist that passes is only useful if it FAILS when the thing it
guards is broken. This script mutates a copy of the game in a scratch dir,
runs the checklist against each mutation, and asserts that the checklist
reports FAIL (non-zero exit) for every one of them.

Each mutation is applied to a fresh copy, so mutations never compound.
The originals are never touched.
"""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

SRC = '/home/junze/gamezipper.com/set-quest'

# (label, filename, python callable that mutates the text, expected: checklist fails)
MUTATIONS = []


def mut(label, fname):
    def deco(fn):
        MUTATIONS.append((label, fname, fn))
        return fn
    return deco


@mut('drop the canonical title', 'index.html')
def _m_title(t):
    return re.sub(r'<title>.*?</title>', '<title></title>', t, count=1,
                  flags=re.S)


@mut('remove the VideoGame JSON-LD', 'index.html')
def _m_vg(t):
    return re.sub(r'"@type":\s*"VideoGame"', '"@type": "Thing"', t, count=1)


@mut('remove the FAQPage JSON-LD', 'index.html')
def _m_faq(t):
    return re.sub(r'"@type":\s*"FAQPage"', '"@type": "FAQThing"', t, count=1)


@mut('remove the BreadcrumbList JSON-LD', 'index.html')
def _m_crumb(t):
    return re.sub(r'"@type":\s*"BreadcrumbList"', '"@type": "CrumbThing"', t,
                  count=1)


@mut('inject a zombie ad network', 'index.html')
def _m_zombie(t):
    return t.replace('</body>',
                      '<script src="https://m2d.m2cdn.me/multitag-multi.js">'
                      '</script></body>')


@mut('drop the mobile top-ad reorder (cards fall below fold)',
    'index.html')
def _m_adfold(t):
    # R1014: without .gz-ad-top{order:99} on narrow screens the filled
    # AdSense slot pushes the bottom row of the 9-card board below the
    # fold — a card the player cannot reason about when hunting a SET.
    return t.replace('@media (max-width:640px){\n  .gz-ad-top{order:99}\n}',
                      '/* mobile ad reorder removed */')


@mut('inject 1ktower', 'index.html')
def _m_1ktower(t):
    return t.replace('</body>', '<script src="https://1ktower/x.js"></script>'
                                 '</body>')


@mut('break the level table (drop a level)', 'index.html')
def _m_levels(t):
    return re.sub(r'(window\.__LEVELS_DATA\s*=\s*\{.*?"LEVELS":\[)(.*?)(\]\};)',
                  lambda m: m.group(1) + m.group(2).rsplit('},{"i":', 1)[0]
                  + ']}', t, count=1, flags=re.S)


@mut('corrupt one card value', 'index.html')
def _m_card(t):
    return re.sub(r'("cards":\[\[)(\d),(\d),(\d)', r'\g<1>9,\g<3>,\g<4>', t,
                  count=1)


@mut('remove the monetag manager', 'index.html')
def _m_monetag(t):
    # Delete the WHOLE script tag: renaming the path would keep the
    # substring "monetag-manager.js" and the check would still pass.
    return re.sub(r'<script[^>]*monetag-manager\.js[^>]*></script>', '', t)


@mut('remove gz-analytics', 'index.html')
def _m_analytics(t):
    return re.sub(r'<script[^>]*gz-analytics\.js[^>]*></script>', '', t)


@mut('remove the game footer', 'index.html')
def _m_footer(t):
    return re.sub(r'<script[^>]*game-footer\.js[^>]*></script>', '', t)


@mut('remove the audio cleanup on pagehide', 'index.html')
def _m_audio(t):
    return t.replace("window.addEventListener('pagehide'",
                      "window.addEventListener('notpagehide'")


@mut('remove localStorage persistence', 'index.html')
def _m_storage(t):
    return t.replace('localStorage', 'notLocalStorage')


@mut('break a solution index out of range', 'index.html')
def _m_solution(t):
    return re.sub(r'("solution":\[)(\d+),(\d+),(\d+)',
                  lambda m: m.group(1) + '99,' + m.group(3) + ','
                  + m.group(4), t, count=1)


@mut('remove the engine API export', 'index.html')
def _m_api(t):
    return t.replace('window.setQuest', 'window.notSetQuest')


@mut('remove aria-pressed from cards', 'index.html')
def _m_aria(t):
    return t.replace('aria-pressed', 'data-pressed')


@mut('remove the viewport meta', 'index.html')
def _m_viewport(t):
    return re.sub(r'<meta name="viewport"[^>]*>', '', t, count=1)


@mut('remove the og:image', 'index.html')
def _m_ogimage(t):
    return re.sub(r'<meta property="og:image"[^>]*>', '', t, count=1)


def run_checklist(d):
    p = subprocess.run(['node', 'qa_checklist.js'], cwd=d,
                       capture_output=True, text=True)
    return p.returncode, (p.stdout + p.stderr)


def main():
    results = []
    for label, fname, fn in MUTATIONS:
        with tempfile.TemporaryDirectory() as td:
            shutil.copytree(SRC, os.path.join(td, 'g'),
                            ignore=shutil.ignore_patterns('.git'))
            d = os.path.join(td, 'g')
            path = os.path.join(d, fname)
            with open(path, encoding='utf-8') as f:
                orig = f.read()
            with open(path, 'w', encoding='utf-8') as f:
                f.write(fn(orig))
            rc, out = run_checklist(d)
            caught = rc != 0
            results.append((label, caught, rc))
            flag = 'CAUGHT ' if caught else 'MISSED!'
            last = [ln for ln in out.splitlines()
                    if 'PASS:' in ln or 'FAIL:' in ln]
            print(f'  {flag} {label:45s} exit={rc}  {last[-1][:70] if last else ""}')

    missed = [r for r in results if not r[1]]
    print(f'\nmutation test: {len(results) - len(missed)}/{len(results)} mutations caught')
    if missed:
        print('MISSED: ' + ', '.join(r[0] for r in missed))
        sys.exit(1)
    print('mutation test: all mutations caught')


if __name__ == '__main__':
    main()
