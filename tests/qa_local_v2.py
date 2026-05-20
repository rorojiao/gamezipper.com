#!/usr/bin/env python3
"""GameZipper 全站本地QA检测脚本 v2 — 5阶段检测
当 Cloudflare 301 重定向导致 qa_v3.py 不可用时使用本地文件检测替代。
"""
import os, re, json, sys, glob

GAMES_DIR = '/home/msdn/gamezipper.com'

# 非游戏目录（有index.html但不是游戏）
EXCLUDE = {'admin', 'beta', 'blog', 'fun-web-games', 'one-line-connect', 'tangram-puzzle', 'ad-experiments'}

def get_games():
    dirs = []
    for d in sorted(os.listdir(GAMES_DIR)):
        p = os.path.join(GAMES_DIR, d, 'index.html')
        if os.path.isfile(p) and d not in EXCLUDE:
            dirs.append(d)
    return dirs

def read_game(slug):
    p = os.path.join(GAMES_DIR, slug, 'index.html')
    with open(p, 'r', encoding='utf-8', errors='replace') as f:
        return f.read()

# ============ 阶段1: 基础健康检测 ============
def phase1(games):
    results = []
    for g in games:
        html = read_game(g)
        issues = []
        score = 100

        # 1.1 文件完整性
        if not html.strip().endswith('</html>'):
            issues.append(('CRITICAL', 'File truncated or missing </html>'))
            score -= 20

        # 1.2 DOCTYPE
        if not html.strip().startswith('<!DOCTYPE') and not html.strip().startswith('<!doctype'):
            issues.append(('HIGH', 'Missing DOCTYPE'))
            score -= 5

        # 1.3 viewport meta
        if 'viewport' not in html:
            issues.append(('HIGH', 'Missing viewport meta'))
            score -= 5

        # 1.4 title标签
        if not re.search(r'<title[^>]*>[^<]+</title>', html, re.IGNORECASE):
            issues.append(('HIGH', 'Missing <title> tag'))
            score -= 5

        # 1.5 canvas/DOM内容
        has_canvas = '<canvas' in html.lower()
        has_interactive = any(x in html for x in ['getElementById', 'querySelector', 'addEventListener'])
        if not has_canvas and not has_interactive:
            issues.append(('HIGH', 'No canvas or DOM interaction detected'))
            score -= 10

        # 1.6 script标签
        script_count = len(re.findall(r'<script', html))
        if script_count == 0:
            issues.append(('CRITICAL', 'No <script> tags'))
            score -= 20

        # 1.7 文件大小合理性 (>500KB警告, <1KB异常)
        fsize = len(html)
        if fsize < 1000:
            issues.append(('CRITICAL', f'File too small ({fsize} bytes)'))
            score -= 20
        elif fsize > 500000:
            issues.append(('WARN', f'File very large ({fsize} bytes)'))

        # 1.8 中文检测（UI应该是英文）
        chinese = len(re.findall(r'[\u4e00-\u9fff]', html))
        if chinese > 5:
            issues.append(('WARN', f'Chinese characters detected: {chinese}'))

        results.append({'game': g, 'score': max(0, score), 'issues': issues})
    return results

# ============ 阶段1.5: HTML结构+代码质量 ============
def phase1_5(games):
    results = []
    for g in games:
        html = read_game(g)
        issues = []

        # 1.5.1 HTML标签匹配
        for tag in ['html', 'body', 'head']:
            opens = len(re.findall(f'<{tag}[\\s>]', html))
            closes = len(re.findall(f'</{tag}>', html))
            if opens != closes:
                issues.append(('HIGH', f'{tag} tag mismatch: open={opens} close={closes}'))

        # 1.5.2 script标签匹配
        script_opens = len(re.findall(r'<script[\s>]', html))
        script_closes = len(re.findall(r'</script>', html))
        if script_opens != script_closes:
            issues.append(('HIGH', f'script tag mismatch: open={script_opens} close={script_closes}'))

        # 1.5.3 空CSS规则
        empty_css = re.findall(r'\.lang-zh\s*\{([^}]*)\}', html)
        for ec in empty_css:
            if not ec.strip():
                issues.append(('MEDIUM', 'Empty .lang-zh CSS rule'))
                break

        # 1.5.4 text-stroke检测
        if '-webkit-text-stroke' in html or 'text-stroke' in html:
            issues.append(('HIGH', 'Forbidden -webkit-text-stroke found'))

        # 1.5.5 emoji in fillText (Canvas rendering issue)
        # Check for common emoji ranges in fillText calls
        emoji_in_filltext = re.findall(r'fillText\s*\([^)]*[\U0001F300-\U0001F9FF\U00002600-\U000026FF\U00002700-\U000027BF]', html)
        if emoji_in_filltext:
            issues.append(('HIGH', f'Emoji in Canvas fillText: {len(emoji_in_filltext)} instances'))

        # 1.5.6 外部CSS引用
        if 'rel="stylesheet"' in html:
            issues.append(('MEDIUM', 'External CSS stylesheet reference'))

        # 1.5.7 JS语法检测 (basic)
        # Extract largest script block and try to detect syntax errors
        script_blocks = re.findall(r'<script[^>]*>([\s\S]*?)</script>', html)
        if script_blocks:
            largest = max(script_blocks, key=len)
            # Check for common syntax error patterns
            bracket_stack = []
            for ch in largest:
                if ch in '({[': bracket_stack.append(ch)
                elif ch in ')}]':
                    if not bracket_stack: break
                    expected = {'(': ')', '{': '}', '[': ']'}
                    if expected.get(bracket_stack[-1]) != ch: break
                    bracket_stack.pop()
            else:
                if bracket_stack:
                    issues.append(('HIGH', f'Unmatched brackets: {bracket_stack[-1]} unclosed'))

        results.append({'game': g, 'issues': issues})
    return results

