#!/usr/bin/env python3
"""
audit_all_games.py — Playwright 全游戏截图+基础检测
用法: python3 audit_all_games.py [game_name]
输出: /tmp/audit_<game>_desktop.png, /tmp/audit_<game>_mobile.png
"""
import sys

GAMES = [
    'sushi-stack', 'ocean-gem-pop', 'phantom-blade', 'catch-turkey',
    'brick-breaker', 'snake', 'stacker', 'color-sort', 'whack-a-mole',
    'paint-splash', 'memory-match', 'kitty-cafe', 'idle-clicker',
    'flappy-wings', 'dessert-blast', 'typing-speed', '2048', 'word-puzzle',
]

def audit_game(game):
    from playwright.sync_api import sync_playwright
    url = f'https://gamezipper.com/{game}/'
    results = {'game': game, 'errors': [], 'overflow_desktop': False, 'overflow_mobile': False}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])

        # 桌面端
        page = browser.new_page(viewport={'width': 1280, 'height': 720})
        page.on('pageerror', lambda e: results['errors'].append(f'JS: {str(e)[:100]}'))
        try:
            page.goto(url, wait_until='networkidle', timeout=20000)
            page.screenshot(path=f'/tmp/audit_{game}_desktop.png')
            results['overflow_desktop'] = page.evaluate(
                "() => document.body.scrollWidth > window.innerWidth + 2"
            )
        except Exception as e:
            results['errors'].append(f'LOAD: {str(e)[:80]}')
        finally:
            page.close()

        # 移动端
        page2 = browser.new_page(viewport={'width': 390, 'height': 844})
        page2.on('pageerror', lambda e: results['errors'].append(f'mob JS: {str(e)[:100]}'))
        try:
            page2.goto(url, wait_until='networkidle', timeout=20000)
            page2.screenshot(path=f'/tmp/audit_{game}_mobile.png')
            results['overflow_mobile'] = page2.evaluate(
                "() => document.body.scrollWidth > window.innerWidth + 2"
            )
        except Exception as e:
            results['errors'].append(f'mob LOAD: {str(e)[:80]}')
        finally:
            page2.close()

        browser.close()

    ok = not results['errors'] and not results['overflow_desktop'] and not results['overflow_mobile']
    status = '✅' if ok else '❌'
    issues = []
    if results['errors']:      issues.append(f"JS错误:{results['errors'][:2]}")
    if results['overflow_desktop']: issues.append('桌面溢出')
    if results['overflow_mobile']:  issues.append('移动端溢出')
    print(f'{status} {game}' + (f': {"; ".join(issues)}' if issues else ''))
    return results


def main():
    target = sys.argv[1] if len(sys.argv) > 1 else None
    games = [target] if target else GAMES

    print(f'开始审查 {len(games)} 个游戏...\n')
    all_results = []
    for game in games:
        r = audit_game(game)
        all_results.append(r)

    passed = sum(1 for r in all_results if not r['errors'] and not r['overflow_desktop'] and not r['overflow_mobile'])
    print(f'\n结果: {passed}/{len(games)} 通过')
    failed = [r for r in all_results if r['errors'] or r['overflow_desktop'] or r['overflow_mobile']]
    if failed:
        print('需要修复:', [r['game'] for r in failed])
    return failed


if __name__ == '__main__':
    main()
