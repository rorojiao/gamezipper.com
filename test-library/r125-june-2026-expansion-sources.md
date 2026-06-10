# R125 — Dynamic Test Intelligence Source List (2026-06-10)

## New Sources Added This Round

| # | Source | Topic | Quality | URL |
|---|--------|-------|---------|-----|
| 1 | Stack Overflow 78517772 | iOS canvas touch lag with rAF | Tier-2 (developer report) | https://stackoverflow.com/questions/78517772/ios-touch-touchstart-cause-html-canvas-lag |
| 2 | MDN Web Docs | INP (Interaction to Next Paint) Core Web Vital | Tier-1 (W3C/MDN spec) | https://developer.mozilla.org/en-US/docs/Glossary/Interaction_to_next_paint |
| 3 | webgpu.com / Google I/O 2026 | HTML-in-Canvas API announcement | Tier-1 (Google official) | https://webgpu.com |
| 4 | Otuny | Mobile web low-latency interaction 2026 | Tier-2 (tech analysis) | https://otuny.com/insights/optimizing-mobile-web-architectures-for-low-latency-interaction-in-2026 |
| 5 | Spider AF | Ad fraud detection platform, IVT benchmarks | Tier-2 (industry platform) | https://global.spideraf.com/ |
| 6 | ADEX | Ad fraud & invalid traffic prevention | Tier-2 (industry platform) | https://www.adex.com/ |
| 7 | arXiv 2412.05039v1 / ACM | Dark patterns in 1496 mobile games study | Tier-1 (peer-reviewed academic) | https://arxiv.org/html/2412.05039v1 |
| 8 | ACM DL | Dark patterns full paper | Tier-1 (peer-reviewed) | https://dlnext.acm.org/doi/full/10.1145/3701571.3701604 |
| 9 | Tencent Cloud Developer | Safari 26 tracking parameter filtering analysis | Tier-2 (tech analysis) | https://cloud.tencent.com/developer/article/2637644 |
| 10 | QQ News (IT之家) | ChromeOS 148 cert migration for Chrome 150 LTS | Tier-2 (tech news) | https://so.html5.qq.com/page/real/search_news?docid=70000021_2736a15714b22052 |

## Additional Sources (supporting context)

| # | Source | Topic | URL |
|---|--------|-------|-----|
| 11 | CybermaXia | WebGPU vs WebGL 2026 browser rendering | https://cybermaxia.com/en/read?slug=webgpu-vs-webgl-browser-2026-render-game-konsol |
| 12 | Programming-Helper | WebGPU 2026 82% global browser support | https://programming-helper.com/tech/webgpu-2026-next-generation-browser-graphics-api |
| 13 | FastPlayGames | HTML5 vs mobile apps comparison 2026 | https://fastplaygames.com/blog/how-html5-games-compare-mobile-apps-2026 |
| 14 | BricxLabs | Dark pattern examples in UX 2026 | https://bricxlabs.com/blogs/dark-pattern-examples |
| 15 | QQ News | Safari 26.5 CSP bypass CVE-2026-28962 | https://new.qq.com/rain/a/20260514A0473Y00 |
| 16 | QQ News | Safari 26.4 CSS Grid Lanes + 191 bug fixes | https://so.html5.qq.com/page/real/search_news?docid=70000021_17369c3312871752 |

## Search Queries Used
1. `HTML5 browser game testing new techniques June 2026` (web-search-prime — aborted)
2. `casual mobile game UX complaint dark pattern 2026` (web-search-prime — success, 8 results)
3. `WebGPU WebGL performance accessibility game 2026` (web-search-prime — success, 8 results)
4. `Chrome 150 2026 security vulnerability update` (minimax — success, 10 results)
5. `Safari 26 WebKit update 2026 browser game compatibility` (minimax — success, 10 results)
6. `browser ad fraud invalid traffic detection 2026` (minimax — success, 10 results)
7. `HTML5 canvas game input latency touch mobile 2026` (web-search-prime — success, 8 results)
8. `Chrome HTML-in-Canvas API I/O 2026 accessibility game` (minimax — partial, found Google I/O reference)
9. `Interaction to Next Paint INP 2026 game performance metric` (minimax — success, 10 results)

## Pitfalls Encountered This Round
- **Pitfall 42 (batch search abort)**: web-search-prime batch_search aborted 3/5 queries. Used individual minimax searches as fallback. Same pattern as R119.
- **Pitfall 37 (stale metrics blocks)**: v1.29.0 had 2 LIBRARY METRICS blocks (historical v1.18.0 + current v1.28.0). Used `rfind()` to remove only the LAST block, preserving historical one.
