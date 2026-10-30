#!/usr/bin/env python3
"""R339 — auditable quality-score evidence for a mechanic cluster.

Scoring rubric (task spec):
  35% core playable + ALL levels solvable/unique
  15% input + mobile
  10% first visit / tutorial / difficulty curve
  10% visual / audio / feedback
  10% perf / lifecycle / persistence
  10% existing independent verifier + test strength
  10% 30d real PV/UV/engagement

Ad READS THE FILES — it does not guess. Every sub-score below is derived
from a grep/probe of the shipped source, and the evidence line is printed so
the number is auditable.
"""
import json
import os
import re
import subprocess
import sqlite3
import sys

REPO = '/home/junze/gamezipper.com'
BI = '/home/junze/gamezipper-bi/data/analytics.db'


def src(slug, fname='index.html'):
    p = os.path.join(REPO, slug, fname)
    return open(p, encoding='utf-8', errors='replace').read() if os.path.exists(p) else ''


def count(h, pat, flags=re.I):
    return len(re.findall(pat, h, flags))


def probe_verifier(slug):
    """Run the game's own verifier and record its verdict + proof strength."""
    d = os.path.join(REPO, slug)
    vids = [f for f in os.listdir(d) if re.match(r'(verify|qa|test).*\.(js|py)$', f)]
    out = []
    for v in sorted(vids):
        p = os.path.join(d, v)
        try:
            r = subprocess.run(['node', p] if v.endswith('.js') else ['python3', p],
                               cwd=d, capture_output=True, text=True, timeout=300)
            tail = [l for l in (r.stdout + r.stderr).splitlines() if l.strip()][-3:]
            out.append({'file': v, 'exit': r.returncode,
                        'tail': ' | '.join(tail)[:400]})
        except Exception as e:
            out.append({'file': v, 'exit': 'ERR', 'tail': str(e)[:200]})
    return out


def bi(slug, days=30):
    if not os.path.exists(BI):
        return None
    db = sqlite3.connect(BI)
    cur = db.cursor()
    q = ("select count(*), count(distinct vid) from events where site='gamezipper.com' "
         "and event='page_view' and path=? and ts >= datetime('now','-%d days')" % days)
    cur.execute(q, ('/%s/' % slug,))
    pv, uv = cur.fetchone()
    eng = 0
    try:
        cur.execute("select count(*) from events where site='gamezipper.com' and event='engaged_time' "
                    "and path like ? and ts >= datetime('now','-30 days')", ('%' + slug + '%',))
        eng = cur.fetchone()[0]
    except Exception:
        pass
    db.close()
    return {'pv30': pv, 'uv30': uv, 'engaged30': eng}


