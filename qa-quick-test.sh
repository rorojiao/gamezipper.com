#!/bin/bash

# 最终快速QA测试
GAMES=(
"2048" "abyss-chef" "bolt-jam-3d" "bounce-bot" "brick-breaker"
"catch-turkey" "cloud-sheep" "color-sort" "dessert-blast" "flappy-wings"
"glyph-quest" "idle-clicker" "kitty-cafe" "memory-match" "mo-yu-fayu"
"ocean-gem-pop" "paint-splash" "phantom-blade" "snake" "stacker"
"sushi-stack" "typing-speed" "whack-a-mole" "wood-block-puzzle" "word-puzzle"
)

BASE="https://gamezipper.com"
echo "=== 游戏站测试结果 ==="
echo "游戏名称,HTTP状态,页面内容检查"

game_ok=0
total_games=${#GAMES[@]}

for game in "${GAMES[@]}"; do
  url="${BASE}/${game}/"
  http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "TIMEOUT")
  
  if [ "$http_code" = "200" ]; then
    content_check=$(curl -s "$url" | grep -c "game\|canvas\|script" 2>/dev/null || echo "0")
    if [ "$content_check" -gt 0 ]; then
      echo "$game,✅ 200,✅"
      game_ok=$((game_ok + 1))
    else
      echo "$game,✅ 200,⚠️ 无游戏内容"
    fi
  else
    echo "$game,❌ $http_code,❌"
  fi
done

echo ""
echo "游戏站总结: $game_ok/$total_games 个游戏正常"

# 工具站测试
echo ""
echo "=== 工具站测试结果 ==="
tools_dir="/home/msdn/gamezipper-tools"
tool_files=$(find "$tools_dir" -name "*.html" ! -name "index.html" ! -name "google*" ! -name "robots.txt" 2>/dev/null | sort)
tool_count=$(echo "$tool_files" | wc -l)
tool_ok=0

echo "工具文件,HTTP状态,工具内容检查"

for tool_file in $tool_files; do
  relative_path=$(realpath --relative-to="$tools_dir" "$tool_file")
  url="https://tools.gamezipper.com/${relative_path}"
  
  http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "TIMEOUT")
  
  if [ "$http_code" = "200" ]; then
    content_check=$(curl -s "$url" | grep -c "tool\|calculator\|converter\|generator\|color\|css\|dev\|fortune\|image\|seo\|social\|text" 2>/dev/null || echo "0")
    if [ "$content_check" -gt 0 ]; then
      echo "$relative_path,✅ 200,✅"
      tool_ok=$((tool_ok + 1))
    else
      echo "$relative_path,✅ 200,⚠️ 无工具内容"
    fi
  else
    echo "$relative_path,❌ $http_code,❌"
  fi
done

echo ""
echo "工具站总结: $tool_ok/$tool_count 个工具正常"

# 保存结果
cat > /tmp/qa-summary.json << EOF
{
  "timestamp": "$(date -Iseconds)",
  "games": {
    "total": $total_games,
    "ok": $game_ok,
    "status": "$game_ok/$total_games 个游戏正常"
  },
  "tools": {
    "total": $tool_count,
    "ok": $tool_ok,
    "status": "$tool_ok/$tool_count 个工具正常"
  },
  "overall": "$game_ok/$total_games 游戏通过, $tool_ok/$tool_count 工具通过"
}
EOF

echo ""
echo "=== 总体结果 ==="
echo "游戏站: $game_ok/$total_games 个游戏正常"
echo "工具站: $tool_ok/$tool_count 个工具正常"
echo "详细结果已保存到: /tmp/qa-summary.json"