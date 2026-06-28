# Shogi — Competitive Benchmark

> GameZipper puzzle pipeline Phase 2 benchmark. Candidate: **Shogi** (slug `shogi`), score 20/25.

## Why Shogi (Gap Analysis, 2026-06-28)

Exhaustive catalog gap analysis across 448 existing GZ games confirmed **zero coverage** of Shogi:

- `grep -ic 'shogi' js/games-data.js` → **0 matches**
- GZ has **chess** (26.6KB), **chinese-chess/xiangqi** (57.9KB), **checkers** (58.6KB), **reversi** (77KB), **gomoku** (50KB), **backgammon** (258KB) — the full chess-family EXCEPT Japanese chess.
- Every adjacent trend category verified covered: DOP/delete-one-part ✓, brain-out ✓, save-the-doge ✓, draw-to-save ✓, pull-the-pin ✓, matchstick-puzzle ✓, sokoban ✓, tower-of-hanoi ✓, full Nikoli set (hashi/slitherlink/hitori/futoshiki/skyscrapers/star-battle/kakuro/kenken/masyu/fillomino/nurikabe/yajilin/heyawake) ✓, lawn/grass-master ✓, ASMR craft cluster (power-wash/nail-art/soap-slice/wood-turning/pottery/candle/perler-beads/cross-stitch/string-art/gem-paint/jelly-dye) ✓.
- Shogi is the cleanest remaining zero-overlap gap and **completes the chess-family board-game set**.

## Scoring

| Criterion | Score | Notes |
|-----------|-------|-------|
| Market demand | 3/5 | Niche but global (Japan + dedicated enthusiasts worldwide); "play shogi online" steady search |
| SEO gap | 4/5 | "play shogi online free", "shogi rules", "shogi vs computer" — strong, zero GZ coverage |
| Session duration | 5/5 | Chess-family board games = longest sessions (highest retention/ad impressions) |
| Implementation feasibility | 3/5 | Full shogi rules (9×9, drops, promotion, check) + minimax AI is complex but matches chinese-chess precedent (57.9KB) |
| Uniqueness | 5/5 | 0 matches confirmed; distinct from chess/xiangqi (drops + promotion zone are signature) |
| **Total** | **20/25** | ✅ ≥18 threshold |

## Top Competitors & Mechanics

| Competitor | Platform | Key Features |
|-----------|----------|--------------|
| **81Dojo / 81SquareUniverse** | Web | Full rules, online ranked play, piece sets, time controls |
| **Shogi Wars** | Web/App | Real-time AI/online, Gekisashi/Ponanza AI |
| **lishogi.org** | Web | Free, open-source, lichess-style, puzzles, AI levels, analysis |
| **Wasabi / Shogi apps** | Mobile | vs-AI levels, tsumeshogi puzzles, drop UI |

## Systems to Match (S-grade parity)

1. **Full shogi rules**: 9×9 board, 8 piece types (K/R/B/G/S/N/L/P) + 6 promoted forms, legal move generation, promotion zone (last 3 ranks), forced promotions, **drops** (komadai captured pieces), nifu/drop restrictions, uchifuzume.
2. **Check / Checkmate / Stalemate** detection (stalemate = loss per shogi rules).
3. **AI opponent**: minimax with alpha-beta, 4 difficulty levels (Easy/Medium/Hard/Expert) with different search depth + material/positional evaluation.
4. **2-player hotseat** mode (pass-and-play).
5. **Move history** + **undo** + **hints** (highlight legal moves / best move).
6. **Komadai** (hand) display showing captured pieces per side, drop interaction.
7. **Promotion choice dialog** when entering zone.
8. **Sound**: Web Audio procedural (move, capture, drop, check, promote, win/lose).
9. **Progress save**: localStorage (game state + win/loss record + difficulty pref).
10. **SEO**: canonical, og/twitter, VideoGame+FAQPage+HowToPlay+BreadcrumbList schemas, mobile-first responsive, touch-action:none.

## Theme Differentiation

- Clean wooden board (hiba/tatami aesthetic) with traditional Japanese kanji pieces (senten 玉金銀桂角飛歩 / promoted と龍馬).
- Reduces to crisp, readable mobile layout. Matches the "play shogi online free" search intent.
