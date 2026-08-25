# GameZipper 全站测试用例 (tests/cases.md)

版本: v1.0 · 2026-08-24
运行方式: `node tests/run-all.mjs`（全量）或 `node tests/run-all.mjs --suites=A,B`（部分）。
退出码: 0 = 全部通过；1 = 存在失败项。报告写入 `tests/results/run-<timestamp>.json`。

## 范围

- 被测对象: 仓库内全部静态页面（根目录 40 个 `.html`、551 个含 `index.html` 的目录）、
  `js/games-data.js`（452 条注册游戏）、`js/categories/*.json`、`sitemap.xml` / `sitemap.html`、
  根目录共享 JS（`game-footer.js`、`monetag-manager.js` 等）、以及所有游戏自带验证器。
- 不测: `api/` 的外部服务实际调用（仅静态检查）；线上环境（E2E 全部针对本地 HTTP 服务）。

## Suite A — 游戏目录静态完整性（对每个 games-data.js 注册游戏执行）

| ID | 用例 | 步骤 | 预期结果 |
|----|------|------|----------|
| A1 | 目录与入口存在 | 由 `url:"/<slug>/"` 推导目录，检查 `<slug>/index.html` | 文件存在 |
| A2 | 标题非空 | 解析 `<title>` | 存在且内容非空 |
| A3 | splash 外有 H1 | 移除 `#splash-screen` 块后搜索 `<h1>` | ≥1 个非空 H1 |
| A4 | 页脚脚本 | 搜索 `game-footer.js` 引用 | 存在 |
| A5 | 广告管理脚本 | 搜索 `monetag-manager.js` 引用 | 存在 |
| A6 | 广告位容器 | 搜索 `gz-ad-below-game` | 存在 |
| A7 | 无僵尸广告域名 | 搜索 `1ktower.com`（无 removed 标注）、`alwingulla`、`cdn.monetag.com` | 均无 |
| A8 | 目录注册唯一 | slug 在 games-data.js 中出现次数 | 恰好 1 次 |

对未注册但含 `index.html` 的目录（约 99 个，含 admin/blog/terms 等功能页与未上架游戏）：
仅执行 A2（标题非空）基础检查，并在报告中单列 `unregistered` 清单，不计入失败。

## Suite B — 站点级一致性

| ID | 用例 | 预期结果 |
|----|------|----------|
| B1 | `js/games-data.js` 可被解析为 JS，`GAMES` 为数组 | 解析成功 |
| B2 | 注册游戏 url slug 无重复 | 无重复 |
| B3 | 每个注册游戏的目录存在（与 A1 互补，反向校验孤儿注册） | 全部存在 |
| B4 | 计数一致：`GAMES.length` 与 `index.html` 中全部计数声明（`data-count`、"N free browser games" 文案、JSON-LD 描述中的数字）一致 | 全部相等 |
| B5 | `sitemap.xml` 覆盖全部注册游戏 URL（`https://gamezipper.com/<slug>/`） | 全覆盖 |
| B6 | `sitemap.xml` 中每个 `<loc>` 都映射到仓库内存在的文件/目录 | 无死链 |
| B7 | `sitemap.html` 覆盖全部注册游戏 slug | 全覆盖 |
| B8 | `js/categories/*.json` 均可解析为数组；条目 slug 对应目录存在 | 全部通过 |
| B9 | 注册游戏的 `cat` 值均有对应 `js/categories/<cat>.json` 文件 | 全部存在 |
| B10 | 根目录 40 个 `.html` 页面 `<title>` 非空 | 全部非空 |
| B11 | `index.html` 中 `href="/<slug>/"` 形式的内部链接均指向存在的目录 | 无死链 |
| B12 | 根页面与共享 JS 无僵尸广告域名（同 A7 规则） | 均无 |

## Suite C — 已有游戏验证器批量执行

| ID | 用例 | 预期结果 |
|----|------|----------|
| C1-C12 | 全部游戏自带验证脚本逐个以 `node` 执行（cwd=仓库根，单文件超时 120s）：`verify_engine.js`、`verify_independent.js`、`verify_levels.js`、`verify_model.js`、`verify_unique.js`、`verify_iife.js`、`playtest.js`、`qa_checklist.js`、`qa_check.js`、`test_jsdom.js`、`test_after_fix.js`、`test_playability.js`（共 500+ 个） | 退出码全 0 |

并发度: min(8, CPU 核数)。超时/崩溃均记为失败并捕获 stderr 首行。

## Suite D — 端到端冒烟（本地 HTTP 服务 + Playwright Chromium）

| ID | 用例 | 预期结果 |
|----|------|----------|
| D1 | 起本地静态服务（仓库根），外部域名请求一律拦截并返回空 200 | 服务就绪 |
| D2 | 加载全部根 `.html` 页面与全部注册游戏页（`/`、`/<slug>/`），采集 `pageerror` 与 console error | 无非广告类 JS 错误 |
| D3 | 上述加载中本地资源（同 host）请求失败/404 采集 | 无 404 |
| D4 | 每个游戏页加载后 DOM 中存在 `<title>` 且 `document.body` 非空 | 全部满足 |

广告/统计类外部脚本（monetag、adsterra、googlesyndication 等）被拦截后产生的报错归入 `adNoise`，不计失败。

## 循环收敛规则

1. 全量运行 → 记录全部失败项。
2. 逐项修复（最小改动，不改玩法语义）。
3. 重跑全量；连续两轮无任何失败项即收敛。
4. 无法在不改变玩法语义的前提下修复的问题：记录位置与原因，写进最终报告，不强行通过。
