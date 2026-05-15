#!/usr/bin/env python3
"""批量QA测试 - 主代理直接运行版（修复eval问题）"""
import subprocess, json, sys, os, time, re
from datetime import datetime

KACHILU = "/home/msdn/.nvm/versions/node/v22.22.0/bin/kachilu-browser"
BASE_URL = "https://gamezipper.com"

GAMES_BATCH1 = ["2048","abyss-chef","alien-whack","arrow-escape","ball-catch","basketball-shoot","bolt-jam-3d","bounce-bot","brick-breaker","bubble-pop","catch-turkey","chess","cloud-sheep","color-sort","dessert-blast","fill-fridge","flappy-wings","flow-connect","fruit-slash","glyph-quest","hex-block"]
GAMES_BATCH2 = ["idle-clicker","impossible-quiz","jigsaw-puzzle","kitty-cafe","little-alchemy","magic-sort","marble-run","memory-match","minesweeper","mo-yu-fayu","neon-run","ocean-gem-pop","paint-splash","parking-jam","phantom-blade","pipe-connect","pixel-logic","pong","sand-balls","snake","solitaire"]
GAMES_BATCH3 = ["slope","stacker","sudoku","sushi-stack","tetris","t-rex","triple-tile","typing-speed","unblock-me","watermelon-merge","whack-a-mole","word-puzzle","wordscapes","wood-block-puzzle","crossword","reaction-time","tile-dynasty"]

ALL_GAMES = GAMES_BATCH1 + GAMES_BATCH2 + GAMES_BATCH3

def kachilu(session, cmd, timeout=15):
    full_cmd = f"{KACHILU} --session {session} {cmd}"
    try:
        result = subprocess.run(full_cmd, shell=True, capture_output=True, text=True, timeout=timeout)
        return result.stdout.strip()
    except subprocess.TimeoutExpired:
        return ""
    except Exception as e:
        return ""

def kachilu_eval(session, js_code, timeout=15):
    """用 kachilu eval 直接执行JS（不用eval-file）"""
    # 把JS写到临时文件，用cat读取后传给eval
    tmp_file = f"/tmp/qa-js-{session}.js"
    with open(tmp_file, 'w') as f:
        f.write(js_code)
    
    # 读取JS内容并用 eval 执行
    js_content = open(tmp_file).read()
    os.unlink(tmp_file)
    
    # 用单引号包裹，转义内部单引号
    js_escaped = js_content.replace("'", "'\\''")
    stdout = kachilu(session, f"eval '{js_escaped}'", timeout)
    
    # 提取JSON
    if stdout:
        start = stdout.find('{')
        end = stdout.rfind('}')
        if start >= 0 and end > start:
            try:
                return json.loads(stdout[start:end+1])
            except:
                pass
    return None

# 快速JS检测脚本（精简版，避免shell转义问题）
QUICK_JS = r'''
(function(){
var r={};
r.cv=[];
document.querySelectorAll('canvas').forEach(function(c,i){
var b=c.getBoundingClientRect();
var px=false;
try{var x=c.getContext('2d');if(x&&c.width>0&&c.height>0){var d=x.getImageData(0,0,Math.min(c.width,10),Math.min(c.height,10)).data;for(var p=0;p<d.length;p++){if(d[p]>0){px=true;break;}}}}catch(e){}
r.cv.push({id:c.id||'u'+i,w:c.width,h:c.height,rw:Math.round(b.width),rh:Math.round(b.height),vis:b.width>0,pix:px});
});
var gc=document.querySelector('#game-container,.game-container,#game,.game,main,#app,#game-screen,.game-screen');
r.gc=gc?{w:Math.round(gc.getBoundingClientRect().width),h:Math.round(gc.getBoundingClientRect().height),vis:gc.getBoundingClientRect().width>0}:null;
r.err=window.__qaErr?window.__qaErr.length:0;
r.btns=[];
document.querySelectorAll('button,[role="button"],a,.btn').forEach(function(e){
var b=e.getBoundingClientRect();
if(b.width>10&&b.height>10&&b.top<window.innerHeight&&b.bottom>0){
r.btns.push((e.textContent||'').trim().substring(0,30));
}
});
r.dom=document.querySelectorAll('*').length;
r.ov=document.documentElement.scrollWidth>window.innerWidth+5;
var ads=document.querySelectorAll('[id*="ad-"],[class*="ad-"],[id*="monetag"],[class*="monetag"],ins');
r.ads=ads.length;
return JSON.stringify(r);
})()
'''

ERROR_JS = r'''window.__qaErr=[];var oe=console.error;console.error=function(){window.__qaErr.push(Array.from(arguments).join(''));oe.apply(console,arguments);};window.onerror=function(m){window.__qaErr.push(m);};'''

