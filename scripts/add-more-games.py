#!/usr/bin/env python3
"""Add 'More Games' cross-link section to game pages that lack it."""
import os, re, random, pathlib

SITE = pathlib.Path('/home/msdn/gamezipper.com')
EXCLUDE = {'template-phaser3', 'node_modules', 'dist', '.git', 'scripts', 'audio', 'og-images', 'ad-experiments', 'promotion', 'test-results', 'blog'}

games = sorted([d.name for d in SITE.iterdir() 
    if d.is_dir() and (d / 'index.html').exists() and d.name not in EXCLUDE])

print(f"Found {len(games)} games")

for game in games:
    fp = SITE / game / 'index.html'
    html = fp.read_text()
    
    if 'More Free Games' in html or 'More Games Section' in html:
        print(f"SKIP {game}")
        continue
    
    # Get display names
    others = [g for g in games if g != game]
    picks = random.sample(others, min(6, len(others)))
    
    def get_name(g):
        fp2 = SITE / g / 'index.html'
        m = re.search(r'<title>Play (.+?) Online', fp2.read_text())
        return m.group(1).strip() if m else g.replace('-', ' ').title()
    
    links = ''.join(
        f'<a href="/{g}/" style="display:inline-block;padding:6px 12px;background:#1a1f34;'
        f'border:1px solid #2a3252;border-radius:999px;text-decoration:none;color:#fff;'
        f'font-size:13px">{get_name(g)}</a>'
        for g in picks
    )
    
    section = (
        '\n<!-- More Games Section -->\n'
        '<section style="max-width:700px;margin:30px auto 24px;padding:0 16px;'
        "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;"
        'color:#ccc;line-height:1.7;">\n'
        '<h2 style="font-size:20px;font-weight:700;color:#fff;margin-bottom:10px;">'
        '🎮 More Free Games Like This</h2>\n'
        '<p>If you enjoyed this game, you\'ll love these free online games too:</p>\n'
        f'<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">{links}</div>\n'
        '<div style="margin-top:16px">'
        '<a href="/" style="display:inline-block;padding:8px 16px;background:#00ff88;'
        'color:#000;border-radius:999px;text-decoration:none;font-weight:700;font-size:14px;'
        'margin-top:12px">🎮 All Free Games</a></div>\n'
        '</section>\n'
    )
    
    html = html.replace('</body>', section + '</body>')
    fp.write_text(html)
    print(f"DONE {game} → {len(picks)} links")

print("All done!")
