#!/bin/bash
# ============================================================
# GameZipper 全站 AI 测试框架 v1.0
# 基于调研的最佳方案: LLM Agent + Browser 驱动测试
# 参考: Quinn (Claude+Playwright), OpenObserve Council
# ============================================================
# 使用方法: bash /home/msdn/gamezipper.com/tests/qa-framework.sh <game-name>
# 输出: JSON 格式测试报告到 /tmp/qa-report-<game>.json
# ============================================================

KACHILU="/home/msdn/.nvm/versions/node/v22.22.0/bin/kachilu-browser"
BASE_URL="https://gamezipper.com"
GAME="$1"
REPORT="/tmp/qa-report-${GAME}.json"

if [ -z "$GAME" ]; then echo "Usage: $0 <game-name>"; exit 1; fi

echo '{' > "$REPORT"
echo '"game":"'"$GAME"'",' >> "$REPORT"
echo '"url":"'"$BASE_URL/$GAME/"'",' >> "$REPORT"
echo '"timestamp":"'$(date -Iseconds)'",' >> "$REPORT"
echo '"checks":{' >> "$REPORT"

SESSION="qa-${GAME}-$$"

# ─── 检查1: HTTP 状态码 ───
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${BASE_URL}/${GAME}/" 2>/dev/null)
echo '"http_status":{"value":'"${HTTP_CODE:-0}"',"pass":'$([ "$HTTP_CODE" = "200" ] && echo "true" || echo "false")'},' >> "$REPORT"

# ─── 检查2: 页面加载时间 ───
LOAD_TIME=$(curl -s -o /dev/null -w "%{time_total}" --max-time 15 "${BASE_URL}/${GAME}/" 2>/dev/null)
echo '"load_time":{"value":'"${LOAD_TIME:-0}"',"pass":'$(echo "$LOAD_TIME < 8" | bc -l 2>/dev/null || echo 0)'},' >> "$REPORT"

# ─── 检查3: HTML 基本结构 ───
HTML_SIZE=$(curl -s --max-time 10 "${BASE_URL}/${GAME}/" 2>/dev/null | wc -c)
HAS_TITLE=$(curl -s --max-time 10 "${BASE_URL}/${GAME}/" 2>/dev/null | grep -c '<title>' || echo 0)
HAS_META_DESC=$(curl -s --max-time 10 "${BASE_URL}/${GAME}/" 2>/dev/null | grep -ci 'meta.*description' || echo 0)
HAS_OG=$(curl -s --max-time 10 "${BASE_URL}/${GAME}/" 2>/dev/null | grep -ci 'og:' || echo 0)
HAS_CANONICAL=$(curl -s --max-time 10 "${BASE_URL}/${GAME}/" 2>/dev/null | grep -ci 'rel="canonical"' || echo 0)
HAS_VIEWPORT=$(curl -s --max-time 10 "${BASE_URL}/${GAME}/" 2>/dev/null | grep -ci 'viewport' || echo 0)
echo '"html_size":'"${HTML_SIZE:-0}"',' >> "$REPORT"
echo '"has_title":'"${HAS_TITLE}"',' >> "$REPORT"
echo '"has_meta_desc":'"${HAS_META_DESC}"',' >> "$REPORT"
echo '"has_og_tags":'"${HAS_OG}"',' >> "$REPORT"
echo '"has_canonical":'"${HAS_CANONICAL}"',' >> "$REPORT"
echo '"has_viewport":'"${HAS_VIEWPORT}"',' >> "$REPORT"