# ============ 阶段3: 商业化标准检查 ============
def phase3(games):
    results = []
    for g in games:
        html = read_game(g)
        issues = []

        # 3.1 SEO
        # meta description
        if not re.search(r'<meta[^>]*name=["\']description["\'][^>]*>', html, re.IGNORECASE):
            if 'og:description' not in html:
                issues.append(('HIGH', 'Missing meta description'))

        # og:title
        if 'og:title' not in html:
            issues.append(('MEDIUM', 'Missing og:title'))

        # og:image
        if 'og:image' not in html:
            issues.append(('MEDIUM', 'Missing og:image'))

        # canonical
        if 'canonical' not in html:
            issues.append(('MEDIUM', 'Missing canonical URL'))

        # JSON-LD
        if 'application/ld+json' not in html:
            issues.append(('MEDIUM', 'Missing JSON-LD structured data'))

        # H1 tag
        if not re.search(r'<h1[\s>]', html, re.IGNORECASE):
            issues.append(('MEDIUM', 'Missing H1 tag'))

        # 3.2 Monetag广告
        if 'monetag-manager.js' not in html and 'monetag' not in html.lower():
            issues.append(('HIGH', 'Missing monetag-manager.js reference'))

        # 3.3 engage.js
        if 'engage.js' not in html:
            issues.append(('LOW', 'Missing engage.js'))

        # 3.4 Home link
        has_home = bool(re.search(r'href=["\']https?://gamezipper\.com/?["\']', html))
        if not has_home:
            has_home2 = bool(re.search(r'href=["\']/["\']', html))
            if not has_home2:
                issues.append(('HIGH', 'Missing home link'))

        # 3.5 site-analytics pixel
        if 'site-analytics.cap.1ktower.com' not in html:
            issues.append(('MEDIUM', 'Missing site-analytics pixel'))

        # 3.6 touch-action CSS
        if 'touch-action' not in html:
            issues.append(('MEDIUM', 'Missing touch-action CSS'))

        # 3.7 user-select CSS
        if 'user-select' not in html:
            issues.append(('LOW', 'Missing user-select CSS'))

        # 3.8 overflow-x CSS
        if 'overflow-x' not in html:
            issues.append(('LOW', 'Missing overflow-x CSS'))

        # 3.9 game-footer.js
        if 'game-footer.js' not in html:
            issues.append(('LOW', 'Missing game-footer.js reference'))

        results.append({'game': g, 'issues': issues})
    return results

