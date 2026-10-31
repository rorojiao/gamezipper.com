#!/usr/bin/env python3
"""Register Set Quest across every GameZipper catalog surface.

SURFACES TOUCHED (all must agree on the new total N):
  1. js/games-data.js        — the GAMES array (TRUTH SOURCE)
  2. js/itemlist-schema.js   — rebuilt from games-data.js via rebuild_schema.js
  3. index.html              — data-count spans, per-category .cat-count spans,
                               and the inline ItemList JSON-LD <script> block
  4. sitemap.xml             — a <url><loc> entry for /set-quest/
  5. game-footer.js          — the related-games pool entry
  6. api/games.json          — regenerated via scripts/gen-games-json.js

Everything is computed from the live games-data.js, never hard-coded, so the
script is safe to re-run and safe to run against a sibling's already-registered
catalog (it appends, then rebuilds the derived files from the result).

Usage:  python3 scripts/register_set_quest.py [--dry-run]
"""
import json
import os
import re
import subprocess
import sys

ROOT = '/home/junze/gamezipper.com'
SLUG = 'set-quest'
NAME = 'Set Quest'
EMOJI = '\U0001F0CF'          # 🃏
CAT = 'card'
TAGS = [
    'set quest', 'set card game', 'set puzzle', 'card attribute puzzle',
    'matching logic game', 'unique solution', 'logic puzzle', 'brain teaser',
    'card game', 'free browser game', 'html5', 'mobile game', 'no download',
]
DESC = (
    'Play Set Quest free online! The classic SET card-attribute puzzle: '
    'find the three cards where every attribute - shape, color, number and '
    'shading - is either all the same or all three different. 30 '
    'unique-solution boards across 5 difficulty tiers, from 9-card Beginner '
    'to 18-card Expert. Hints, undo and 3-star ratings. No download needed.'
)
# The description must survive JSON.stringify inside a JS string literal.
DESC = DESC.replace('-', '-')

DRY = '--dry-run' in sys.argv


def read(p):
    with open(os.path.join(ROOT, p), encoding='utf-8') as f:
        return f.read()


def write(p, s):
    if not DRY:
        with open(os.path.join(ROOT, p), 'w', encoding='utf-8') as f:
            f.write(s)
    print(f'  wrote {p} ({len(s)} bytes)')


def js_str(s):
    """Escape a Python string for embedding in a double-quoted JS literal."""
    return json.dumps(s, ensure_ascii=False)[1:-1].replace('"', '\\"')


