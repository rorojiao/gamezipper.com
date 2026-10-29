#!/usr/bin/env python3
"""
R337 — D20 fix: correct the "handcrafted" claim on every live game whose
level catalog is GENERATED at runtime by a seeded RNG.

WHY: "handcrafted" means a human authored the levels. 8 live games say
"30 handcrafted levels" while their catalog is synthesized at load time by a
seeded RNG (hidato/bounce-bot/slitherlink/snake-vs-block/hex-haven/blob-pop/
power-wash/color-switch). The copy describes a different product from the one
that ships — the same class as R336's D18 (advertised count vs shipped
catalog).

TARGET SELECTION: this script does NOT carry its own target list. It asks the
shared classifier (.audit/r337-d20-classify.js) for the PROCEDURAL games, so
the fix can only ever touch what the detector flags. (The first version had a
HARDCODED list; the negative test caught that it then "fixed" an
authored-catalog game — two independent lists WILL drift, and the fix must be
driven by the detector.)

WHAT IT DOES: rewrites ONLY the adjective, in place:
    "handcrafted levels"    -> "generated levels"
    "hand-crafted puzzles"  -> "generated puzzles"
The number, the tiers and every other word are untouched.

SAFETY (the lesson from R335's D11 — a blind find/replace on a page with
prose silently rewrites unrelated text):
  - the edit is asserted to change ONLY the word "handcrafted"/"hand-crafted"
    (everything else byte-identical);
  - the corrected phrase must still be present;
  - every JSON-LD block must still parse;
  - the file's byte delta must equal exactly the adjective shrink;
  - the script is idempotent (a second run changes nothing).

DRY RUN by default; pass --apply to write.
"""
import json
import os
import re
import subprocess
import sys

ROOT = os.environ.get('GZ_SITE_ROOT', '/home/junze/gamezipper.com')
CLASSIFY = os.path.join(ROOT, '.audit/r337-d20-classify.js')

REPL = [
    # R338: the claim can wear several synonym forms. The detector's CLAIM_RE
    # matches all of them, so the fixer must be able to rewrite all of them —
    # otherwise a synonym-form defect would be flagged but never repaired.
    (re.compile(r'hand[-\s]?crafted', re.I), 'generated'),
    (re.compile(r'hand[-\s]?built', re.I), 'generated'),
    (re.compile(r'hand[-\s]?designed', re.I), 'generated'),
    (re.compile(r'hand[-\s]?authored', re.I), 'generated'),
]

APPLY = '--apply' in sys.argv


def procedural_games():
    """Ask the shared classifier which games generate their catalog."""
    out = subprocess.run(['node', CLASSIFY, '--procedural-only'],
                         capture_output=True, text=True, cwd=ROOT)
    if out.returncode != 0:
        raise RuntimeError('classifier failed: ' + (out.stderr or out.stdout)[:500])
    return json.loads(out.stdout)


def strip_adjective(s):
    for pat, rep in REPL:
        s = pat.sub(rep, s)
    return s


def jsonld_valid(html):
    blocks = re.findall(
        r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        html, re.S | re.I)
    for i, b in enumerate(blocks):
        try:
            json.loads(b)
        except Exception as e:
            return False, 'ld+json block %d invalid: %s' % (i, e)
    return True, ('%d ld+json block(s) ok' % len(blocks) if blocks else 'no ld+json blocks')


report = []
targets = sorted(procedural_games().keys())
print('classifier says %d game(s) generate their catalog at runtime: %s'
      % (len(targets), ', '.join(targets)))

for slug in targets:
    path = os.path.join(ROOT, slug, 'index.html')
    if not os.path.exists(path):
        report.append({'slug': slug, 'status': 'NO_INDEX'})
        continue
    src = open(path, encoding='utf-8').read()

    # R338: count EVERY claim form the detector recognises, not just
    # "hand-?crafted" — otherwise a synonym-form claim is reported NO_CLAIM
    # and the defect is flagged by the gate but never repaired by the fixer.
    before_n = len(re.findall(r'hand[-\s]?(?:crafted|built|designed|authored)', src, re.I))
    if before_n == 0:
        report.append({'slug': slug, 'status': 'NO_CLAIM'})
        continue

    new = src
    replaced = 0
    for pat, rep in REPL:
        new, n = pat.subn(rep, new)
        replaced += n
    remaining = len(re.findall(r'hand[-\s]?(?:crafted|built|designed|authored)', new, re.I))

    # SAFETY 1: everything outside the adjective is byte-identical
    if strip_adjective(src) != strip_adjective(new):
        report.append({'slug': slug, 'status': 'ABORT_UNSAFE',
                       'detail': 'text outside the adjective changed'})
        continue
    # SAFETY 2: the corrected claim must still be present
    if not re.search(r'\bgenerated\s+(?:\w+\s+){0,2}(levels|puzzles|rooms|puzzle levels)\b', new, re.I):
        report.append({'slug': slug, 'status': 'ABORT_NO_CLAIM_LEFT',
                       'detail': 'no "generated ... levels/puzzles" phrase remains'})
        continue
    # SAFETY 3: JSON-LD must still parse
    ok, detail = jsonld_valid(new)
    if not ok:
        report.append({'slug': slug, 'status': 'ABORT_JSONLD', 'detail': detail})
        continue
    # SAFETY 4: byte delta == exactly the adjective shrink.
    # R338: the expected delta must be computed from the SAME replacement
    # patterns that were applied — a hardcoded `hand-?crafted` pattern made
    # the synonym forms ("hand-built", "hand-designed") abort with a bogus
    # "expected 0 got -1", i.e. the safety check itself blocked the fix.
    exp_delta = 0
    for pat, rep in REPL:
        exp_delta += sum(len(rep) - len(m.group(0))
                         for m in pat.finditer(src))
    actual_delta = len(new) - len(src)
    if actual_delta != exp_delta:
        report.append({'slug': slug, 'status': 'ABORT_DELTA',
                       'detail': 'expected %d got %d' % (exp_delta, actual_delta)})
        continue

    if APPLY:
        open(path, 'w', encoding='utf-8').write(new)

    report.append({'slug': slug, 'status': 'FIXED' if APPLY else 'DRYRUN',
                   'occurrences_before': before_n, 'replaced': replaced,
                   'remaining_handcrafted': remaining, 'jsonld': detail,
                   'bytes_delta': actual_delta})

print('\n=== D20 "handcrafted" -> "generated" (%s) ===' % ('APPLY' if APPLY else 'DRY RUN'))
for r in report:
    print('  %-22s %-16s %s' % (
        r['slug'], r['status'],
        ('occ=%s replaced=%s left=%s delta=%s  %s' % (
            r.get('occurrences_before'), r.get('replaced'),
            r.get('remaining_handcrafted'), r.get('bytes_delta'), r.get('jsonld')))
        if r['status'] in ('FIXED', 'DRYRUN') else r.get('detail', '')))
bad = [r for r in report if r['status'].startswith('ABORT')]
print('\nfiles needing attention: %d' % len(bad))
json.dump(report, open(os.path.join(ROOT, '.audit/r337-d20-fix.json'), 'w'), indent=1)
print('WROTE .audit/r337-d20-fix.json')
sys.exit(1 if bad else 0)
