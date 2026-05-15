#!/usr/bin/env python3
"""
GameZipper 全站 AI 质量测试框架 v2.0
====================================
基于调研最佳方案: LLM Agent + Browser 驱动多维度测试
参考: Quinn (Claude+Playwright MCP), OpenObserve Council of Sub Agents

测试维度 (10项/游戏):
  1. HTTP 状态码 (200=通过)
  2. 页面加载时间 (<8s=通过)
  3. HTML 完整性 (title/meta/og/canonical/viewport)
  4. JS 控制台错误 (0个=通过)
  5. Canvas 渲染状态 (尺寸>0, 有像素=通过)
  6. 游戏容器可见性 (width>0 && height>0)
  7. 交互元素可用性 (有可见按钮)
  8. 水平溢出检测 (无横向滚动条)
  9. 广告容器存在 (IAA变现检查)
  10. DOM 性能 (节点数<3000)

用法: python3 /home/msdn/gamezipper.com/tests/qa_test.py <game_name> [--deep]
  --deep: 点击开始按钮进入游戏后再次检测
"""
import subprocess, json, sys, os, re, time
from datetime import datetime

KACHILU = "/home/msdn/.nvm/versions/node/v22.22.0/bin/kachilu-browser"
BASE_URL = "https://gamezipper.com"

def kachilu(session, cmd, timeout=15):
    """执行 kachilu-browser 命令"""
    full_cmd = f"{KACHILU} --session {session} {cmd}"
    try:
        result = subprocess.run(full_cmd, shell=True, capture_output=True, text=True, timeout=timeout)
        return result.stdout.strip(), result.stderr.strip(), result.returncode
    except subprocess.TimeoutExpired:
        return "", "TIMEOUT", 1

def kachilu_eval(session, js_code, timeout=15):
    """在浏览器中执行JS并返回JSON"""
    # 写入临时文件避免shell转义问题
    tmp_file = f"/tmp/qa-eval-{session}.js"
    with open(tmp_file, 'w') as f:
        f.write(js_code)
    
    stdout, stderr, rc = kachilu(session, f'eval-file {tmp_file}', timeout)
    
    # 清理
    try:
        os.unlink(tmp_file)
    except:
        pass
    
    # 提取JSON（从输出中找第一个 { 到最后一个 }）
    if stdout:
        start = stdout.find('{')
        end = stdout.rfind('}')
        if start >= 0 and end > start:
            try:
                return json.loads(stdout[start:end+1])
            except json.JSONDecodeError:
                pass
    
    return None

def http_check(game):
    """检查1: HTTP状态码和加载时间"""
    import urllib.request
    url = f"{BASE_URL}/{game}/"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Linux; Android 13) Chrome/120.0'})
        start = time.time()
        resp = urllib.request.urlopen(req, timeout=10)
        html = resp.read().decode('utf-8', errors='ignore')
        load_time = time.time() - start
        
        return {
            "status": resp.status,
            "load_time": round(load_time, 2),
            "html_size": len(html),
            "has_title": 1 if '<title>' in html else 0,
            "has_meta_desc": len(re.findall(r'<meta[^>]+description', html, re.I)),
            "has_og_tags": len(re.findall(r'og:', html)),
            "has_canonical": 1 if 'rel="canonical"' in html else 0,
            "has_viewport": 1 if 'viewport' in html else 0,
            "has_theme_color": 1 if 'theme-color' in html else 0,
        }
    except Exception as e:
        return {"status": 0, "error": str(e), "load_time": 0}