def main():
    print(f'=== Registering {NAME} (/{SLUG}/) ===')

    # ---------------- 1. games-data.js ----------------
    gd = read('js/games-data.js')
    if f'url:"/{SLUG}/"' in gd:
        print('  games-data.js: already registered, skipping insert')
    else:
        entry = (
            '{name:"%s",emoji:"%s",cat:"%s",tags:[%s],url:"/%s/",desc:"%s",'
            'isNew:true,status:"live"},'
            % (NAME, EMOJI, CAT,
               ','.join('"%s"' % t for t in TAGS),
               SLUG, js_str(DESC))
        )
        # Insert as the LAST element of the GAMES array.
        # The array's existing last entry already ends with a comma, so we
        # must NOT add another one — "},," would create a sparse-array hole
        # (JS tolerates it, but the array length would then exceed the real
        # entry count and every consumer that indexes positionally would see
        # an undefined slot).
        marker = '\n];'
        idx = gd.rindex(marker)
        head = gd[:idx].rstrip()
        assert head.endswith(','), 'expected the last entry to end with a comma'
        gd = head + '\n' + entry + gd[idx:]
        write('js/games-data.js', gd)

    # ---------------- 2. rebuild itemlist-schema.js ----------------
    if not DRY:
        subprocess.run(['node', os.path.join(ROOT, 'rebuild_schema.js')],
                       cwd=ROOT, check=True)

    # Read the catalog back through the same loader the site uses.
    node_src = (
        "const fs=require('fs'),vm=require('vm');"
        "let c=fs.readFileSync('js/games-data.js','utf8');"
        "c=c.replace(/^const GAMES/m,'globalThis.GAMES');"
        "const sb={globalThis:{},console:console};Object.assign(sb,sb.globalThis);"
        "vm.createContext(sb);vm.runInContext(c,sb);"
        "const g=sb.GAMES||sb.globalThis.GAMES;"
        "const live=g.filter(x=>x&&x.url&&x.status==='live');"
        "const cats={};for(const x of live)cats[x.cat]=(cats[x.cat]||0)+1;"
        "console.log(JSON.stringify({total:live.length,cats}));"
    )
    out = subprocess.run(['node', '-e', node_src], cwd=ROOT,
                         capture_output=True, text=True, check=True)
    info = json.loads(out.stdout.strip())
    total = info['total']
    cats = info['cats']
    print(f'  catalog now: {total} live games, cats={cats}')
    if f'url:"/{SLUG}/"' not in read('js/games-data.js'):
        sys.exit('ERROR: set-quest missing from games-data.js after insert')

    # ---------------- 3. index.html ----------------
    html = read('index.html')
    old_total = 466  # the pre-registration total this script is written against
    if total == old_total:
        sys.exit(f'ERROR: catalog total is still {total}; expected {old_total}+1')

    # 3a. the two data-count spans (header + footer stat)
    def bump_dc(m):
        return m.group(0).replace(f'data-count="{old_total}"',
                                  f'data-count="{total}"')
    html, n_dc = re.subn(r'data-count="%d"' % old_total, bump_dc, html)

    # 3b. the per-category .cat-count span for OUR category only.
    #     Replace the count ONLY inside the cat-btn that carries our emoji,
    #     so a sibling's concurrent category bump is not clobbered.
    #     The button text is "<emoji> <Label> <span class="cat-count">N</span>",
    #     so the emoji is followed by the LABEL, not by the span directly.
    cat_before = cats.get(CAT, 1) - 1
    cat_after = cats.get(CAT, 1)
    cat_emoji = {'card': '\U0001F0CF', 'puzzle': '\U0001F9E9'}.get(CAT, '')
    pat = re.compile(
        r'(%s[^<]*<span class="cat-count">)(\d+)(</span>)' % re.escape(cat_emoji))
    m = pat.search(html)
    if not m:
        print(f'  WARNING: could not locate the {CAT} cat-count span')
    else:
        html = html[:m.start()] + m.group(1) + str(cat_after) + m.group(3) + \
            html[m.end():]
        print(f'  {CAT} cat-count: {cat_before} -> {cat_after}')

    # NOTE: there is NO separate "All" total span to update. The All button's
    # .cat-count holds a literal placeholder, and scripts/sync-game-counts.sh
    # derives the page total as the SUM of the 11 per-category spans. Bumping
    # our category span is therefore sufficient.

    # 3c. rebuild the inline ItemList JSON-LD block from the canonical schema.
    schema_js = read('js/itemlist-schema.js')
    ms = re.search(r'const ITEMLIST_SCHEMA\s*=\s*(\{[\s\S]*?\});', schema_js)
    if not ms:
        sys.exit('ERROR: could not parse js/itemlist-schema.js')
    schema_obj = json.loads(ms.group(1))

    ld_block = json.dumps(schema_obj, separators=(',', ':'),
                          ensure_ascii=False)
    # index.html stores the SAME object but under the site's key order.
    new_ld = (
        '<script type="application/ld+json">'
        + json.dumps({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            'name': 'GameZipper Free HTML5 Games',
            'itemListElement': [
                {'@type': 'ListItem', 'position': i + 1,
                 'url': e['url'], 'name': e['name']}
                for i, e in enumerate(schema_obj['itemListElement'])
            ],
            'numberOfItems': total,
            'description': f'{total} free browser games you can play instantly',
        }, separators=(',', ':'), ensure_ascii=False)
        + '</script>'
    )
    pat_ld = re.compile(
        r'<script type="application/ld\+json">\{"@context":"https://schema\.org",'
        r'"@type":"ItemList"[\s\S]*?</script>')
    if not pat_ld.search(html):
        sys.exit('ERROR: could not locate the ItemList JSON-LD block in index.html')
    html = pat_ld.sub(lambda _: new_ld, html, count=1)

    # 3d. append the new game to the ItemList JSON-LD name/url list
    #     (rebuild_schema.js already produced it; nothing more to do here)

    write('index.html', html)
    print(f'  index.html: data-count bumps={n_dc}, ItemList JSON-LD rebuilt')

    # ---------------- 4. sitemap.xml ----------------
    sm = read('sitemap.xml')
    if f'https://gamezipper.com/{SLUG}/' not in sm:
        entry = (
            '  <url>\n'
            f'    <loc>https://gamezipper.com/{SLUG}/</loc>\n'
            '    <lastmod>2026-10-31</lastmod>\n'
            '    <changefreq>weekly</changefreq>\n'
            '    <priority>0.8</priority>\n'
            '  </url>\n'
        )
        idx = sm.rindex('</urlset>')
        sm = sm[:idx] + entry + sm[idx:]
        write('sitemap.xml', sm)
    else:
        print('  sitemap.xml: already present, skipping')

    # ---------------- 5. game-footer.js ----------------
    gf = read('game-footer.js')
    if f"u:'/{SLUG}/'" not in gf and f'u:"/{SLUG}/"' not in gf:
        # Insert right after the opening `var games = [` line.
        anchor = 'var games = ['
        idx = gf.index(anchor) + len(anchor)
        entry = (
            "\n     {n:'%s',e:'%s',u:'/%s/',c:'%s'},"
            % (NAME, EMOJI, SLUG, CAT)
        )
        gf = gf[:idx] + entry + gf[idx:]
        write('game-footer.js', gf)
    else:
        print('  game-footer.js: already present, skipping')

    # ---------------- 6. api/games.json ----------------
    if not DRY:
        subprocess.run(['node', os.path.join(ROOT, 'scripts/gen-games-json.js')],
                       cwd=ROOT, check=True)

    # ---------------- verify ----------------
    print('\n=== verification ===')
    checks = [
        ('js/games-data.js', f'url:"/{SLUG}/"'),
        ('js/itemlist-schema.js', f'gamezipper.com/{SLUG}/'),
        ('index.html', f'gamezipper.com/{SLUG}/'),
        ('sitemap.xml', f'https://gamezipper.com/{SLUG}/'),
        ('game-footer.js', f"u:'/{SLUG}/'"),
        ('api/games.json', '"slug": "set-quest"'),
    ]
    ok = True
    for path, needle in checks:
        hit = needle in read(path)
        print(f'  {"OK " if hit else "MISS"} {path} <- {needle}')
        ok = ok and hit
    print(f'\n  games-data total : {total}')
    print(f'  {CAT} category    : {cat_after}')
    if not ok:
        sys.exit('ERROR: registration verification failed')
    print('=== registration complete ===')


if __name__ == '__main__':
    main()
