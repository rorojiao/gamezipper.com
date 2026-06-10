# R123 June 2026 Expansion Sources

## New Sources Added (8 URLs)
1. **Firefox 150 Nova redesign** — 5-year biggest redesign, AI kill switch, 9% speed improvement
   - https://so.html5.qq.com/page/real/search_news?docid=70000021_2136a0fdb1134152
2. **WebGPU 22% frame rate stability + IDC 2026 Q1 benchmarks** — 60fps vs 45fps, 18%+ mobile adoption
   - https://www.lcxw.cn/39@wiki/ZoCGH
3. **Unity 6 WebGPU Nginx black screen** — export fails, Firefox Nightly crashes
   - https://developer.unity.cn/ask/question/6778d29fedbc2a001efec7c3
4. **Firefox 115 ESR extended August 2026** — legacy Win7/8.1/macOS support
   - https://so.html5.qq.com/page/real/search_news?docid=70000021_66969b2122136352
5. **Docker AuthZ + Langflow RCE rapid weaponization** — 20h exploit window
   - https://so.html5.qq.com/page/real/search_news?docid=70000021_63969d701e048852
6. **AI anti-detect browser market 2026** — RoxyBrowser, AdsPower, fingerprint evasion
   - https://so.html5.qq.com/page/real/search_news?docid=70000021_56569de3f5d87052
   - https://so.html5.qq.com/page/real/search_news?docid=70000021_86369ddf17966652
7. **MDN Mobile Accessibility Checklist March 2026** — contrast, ARIA, focus management
   - https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Mobile_accessibility_checklist
8. **Phaser.js AUTO rendering mode** — WebGL+Canvas dual fallback
   - https://cloud.tencent.com/developer/article/1467947

## Secondary Sources (Context)
- WebGPU vs WebGL comprehensive comparison: https://developer.baidu.com/article/details/3340925
- W3C Mobile A11y TF active repo: https://w3c.github.io/Mobile-A11y-TF-Note/
- WebGPU implementation guide: https://blog.csdn.net/qq_51700102/article/details/145066284
- FIRST 2026 CVE projections: 100K+ total (median ~59K, 90% CI upper bound ~118K)

## Pitfalls Encountered (R123)
- **Pitfall 39**: `execute_code` blocked for cron jobs → use terminal + python3 one-liners instead
- **Pitfall 43**: Header string replacement caused duplication — always verify with `head -10` after Python string ops
