#!/usr/bin/env python3
"""
fix_common_issues.py — 自动修复常见问题
用法: python3 fix_common_issues.py [game_name]
注意: 不会修改 JS 错误、text-stroke、关卡设计等需要人工判断的问题
"""
import re, sys
from pathlib import Path

BASE = Path('/home/msdn/gamezipper.com')
SKIP = {'node_modules', 'audio', 'test-results', 'bolt-jam-3d'}
ANALYTICS_SNIPPET = '<script>new Image().src="https://site-analytics.cap.1ktower.com/hit?s=gamezipper.com&p="+encodeURIComponent(location.pathname);</script>'

MOBILE_CSS = """
html,body{overflow-x:hidden;max-width:100vw;}
*{box-sizing:border-box;}
body{-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none;}"""

GAMES = [
    d.name for d in sorted(BASE.iterdir())
    if d.is_dir() and d.name not in SKIP and (d / 'index.html').exists()
]


def make_jsonld(game, html):
    """从现有 og:title/description 生成 JSON-LD"""
    title_m = re.search(r'og:title.*?content="([^"]+)"', html, re.DOTALL)
    desc_m  = re.search(r'og:description.*?content="([^"]+)"', html, re.DOTALL)
    if not title_m:
        return None
    title = title_m.group(1).replace('"', '\\"')
    desc  = (desc_m.group(1) if desc_m else f'Free online {game} game.').replace('"', '\\"')
    url   = f'https://gamezipper.com/{game}/'
    return (
        f'<script type="application/ld+json">\n'
        f'{{"@context":"https://schema.org","@type":"Game","name":"{title}",'
        f'"url":"{url}","description":"{desc}",'
        f'"isAccessibleForFree":true,"applicationCategory":"Game",'
        f'"operatingSystem":"Web Browser","playMode":"SinglePlayer"}}\n'
        f'</script>'
    )


def fix_game(game):
    path = BASE / game / 'index.html'
    html = path.read_text(errors='ignore')
    original = html
    fixes = []

    # 1. 流量统计埋点
    if 'site-analytics' not in html:
        if '</body>' in html:
            html = html.replace('</body>', f'{ANALYTICS_SNIPPET}\n</body>', 1)
        elif '</html>' in html:
            html = html.replace('</html>', f'{ANALYTICS_SNIPPET}\n</html>', 1)
        fixes.append('✅ 添加流量统计埋点')

    # 2. JSON-LD 结构化数据
    if 'application/ld+json' not in html:
        jld = make_jsonld(game, html)
        if jld and '</head>' in html:
            html = html.replace('</head>', f'{jld}\n</head>', 1)
            fixes.append('✅ 添加 JSON-LD')

    # 3. 移动端基础 CSS（overflow-x + user-select）
    needs_overflow = 'overflow-x' not in html
    needs_usersel  = 'user-select' not in html and 'userSelect' not in html
    if needs_overflow or needs_usersel:
        # 找第一个 <style> 标签插入
        if '<style>' in html:
            insert = ''
            if needs_overflow: insert += '\nhtml,body{overflow-x:hidden;max-width:100vw;}\n'
            if needs_usersel:  insert += 'body{user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;}\n'
            html = html.replace('<style>', f'<style>{insert}', 1)
            if needs_overflow: fixes.append('✅ 添加 overflow-x:hidden')
            if needs_usersel:  fixes.append('✅ 添加 user-select:none')

    # 4. Canvas touch-action:none
    if '<canvas' in html and 'touch-action' not in html:
        # 在 CSS 中加
        if '<style>' in html:
            html = html.replace('<style>', '<style>\ncanvas{touch-action:none;}\n', 1)
            fixes.append('✅ 添加 canvas touch-action:none')

    # 保存
    if html != original:
        path.write_text(html)
        print(f'🔧 {game}: {", ".join(fixes)}')
    else:
        print(f'✅ {game}: 无需修复')

    return fixes


def main():
    target = sys.argv[1] if len(sys.argv) > 1 else None
    games = [target] if target else GAMES

    print(f'修复 {len(games)} 个游戏...\n')
    total_fixes = 0
    for game in games:
        fixes = fix_game(game)
        total_fixes += len(fixes)

    print(f'\n共修复 {total_fixes} 项问题')
    print('\n⚠️  以下问题需要人工处理:')
    print('  - JS 运行时错误（需 console.log 注入调试）')
    print('  - -webkit-text-stroke 中文描边（改为 text-shadow）')
    print('  - Sort-It 关卡配置 rods != colors+empty（需重写 LEVEL_CONFIGS）')
    print('  - pointerdown + touchstart 双绑定（需删除 touchstart 监听）')


if __name__ == '__main__':
    main()
