#!/usr/bin/env python3
"""GameZipper 批量QA - 使用临时JS文件避免shell转义问题"""
import subprocess, json, sys, os, time, re, tempfile
from datetime import datetime

KACHILU = "/home/msdn/.nvm/versions/node/v22.22.0/bin/kachilu-browser"
BASE_URL = "https://gamezipper.com"

# 写入固定JS文件
ERROR_JS_FILE = "/tmp/qa-error-inject.js"
QUICK_JS_FILE = "/tmp/qa-quick-check.js"

with open(ERROR_JS_FILE, 'w') as f:
    f.write("window.__qaErr=[];var oe=console.error;console.error=function(){window.__qaErr.push(Array.from(arguments).join(''));oe.apply(console,arguments);};window.onerror=function(m){window.__qaErr.push(m);};")

with open(QUICK_JS_FILE, 'w') as f:
    f.write(r'''(function(){
var r={};
r.cv=[];
document.querySelectorAll('canvas').forEach(function(c,i){
var b=c.getBoundingClientRect();var px=false;
try{var x=c.getContext('2d');if(x&&c.width>0&&c.height>0){var d=x.getImageData(0,0,Math.min(c.width,10),Math.min(c.height,10)).data;for(var p=0;p<d.length;p++){if(d[p]>0){px=true;break;}}}}catch(e){}
r.cv.push({id:c.id||'u'+i,w:c.width,h:c.height,rw:Math.round(b.width),rh:Math.round(b.height),vis:b.width>0,pix:px});
});
var gc=document.querySelector('#game-container,.game-container,#game,.game,main,#app,#game-screen,.game-screen');
r.gc=gc?{w:Math.round(gc.getBoundingClientRect().width),h:Math.round(gc.getBoundingClientRect().height),vis:gc.getBoundingClientRect().width>0}:null;
r.err=window.__qaErr?window.__qaErr.length:0;
r.btns=[];
document.querySelectorAll('button,[role="button"],a,.btn').forEach(function(e){
var b=e.getBoundingClientRect();
if(b.width>10&&b.height>10&&b.top<window.innerHeight&&b.bottom>0){r.btns.push((e.textContent||'').trim().substring(0,30));}
});
r.dom=document.querySelectorAll('*').length;
r.ov=document.documentElement.scrollWidth>window.innerWidth+5;
var ads=document.querySelectorAll('[id*="ad-"],[class*="ad-"],[id*="monetag"],[class*="monetag"],ins');
r.ads=ads.length;
return JSON.stringify(r);
})()''')

def kachilu(session, cmd, timeout=15):
    try:
        r = subprocess.run(f"{KACHILU} --session {session} {cmd}", 
            shell=True, capture_output=True, text=True, timeout=timeout)
        return r.stdout.strip()
    except:
        return ""

def kachilu_eval_from_file(session, js_file, timeout=10):
    """读取JS文件内容，用 kachilu eval 执行"""
    js = open(js_file).read()
    # 用heredoc方式避免转义问题
    cmd = f"eval '{js}'"
    stdout = kachilu(session, cmd, timeout)
    if stdout:
        s = stdout.find('{')
        e = stdout.rfind('}')
        if s >= 0 and e > s:
            try: return json.loads(stdout[s:e+1])
            except: pass
    return None