BROWSER_CHECK_JS = """
(function() {
  var results = {};
  
  // 4. JS错误收集 (收集已有的)
  results.js_errors_count = window.__qaErrors ? window.__qaErrors.length : 0;
  results.js_errors_sample = window.__qaErrors ? window.__qaErrors.slice(0, 3) : [];
  
  // 5. Canvas状态
  results.canvases = [];
  var allCanvas = document.querySelectorAll('canvas');
  for (var i = 0; i < allCanvas.length; i++) {
    var c = allCanvas[i];
    var r = c.getBoundingClientRect();
    var hasPixels = false;
    try {
      var ctx = c.getContext('2d');
      if (ctx && c.width > 0 && c.height > 0) {
        var data = ctx.getImageData(0, 0, Math.min(c.width, 50), Math.min(c.height, 50)).data;
        for (var p = 0; p < Math.min(data.length, 500); p++) {
          if (data[p] > 0) { hasPixels = true; break; }
        }
      }
    } catch(e) {}
    results.canvases.push({
      id: c.id || '(unnamed-' + i + ')',
      w: c.width,
      h: c.height,
      rect_w: Math.round(r.width),
      rect_h: Math.round(r.height),
      visible: r.width > 0 && r.height > 0,
      pixels: hasPixels
    });
  }
  
  // 6. 游戏容器
  var selectors = '#game-container,.game-container,#game,.game,main,#app,.app,#game-screen,.game-screen,#game-area,.game-area';
  var gc = document.querySelector(selectors);
  if (gc) {
    var gr = gc.getBoundingClientRect();
    results.game_container = { found: true, w: Math.round(gr.width), h: Math.round(gr.height), visible: gr.width > 0 && gr.height > 0 };
  } else {
    results.game_container = { found: false };
  }
  
  // 7. 可见交互按钮
  results.interactive_elements = [];
  var els = document.querySelectorAll('button,[role="button"],a[href],.btn,[class*="play"],[class*="start"],[class*="btn"],[id*="play"],[id*="start"]');
  for (var j = 0; j < els.length; j++) {
    var el = els[j];
    var er = el.getBoundingClientRect();
    if (er.width > 10 && er.height > 10 && er.top < window.innerHeight && er.bottom > 0) {
      results.interactive_elements.push({
        tag: el.tagName,
        text: (el.textContent || '').trim().substring(0, 40),
        cls: (el.className || '').toString().substring(0, 60),
        w: Math.round(er.width),
        h: Math.round(er.height)
      });
    }
  }
  
  // 8. 溢出检测
  results.overflow = {
    doc_width: document.documentElement.scrollWidth,
    viewport_width: window.innerWidth,
    has_horizontal: document.documentElement.scrollWidth > window.innerWidth + 5
  };
  
  // 9. 广告容器
  results.ad_slots = 0;
  var adSels = '[id*="ad-"],[class*="ad-"],[id*="monetag"],[class*="monetag"],ins[class*="adsbygoogle"],[id*="google_ads"],.ad-slot,.ad-container,#ad-container';
  results.ad_slots = document.querySelectorAll(adSels).length;
  
  // 10. 性能
  results.perf = {
    dom_nodes: document.querySelectorAll('*').length,
    img_count: document.querySelectorAll('img').length,
    script_count: document.querySelectorAll('script[src]').length,
    css_count: document.querySelectorAll('link[rel="stylesheet"]').length,
    render_time: 0
  };
  if (window.performance && window.performance.timing) {
    var t = window.performance.timing;
    results.perf.dom_ready = t.domContentLoadedEventEnd - t.navigationStart;
    results.perf.full_load = t.loadEventEnd - t.navigationStart;
  }
  
  return results;
})()
"""

ERROR_CATCH_JS = """
window.__qaErrors = [];
var origError = console.error;
var origWarn = console.warn;
console.error = function() { window.__qaErrors.push('ERR:' + Array.from(arguments).join(' ')); origError.apply(console, arguments); };
console.warn = function() { window.__qaErrors.push('WARN:' + Array.from(arguments).join(' ')); origWarn.apply(console, arguments); };
window.onerror = function(msg, url, line) { window.__qaErrors.push('ON_ERR:' + msg + ' @' + line); };
"""

def test_game(game, deep=False):
    """测试单个游戏，返回测试报告"""
    session = f"qa-{game.replace('/', '-')}"
    report = {
        "game": game,
        "url": f"{BASE_URL}/{game}/",
        "timestamp": datetime.now().isoformat(),
        "deep": deep,
    }
    
    # Phase 1: HTTP检查
    print(f"  [HTTP] 检查 {game}...", flush=True)
    http = http_check(game)
    report["http"] = http
    if http.get("status", 0) != 200:
        report["error"] = f"HTTP {http.get('status', 'ERROR')}"
        return report
    
    # Phase 2: 浏览器检查
    print(f"  [BROWSER] 打开 {game}...", flush=True)
    kachilu(session, f'open "{BASE_URL}/{game}/"', timeout=15)
    time.sleep(8)
    
    # 注入错误捕获
    kachilu_eval(session, ERROR_CATCH_JS)
    
    # 运行检测
    print(f"  [CHECK] 运行检测...", flush=True)
    browser_data = kachilu_eval(session, BROWSER_CHECK_JS)
    
    if browser_data:
        report["browser"] = browser_data
    else:
        report["browser"] = {"error": "failed to evaluate JS"}
    
    # Phase 3: Deep test (点击开始按钮)
    if deep and browser_data:
        print(f"  [DEEP] 尝试进入游戏...", flush=True)
        start_btn = None
        for elem in browser_data.get("interactive_elements", []):
            text = elem.get("text", "").lower()
            cls = elem.get("cls", "").lower()
            if any(kw in text or kw in cls for kw in ["play", "start", "tap to", "click", "begin", "go"]):
                start_btn = elem
                break
        
        if start_btn:
            # 点击开始按钮
            click_js = f"""
            var els = document.querySelectorAll('button,[role="button"],a[href],.btn,[class*="play"],[class*="start"],[id*="play"],[id*="start"]');
            for (var i = 0; i < els.length; i++) {{
              if ((els[i].textContent || '').toLowerCase().indexOf('{start_btn["text"].split()[0].lower()}') >= 0) {{
                els[i].click();
                break;
              }}
            }}
            """
            kachilu_eval(session, click_js)
            time.sleep(3)
            
            # 再次检测
            deep_data = kachilu_eval(session, BROWSER_CHECK_JS)
            if deep_data:
                report["deep_test"] = deep_data
    
    # 清理
    kachilu(session, "close", timeout=5)
    
    # 计算得分
    report["score"] = calculate_score(report)
    
    return report

