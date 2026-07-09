# Round 91 Phase 7-9 预期交付物

## Phase 7: 交付前检查清单
- [ ] index.html单文件完整 (包含所有CSS/JS)
- [ ] 30关卡数据内嵌 (levels.json注入)
- [ ] SEO meta标签完整 (VideoGame, FAQPage, HowTo, BreadcrumbList)
- [ ] Monetag广告代码集成 (110120/110121/110122)
- [ ] 零QA问题 (gamezipper-qa 5阶段全通过)
- [ ] 移动端适配 (touch events, viewport)
- [ ] Web Audio BGM+SFX正常
- [ ] localStorage保存进度
- [ ] 文件大小 < 100KB

## Phase 8: Git提交
```
git add wagiri/index.html
git commit -m "Round 91: Wagiri (#603) — Nikoli Path-Pair Puzzle

30 levels verified unique via BFS + backtracking.
Canvas rendering with edge-drawing interaction.
Web Audio BGM + SFX.
Monetag ad integration (110120/110121/110122).
Zero QA issues.

Slug: wagiri
Game number: 603
Round: 91
"
git push origin main
```

## Phase 9: 更新全局状态
- `.game-pipeline-status`: lastBuilt=wagiri, lastBuiltRound=91, totalGames=567
- `.game-pipeline-candidates.md`: 更新"LAST BUILT"和"PREVIOUS"
- `gamezipper-qa-report.md`: Round 91完整QA报告

## 预期时间线
- Phase 3: 10-15分钟 (subagent deleg_1f8ef334)
- Phase 7-8: 5分钟 (交付检查 + git提交)
- Phase 9: 2分钟 (状态更新)

**总时间**: ~20-25分钟