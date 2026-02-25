#!/usr/bin/env bash
# release.sh — GameMonetize 完整发布流程
# 用法：bash scripts/gm-build/release.sh

set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

CURRENT_BRANCH=$(git branch --show-current)
echo "当前分支: $CURRENT_BRANCH"

# 确认在 gamemonetize 分支
if [ "$CURRENT_BRANCH" != "gamemonetize" ]; then
  echo ""
  echo "切换到 gamemonetize 分支..."
  git checkout gamemonetize
fi

echo ""
echo "1. Rebase main 最新代码..."
git fetch origin
git rebase origin/main

echo ""
echo "2. 注入 GameMonetize SDK..."
bash scripts/gm-build/apply-sdk.sh

echo ""
echo "3. 提交 SDK 变更..."
git add -A
git diff --cached --stat
if git diff --cached --quiet; then
  echo "（无变更，跳过 commit）"
else
  git commit -m "chore(gm): apply GameMonetize SDK - $(date +%Y-%m-%d)"
fi

echo ""
echo "4. 构建 ZIP 包..."
bash scripts/gm-build/build-zips.sh

echo ""
echo "5. 打 release 标签..."
TAG="gm/v$(date +%Y-%m-%d)"
git tag "$TAG" 2>/dev/null || echo "⚠️  标签 $TAG 已存在，跳过"
git push origin gamemonetize --tags

echo ""
echo "=== 发布完成 ==="
echo "分支：gamemonetize 已推送"
echo "标签：$TAG"
echo "ZIP包：dist/gm/$(date +%Y-%m-%d)/"
echo ""
echo "返回 main 分支..."
git checkout main
