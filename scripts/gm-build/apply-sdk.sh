#!/usr/bin/env bash
# apply-sdk.sh — 给所有游戏的 index.html 注入 GameMonetize SDK
# 用法：bash scripts/gm-build/apply-sdk.sh
# 必须在 gamemonetize 分支上运行

set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# GameId 映射（从 GameMonetize 后台获取后填入）
declare -A GAME_IDS=(
  ["sushi-stack"]=""
  ["color-sort"]=""
  ["ocean-gem-pop"]=""
  ["phantom-blade"]=""
  ["catch-turkey"]=""
  ["bolt-jam-3d"]=""
  ["brick-breaker"]=""
  ["2048"]=""
  ["dessert-blast"]=""
  ["flappy-wings"]=""
  ["idle-clicker"]=""
  ["kitty-cafe"]=""
  ["memory-match"]=""
  ["paint-splash"]=""
  ["snake"]=""
  ["stacker"]=""
  ["typing-speed"]=""
  ["whack-a-mole"]=""
  ["word-puzzle"]=""
)

SDK_SNIPPET='<!-- [GM-SDK-START] -->\n<script type="text/javascript">\nwindow.SDK_OPTIONS = {\n  gameId: "GM_GAME_ID",\n  onEvent: function(a) {\n    switch(a.name) {\n      case "SDK_GAME_PAUSE": if(window.gmPauseGame) window.gmPauseGame(); break;\n      case "SDK_GAME_START": if(window.gmResumeGame) window.gmResumeGame(); break;\n      case "SDK_READY": window.sdkReady = true; break;\n    }\n  }\n};\n(function(a,b,c){var d=a.getElementsByTagName(b)[0];a.getElementById(c)||(a=a.createElement(b),a.id=c,a.src="https://api.gamemonetize.com/sdk.js",d.parentNode.insertBefore(a,d))})(document,"script","gamemonetize-sdk");\n</script>\n<!-- [GM-SDK-END] -->'

INJECTED=0
SKIPPED=0

for game in "${!GAME_IDS[@]}"; do
  INDEX="$REPO_ROOT/$game/index.html"
  if [ ! -f "$INDEX" ]; then
    echo "⚠️  跳过（文件不存在）: $game"
    ((SKIPPED++))
    continue
  fi

  # 避免重复注入
  if grep -q "GM-SDK-START" "$INDEX"; then
    echo "✓ 已注入（跳过）: $game"
    ((SKIPPED++))
    continue
  fi

  GAME_ID="${GAME_IDS[$game]}"
  SNIPPET="${SDK_SNIPPET//GM_GAME_ID/$GAME_ID}"

  # 在 </head> 前注入
  python3 -c "
import sys
content = open('$INDEX', 'r', encoding='utf-8').read()
snippet = '''$SNIPPET'''
content = content.replace('</head>', snippet + '\n</head>', 1)
open('$INDEX', 'w', encoding='utf-8').write(content)
print('✅ 注入 SDK: $game (gameId=$GAME_ID)')
"
  ((INJECTED++))
done

echo ""
echo "完成：注入 $INJECTED 个游戏，跳过 $SKIPPED 个"
echo "⚠️  注意：需要到 GameMonetize 后台获取每个游戏的 GameId 并更新本脚本的 GAME_IDS 映射"