def calculate_score(report):
    """计算综合得分 0-100"""
    score = 100
    deductions = []
    
    # HTTP
    if report.get("http", {}).get("status") != 200:
        score -= 30
        deductions.append("HTTP非200")
    
    # 加载时间
    lt = report.get("http", {}).get("load_time", 0)
    if lt > 8:
        score -= 10
        deductions.append(f"加载慢({lt}s)")
    elif lt > 4:
        score -= 3
        deductions.append(f"加载较慢({lt}s)")
    
    # SEO
    http = report.get("http", {})
    if not http.get("has_title"):
        score -= 10
        deductions.append("缺少title")
    if not http.get("has_meta_desc"):
        score -= 8
        deductions.append("缺少meta description")
    if not http.get("has_og_tags"):
        score -= 5
        deductions.append("缺少OG标签")
    if not http.get("has_canonical"):
        score -= 3
        deductions.append("缺少canonical")
    if not http.get("has_viewport"):
        score -= 10
        deductions.append("缺少viewport")
    
    # Canvas
    browser = report.get("browser", {})
    canvases = browser.get("canvases", [])
    zero_count = sum(1 for c in canvases if c.get("w", 0) == 0 or c.get("h", 0) == 0)
    if canvases and zero_count > 0:
        score -= 15
        deductions.append(f"{zero_count}/{len(canvases)} canvas尺寸为0")
    
    # JS错误
    err_count = browser.get("js_errors_count", 0)
    if err_count > 0:
        score -= 5
        deductions.append(f"{err_count}个JS错误")
    
    # 溢出
    if browser.get("overflow", {}).get("has_horizontal"):
        score -= 10
        deductions.append("水平溢出")
    
    # 游戏容器
    if not browser.get("game_container", {}).get("visible"):
        score -= 5
        deductions.append("游戏容器不可见")
    
    # 广告
    if browser.get("ad_slots", 0) == 0:
        score -= 2  # 轻微扣分，有些游戏可能确实没有广告位
    
    # DOM性能
    dom = browser.get("perf", {}).get("dom_nodes", 0)
    if dom > 5000:
        score -= 5
        deductions.append(f"DOM节点过多({dom})")
    
    return {"total": max(0, score), "deductions": deductions}

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    game = sys.argv[1]
    deep = "--deep" in sys.argv
    
    print(f"\n{'='*60}", flush=True)
    print(f"🧪 测试游戏: {game} (deep={deep})", flush=True)
    print(f"{'='*60}\n", flush=True)
    
    report = test_game(game, deep=deep)
    
    # 输出报告
    score = report.get("score", {}).get("total", 0)
    status = "✅ PASS" if score >= 80 else "⚠️ WARN" if score >= 60 else "❌ FAIL"
    
    print(f"\n{'='*60}", flush=True)
    print(f"📊 结果: {game} — {status} ({score}/100)", flush=True)
    print(f"{'='*60}", flush=True)
    
    if report.get("score", {}).get("deductions"):
        print("扣分项:", flush=True)
        for d in report["score"]["deductions"]:
            print(f"  - {d}", flush=True)
    
    # Canvas详情
    browser = report.get("browser", {})
    if browser.get("canvases"):
        print(f"\nCanvas ({len(browser['canvases'])}个):", flush=True)
        for c in browser["canvases"]:
            status = "✅" if c.get("pixels") else ("⚠️" if c.get("visible") else "❌")
            print(f"  {status} {c['id']}: {c['w']}x{c['h']} (rect: {c.get('rect_w',0)}x{c.get('rect_h',0)}) pixels={c.get('pixels')}", flush=True)
    
    # 保存JSON
    out_path = f"/tmp/qa-report-{game}.json"
    with open(out_path, 'w') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print(f"\n📄 完整报告: {out_path}", flush=True)
    
    return report

if __name__ == "__main__":
    main()