def test_one(game):
    session = f"q{game}"
    result = {"game": game, "ts": datetime.now().isoformat()}
    
    # HTTP check
    try:
        import urllib.request
        req = urllib.request.Request(f"{BASE_URL}/{game}/", headers={'User-Agent': 'Mozilla/5.0 Chrome/120'})
        t0 = time.time()
        resp = urllib.request.urlopen(req, timeout=8)
        html = resp.read().decode('utf-8', errors='ignore')
        lt = round(time.time() - t0, 2)
        result["http"] = resp.status
        result["load"] = lt
        result["size"] = len(html)
        result["seo"] = {
            "title": 1 if '<title>' in html else 0,
            "meta": len(re.findall(r'meta[^>]+description', html, re.I)),
            "og": len(re.findall(r'og:', html)),
            "canonical": 1 if 'canonical' in html else 0,
            "viewport": 1 if 'viewport' in html else 0,
        }
    except Exception as e:
        result["http"] = 0
        result["error"] = str(e)[:80]
        return result
    
    # Browser check
    kachilu(session, f'open "{BASE_URL}/{game}/"')
    time.sleep(7)
    
    # Inject error catcher
    kachilu_eval(session, ERROR_JS)
    time.sleep(0.5)
    
    # Run checks
    data = kachilu_eval(session, QUICK_JS)
    
    if data:
        result["canvas"] = data.get("cv", [])
        result["game_container"] = data.get("gc")
        result["js_errors"] = data.get("err", 0)
        result["buttons"] = data.get("btns", [])
        result["dom_nodes"] = data.get("dom", 0)
        result["overflow"] = data.get("ov", False)
        result["ads"] = data.get("ads", 0)
    else:
        result["canvas"] = []
        result["browser_error"] = True
    
    # Cleanup
    kachilu(session, "close")
    
    # Score
    score = 100
    issues = []
    if result.get("http") != 200:
        score -= 30; issues.append(f"HTTP {result.get('http')}")
    if result.get("load", 0) > 8:
        score -= 10; issues.append(f"慢加载 {result['load']}s")
    seo = result.get("seo", {})
    if not seo.get("title"): score -= 10; issues.append("无title")
    if not seo.get("meta"): score -= 8; issues.append("无meta desc")
    if not seo.get("og"): score -= 5; issues.append("无OG")
    if not seo.get("canonical"): score -= 3; issues.append("无canonical")
    if not seo.get("viewport"): score -= 10; issues.append("无viewport")
    
    cvs = result.get("canvas", [])
    if cvs:
        zero = sum(1 for c in cvs if c.get("w",0)==0 or c.get("h",0)==0)
        no_vis = sum(1 for c in cvs if not c.get("vis",False))
        no_pix = sum(1 for c in cvs if c.get("vis") and not c.get("pix"))
        if zero > 0: score -= 15; issues.append(f"{zero}/{len(cvs)} canvas 0尺寸")
        elif no_pix > 0: score -= 3; issues.append(f"{no_pix}/{len(cvs)} canvas无像素(可能title screen)")
    
    if result.get("js_errors", 0) > 2: score -= 5; issues.append(f"{result.get('js_errors')} JS错误")
    if result.get("overflow"): score -= 8; issues.append("水平溢出")
    if result.get("dom_nodes", 0) > 5000: score -= 5; issues.append(f"DOM过多({result['dom_nodes']})")
    
    result["score"] = max(0, score)
    result["issues"] = issues
    result["status"] = "PASS" if score >= 80 else ("WARN" if score >= 60 else "FAIL")
    
    return result

def main():
    batch_idx = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    games_list = [GAMES_BATCH1, GAMES_BATCH2, GAMES_BATCH3]
    games = games_list[batch_idx] if batch_idx < len(games_list) else ALL_GAMES
    
    results = []
    for i, game in enumerate(games):
        print(f"[{i+1}/{len(games)}] {game}...", end=" ", flush=True)
        r = test_one(game)
        s = r.get("score", 0)
        st = r.get("status", "?")
        print(f"{s}/100 {st}", flush=True)
        results.append(r)
    
    # Summary
    print(f"\n{'='*80}")
    print(f"📊 批次{batch_idx+1} 测试完成 — {len(results)}个游戏")
    print(f"{'='*80}")
    
    fails = [r for r in results if r.get("status") == "FAIL"]
    warns = [r for r in results if r.get("status") == "WARN"]
    passes = [r for r in results if r.get("status") == "PASS"]
    
    print(f"✅ PASS: {len(passes)} | ⚠️ WARN: {len(warns)} | ❌ FAIL: {len(fails)}")
    
    all_sorted = sorted(results, key=lambda x: x.get("score", 0))
    for r in all_sorted:
        icon = "❌" if r.get("status")=="FAIL" else ("⚠️" if r.get("status")=="WARN" else "✅")
        issues = ", ".join(r.get("issues", [])) if r.get("issues") else "-"
        cvs = r.get("canvas", [])
        cv_info = f"{len(cvs)}cv" if cvs else "DOM"
        print(f"  {icon} {r['game']:25s} | {r.get('score',0):3d}/100 | HTTP:{r.get('http',0)} | {r.get('load',0):.1f}s | {cv_info} | {issues}")
    
    # Save
    out = f"/tmp/qa-batch{batch_idx+1}-full.json"
    with open(out, 'w') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"\n📄 详细报告: {out}")

if __name__ == "__main__":
    main()
