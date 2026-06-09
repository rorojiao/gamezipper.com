# Tatamibari Pipeline Report — 2026-06-10

## Game Identity
- **Slug**: tatamibari
- **Name**: Tatamibari
- **Category**: Puzzle
- **Type**: Nikoli grid-partition logic puzzle
- **Score**: 21/25 (highest remaining candidate)

## Deliverables
| File | Size | Description |
|------|------|-------------|
| `/home/msdn/gamezipper.com/tatamibari/index.html` | 71KB | Single-file HTML5 game |
| `/home/msdn/gamezipper.com/tatamibari/icon.png` | 1024x1024 | Game icon (RunningHub) |
| `/home/msdn/gamezipper.com/og-images/tatamibari.png` | 1024x1024 | OG share image |
| `/home/msdn/gamezipper.com/tatamibari/BENCHMARK.md` | 137 lines | Competitive benchmark |

## Technical Stack
- **Rendering**: Canvas 2D
- **Audio**: Web Audio API (BGM + 5 SFX)
- **Input**: Mouse + Touch (mobile responsive)
- **Levels**: 30 across 5 tiers (4x3 → 9x9)
- **Solver**: Backtracking algorithm (built-in)
- **Ads**: Monetag MultiTag (zones 110120/110121/110122)
- **SEO**: Full meta tags, JSON-LD, structured data

## Level Design
| Tier | Levels | Grid Size |
|------|--------|-----------|
| 1 | L1-L6 | 4x3 |
| 2 | L7-L12 | 5x4 |
| 3 | L13-L18 | 6x5 |
| 4 | L19-L24 | 7x6 |
| 5 | L25-L30 | 8x7 / 9x9 |

## QA Results
- **40/40 checklist**: PASS
- **JS Syntax**: PASS (node --check)
- **Level Validation**: 30/30 solvable
- **Chinese in code**: 0 occurrences
- **Emoji in code**: 0 occurrences
- **Analytics pixel**: Present
- **Monetag ads**: Present (3 zones)

## Registration
- games-data.js: Registered (emoji: 🟠, cat: puzzle)
- itemlist-schema.js: Position 290
- sitemap.xml: Added
- index.html: JSON-LD + counts updated (289 → 290)
- Homepage: All counts synced (ALL IN SYNC)
- IndexNow: Submitted to api.indexnow.org + Bing

## Git
- **Commit**: cc3898d6
- **Pushed**: main → origin/main
- **Files changed**: 85 (tatamibari game + global count sync)

## Competitive Analysis
- **Online competitors**: Extremely scarce
- **puzzle-tatamibari.com**: No Tatamibari page
- **puzzlemadness**: No Tatamibari page
- **brainbashers**: No Tatamibari page
- **SEO opportunity**: HIGH (first-mover advantage)

## Pipeline Status
- **Previous game**: pips (completed)
- **Current game**: tatamibari (completed)
- **Next candidate**: Per .game-pipeline-candidates.md
