#!/bin/bash

echo "=== Pentomino QA Check (Phase 7) ==="
echo ""

PASS=0
FAIL=0

# 1. Analytics pixel
if grep -q 'site-analytics.cap.1ktower.com' index.html; then
    echo "✅ Analytics pixel present"
    ((PASS++))
else
    echo "❌ Analytics pixel missing"
    ((FAIL++))
fi

# 2. touch-action
if grep -q 'touch-action' index.html; then
    echo "✅ touch-action present"
    ((PASS++))
else
    echo "❌ touch-action missing"
    ((FAIL++))
fi

# 3. overflow-x
if grep -q 'overflow-x' index.html; then
    echo "✅ overflow-x present"
    ((PASS++))
else
    echo "❌ overflow-x missing"
    ((FAIL++))
fi

# 4. user-select
if grep -q 'user-select' index.html; then
    echo "✅ user-select present"
    ((PASS++))
else
    echo "❌ user-select missing"
    ((FAIL++))
fi

# 5. NO text-stroke
if ! grep -q 'text-stroke' index.html; then
    echo "✅ No text-stroke (forbidden)"
    ((PASS++))
else
    echo "❌ text-stroke found (forbidden)"
    ((FAIL++))
fi

# 6. JSON-LD schemas
count=$(grep -c 'application/ld+json' index.html || echo 0)
if [ $count -ge 4 ]; then
    echo "✅ JSON-LD schemas present ($count/4)"
    ((PASS++))
else
    echo "❌ JSON-LD schemas insufficient ($count/4)"
    ((FAIL++))
fi

# 7. og:title
if grep -q 'og:title' index.html; then
    echo "✅ og:title present"
    ((PASS++))
else
    echo "❌ og:title missing"
    ((FAIL++))
fi

# 8. localStorage
if grep -q 'localStorage' index.html; then
    echo "✅ localStorage present"
    ((PASS++))
else
    echo "❌ localStorage missing"
    ((FAIL++))
fi

# 9. Web Audio
if grep -q 'AudioContext\|webkitAudioContext' index.html; then
    echo "✅ Web Audio API present"
    ((PASS++))
else
    echo "❌ Web Audio API missing"
    ((FAIL++))
fi

# 10. cleanup
if grep -q 'cleanup\|destroy\|dispose' index.html; then
    echo "✅ Cleanup function present"
    ((PASS++))
else
    echo "❌ Cleanup function missing"
    ((FAIL++))
fi

# 11. File size
size=$(wc -c < index.html)
if [ $size -ge 30000 ]; then
    echo "✅ File size adequate ($size bytes, target ≥30KB)"
    ((PASS++))
else
    echo "❌ File size too small ($size bytes, target ≥30KB)"
    ((FAIL++))
fi

# 12. HTML structure
if grep -q '</html>' index.html; then
    echo "✅ HTML structure complete"
    ((PASS++))
else
    echo "❌ HTML structure incomplete"
    ((FAIL++))
fi

# 13. Script tags
if grep -q '</script>' index.html; then
    echo "✅ Script tags closed"
    ((PASS++))
else
    echo "❌ Script tags not closed"
    ((FAIL++))
fi

# 14. 12 pentomino shapes
shape_count=$(grep -o 'F\|I\|L\|P\|N\|T\|U\|V\|W\|X\|Y\|Z' index.html | head -12 | sort -u | wc -l)
if [ $shape_count -eq 12 ]; then
    echo "✅ All 12 pentomino shapes defined"
    ((PASS++))
else
    echo "❌ Pentomino shapes incomplete ($shape_count/12)"
    ((FAIL++))
fi

# 15. Levels count
if grep -q '27 levels' index.html; then
    echo "✅ 27 levels configured"
    ((PASS++))
else
    echo "❌ Level count incorrect"
    ((FAIL++))
fi

# 16. Tier system
if grep -q 'Beginner\|Easy\|Medium\|Hard\|Expert\|Master' index.html; then
    echo "✅ Tier system present"
    ((PASS++))
else
    echo "❌ Tier system missing"
    ((FAIL++))
fi

# 17. Star rating
if grep -q 'stars\|star' index.html; then
    echo "✅ Star rating system present"
    ((PASS++))
else
    echo "❌ Star rating missing"
    ((FAIL++))
fi

# 18. Timer
if grep -q 'timer\|Timer' index.html; then
    echo "✅ Timer present"
    ((PASS++))
else
    echo "❌ Timer missing"
    ((FAIL++))
fi

# 19. Hint system
if grep -q 'hint\|Hint' index.html; then
    echo "✅ Hint system present"
    ((PASS++))
else
    echo "❌ Hint system missing"
    ((FAIL++))
fi

# 20. Undo system
if grep -q 'undo\|Undo' index.html; then
    echo "✅ Undo system present"
    ((PASS++))