def score(slug):
    h = src(slug)
    ev = []
    sub = {}

    # ---- 35% core playable + all levels solvable/unique -------------------
    core = 0.0
    lvl = count(h, r'\bLEVELS\b')
    has_levels = lvl > 0
    has_levels_file = os.path.exists(os.path.join(REPO, slug, 'levels.json'))
    # a real win predicate
    win_fn = count(h, r'function\s+(checkWin|isWin|checkSolution|checkCompletion|checkAnswer|isSolved|win)\b')
    # independent verification of every level
    vprobe = probe_verifier(slug)
    verified = any(v['exit'] == 0 and re.search(r'UNIQUE|proven|PASS|solvable', v['tail'], re.I) for v in vprobe)
    proven_unique = any(re.search(r'UNIQUE|proven unique', v['tail'], re.I) for v in vprobe)
    core = 0.0
    if has_levels:
        core += 8
    if has_levels or has_levels_file:
        core += 7
    if win_fn:
        core += 8
    if verified:
        core += 6
    if proven_unique:
        core += 6
    sub['core_35'] = core
    ev.append('levels=%s levels_file=%s win_fn=%d verifiers=%d proven_unique=%s' %
              (lvl, has_levels_file, win_fn, len(vprobe), proven_unique))

    # ---- 15% input + mobile ---------------------------------------------
    inp = 0.0
    if count(h, r'touchstart|pointerdown|touch-action'): inp += 6
    if count(h, r'keydown|keyup|keypress'): inp += 3
    if count(h, r'name=["\']viewport'): inp += 3
    if count(h, r'@media\s*\('): inp += 3
    sub['input_mobile_15'] = inp
    ev.append('touch/pointer=%d key=%d viewport=%d media=%d' %
              (count(h, r'touchstart|pointerdown'), count(h, r'keydown'),
               count(h, r'name=["\']viewport'), count(h, r'@media\s*\(')))

    # ---- 10% first visit / tutorial / difficulty curve --------------------
    first = 0.0
    if count(h, r'tutorial|how[- ]to[- ]play|howto|first[- ]time|welcome', re.I): first += 5
    if count(h, r'hint', re.I): first += 3
    if count(h, r'level[- ]?select|levelSelect|btnLevels'): first += 2
    sub['first_visit_10'] = first
    ev.append('tutorial=%d hint=%d levelselect=%d' %
              (count(h, r'tutorial|how[- ]to[- ]play|howto|first[- ]time|welcome'),
               count(h, r'hint'), count(h, r'level[- ]?select|levelSelect|btnLevels')))

    # ---- 10% visual / audio / feedback ----------------------------------
    vis = 0.0
    if count(h, r'AudioContext|webkitAudioContext'): vis += 4
    if count(h, r'mute|soundBtn|volume|toggleSound'): vis += 3
    if count(h, r'confetti|particles|shake|flash|pop\b|animation|@keyframes'): vis += 3
    sub['visual_audio_10'] = vis
    ev.append('audio=%d muteUI=%d fx=%d' %
              (count(h, r'AudioContext'), count(h, r'mute|soundBtn|volume'),
               count(h, r'confetti|particles|shake|flash|@keyframes')))

    # ---- 10% perf / lifecycle / persistence ------------------------------
    perf = 0.0
    if count(h, r'localStorage'): perf += 4
    if count(h, r'visibilitychange|beforeunload|pagehide'): perf += 3
    if count(h, r'cancelAnimationFrame|clearInterval|clearTimeout'): perf += 3
    sub['perf_lifecycle_10'] = perf
    ev.append('persist=%d lifecycle=%d cleanup=%d' %
              (count(h, r'localStorage'), count(h, r'visibilitychange|beforeunload|pagehide'),
               count(h, r'cancelAnimationFrame|clearInterval|clearTimeout')))

    # ---- 10% verifier / test strength ------------------------------------
    vs = 0.0
    if len(vprobe) >= 1: vs += 4
    if len(vprobe) >= 2: vs += 3
    if proven_unique: vs += 3
    sub['verifier_10'] = vs
    ev.append('verifier_files=%d' % len(vprobe))

    # ---- 10% 30d PV/UV/engagement ----------------------------------------
    b = bi(slug) or {'pv30': 0, 'uv30': 0, 'engaged30': 0}
    eng = 0.0
    if b['uv30'] >= 10: eng += 4
    elif b['uv30'] >= 3: eng += 2
    if b['pv30'] >= 30: eng += 3
    elif b['pv30'] >= 10: eng += 2
    elif b['pv30'] >= 1: eng += 1
    if b['engaged30'] >= 10: eng += 3
    elif b['engaged30'] >= 1: eng += 1
    sub['bi_10'] = eng
    ev.append('pv30=%d uv30=%d engaged30=%d' % (b['pv30'], b['uv30'], b['engaged30']))

    total = sum(sub.values())
    return {'slug': slug, 'total': round(total, 1),
            'sub': {k: round(v, 1) for k, v in sub.items()},
            'evidence': ev, 'verifiers': vprobe}


if __name__ == '__main__':
    for slug in sys.argv[1:]:
        r = score(slug)
        print('=' * 72)
        print('%s   TOTAL %.1f / 100' % (r['slug'], r['total']))
        for k, v in r['sub'].items():
            print('   %-20s %5.1f' % (k, v))
        print('   evidence:')
        for e in r['evidence']:
            print('     - ' + e)
        for v in r['verifiers']:
            print('     verifier %-26s exit=%s :: %s' % (v['file'], v['exit'], v['tail'][:220]))
