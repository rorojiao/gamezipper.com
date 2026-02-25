#!/usr/bin/env bash
# build-zips.sh — 打包所有游戏为 GameMonetize ZIP 文件
# 用法：bash scripts/gm-build/build-zips.sh
# 必须在 gamemonetize 分支上运行

set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DATE=$(date +%Y-%m-%d)
DIST_DIR="$REPO_ROOT/dist/gm/$DATE"

mkdir -p "$DIST_DIR"

GAMES=(
  "2048" "bolt-jam-3d" "brick-breaker" "catch-turkey" "color-sort"
  "dessert-blast" "flappy-wings" "idle-clicker" "kitty-cafe" "memory-match"
  "ocean-gem-pop" "paint-splash" "phantom-blade" "snake" "stacker"
  "sushi-stack" "typing-speed" "whack-a-mole" "word-puzzle"
)

BUILT=0
for game in "${GAMES[@]}"; do
  GAME_DIR="$REPO_ROOT/$game"
  if [ ! -d "$GAME_DIR" ] || [ ! -f "$GAME_DIR/index.html" ]; then
    echo "⚠️  跳过（目录不存在）: $game"
    continue
  fi

  ZIP_FILE="$DIST_DIR/${game}.zip"
  cd "$GAME_DIR"
  zip -r "$ZIP_FILE" . -x "*.DS_Store" -x "__MACOSX/*" > /dev/null
  SIZE=$(du -sh "$ZIP_FILE" | cut -f1)
  echo "✅ $game → ${game}.zip ($SIZE)"
  ((BUILT++))
done

echo ""
echo "构建完成：$BUILT 个游戏 ZIP"
echo "输出目录：$DIST_DIR"
echo ""
echo "下一步：登录 GameMonetize 后台上传各 ZIP 文件"
echo "  https://gamemonetize.com/account → My Games → 上传"
