#!/usr/bin/env python3
import urllib.request, re, json, time, ssl
from collections import defaultdict
from datetime import datetime

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

BASE = 'https://gamezipper.com'
GAMES = ['2048','tetris','snake','flappy-wings','slope','sudoku','jigsaw-puzzle','whack-a-mole','memory-match','minesweeper','reaction-time','idle-clicker','color-sort','chess','crossword','parking-jam','brick-breaker','marble-run','neon-run','stacker']
UA = {'User-Agent': 'Mozilla/5.0'}

def fetch_bytes(url):
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=15, context=ssl_ctx) as r:
            return r.read(), r.status
    except Exception as e:
        return None, 0

def fetch_str(url):
    data, st = fetch_bytes(url)
    if data: return data.decode('utf-8','replace'), st
    return None, st

def check_seo(h):
    issues, c = [], {}
    m = re.search(r'<title[^>]*>(.*?)</title>', h, re.DOTALL|re.I)
    c['title'] = bool(m and m.group(1).strip())
    if not c['title']: issues.append('Missing/empty title')
    DQ = chr(34); SQ = chr(39)
    d = re.search(r'<meta\s+[^>]*name=['+DQ+SQ+']description['+DQ+SQ+'][^>]*content=['+DQ+SQ+'](.*?)['+DQ+SQ+']', h, re.I|re.S)
    if not d: d = re.search(r'<meta\s+[^>]*content=['+DQ+SQ+'](.*?)['+DQ+SQ+'][^>]*name=['+DQ+SQ+']description['+DQ+SQ+']', h, re.I|re.S)
    dl = len(d.group(1).strip()) if d else 0
    c['meta_desc'] = dl > 50
    if not c['meta_desc']: issues.append(f'meta desc {dl} chars (need>50)')
    for tag in ['og:title','og:description','og:image']:
        pat = r'<meta\s+[^>]*property=['+DQ+SQ+']' + tag + '['+DQ+SQ+']'
        c[tag] = bool(re.search(pat, h, re.I))
        if not c[tag]: issues.append(f'Missing {tag}')
    c['canonical'] = bool(re.search(r'<link\s+[^>]*rel=['+DQ+SQ+']canonical['+DQ+SQ+']', h, re.I))
    if not c['canonical']: issues.append('Missing canonical')
    c['json_ld'] = bool(re.search(r'<script[^>]*type=['+DQ+SQ+']application/ld\+json['+DQ+SQ+']', h, re.I))
    if not c['json_ld']: issues.append('Missing JSON-LD')
    c['h1'] = bool(re.search(r'<h1[^>]*>', h, re.I))
    if not c['h1']: issues.append('Missing H1')
    return c, issues

def check_ads(h):
    issues, c = [], {}
    c['ins_tags'] = bool(re.findall(r'<ins', h, re.I))
    if not c['ins_tags']: issues.append('No ins ad tags')
    kw = 'monetag|propeller|ads?_|adsbygoogle|adsterra|hilltopads|popads|push|clickadu|exoclick'
    c['ad_scripts'] = bool(re.search(r'<script[^>]*(' + kw + r')[^>]*>', h, re.I))
    if not c['ad_scripts']: issues.append('No ad scripts')
    c['ad_divs'] = bool(re.search(r'<(?:div|span)[^>]*(?:ad-container|ad-slot|ad-banner|ad-wrapper|ad-unit|gpt-ad|ad_)[^>]*>', h, re.I))
    if not c['ad_divs']: issues.append('No ad container divs')
    return c, issues

def check_mobile(h):
    issues, c = [], {}
    DQ = chr(34); SQ = chr(39)
    c['viewport'] = bool(re.search(r'<meta\s+[^>]*name=['+DQ+SQ+']viewport['+DQ+SQ+']', h, re.I))
    if not c['viewport']: issues.append('Missing viewport')
    t = bool(re.search(r'touch-action|webkit-tap-highlight|touchstart|touchmove|touchend', h, re.I) or re.search(r'@media.*max-width', h, re.I))
    c['touch_css'] = t
    if not t: issues.append('No touch CSS')
    return c, issues

def check_perf(b):
    issues, c = [], {}
    kb = len(b)/1024
    c['html_size'] = kb < 200
    if kb >= 200: issues.append(f'HTML {kb:.1f}KB>200KB')
    h = b.decode('utf-8','replace')
    sc = len(re.findall(r'<script', h, re.I))
    lc = len(re.findall(r'<link', h, re.I))
    tr = sc + lc
    c['resources'] = tr < 30
    if tr >= 30: issues.append(f'{tr} resources>=30')
    return c, issues, kb, tr

def check_links(b, game):
    issues, c = [], {}
    h = b.decode('utf-8','replace')
    DQ = chr(34); SQ = chr(39)
    c['home'] = bool(re.search(r'href=['+DQ+SQ+']https?://gamezipper\.com/?['+DQ+SQ+']', h) or re.search(r'href=['+DQ+SQ+']/?['+DQ+SQ+']', h))
    if not c['home']: issues.append('No homepage link')
    gl = re.findall(r'href=['+DQ+SQ+']/?([a-z0-9][a-z0-9\-]*/?)['+DQ+SQ+']', h, re.I)
    skip = {'admin','about','sitemap','arcade-games','puzzle-games','card-games','idle-games','simulation-games','word-typing-games','privacy','terms','contact','audio','images','css','js','fonts','og-images','beta','test-results','favicon','apple-touch-icon','ads','node_modules','game-audio','manifest','service-worker','sw','icon','best-'}
    og = set(g.rstrip('/') for g in gl if g and g.rstrip('/') != game and g.rstrip('/') not in skip and len(g) < 40)
    c['game_links'] = len(og) >= 2
    if len(og) < 2: issues.append(f'Only {len(og)} game links')
    return c, issues