# ============ 阶段4: 深度代码质量检查 ============
def phase4(games):
    results = []
    for g in games:
        html = read_game(g)
        issues = []

        # 4.1 直接Monetag SDK引用（绕过统一管理）
        if 'cdn.monetag.com/sdk' in html:
            issues.append(('HIGH', 'Direct Monetag SDK CDN reference (should use /monetag-manager.js)'))

        # 4.2 alwingulla.com引用
        if 'alwingulla.com' in html:
            issues.append(('HIGH', 'alwingulla.com reference (malware/adware domain)'))

        # 4.3 console.log残留
        log_count = html.count('console.log')
        if log_count > 0:
            issues.append(('LOW', f'console.log statements: {log_count}'))

        # 4.4 TODO/FIXME残留
        todo_count = len(re.findall(r'TODO|FIXME|HACK|XXX', html))
        if todo_count > 0:
            issues.append(('LOW', f'TODO/FIXME comments: {todo_count}'))

        # 4.5 外部API key泄露检测
        api_keys = re.findall(r'(api[_-]?key|apikey|secret|token)\s*[=:]\s*["\'][^"\']+["\']', html, re.IGNORECASE)
        if api_keys:
            issues.append(('CRITICAL', f'Potential API key exposure: {len(api_keys)} matches'))

        # 4.6 localStorage使用
        if 'localStorage' not in html:
            issues.append(('LOW', 'No localStorage usage (progress save)'))

        # 4.7 Canvas游戏 - DPI处理
        if '<canvas' in html.lower() and 'devicePixelRatio' not in html:
            issues.append(('LOW', 'Canvas game without DPI handling'))

        # 4.8 响应式检测
        if 'resize' not in html and 'innerWidth' not in html and 'matchMedia' not in html:
            issues.append(('MEDIUM', 'No responsive handling'))

        # 4.9 cleanup/visibilitychange
        if 'requestAnimationFrame' in html and 'visibilitychange' not in html:
            issues.append(('LOW', 'rAF without visibilitychange handler'))

        # 4.10 setInterval leak check
        si_count = html.count('setInterval')
        ci_count = html.count('clearInterval')
        if si_count > 0 and ci_count == 0:
            issues.append(('MEDIUM', f'setInterval ({si_count}) without clearInterval'))

        results.append({'game': g, 'issues': issues})
    return results

# ============ 首页检查 ============
def check_homepage():
    p = os.path.join(GAMES_DIR, 'index.html')
    with open(p, 'r', encoding='utf-8', errors='replace') as f:
        html = f.read()
    issues = []

    # H1 count
    h1_count = len(re.findall(r'<h1[\s>]', html, re.IGNORECASE))
    if h1_count != 1:
        issues.append(('HIGH', f'H1 count: {h1_count} (expected 1)'))

    # footer count
    footer_opens = len(re.findall(r'<footer[\s>]', html, re.IGNORECASE))
    if footer_opens != 1:
        issues.append(('HIGH', f'footer count: {footer_opens} (expected 1)'))

    # duplicate Why Play section
    why_play = len(re.findall(r'why.play|Why Play', html, re.IGNORECASE))
    if why_play > 1:
        issues.append(('HIGH', f'Duplicate Why Play section: {why_play} occurrences'))

    # game count consistency
    live_count = len(re.findall(r'status:"live"', html))
    if live_count == 0:
        live_count = len(re.findall(r'status:\s*"live"', html))

    # Check for stale game count numbers
    current_count = 104  # from games-data.js
    for m in re.finditer(r'\b(100|101|102|103)\b', html):
        line = html[:m.start()].count('\n') + 1
        ctx = html[max(0,m.start()-30):m.end()+30]
        issues.append(('WARN', f'Line {line}: potentially stale number {m.group()}: ...{ctx}...'))

    return issues