# ─── 检查4-10: 浏览器内检测（Kachilu） ───
BROWSER_JS=$(cat << 'JSEOF'
(function(){
  var results = {};
  
  // 检查4: Console 错误
  results.js_errors = [];
  var origError = console.error;
  console.error = function() {
    results.js_errors.push(Array.from(arguments).join(' '));
    origError.apply(console, arguments);
  };
  
  // 检查5: Canvas 状态
  results.canvases = [];
  var allCanvas = document.querySelectorAll('canvas');
  for (var i = 0; i < allCanvas.length; i++) {
    var c = allCanvas[i];
    results.canvases.push({
      id: c.id || '(unnamed-' + i + ')',
      width: c.width,
      height: c.height,
      cssWidth: c.style.width,
      cssHeight: c.style.height,
      rect: c.getBoundingClientRect().width + 'x' + c.getBoundingClientRect().height,
      visible: c.offsetParent !== null || c.style.display !== 'none',
      pixels: (function(){try{return c.getContext('2d').getImageData(0,0,Math.min(c.width,10),Math.min(c.height,10)).data.some(function(v){return v>0;});}catch(e){return false;}})()
    });
  }
  
  // 检查6: 游戏容器可见性
  results.game_container = (function(){
    var gc = document.querySelector('#game-container, .game-container, #game, .game, main, #app, .app');
    if (!gc) return {found: false};
    var r = gc.getBoundingClientRect();
    return {
      found: true,
      width: Math.round(r.width),
      height: Math.round(r.height),
      visible: r.width > 0 && r.height > 0
    };
  })();
  
  // 检查7: 开始/播放按钮
  results.start_buttons = [];
  var btns = document.querySelectorAll('[class*="play"], [class*="start"], [id*="play"], [id*="start"], button, .btn');
  for (var j = 0; j < btns.length; j++) {
    var b = btns[j];
    var br = b.getBoundingClientRect();
    if (br.width > 0 && br.height > 0 && br.top < window.innerHeight) {
      results.start_buttons.push({
        tag: b.tagName,
        text: (b.textContent || '').trim().substring(0, 50),
        class: b.className.substring(0, 80),
        rect: Math.round(br.width) + 'x' + Math.round(br.height)
      });
    }
  }
  
  // 检查8: 移动端视口问题
  results.mobile_issues = [];
  var vw = window.innerWidth;
  if (vw > 500) {
    // 模拟检测是否有 overflow 问题
    var docW = document.documentElement.scrollWidth;
    if (docW > vw + 10) {
      results.mobile_issues.push('horizontal_overflow: docWidth=' + docW + ' > viewport=' + vw);
    }
  }
  
  // 检查9: 广告容器
  results.ad_containers = document.querySelectorAll('[id*="ad"], [class*="ad-"], [id*="monetag"], [class*="monetag"], [id*="google"], ins').length;
  
  // 检查10: 性能指标
  results.performance = {};
  if (window.performance && window.performance.timing) {
    var t = window.performance.timing;
    results.performance.dom_ready = t.domContentLoadedEventEnd - t.navigationStart;
    results.performance.full_load = t.loadEventEnd - t.navigationStart;
  }
  results.performance.dom_nodes = document.querySelectorAll('*').length;
  results.performance.img_count = document.querySelectorAll('img').length;
  results.performance.script_count = document.querySelectorAll('script').length;
  
  return JSON.stringify(results);
})()
JSEOF
)

# 打开页面并运行检测
$KACHILU --session "$SESSION" open "${BASE_URL}/${GAME}/" 2>/dev/null
sleep 8

BROWSER_RESULT=$($KACHILU --session "$SESSION" eval "$BROWSER_JS" 2>/dev/null | tail -1)

# 解析浏览器结果并写入报告
if [ -n "$BROWSER_RESULT" ] && echo "$BROWSER_RESULT" | grep -q 'canvases'; then
  # 清理JSON中的特殊字符
  CLEAN_RESULT=$(echo "$BROWSER_RESULT" | sed 's/\\n//g' | sed 's/\\t//g' | tr -d '\n')
  
  # 提取各项
  CANVAS_COUNT=$(echo "$CLEAN_RESULT" | grep -o '"canvases":\[[^]]*\]' | head -1 | grep -o '"id"' | wc -l)
  ZERO_CANVASES=$(echo "$CLEAN_RESULT" | grep -o '"width":0\|"height":0' | wc -l)
  
  GAME_VISIBLE=$(echo "$CLEAN_RESULT" | grep -o '"visible":true' | head -1)
  START_BTNS=$(echo "$CLEAN_RESULT" | grep -o '"text":"[^"]*"' | grep -i 'play\|start\|tap\|click' | wc -l)
  AD_CONTAINERS=$(echo "$CLEAN_RESULT" | grep -o '"ad_containers":[0-9]*' | grep -o '[0-9]*')
  DOM_NODES=$(echo "$CLEAN_RESULT" | grep -o '"dom_nodes":[0-9]*' | grep -o '[0-9]*')
  
  echo '"canvas_count":'"${CANVAS_COUNT:-0}"',' >> "$REPORT"
  echo '"zero_size_canvases":'"${ZERO_CANVASES:-0}"',' >> "$REPORT"
  echo '"game_visible":'"${GAME_VISIBLE:-false}"',' >> "$REPORT"
  echo '"start_buttons":'"${START_BTNS:-0}"',' >> "$REPORT"
  echo '"ad_containers":'"${AD_CONTAINERS:-0}"',' >> "$REPORT"
  echo '"dom_nodes":'"${DOM_NODES:-0}"',' >> "$REPORT"
  echo '"browser_raw":"'"${CLEAN_RESULT:0:500}"'",' >> "$REPORT"
else
  echo '"canvas_count":-1,' >> "$REPORT"
  echo '"zero_size_canvases":-1,' >> "$REPORT"
  echo '"game_visible":false,' >> "$REPORT"
  echo '"start_buttons":0,' >> "$REPORT"
  echo '"ad_containers":0,' >> "$REPORT"
  echo '"dom_nodes":0,' >> "$REPORT"
  echo '"browser_raw":"FAILED",' >> "$REPORT"
fi

# 结束 JSON
echo '}}' >> "$REPORT"

# 清理 session
$KACHILU --session "$SESSION" close 2>/dev/null

# 输出结果
cat "$REPORT"
