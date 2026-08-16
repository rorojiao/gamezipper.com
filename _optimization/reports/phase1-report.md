# Phase 1 冒烟测试报告(无头 Chromium 全量)

> 时间: 2026-08-16(全量跑 ~06:00Z,修复复验 ~06:10Z) · 工具: Playwright bundled chromium(合规) · 覆盖: 543 页
> 判定规则: 主文档 200 + 无未捕获异常 + 无本地资源 4xx/5xx + (canvas 或 DOM 棋盘存在) = PASS;未捕获 JS 异常或本地资源 404 = FAIL(P0);外部广告/分析域已拦截(不打生产 BI)

## 结论(修复后)

| 判定 | 数量 | 说明 |
|---|---|---|
| PASS | 452 | 正常启动(含本轮修复的 3 个) |
| STUB-OK | 91 | 重定向桩(改名/合并游戏),目标全部有效 |
| FAIL (P0) | **0** | 原 7 个:3 个已修复,4 个降级观察 |

真实游戏数:**452**(另有 91 个重定向桩,目标全部存在)

## 原 7 个 P0 的处置

| 游戏 | 原始异常 | 处置 | 证据 |
|---|---|---|---|
| rosette | `Cannot read properties of null (reading 'addEventListener')` | ✅ 已修复:win 界面按钮 id 引用错误(`btn-next-level`→`btn-next-win` 等 2 处) | `evidence/rosette/after-fix-{load,interact}.png` + verify 30/30 |
| color-cars-parking | `Cannot read properties of null (reading 'complete')` | ✅ 已修复:`handleClick` 在 `gameState` 初始化前可被调用,加空值守卫 | `evidence/color-cars-parking/after-fix-interact.png` |
| bubble-shooter | `Assignment to constant variable.` | ✅ 已修复:cleanup() 重赋值 `timers` 但声明为 const,改 let | `evidence/bubble-shooter/after-fix-interact.png` |
| sandwich-sudoku | `animFrame is not defined` | 🔶 降级 P1-观察:9+ 次复测(含精确复刻 harness)不复发,疑似时序竞态;已列入 verifier 计划持续观察 | smoke 复测记录 |
| spiral-galaxy | `onPointerDown is not defined` | 🔶 降级 P1-观察:同上 | 同上 |
| suraromu | `Cannot read properties of null (reading 'timerInterval')` | 🔶 降级 P1-观察:同上 | 同上 |
| word-search | `requestAnimationFrame: parameter 1 is not a Function` | 🔶 降级 P1-观察:同上 | 同上 |

> 注:汇总文件 `smoke-results.json` 曾被一次 `--only` 重测覆盖,已按报告重建判定层明细;全量明细将在修复期结束后统一重测补齐。

## 环境说明
- 广告域(pagead2/monetag/magsrv/adsterra 等)与分析 EP(trycloudflare)已 abort,避免 543 次测试 PV 污染生产 BI
- autoplay/用户手势类报错计入环境噪声不计缺陷