def main():
    games = get_games()
    print(f"=== GameZipper QA Round 34 (Local) ===")
    print(f"Games to test: {len(games)}")
    print()

    # Phase 1
    print("=" * 60)
    print("Phase 1: Basic Health Check")
    print("=" * 60)
    p1 = phase1(games)
    p1_pass = sum(1 for r in p1 if r['score'] >= 80)
    p1_fail = sum(1 for r in p1 if r['score'] < 80)
    p1_critical = [(r['game'], i) for r in p1 for i in r['issues'] if i[0] == 'CRITICAL']
    p1_high = [(r['game'], i) for r in p1 for i in r['issues'] if i[0] == 'HIGH']
    print(f"  PASS: {p1_pass}/{len(games)} | FAIL: {p1_fail}")
    if p1_critical:
        print(f"  CRITICAL ({len(p1_critical)}):")
        for g, i in p1_critical: print(f"    - {g}: {i[1]}")
    if p1_high:
        print(f"  HIGH ({len(p1_high)}):")
        for g, i in p1_high: print(f"    - {g}: {i[1]}")
    print()

    # Phase 1.5
    print("=" * 60)
    print("Phase 1.5: HTML Structure & Code Quality")
    print("=" * 60)
    p1_5 = phase1_5(games)
    p1_5_issues = [(r['game'], i) for r in p1_5 for i in r['issues']]
    p1_5_high = [(r['game'], i) for r in p1_5 for i in r['issues'] if i[0] in ('CRITICAL', 'HIGH')]
    p1_5_pass = sum(1 for r in p1_5 if not any(i[0] in ('CRITICAL', 'HIGH') for i in r['issues']))
    print(f"  PASS: {p1_5_pass}/{len(games)} | ISSUES: {len(p1_5_issues)}")
    if p1_5_high:
        print(f"  HIGH+ ({len(p1_5_high)}):")
        for g, i in p1_5_high: print(f"    - {g}: {i[1]}")
    print()

    # Phase 3
    print("=" * 60)
    print("Phase 3: Commercial Standards Check")
    print("=" * 60)
    p3 = phase3(games)
    p3_issues = [(r['game'], i) for r in p3 for i in r['issues']]
    p3_high = [(r['game'], i) for r in p3 for i in r['issues'] if i[0] in ('CRITICAL', 'HIGH')]
    p3_pass = sum(1 for r in p3 if not any(i[0] in ('CRITICAL', 'HIGH') for i in r['issues']))
    print(f"  PASS: {p3_pass}/{len(games)} | ISSUES: {len(p3_issues)}")
    if p3_high:
        print(f"  HIGH+ ({len(p3_high)}):")
        for g, i in p3_high: print(f"    - {g}: {i[1]}")
    print()

    # Phase 4
    print("=" * 60)
    print("Phase 4: Code Quality Deep Check")
    print("=" * 60)
    p4 = phase4(games)
    p4_issues = [(r['game'], i) for r in p4 for i in r['issues']]
    p4_critical = [(r['game'], i) for r in p4 for i in r['issues'] if i[0] == 'CRITICAL']
    p4_high = [(r['game'], i) for r in p4 for i in r['issues'] if i[0] == 'HIGH']
    p4_pass = sum(1 for r in p4 if not any(i[0] in ('CRITICAL', 'HIGH') for i in r['issues']))
    print(f"  PASS: {p4_pass}/{len(games)} | ISSUES: {len(p4_issues)}")
    if p4_critical:
        print(f"  CRITICAL ({len(p4_critical)}):")
        for g, i in p4_critical: print(f"    - {g}: {i[1]}")
    if p4_high:
        print(f"  HIGH ({len(p4_high)}):")
        for g, i in p4_high: print(f"    - {g}: {i[1]}")
    print()

    # Homepage check
    print("=" * 60)
    print("Homepage Structure Check")
    print("=" * 60)
    hp = check_homepage()
    if hp:
        for i in hp: print(f"  [{i[0]}] {i[1]}")
    else:
        print("  All checks passed!")
    print()

    # Summary
    print("=" * 60)
    print("QA SUMMARY")
    print("=" * 60)
    all_critical = len(p1_critical) + len(p1_5_high) + len(p3_high) + len(p4_critical) + len(p4_high)
    # Filter TRUE critical/high from phases
    true_critical = []
    for items, label in [(p1_critical, 'P1'), (p1_5_high, 'P1.5'), (p3_high, 'P3'), (p4_critical + p4_high, 'P4')]:
        for g, i in items:
            if i[0] in ('CRITICAL', 'HIGH'):
                true_critical.append((g, label, i))

    print(f"  Games tested: {len(games)}")
    print(f"  P1 Health: {p1_pass}/{len(games)} pass")
    print(f"  P1.5 Structure: {p1_5_pass}/{len(games)} pass")
    print(f"  P3 Commercial: {p3_pass}/{len(games)} pass")
    print(f"  P4 Code Quality: {p4_pass}/{len(games)} pass")
    print(f"  TRUE CRITICAL+HIGH issues: {len(true_critical)}")
    if true_critical:
        print(f"  --- Issues requiring fix ---")
        for g, phase, i in true_critical:
            print(f"    [{phase}] {g}: {i[1]}")

    # Write JSON report
    report = {
        'round': 34,
        'games_tested': len(games),
        'p1_pass': p1_pass,
        'p1_fail': p1_fail,
        'p1_5_pass': p1_5_pass,
        'p3_pass': p3_pass,
        'p4_pass': p4_pass,
        'true_high_critical': [{'game': g, 'phase': ph, 'issue': i[1]} for g, ph, i in true_critical],
        'homepage_issues': [{'severity': i[0], 'issue': i[1]} for i in hp]
    }
    out_path = '/tmp/qa_round34_report.json'
    with open(out_path, 'w') as f:
        json.dump(report, f, indent=2)
    print(f"\nReport saved to {out_path}")

if __name__ == '__main__':
    main()
