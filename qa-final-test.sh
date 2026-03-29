#!/bin/bash

# 简化的QA测试脚本
GAMES=(
"2048" "abyss-chef" "bolt-jam-3d" "bounce-bot" "brick-breaker"
"catch-turkey" "cloud-sheep" "color-sort" "dessert-blast" "flappy-wings"
"glyph-quest" "idle-clicker" "kitty-cafe" "memory-match" "mo-yu-fayu"
"ocean-gem-pop" "paint-splash" "phantom-blade" "snake" "stacker"
"sushi-stack" "typing-speed" "whack-a-mole" "wood-block-puzzle" "word-puzzle"
)

BASE="https://gamezipper.com"
SCREENSHOT_DIR="/tmp/qa-final-screenshots"
mkdir -p "$SCREENSHOT_DIR"

echo "=== 游戏站测试开始 ==="

game_pass=0
game_fail=0
failed_games=()

for game in "${GAMES[@]}"; do
  url="${BASE}/${game}/"
  echo -n "测试 $game... "
  
  # 检查HTTP状态
  if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200"; then
    echo "✅ HTTP 200"
    game_pass=$((game_pass + 1))
    
    # 简单的页面内容检查
    if curl -s "$url" | grep -q "game\|canvas\|script"; then
      echo "  页面包含游戏内容"
    else
      echo "  ⚠️  页面可能缺少游戏内容"
      game_fail=$((game_fail + 1))
      failed_games+=("$game")
    fi
    
  else
    echo "❌ HTTP状态异常"
    game_fail=$((game_fail + 1))
    failed_games+=("$game")
  fi
done

echo ""
echo "=== 游戏站测试结果 ==="
echo "通过: $game_pass 失败: $game_fail"
if [ ${#failed_games[@]} -gt 0 ]; then
  echo "失败的游戏: ${failed_games[*]}"
fi

# 工具站测试
echo ""
echo "=== 工具站测试开始 ==="
tools_dir="/home/msdn/gamezipper-tools"
tool_count=0
tool_pass=0
tool_fail=0
failed_tools=()

# 查找所有工具HTML文件
tool_files=$(find "$tools_dir" -name "*.html" ! -name "index.html" ! -name "google*" ! -name "robots.txt" 2>/dev/null | sort)

echo "找到的工具文件数量: $(echo "$tool_files" | wc -l)"

for tool_file in $tool_files; do
  relative_path=$(realpath --relative-to="$tools_dir" "$tool_file")
  url="https://tools.gamezipper.com/${relative_path}"
  tool_count=$((tool_count + 1))
  
  if [ $((tool_count % 10)) -eq 0 ]; then
    echo "已测试 $tool_count 个工具..."
  fi
  
  echo -n "测试工具 $relative_path... "
  if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200"; then
    echo "✅"
    tool_pass=$((tool_pass + 1))
    
    # 检查页面内容
    if curl -s "$url" | grep -q "tool\|calculator\|converter\|generator"; then
      echo "  页面包含工具内容"
    else
      echo "  ⚠️  页面可能缺少工具内容"
      tool_fail=$((tool_fail + 1))
      failed_tools+=("$relative_path")
    fi
  else
    echo "❌"
    tool_fail=$((tool_fail + 1))
    failed_tools+=("$relative_path")
  fi
done

echo ""
echo "=== 工具站测试结果 ==="
echo "通过: $tool_pass 失败: $tool_fail 总数: $tool_count"
if [ ${#failed_tools[@]} -gt 0 ]; then
  echo "失败的工具: ${failed_tools[*]}"
fi

# 保存结果
cat > /tmp/final-qa-results.json << EOF
{
  "timestamp": "$(date -Iseconds)",
  "games": {
    "total": $game_pass,
    "passed": $game_pass,
    "failed": $game_fail,
    "failed_list": ${failed_games[*]:+"${failed_games[*]}"}
  },
  "tools": {
    "total": $tool_count,
    "passed": $tool_pass,
    "failed": $tool_fail,
    "failed_list": ${failed_tools[*]:+"${failed_tools[*]}"}
  }
}
EOF

echo ""
echo "=== 最终结果 ==="
echo "游戏站: $game_pass/$((game_pass + game_fail)) 通过"
echo "工具站: $tool_pass/$tool_count 通过"
echo "结果已保存到 /tmp/final-qa-results.json"