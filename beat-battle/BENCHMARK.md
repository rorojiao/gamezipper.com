# Beat Battle — Competitive Benchmark

## Selected Candidate
- **Game**: Beat Battle (FNF-style 4-key rhythm battle)
- **Slug**: `beat-battle`
- **Score**: 23/25 (Market 5 · SEO-gap 5 · Session 4 · Feasibility 4 · Zero-overlap 5)
- **Selected**: 2026-06-25 (fresh Phase 0 market research, queue was empty)

## Market Research (Phase 0, 2026-06-25)

### Global download trends (Sensor Tower, May 2026)
- 《Arrow: Puzzle Escape》 (Lessmore) — #1 global download May 2026, 15M+ cumulative.
- However GZ already has 4 arrow games (arrow-block-escape, arrow-puzzle, arrow-escape,
  arrow-sudoku) → hard-overlap gate REJECTS another arrow game (Z≤2, below 18 threshold).

### Geometry Dash analysis
- Massive web presence (geometrydash2.io, geometry-dash.cc, geometrydashonline.io,
  geometrygame.org, kbhgames, miniplay — all actively serving 2026).
- But `neon-dash` already covers the rhythm-platformer genre ("rhythm platformer, one-tap,
  jump/fly/flip/dash through obstacles, procedural music") → REJECTED as overlap.

### Friday Night Funkin (FNF) — the WINNER
- Top-played browser game 2021-2026, evergreen viral phenomenon.
- Dozens of active 2026 mod releases: 腐化版, 伪人整合包, nsm模组, 波比模组,
  立场反转, 死亡生活D模式 — all dated 2026-01 to 2026-05.
- Core mechanic: 4-key (← ↓ ↑ →) note-hitting rhythm duel vs animated opponent.
- **Zero GZ overlap**: verified — no fnf/funk/rhythm-battle/beat-battle/note-rush slug
  exists; `neon-dash` is an endless runner, NOT a note-hitting duel.

## Scoring Matrix
| Criterion | Score | Rationale |
|-----------|-------|-----------|
| Market demand | 5/5 | FNF is a top browser game, hundreds of mods, sustained viral traffic |
| SEO gap | 5/5 | Zero GZ rhythm-battle game; clean "rhythm battle online free" niche |
| Session duration | 4/5 | Music/rhythm games are highly addictive, long repeat sessions |
| Feasibility | 4/5 | 4-key note-hitting + Web Audio procedural beats — single-file buildable |
| Zero overlap | 5/5 | Verified absent via grep; neon-dash is a different genre |
| **TOTAL** | **23/25** | ✅ ≥18 threshold, proceed |

## Top Competitors
1. **Friday Night Funkin' (ninjamuffin99)** — the genre originator. Arrow notes scroll up;
   hit on-beat to fill your side of a tug-of-war health bar; beat opponent to win the week.
   Features: story mode, dozens of weeks, character roster, mods.
2. **FNF mods ecosystem** (Psych Engine, etc.) — user-generated content keeps it alive.
3. **Guitar Hero / osu! mania** — 4/7-key note-highway precursors.

## Systems to Replicate (竞品对标)
- 4 directional note lanes (← ↓ ↑ →), notes scroll toward a judgement line
- Hit-window judgement: Perfect / Good / OK / Miss
- Combo counter + score multiplier
- Tug-of-war health bar (signature FNF mechanic): good hits push bar toward opponent,
  misses push toward you; lose if your side empties
- Animated opponent + player avatars that react (idle / sing-pose / hit / miss)
- Procedural BGM + per-hit SFX (Web Audio)
- 30 levels across difficulty tiers (BPM + note-density scale up)
- Star ratings, achievements, progress save (localStorage), tutorial, daily challenge

## Differentiation (Theme)
- Name: **Beat Battle** — clean, searchable, brand-safe (no trademark risk vs "FNF")
- Theme: neon synthwave duel arena; player = "Neo" vs rotating opponent cast
- All-original procedural music (Web Audio) — no copyrighted FNF tracks
- Mobile-first 4-zone touch layout + keyboard (D/F/J/K or arrows)

## Build Plan
- Single-file HTML5, Canvas rendering, Web Audio procedural music engine
- 30 hand-tuned levels: BPM 90→180, note patterns verified rhythmically playable
- Verification: each level's note array is finite & every note hittable; health bar winnable
