#!/usr/bin/env bash
# Snake Pit QA — Full Pipeline Execution

set -e

echo "🧩 Snake Pit QA Pipeline"
echo "=========================="

cd /home/msdn/gamezipper.com/snake-pit

# Phase 1: Level Generation Verification
echo -e "\n📋 Phase 1: Level Verification"
if [ -f /tmp/snake-pit-levels-fixed.json ]; then
    python3 verify_levels.py /tmp/snake-pit-levels-fixed.json
    echo "✅ Levels verified"
else
    echo "⏸️ Levels not ready (waiting for deleg_a56a465d)"
fi

# Phase 2: QA Checklist
echo -e "\n🔍 Phase 2: QA Checklist"
python3 qa_checklist.py || echo "❌ QA checklist FAIL"

# Phase 3: Monetag Ad Zones
echo -e "\n📺 Phase 3: Ad Zones Check"
if grep -q "110120" index.html && grep -q "110121" index.html && grep -q "110122" index.html; then
    echo "✅ All 3 Monetag zones present (110120, 110121, 110122)"
else
    echo "❌ Monetag zones MISSING"
fi

# Phase 4: File Sizes
echo -e "\n📦 Phase 4: File Size Check"
FILES=("index.html" "icon.png" "og-image.jpg" "BENCHMARK.md")
for f in "${FILES[@]}"; do
    if [ -f "$f" ]; then
        size=$(stat -c%s "$f" 2>/dev/null || stat -f%z "$f" 2>/dev/null)
        echo "✓ $f: $size bytes"
    else
        echo "✗ $f: MISSING"
    fi
done

# Phase 5: SEO Meta Tags
echo -e "\n🔎 Phase 5: SEO Check"
TAGS=("og:title" "og:description" "og:image" "twitter:card" "description")
for tag in "${TAGS[@]}"; do
    if grep -q "$tag" index.html; then
        echo "✓ $tag present"
    else
        echo "✗ $tag MISSING"
    fi
done

echo -e "\n=========================="
echo "QA Pipeline Complete"