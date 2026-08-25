# GameZipper 全站测试用例规范 (TEST-CASES.md)

> 版本: v1.0 · 制定: 2026-08-24 · 执行者: QA(Claude) · 铁律: 一切结论必须有运行证据; 诚实 FAIL 优于 放宽 PASS
> 目标(用户指令): 100% 覆盖所有功能与代码的测试用例 → 严格按用例做完整 E2E → 修复发现的全部问题 → 循环直到一整轮零新缺陷。

## 0. 被测对象与 100% 覆盖口径

| 对象 | 数量 | 定义 | 依据(真源) |
|---|---|---|---|
| 目录游戏(真游戏) | 452 | `js/games-data.js` 的 `GAMES` 数组(status=live) ≡ `_optimization/state/inventory.json` real | 已核对双射 0 差 |
| 隐藏真游戏(原桩, 已转正) | 91 | 有 index.html+game.js, 不在 GAMES 目录 | inventory isStub |
| 站点壳页面 | 43 | 顶层 *.html(首页/类目/专题/关于/隐私/404/sitemap) | `ls *.html` |
| 数据文件 | 12+ | games-data.js, js/categories/*.json(11), sitemap.html | — |
| 游戏页总计 | 543 | 452 + 91(全部需 verifier PASS 证据) | evidence/ |

**"100% 覆盖"判据**: 上表每个对象都被至少一个 TC-* 用例命中, 且每个 TC-GAME 用例对 543 款全部执行(非抽样)。

## 1. TC-SITE 站点壳与数据完整性(每条 = 全量执行)

| ID | 用例 | 步骤 | 期望 | 自动化 |
|---|---|---|---|---|
| TC-SITE-01 | 壳页面可解析 | 解析 43 个顶层 HTML(标签闭合/meta/title/h1 存在) | 0 解析错误 | site-check.js |
| TC-SITE-02 | 内链不 404 | 提取所有壳页 `<a href>` 指向站内路径, 逐一验证文件存在(目录→index.html) | 0 死链 | site-check.js |
| TC-SITE-03 | 本地资源不 404 | 壳页+游戏页引用的 src/href 本地资产(css/js/img/audio)逐一存在; `http(s)://` 外链跳过 | 0 缺失 | site-check.js |
| TC-SITE-04 | 目录↔文件系统双射 | GAMES 452 slugs ↔ 实际目录 | 双向 0 差 | site-check.js |
| TC-SITE-05 | 类目 JSON 有效性 | 11 个 js/categories/*.json 可解析、slug 无重复、每个 slug 有目录、slug 均在 GAMES∪允许集 | 全部满足 | site-check.js |
| TC-SITE-06 | 缩略图覆盖 | 类目页/首页引用的 /thumbs/*.jpg 存在(onerror 兜底不算失败, 记录缺失数) | 缺失清单为空或已兜底 | site-check.js |
| TC-SITE-07 | sitemap 覆盖 | sitemap.html 含全部 452 游戏 + 壳页链接, 无指向不存在页面的项 | 双向差集为空 | site-check.js |
| TC-SITE-08 | 404 页可用 | 请求不存在路径 → GitHub Pages 404.html; 本地静态服务返回 404 状态 | 404 页含返回首页链接 | 人工+serve |
| TC-SITE-09 | 基础文件在位 | CNAME/robots.txt/ads.txt/favicon/apple-touch-icon 存在 | 全在 | site-check.js |
| TC-SITE-10 | 游戏页冒烟(无 JS 错误启动) | 无头 chromium(bundled, 禁系统 Chrome)载入每款, 收集 pageerror/failed request | 0 pageerror | smoke-test.js(Phase 1 已建, 复跑增量) |

## 2. TC-GAME 游戏引擎 E2E(对 543 款每一款, 规范 = verifier-spec v3)

| ID | 用例 | 期望 |
|---|---|---|
| TC-GAME-01 | verifier 存在且可跑 | `<slug>/verify_engine.js` 存在, `node` 单进程 ≤120s 退出 |
| TC-GAME-02 | 输出契约 | stdout 末行紧凑 JSON: pass/fail/total/verdict; 退出码 0=PASS |
| TC-GAME-03 | 真实输入路径 | 验证经引擎真实交互 API(键/指针/按钮 dispatch), 禁直接改内部状态判胜 |
| TC-GAME-04 | A 型逐关可完成 | 解谜/关卡型: 每一关证明可完成(内嵌解回放 / 独立求解器双向证明) |
| TC-GAME-05 | B 型成功事件 | 街机/技巧型: 经真实输入达成游戏自身定义的成功(过关/得分>0/存活 N 秒) |
| TC-GAME-06 | C 型 fuzz 稳定 | 模拟/玩具型: ≥300 步随机合法交互, 零异常 + 状态推进 + 重置路径可用 |
| TC-GAME-07 | 全生命周期 | PLAY→(WIN)→NEXT→…→末关 / RESTART / REPLAY 至少一条链路走通(适用者) |
| TC-GAME-08 | 证据归档 | `_optimization/evidence/<slug>/verify.json+verify.log`; 修复过的游戏留 verify-before |
| TC-GAME-09 | 引擎缺陷处置 | 发现引擎 bug→修+根因注释+before/after; 关卡无解→重生成/最小修复; 修不动→诚实 FAIL+卡点 |
| TC-GAME-10 | 商店同步 | solvability-results.json 有该 slug 条目且 verdict 与证据一致 |

## 3. TC-REG 回归与循环(验收门)

| ID | 用例 | 期望 |
|---|---|---|
| TC-REG-01 | 全量 verifier 重跑 | 543 款全跑, PASS=543(或带卡点的诚实 FAIL≤既有清单, 不新增) |
| TC-REG-02 | site-check 全绿 | TC-SITE-01..09 全 PASS |
| TC-REG-03 | 双向核对 | evidence↔store↔verify 文件三方一致(rebuild-store 校验 missingEvidence=0) |
| TC-REG-04 | 循环终止判据 | 连续一整轮(TC-REG-01+02+03)零新缺陷 → 收敛; 否则修复后重跑本轮 |

## 4. 已知非绿项(开工基线, 须闭环或保留诚实卡点)

1. boxrob — ~~store TIMEOUT(WIP)~~ → 已闭环 R2: L5+L18 两处无解地图修复, 验证器 7 处模型缺陷修复, 29/40 诚实 FAIL(余 11 关=bot nav 预算, 已文档化)
2. drive-fury — 已闭环 R2: 6/6 PASS(maxX 2457=finish, level_complete)
3. blumgi-slime — 已闭环 R2: 5/5 PASS(30/30 won)
4. 171/452 目录游戏无任何验证证据(主工作量) — R2 三队列进行中
5. store 落后 3 款未同步(color-by-number / color-cars-parking / cover-orange) — 待 R3 rebuild-store

## 5. 执行记录(每轮追加)

| 轮次 | 日期 | 范围 | 新缺陷 | 修复 | 状态 |
|---|---|---|---|---|---|
| R1 | 2026-08-24 | 基线回归+site-check 首跑 | (待填) | (待填) | 进行中 |
| R2 | 2026-08-25 | boxrob 全量 + drive-fury/blumgi-slime 复攻 + site-check | boxrob L18 密封走廊无解(物理穷举证明: 4 宽墙+双箱+墙角兜底使走廊四面被封, b1 目标 (200,240) 需从走廊内推但无任何进入路径) | L18 墙 4宽→3宽, 开 x=400-440 进入口袋; 验证器: fall-edge 走带身体检测+高度比例 drift、lipEntry 邻接校验、planLevel 贪心桶(256 桶 offTarget*16+steps)、在靶箱 drift 保护、frontier 150、aimFor 回退=最近路径段、二攻 pass | boxrob 29/40 诚实 FAIL(11 关 bot nav 预算), 110s 内完成; site-check 9 项全绿 |
| R2b | 2026-08-25 | 全站 543 款引擎级验证(6 队列并行) + 视觉 E2E(无头 bundled chromium 551 页冒烟 + 视觉模型 58 张深验) | 60+ 真引擎缺陷, 含 6 款"上架即不可玩"P0: dunk-shot-3d(6×P0), simon-says, schulte-table(2×P0), gecko-out(按钮失灵+19/30 关无解), who-is(5 关遮挡无解+hint 全灭+半数关卡不可达), color-hole-3d, matchstick-puzzle(引擎重建); 数据级无解: woodoku 5 关(26.6 万 rollout 证明), easy-as-abc 全关卡 3 星不可达, boxrob L5/L18, mr-bullet 10 关, marble-run L9/L17, tower-defense L21+ 经济 | 全部修复+根因注释+before/after 证据; 37 款修复游戏经主会话独立二次复验 100% 复现 PASS | 540/543 PASS + 3 诚实 FAIL(boxrob 29/40, metro-lines 250/251, sugar-sugar 26/30 — 三款引擎均经独立证明无罪, 卡点=bot 搜索预算); 视觉 0 真实缺陷(mini-golf 黑屏为 headless 软渲染 backdrop-filter 截图 artifact, 已证伪); 0 chrome 进程残留 |
| R3 | 2026-08-25 | 全量回归循环(543 verifier 重跑 vs 存档判定对比, regression-pass.js 8并发) | 16 款 PASS→FAIL 翻转 + unblock-me 自愈; 修复期又揪出 2 个被旧 harness 桩掩埋的真引擎 bug: color-cascade 末发不消除即 0 弹药软锁(endLevel 只在 clearCluster 内调度), impossible-quiz 首次 game over 后永久控件(PLAY/TRY AGAIN/Skip)被 cleanup() 全反注册=真浏览器按钮全灭 | 归因三类: ① 回归器 cwd 缺 repo-root 回退 → anti-knight-sudoku/sudoku ENOENT 假失败(已修 runner, 恢复 PASS); ② 8 并发饿死时间预算型 bot → 6 款串行全恢复(blumgi-slime/color-block-jam/kakuro/cribbage/growmi/maze-runner); ③ harness 收尾变更 vs 旧验证器假设 → 8 款: 6 款验证器侧修(blue qsa 假节点/drive-mad 死探针+150s 环路→真胜 0.14s/flood-fill+spelling-bee+yahtzee 双初始化/mini-golf 规划器旧叠加轨迹), 2 款引擎侧修(color-cascade/impossible-quiz, 根因注释+before/after) | 8/8 全绿复验≥2次; 收敛轮 R4 低并发(4 worker)启动 |
| R4 | 2026-08-25 | 收敛回归(543 verifier, 4 worker 低并发, 8 分块) | **零新增失败** → 按 TC-REG-04 收敛达成 | unblock-me 存档 "SOLVED" 非标判定刷新为 PASS 50/50 | 540 PASS / 3 诚实 FAIL(boxrob 29/40, metro-lines 250/251, sugar-sugar 26/30), 全轮零新缺陷; site-check 9 项全绿; rebuild-store 543/543 missingEvidence=0 三方一致 |

## 6. 收敛结论

R1(基线) → R2(全站验证+修复) → R3(全量回归, 16 翻转→修复, 含 2 个被旧 harness 桩掩埋的真引擎 bug) → **R4(全量回归零新缺陷) — 循环终止判据达成**。
终态: 543 款 verify_engine 全覆盖, 540 PASS + 3 诚实 FAIL(bot 搜索预算卡点, 引擎均经独立证明无罪, 留人工复核); 视觉 E2E 551 页冒烟 + 58 张视觉模型深验零真实缺陷; 本周期累计修复真引擎缺陷 65+(18+ P0 级"上架即不可玩", 含 6 款完全不可赢), 37 款修复款经主会话独立二次复验 100% 复现。
