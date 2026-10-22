#!/usr/bin/env python3
"""Detect canvas input-coordinate mismatch: CSS box aspect != backing-store aspect.

A canvas whose CSS box is non-uniformly scaled relative to canvas.width/height
AND whose pointer handler maps `e.clientX - rect.left` straight into backing-store
space without dividing by the scale factor will mis-locate every click.

Emits: slug, canvas id, css w/h decl, backing size, the getPos pattern, whether
an aspect-preserving scale (object-fit / uniform width=auto) is present.
"""
import os, re, json, sys

ROOT = '/home/junze/gamezipper.com'
SKIP = {'js','css','assets','data','og-images','public','admin','api','tools',
        'test-library','node_modules','.git','.claude','.audit','_optimization','blog','zh'}

# getPos / pointer mapping patterns that divide by the scale (i.e. CORRECT)
GOOD = re.compile(
    r'(rect\.width\s*/\s*canvas\.width|getBoundingClientRect\(\)\.width\s*/\s*canvas\.width'
    r'|clientX\s*-\s*[^;\n]*?\)\s*/\s*(r|rect|b|cv|canvas)\.width'
    # ── R326 后补 (2026-10-22) ─────────────────────────────────────────────
    # 官方修复范式是 `var sx = r.width ? canvas.width/r.width : 1` —— 即
    # backing-store 尺寸 ÷ display 尺寸, 再乘到 client 坐标上。
    # 旧 GOOD 只认 "display ÷ backing" 方向 (rect.width/canvas.width), 认不出
    # 官方自己的修法 → 已修好的 tangram 被反复报成 candidate (假阳性),
    # 下一个 QA sweep 会去"再修"一个已经正确的游戏。
    r'|canvas\.width\s*/\s*\w+\.width|canvas\.height\s*/\s*\w+\.height'
    r'|dpr|scaleX|offsetWidth\s*/\s*canvas\.width'
    r'|getScaleX|scaleFactor|canvas\.getBoundingClientRect\(\)\.width)', re.I)
# getPos patterns with NO division (i.e. BROKEN when aspect differs)
NAIVE = re.compile(r'function\s+(getPos|canvasPos|pos|toCanvas|getCanvasPos|evPos)\s*\([^)]*\)\s*\{[^}]{0,400}?'
                   r'client[XY]\s*-\s*[a-zA-Z_$][\w$]*\.left', re.S)

def canvas_css_rule(html):
    """Return the CSS declarations that set width/height on `canvas` elements."""
    out = []
    for m in re.finditer(r'(^|[,{}\s])canvas\s*(,[^{]*)?\{([^}]*)\}', html):
        body = m.group(3)
        w = re.search(r'(?<!max-)width\s*:\s*([^;]+)', body)
        h = re.search(r'(?<!max-)height\s*:\s*([^;]+)', body)
        mw = re.search(r'max-width\s*:\s*([^;]+)', body)
        mh = re.search(r'max-height\s*:\s*([^;]+)', body)
        aw = re.search(r'aspect-ratio\s*:\s*([^;]+)', body)
        if w or h or mw or mh:
            out.append(dict(width=w.group(1).strip() if w else None,
                            height=h.group(1).strip() if h else None,
                            max_width=mw.group(1).strip() if mw else None,
                            max_height=mh.group(1).strip() if mh else None,
                            aspect_ratio=aw.group(1).strip() if aw else None))
    return out

def main():
    # live set
    src = open(os.path.join(ROOT, 'js/games-data.js')).read()
    src = re.sub(r'^const\s+(GAME_GRADIENTS|GAMES)\s*=', 'var \\1=', src, flags=re.M)
    import subprocess
    js = "const s=require('fs').readFileSync('%s/js/games-data.js','utf8');" \
         "const t=s.replace(/^const\\s+(GAME_GRADIENTS|GAMES)\\s*=/gm,'var \\$1=');" \
         "const G=new Function(t+'; return GAMES;')();" \
         "console.log(JSON.stringify(G.filter(g=>g.status==='live')" \
         ".map(g=>g.url.replace(/^\\//,'').replace(/\\/$/,''))))" % ROOT
    live = json.loads(subprocess.run(['node','-e',js], capture_output=True, text=True, cwd=ROOT).stdout)

    findings = []
    for slug in live:
        slug = slug.rstrip('/')          # ← 旧代码因 "\\$" 转义 bug 留下尾部 "/"
        if slug in SKIP: continue        # ← SKIP 集合此前从未被使用 (dead code)
        idx = os.path.join(ROOT, slug, 'index.html')
        if not os.path.exists(idx): continue
        html = open(idx, errors='replace').read()
        # must actually have a canvas
        if '<canvas' not in html: continue
        # gather JS the page loads
        js_src = html
        for m in re.finditer(r'<script[^>]+src="([^"]+)"', html):
            s = m.group(1).split('?')[0]
            if s.startswith('/') or s.startswith('http'): continue
            p = os.path.join(ROOT, slug, s)
            if os.path.exists(p): js_src += '\n' + open(p, errors='replace').read()
        css_rules = canvas_css_rule(html)
        if not css_rules: continue
        # flags
        hard_fixed_h = any(re.fullmatch(r'\d+px', (r.get('height') or '')) for r in css_rules)
        maxh_vh     = any('vh' in (r.get('max_height') or '') for r in css_rules)
        maxw_vw     = any('vw' in (r.get('max_width') or '') or '100%' in (r.get('max_width') or '') for r in css_rules)
        has_naive   = bool(NAIVE.search(js_src))
        has_good    = bool(GOOD.search(js_src))
        if hard_fixed_h and maxh_vh and maxw_vw and has_naive and not has_good:
            findings.append(dict(slug=slug, css=css_rules[:2], naive=True, good=False))
    print(json.dumps({'live': len(live), 'candidates': len(findings),
                      'slugs': [f['slug'] for f in findings]}, indent=1))
    # 输出目录用 scratch (TMPDIR), 不写死 /tmp/qa-r326 —— 旧代码在目录不存在时
    # 直接 FileNotFoundError 崩掉 (exit 1), 检测器变成"永远失败"的一次性产物。
    out_dir = os.path.join(os.environ.get('TMPDIR', '/tmp'), 'gz-canvas-aspect')
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, 'canvas-aspect-candidates.json'), 'w') as f:
        json.dump(findings, f, indent=1)
    print(f"wrote {out_dir}/canvas-aspect-candidates.json")

if __name__ == '__main__':
    main()