def test_one(game):
    session = f"q{game}"
    result = {"game": game}
    
    # HTTP
    try:
        import urllib.request
        req = urllib.request.Request(f"{BASE_URL}/{game}/", headers={'User-Agent': 'Mozilla/5.0 Chrome/120'})
        t0 = time.time()
        resp = urllib.request.urlopen(req, timeout=8)
        html = resp.read().decode('utf-8', errors='ignore')
        result["http"] = resp.status
        result["load"] = round(time.time()-t0, 2)
        result["size"] = len(html)
        result["seo"] = {
            "title": '<title>' in html,
            "meta": len(re.findall(r'meta[^>]+description', html, re.I)) > 0,
            "og": len(re.findall(r'og:', html)) > 0,
            "canonical": 'canonical' in html,
            "viewport": 'viewport' in html,
        }
    except Exception as e:
        result["http"] = 0
        result["error"] = str(e)[:60]
        return result
    
    # Browser
    kachilu(session, f'open "{BASE_URL}/{game}/"')
    time.sleep(6)
    kachilu_eval_from_file(session, ERROR_JS_FILE, 5)
    time.sleep(0.3)
    data = kachilu_eval_from_file(session, QUICK_JS_FILE, 8)
    
    if data:
        result["canvas"] = data.get("cv", [])
        result["gc"] = data.get("gc")
        result["js_err"] = data.get("err", 0)
        result["btns"] = data.get("btns", [])
        result["dom"] = data.get("dom", 0)
        result["overflow"] = data.get("ov", False)
        result["ads"] = data.get("ads", 0)
    
    kachilu(session, "close")
    
    # Score
    score = 100
    issues = []
    if result.get("http") != 200: score -= 30; issues.append("HTTP非200")
    if result.get("load",0) > 8: score -= 10; issues.append(f"慢{result['load']}s")
    seo = result.get("seo",{})
    for k, v in seo.items():
        if not v: 
            score -= {"title":10,"meta":8,"og":5,"canonical":3,"viewport":10}.get(k,3)
            issues.append(f"无{k}")
    
    cvs = result.get("canvas",[])
    if cvs:
        zero = sum(1 for c in cvs if c.get("w",0)==0 or c.get("h",0)==0)
        no_pix = sum(1 for c in cvs if c.get("vis") and not c.get("pix"))
        if zero: score -= 15; issues.append(f"{zero}/{len(cvs)} canvas=0")
        elif no_pix: issues.append(f"{no_pix}无像素(title screen)")
    
    if result.get("js_err",0) > 2: score -= 5; issues.append(f"{result['js_err']}JS错误")
    if result.get("overflow"): score -= 8; issues.append("水平溢出")
    if result.get("dom",0) > 5000: score -= 5; issues.append(f"DOM>{result['dom']}")
    
    result["score"] = max(0, score)
    result["issues"] = issues
    return result

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 qa_batch2.py <game1> <game2> ...")
        print("   or: python3 qa_batch2.py --all")
        sys.exit(1)
    
    if sys.argv[1] == "--all":
        games = [d for d in os.listdir("/home/msdn/gamezipper.com")
                 if os.path.isdir(f"/home/msdn/gamezipper.com/{d}") 
                 and d not in ['.git','node_modules','tests','.next','public','components','src','scripts','docs','.hermes']
                 and not d.startswith('.')]
    else:
        games = sys.argv[1:]
    
    results = []
    t0 = time.time()
    for i, game in enumerate(games):
        elapsed = time.time() - t0
        print(f"[{i+1}/{len(games)}] {game}...", end=" ", flush=True)
        r = test_one(game)
        s = r.get("score",0)
        icon = "✅" if s>=80 else ("⚠️" if s>=60 else "❌")
        cvs = r.get("canvas",[])
        cv = f"{len(cvs)}cv" if cvs else "DOM"
        print(f"{icon} {s}/100 | {r.get('http',0)} | {r.get('load',0):.1f}s | {cv}", flush=True)
        results.append(r)
    
    # Summary
    total = time.time() - t0
    fails = [r for r in results if r.get("score",0) < 60]
    warns = [r for r in results if 60 <= r.get("score",0) < 80]
    
    print(f"\n{'='*80}")
    print(f"📊 测试完成 {len(results)}个游戏 ({total:.0f}s)")
    print(f"✅ {len(results)-len(fails)-len(warns)} | ⚠️ {len(warns)} | ❌ {len(fails)}")
    print(f"{'='*80}")
    
    for r in sorted(results, key=lambda x: x.get("score",0)):
        icon = "❌" if r.get("score",0)<60 else ("⚠️" if r.get("score",0)<80 else "✅")
        iss = ", ".join(r.get("issues",[])) or "-"
        print(f"  {icon} {r['game']:25s} {r.get('score',0):3d} | {iss}")
    
    out = f"/tmp/qa-results-{datetime.now().strftime('%H%M%S')}.json"
    with open(out,'w') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"\n📄 {out}")

if __name__ == "__main__":
    main()