else
    echo "❌ Undo system missing"
    ((FAIL++))
fi

# 21. Check function
if grep -q 'check\|Check' index.html; then
    echo "✅ Check function present"
    ((PASS++))
else
    echo "❌ Check function missing"
    ((FAIL++))
fi

# 22. Tutorial
if grep -q 'tutorial\|Tutorial' index.html; then
    echo "✅ Tutorial present"
    ((PASS++))
else
    echo "❌ Tutorial missing"
    ((FAIL++))
fi

# 23. Win modal
if grep -q 'winModal\|win-modal' index.html; then
    echo "✅ Win modal present"
    ((PASS++))
else
    echo "❌ Win modal missing"
    ((FAIL++))
fi

# 24. Level select
if grep -q 'levelSelect\|level-select' index.html; then
    echo "✅ Level select present"
    ((PASS++))
else
    echo "❌ Level select missing"
    ((FAIL++))
fi

# 25. SFX
if grep -q 'playPlaceSound\|playRotateSound\|playFlipSound' index.html; then
    echo "✅ Sound effects present"
    ((PASS++))
else
    echo "❌ Sound effects missing"
    ((FAIL++))
fi

# 26. Progress save
if grep -q 'saveProgress\|loadProgress' index.html; then
    echo "✅ Progress save system present"
    ((PASS++))
else
    echo "❌ Progress save missing"
    ((FAIL++))
fi

# 27. Responsive design
if grep -q 'media.*max-width\|@media' index.html; then
    echo "✅ Responsive design present"
    ((PASS++))
else
    echo "❌ Responsive design missing"
    ((FAIL++))
fi

# 28. BGM
if grep -q 'startBGM\|bgmOsc\|background music' index.html; then
    echo "✅ BGM present"
    ((PASS++))
else
    echo "❌ BGM missing"
    ((FAIL++))
fi

# 29. Move counter
if grep -q 'moves\|Moves' index.html; then
    echo "✅ Move counter present"
    ((PASS++))
else
    echo "❌ Move counter missing"
    ((FAIL++))
fi

# 30. Grid sizes
if grep -q 'gridW.*gridH' index.html; then
    echo "✅ Grid size configuration present"
    ((PASS++))
else
    echo "❌ Grid size missing"
    ((FAIL++))
fi

# 31. Rotate function
if grep -q 'rotate()\|function rotate' index.html; then
    echo "✅ Rotate function present"
    ((PASS++))
else
    echo "❌ Rotate function missing"
    ((FAIL++))
fi

# 32. Flip function
if grep -q 'flip()\|function flip' index.html; then
    echo "✅ Flip function present"
    ((PASS++))
else
    echo "❌ Flip function missing"
    ((FAIL++))
fi

# 33. Shape colors
if grep -q 'SHAPE_COLORS\|shapeColors' index.html; then
    echo "✅ Shape colors defined"
    ((PASS++))
else
    echo "❌ Shape colors missing"
    ((FAIL++))
fi

# 34. Particles
if grep -q 'particles\|Particles' index.html; then
    echo "✅ Particle effects present"
    ((PASS++))
else
    echo "❌ Particle effects missing"
    ((FAIL++))
fi

# 35. Canvas rendering
if grep -q 'getContext.*2d\|canvas.getContext' index.html; then
    echo "✅ Canvas rendering present"
    ((PASS++))
else
    echo "❌ Canvas rendering missing"
    ((FAIL++))
fi

# 36. Pointer events
if grep -q 'pointerdown\|pointermove\|pointerup' index.html; then
    echo "✅ Pointer events present"
    ((PASS++))
else
    echo "❌ Pointer events missing"
    ((FAIL++))
fi

# 37. Reset function
if grep -q 'reset()\|function reset' index.html; then
    echo "✅ Reset function present"
    ((PASS++))
else
    echo "❌ Reset function missing"
    ((FAIL++))
fi

# 38. Next level
if grep -q 'nextLevel\|next-level' index.html; then
    echo "✅ Next level function present"
    ((PASS++))
else
    echo "❌ Next level missing"
    ((FAIL++))
fi

# 39. Shape selection
if grep -q 'selectedShape\|selected-shape' index.html; then
    echo "✅ Shape selection present"
    ((PASS++))
else
    echo "❌ Shape selection missing"
    ((FAIL++))
fi

# 40. Drag and drop
if grep -q 'dragging\|onPointerDown\|onPointerUp' index.html; then
    echo "✅ Drag-and-drop present"
    ((PASS++))
else
    echo "❌ Drag-and-drop missing"
    ((FAIL++))
fi

echo ""
echo "=== QA SUMMARY ==="
echo "PASS: $PASS/40"
echo "FAIL: $FAIL/40"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "✅ ALL QA CHECKS PASS!"
    exit 0
else
    echo "❌ $FAIL checks failed"
    exit 1
fi
