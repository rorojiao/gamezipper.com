#!/usr/bin/env python3
"""
check_game_code.py — 逐游戏代码静态检查
用法: python3 check_game_code.py [game_name]
"""
import re, sys
from pathlib import Path

BASE = Path('/home/msdn/gamezipper.com')
SKIP = {'node_modules', 'audio', 'test-results', 'bolt-jam-3d'}

GAMES = [
    d.name for d in sorted(BASE.iterdir())
    if d.is_dir() and d.name not in SKIP and (d / 'index.html').exists()
]


def check_game(game):
    html = (BASE / game / 'index.html').read_text(errors='ignore')
    issues = []

    # 1. 流量统计埋点
    if 'site-analytics' not in html:
        issues.append('❌ P0: 缺流量统计埋点')

    # 2. SEO
    if 'og:title' not in html:
        issues.append('❌ P1: 缺 og:title')
    if 'application/ld+json' not in html:
        issues.append('⚠️ P1: 缺 JSON-LD 结构化数据')
    if 'canonical' not in html:
        issues.append('⚠️ P1: 缺 canonical')

    # 3. 中文 text-stroke（禁止）
    strokes = re.findall(r'-webkit-text-stroke\s*:\s*([^;"\n]+)', html)
    bad = [s.strip() for s in strokes if s.strip() not in ('0', '0px', '0em', 'none', '')]
    if bad:
        issues.append(f'⚠️ P1: 使用了 -webkit-text-stroke: {bad[:2]} （禁止用于中文）')

    # 4. 移动端基础
    if 'overflow-x' not in html:
        issues.append('⚠️ P2: 缺 overflow-x:hidden')
    if 'user-select' not in html and 'userSelect' not in html:
        issues.append('⚠️ P2: 缺 user-select:none')
    if '<canvas' in html and 'touch-action' not in html:
        issues.append('⚠️ P2: Canvas 游戏缺 touch-action:none')

    # 5. pointerdown + touchstart 双触发风险
    if 'pointerdown' in html and 'touchstart' in html:
        ctx = re.findall(r'.{0,30}(pointerdown|touchstart).{0,30}', html)
        if len([c for c in ctx if 'pointerdown' in c]) > 0 and \
           len([c for c in ctx if 'touchstart' in c]) > 0:
            issues.append('⚠️ P2: 同时绑定 pointerdown + touchstart（移动端可能双触发）')

    # 6. setInterval 代替 requestAnimationFrame
    if 'setInterval' in html and 'requestAnimationFrame' not in html and '<canvas' in html:
        issues.append('⚠️ P3: Canvas 游戏用 setInterval 而非 requestAnimationFrame')

    # 7. Sort-It 类关卡配置检查
    if 'LEVEL_CONFIGS' in html:
        configs = re.findall(
            r'rods\s*:\s*(\d+)[^}]*?empty\s*:\s*(\d+)[^}]*?colors\s*:\s*(\d+)', html
        )
        for rods, empty, colors in configs:
            if int(rods) != int(colors) + int(empty):
                issues.append(f'❌ P0: 关卡BUG rods={rods} != colors={colors}+empty={empty}')
                break
        if not any('❌ P0: 关卡BUG' in i for i in issues):
            if configs:
                issues_found = [
                    f'rods={r} colors={c} empty={e}'
                    for r,e,c in configs if int(r) != int(c)+int(e)
                ]
                # 逆向打乱法检查
                if 'genLevel' in html and 'rodData[f].pop()' not in html:
                    issues.append('⚠️ P1: Sort-It 未用逆向打乱法生成（建议改为保证可解的算法）')

    return issues


def main():
    target = sys.argv[1] if len(sys.argv) > 1 else None
    games = [target] if target else GAMES

    problems = {}
    for game in games:
        issues = check_game(game)
        if issues:
            problems[game] = issues
        else:
            print(f'✅ {game}')

    if problems:
        print('\n=== 需要修复 ===')
        for game, issues in problems.items():
            print(f'\n📁 {game}:')
            for issue in issues:
                print(f'   {issue}')

    total = len(games)
    ok = total - len(problems)
    print(f'\n检查完成: {ok}/{total} 无问题')
    return problems


if __name__ == '__main__':
    main()
