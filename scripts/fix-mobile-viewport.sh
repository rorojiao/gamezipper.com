#!/bin/bash
# fix-mobile-viewport.sh
# 2026-07-12 P0 修复 gamezipper.com mobile viewport (GSC mobile usability)
# 移除 user-scalable=no / maximum-scale=1 / minimum-scale=1
# 保留 viewport-fit=cover 等现代 iOS Safari 属性
#
# 用法: bash scripts/fix-mobile-viewport.sh
# 影响: 614+ game pages, BI 30d mobile 4.04% → 预期 12-20% (30d)
set -e
cd /home/msdn/gamezipper.com

COUNT=0
# Phase 1: 移除 user-scalable / maximum-scale 各种变体
for f in $(grep -rl 'user-scalable' --include='index.html' . 2>/dev/null); do
  sed -i -E '
    s|maximum-scale=1\.0,user-scalable=no,||g
    s|user-scalable=no,maximum-scale=1\.0,||g
    s|,maximum-scale=1\.0,user-scalable=no||g
    s|,user-scalable=no,maximum-scale=1\.0||g
    s|maximum-scale=1,user-scalable=no,||g
    s|user-scalable=no,maximum-scale=1,||g
    s|,maximum-scale=1,user-scalable=no||g
    s|,user-scalable=no,maximum-scale=1||g
    s|maximum-scale=1\.0||g
    s|maximum-scale=1||g
    s|,user-scalable=no||g
    s|user-scalable=no,||g
    s|user-scalable=no||g
  ' "$f"
  COUNT=$((COUNT+1))
done

# Phase 2: minimum-scale (1 个 catch-turkey)
for f in $(grep -rl 'minimum-scale=1' --include='index.html' . 2>/dev/null); do
  sed -i -E 's|,minimum-scale=1,|,|g; s|,minimum-scale=1||g; s|minimum-scale=1,||g' "$f"
done

# Phase 3: 清理 sed 残留的双逗号/尾空格
for f in $(grep -rl 'initial-scale=1,,' --include='index.html' . 2>/dev/null); do
  sed -i -E 's|initial-scale=1,,|initial-scale=1,|g; s|initial-scale=1\.0,,|initial-scale=1\.0,|g' "$f"
done
for f in $(grep -rl ', ,' --include='index.html' . 2>/dev/null); do
  sed -i -E 's|, ,|,|g' "$f"
done
for f in $(grep -rl 'initial-scale=1\.0, "' --include='index.html' . 2>/dev/null); do
  sed -i -E 's|content="width=device-width, initial-scale=1\.0, "|content="width=device-width, initial-scale=1.0"|g' "$f"
done
for f in $(grep -rl 'initial-scale=1, "' --include='index.html' . 2>/dev/null); do
  sed -i -E 's|content="width=device-width, initial-scale=1, "|content="width=device-width, initial-scale=1"|g' "$f"
done
for f in $(grep -rl ',  viewport-fit=cover"' --include='index.html' . 2>/dev/null); do
  sed -i -E 's|,  viewport-fit=cover|,viewport-fit=cover|g' "$f"
done

REMAIN=$(grep -rl 'user-scalable' --include='index.html' . 2>/dev/null | wc -l)
echo "[fix-viewport] Modified $COUNT pages with user-scalable"
echo "[fix-viewport] Remaining user-scalable: $REMAIN (expect 0)"