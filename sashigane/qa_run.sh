#!/bin/bash
echo "=== 40-Point QA Checklist (static checks) ==="
echo ""
FILE="index.html"
# 1. Viewport
grep -q 'viewport' "$FILE" && echo "1. PASS: viewport meta present" || echo "1. FAIL: viewport meta missing"
# 2. Touch (dynamic, skip)
echo "2. SKIP: touch events (needs runtime)"
# 3. No zoom (dynamic, skip)
echo "3. SKIP: no zoom on double-tap (needs runtime)"
# 4. Font size
grep -q 'body' "$FILE" && grep -oP 'font-size:\s*\d+px' "$FILE" | head -1 && echo "4. PASS: body font-size defined" || echo "4. WARNING: no explicit body font-size"
# 5. Button min 44px
grep -oP 'min-height:\s*4[4-9]px' "$FILE" >/dev/null && echo "5. PASS: button min-height >=44px" || echo "5. WARNING: no 44px min-height found"
# 6. Load time (dynamic, skip)
echo "6. SKIP: page load <3s (needs runtime)"
# 7. No blocking script in head
grep -A 20 '<head' "$FILE" | grep -q '<script' && echo "7. FAIL: script in head" || echo "7. PASS: no script in head"
# 8. Lazy load (no images)
grep -q '<img' "$FILE" && echo "8. WARNING: images present (check lazy-load)" || echo "8. PASS: no images"
# 9. No unnecessary external requests
grep -E '<link rel="stylesheet"|<script src=' "$FILE" | wc -l > /tmp/external.txt && echo "9. INFO: external requests count: $(cat /tmp/external.txt)"
# 10. Web Audio on interaction
grep -q 'click.*initAudio\|initAudio.*click' "$FILE" && echo "10. PASS: Web Audio init on interaction" || echo "10. WARNING: Web Audio init not clearly guarded"
# 11. Title
TITLE=$(grep -oP '<title>\K[^<]+' "$FILE" | tr -d ' ')
echo "11. INFO: title='${TITLE:0:60}' (len=${#TITLE})"
# 12. Meta description
grep -q 'name="description"' "$FILE" && DESC=$(grep -oP 'name="description" content="\K[^"]+' "$FILE") && echo "12. INFO: description='${DESC:0:160}' (len=${#DESC})" || echo "12. FAIL: meta description missing"
# 13. Canonical
grep -q 'rel="canonical"' "$FILE" && echo "13. PASS: canonical present" || echo "13. FAIL: canonical missing"
# 14. OG tags
grep -E 'property="og:' "$FILE" | wc -l > /tmp/og.txt && echo "14. INFO: OG tags count: $(cat /tmp/og.txt)"
# 15. JSON-LD
grep -q 'application/ld+json' "$FILE" && echo "15. PASS: JSON-LD present" || echo "15. FAIL: JSON-LD missing"
# 16. ARIA labels
grep -E 'aria-label=' "$FILE" | wc -l > /tmp/aria.txt && echo "16. INFO: ARIA labels count: $(cat /tmp/aria.txt)"
# 17. Alt text
grep -E 'alt=' "$FILE" | wc -l > /tmp/alt.txt && echo "17. INFO: alt attributes count: $(cat /tmp/alt.txt)"
# 18. Keyboard (dynamic, skip)
echo "18. SKIP: keyboard navigation (needs runtime)"
# 19. Focus visible (dynamic, skip)
echo "19. SKIP: focus visible states (needs runtime)"
# 20. Screen reader (dynamic, skip)
echo "20. SKIP: screen reader support (needs runtime)"
# 21. No console errors (dynamic, skip)
echo "21. SKIP: no console errors (needs runtime)"
# 22. No console warnings (dynamic, skip)
echo "22. SKIP: no console warnings (needs runtime)"
# 23. BEM CSS
grep -oE '[a-z]+--[a-z]+' "$FILE" | wc -l > /tmp/bem.txt && echo "23. INFO: BEM modifiers count: $(cat /tmp/bem.txt)"
# 24. Chinese comments
grep -E '(//|/\*|\*|<!--).*[\u4e00-\u9fff]' "$FILE" | wc -l > /tmp/cn.txt && echo "24. INFO: Chinese comments count: $(cat /tmp/cn.txt)"
# 25. No eval
grep -q 'eval(' "$FILE" && echo "25. FAIL: eval() found" || echo "25. PASS: no eval()"
# 26-30: Game logic (dynamic, skip)
for i in 26 27 28 29 30; do echo "$i. SKIP: game logic (needs runtime)"; done
# 31-35: UX/UI (dynamic, skip)
for i in 31 32 33 34 35; do echo "$i. SKIP: UX/UI (needs runtime)"; done
# 36-40: Cross-browser (needs runtime)
for i in 36 37 38 39 40; do echo "$i. SKIP: cross-browser (needs runtime)"; done
echo ""
echo "=== Static check done. Runtime checks require browser testing. ==="