def main():
    NL = chr(10)
    print('='*70)
    print('  QA Phase 3: Commercial Readiness - GameZipper.com')
    ts = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f'  {ts} | {len(GAMES)} games')
    print('='*70)
    print()
    print('[6] Sitemap + Robots.txt')
    si_list, ri_list = [], []
    st, ss = fetch_str(f'{BASE}/sitemap.xml')
    sf = []
    if st and ss==200:
        print('   OK sitemap.xml')
        for g in GAMES:
            if f'{BASE}/{g}' in st: sf.append(g)
        mg = [g for g in GAMES if g not in sf]
        if mg:
            si_list.append(f'Missing {len(mg)}: {chr(44).join(mg)}')
            print(f'   WARN missing {len(mg)}')
        else:
            print(f'   OK all {len(GAMES)} in sitemap')
    else:
        si_list.append(f'HTTP {ss}')
        print(f'   FAIL sitemap HTTP {ss}')
    rt, rs = fetch_str(f'{BASE}/robots.txt')
    if rt and rs==200:
        print('   OK robots.txt')
        if 'Sitemap:' not in rt:
            ri_list.append('No Sitemap decl')
            print('   WARN no Sitemap decl')
        else:
            print('   OK Sitemap decl')
    else:
        ri_list.append(f'HTTP {rs}')
        print(f'   FAIL robots HTTP {rs}')
    cs = defaultdict(lambda:{'pass':0,'fail':0,'issues':defaultdict(list)})
    for i, game in enumerate(GAMES, 1):
        url = f'{BASE}/{game}/'
        b, s = fetch_bytes(url)
        if b is None:
            print(f'{NL}[{i}/{len(GAMES)}] {game} FAIL HTTP {s}')
            for cat in ['seo','ads','mobile','performance','internal_links']:
                cs[cat]['fail'] += 1
                cs[cat]['issues'][game].append(f'HTTP {s}')
            continue
        h = b.decode('utf-8','replace')
        print(f'{NL}[{i}/{len(GAMES)}] {game} (HTTP {s})')
        for cat, fn in [('seo',lambda: check_seo(h)),('ads',lambda: check_ads(h)),('mobile',lambda: check_mobile(h))]:
            ck, iss = fn()
            p = all(ck.values())
            cs[cat]['pass' if p else 'fail'] += 1
            if iss: cs[cat]['issues'][game] = iss
            mk = 'OK' if p else 'FAIL'
            detail = f' - {chr(59).join(iss[:2])}' if iss else ''
            print(f'   {mk} {cat}: {len(iss)} issues{detail}')
        ck, iss, kb, tr = check_perf(b)
        p = all(ck.values())
        cs['performance']['pass' if p else 'fail'] += 1
        if iss: cs['performance']['issues'][game] = iss
        mk = 'OK' if p else 'FAIL'
        print(f'   {mk} perf: {kb:.1f}KB {tr}res')
        ck, iss = check_links(b, game)
        p = all(ck.values())
        cs['internal_links']['pass' if p else 'fail'] += 1
        if iss: cs['internal_links']['issues'][game] = iss
        detail = f' - {chr(59).join(iss[:2])}' if iss else ''
        mk = 'OK' if p else 'FAIL'
        print(f'   {mk} links: {len(iss)} issues{detail}')
        time.sleep(0.3)
    print(NL)
    print('='*70)
    print('  SUMMARY REPORT')
    print('='*70)
    cn = {'seo':'1. SEO Completeness','ads':'2. Ad Loading','mobile':'3. Mobile Adaptation','performance':'4. Performance','internal_links':'5. Internal Links'}
    tp, tc = 0, 0
    for ck, nm in cn.items():
        s = cs[ck]
        r = s['pass']/len(GAMES)*100
        tp += s['pass']; tc += len(GAMES)
        pstr = str(s['pass'])
        print(f'{NL}{nm}: {pstr}/{len(GAMES)} ({r:.0f}%)')
        if s['issues']:
            for g, il in s['issues'].items():
                print(f'  - {g}: {chr(59).join(il)}')
        else:
            print('  All passed!')
    sitemap_status = 'PASS' if not si_list else 'FAIL'
    robots_status = 'PASS' if not ri_list else 'FAIL'
    print(f'{NL}6. Sitemap: {sitemap_status}')
    for x in si_list: print(f'  - {x}')
    print(f'   Robots.txt: {robots_status}')
    for x in ri_list: print(f'  - {x}')
    ov = tp/tc*100 if tc else 0
    gr = 'A' if ov>=95 else 'B' if ov>=85 else 'C' if ov>=70 else 'D' if ov>=50 else 'F'
    print(NL)
    print('='*70)
    print(f'  Overall: {tp}/{tc} ({ov:.1f}%) Grade: {gr}')
    print('='*70)
    out = {'timestamp':datetime.now().isoformat(),'games':GAMES,'summary':{},'sitemap':{'accessible':bool(st),'found':len(sf),'missing':[g for g in GAMES if g not in sf],'issues':si_list},'robots':{'accessible':bool(rt),'issues':ri_list},'overall_rate':round(ov,1),'grade':gr}
    for ck in cn:
        s = cs[ck]
        out['summary'][ck] = {'pass':s['pass'],'fail':s['fail'],'rate':round(s['pass']/len(GAMES)*100,1),'failures':dict(s['issues'])}
    p = '/home/msdn/gamezipper.com/tests/qa_phase3_results.json'
    with open(p,'w') as f: json.dump(out,f,indent=2,ensure_ascii=False)
    print(f'{NL}Saved: {p}')

if __name__=='__main__': main()
