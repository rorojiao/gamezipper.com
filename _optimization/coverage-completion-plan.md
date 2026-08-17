# 全站 100% 覆盖收尾计划(coverage-completion-plan.md)

> 制定: 2026-08-17 · 基线: 203/452 验证器全 PASS, 0 FAIL, 11 个本地 commit 未推送
> 总目标(不打折口径): **452 款真游戏每款都有 verify_engine.js、逐关/逐局完成证据、store 全 PASS**, 终报按此结果重写并验收。

---

## 0. 验收口径(Definition of Done)

1. `ls */verify_engine.js | wc -l` = **452**(真游戏目录全覆盖, 91 桩不在范围)
2. `_optimization/reports/solvability-results.json`: **452 条全 PASS, 0 FAIL, 0 缺证据**(rebuild-store 校验 missingEvidence=0)
3. 每款证据链: `_optimization/evidence/<slug>/verify.json`(verify-before 留档于修复过的游戏)
4. 修复过的游戏: 引擎/数据 bug 有根因注释 + before/after 数据
5. 终局回归: run-verifiers 全绿 + 22 款已改页冒烟复测全绿
6. final-report.md / final-report.html 按 452/452 重写, README/catalog/任务板同步
7. 全部 commit 推送 origin/main, 等 GitHub Pages 2h 周期后线上抽查 5 款
8. 会话收尾: chrome 进程自查 = 0

## 1. 剩余工作分解(249 款 + 收尾项)

| 编号 | 工作包 | 数量 | 单款预估 | 小计 |
|---|---|---|---|---|
| W1 | B 型街机(drift-boss, drive-fury, drive-mad, glass-rush-3d, gobble, going-balls, gravity-run, lava-rising, monster-truck-madness, neon-dash, paper-io, pinball, punch-master, stickman-escape, stickman-swing) | 15 | 5–15 min | ~3 h |
| W2 | C 型卡牌/棋盘/桌游(blackjack, backgammon, hearts, spades, go, ludo, mancala, 各 solitaire, crazy-eights, cribbage, euchre, farkle, go-fish, rummy, tripeaks, guess-the-emoji, mo-yu-fayu, papas-freezeria, tiny-fishing, abyss-chef, antistress, build-a-queen, cookie-clicker, chinese-checkers, solitaire-roguelite, ludo) | 26 | 15–40 min(合法完整对局) | ~13 h |
| W3a | A 型-简单: 静态关卡+内嵌解或显式胜利条件(link-a-pix 同族模板、填充类、路径类) | ~70 | 8–15 min | ~15 h |
| W3b | A 型-中等: 静态关卡无内嵌解, 需独立求解器(BFS/DFS/构造) | ~95 | 20–40 min | ~47 h |
| W3c | A 型-硬: 规则引擎/运行时生成/对抗 AI(baba-is-you 同族、clickomania 变体、对抗类) | ~45 | 40–90 min | ~48 h |
| W4 | 推送 11 个 backlog commit + 后续增量推送 | — | — | 10 min |
| W5 | 终局回归: 全量 verifier 重跑 + 改动页冒烟 + rebuild-store | — | — | ~2 h |
| W6 | 终报重写(md+html 双版) + README/catalog/进度板刷新 | — | — | ~1 h |
| W7 | 验收交付: 本地 server + 首页/样板 URL + 已验证清单 | — | — | 15 min |

**纯工时合计: ~130 h**;混合并行(harness 成熟后单款成本已从小时级降到分钟级,长尾在 W3b/W3c)。

## 2. 执行模式(三选一,待用户确认)

**模式 M1 混合(推荐, wall-clock 最短)**
- 主会话(我): W3c 硬骨头 + 全部裁决/复核/修复 + 每批质量门
- 后台 agent ×2(低并发防 429): W1+W2+W3a 流水, 每人一批 25–35 款, 串行 node, 按规范交付
- 节奏: 我与 agent 互不碰对方文件(wave 文件分片隔离);每 +50 款 commit+push 一次
- 429 对策: 速率限制触发时 agent 自动退避重试(账户级限额, 并发≤2 是经验安全值)
- 预计 wall-clock: **连续 ~30–40 h**(多轮会话接力, 任务 #7 playbook 保证跨会话续跑)

**模式 M2 纯单干(最稳, 最慢)**
- 全部由主会话完成, 零 fleet 压力, 无速率限制风险
- 预计 wall-clock: ~70 h+(纯工时 130h × 上下文切换损耗)

**模式 M3 分段验收**
- 先 W1+W2+W3a(120 款, ~31h 工时)交付一次 → 用户中期验收 → 再决定 W3b/W3c
- 降低一次性投入风险, 但多一轮往返

## 3. 批次与质量门(每个工作包内)

1. **分片**: 按 wave-*.json 切 25–35 款/批, 文件互斥
2. **单款流水**: 引擎分诊(grep 结构) → 写 verify(harness-lib + inject 导出) → 跑到 PASS(引擎 bug 直接修+注释; 关卡无解按成熟模板修: 预算重校/构造重生成/种子扫描) → save-verify → 修不动如实 FAIL 记卡点
3. **批质量门(我执行)**: 抽 20% 复跑核对 PASS 真实性 → rebuild-store(证据为真源) → commit
4. **诚实铁律不放松**: 任何 FAIL 必须有卡点描述, 禁止放宽判定凑 PASS(参照 doodle-jump 的 bot-skill 处理方式记录)

## 4. 里程碑与检查点

| 里程碑 | 内容 | 达成判据 |
|---|---|---|
| M-250 | W1+W2 完成 | 249/452 验证器 |
| M-320 | W3a 完成 | ~319/452 |
| M-415 | W3b 完成 | ~414/452 |
| M-452 | W3c 完成 + 全绿 | **452/452, 0 FAIL** |
| M-FINAL | W5+W6+W7 | 终报验收 + 推送上线 |

每个里程碑: commit+push+store rebuild+进度板刷新。

## 5. 风险与对策

| 风险 | 概率 | 对策 |
|---|---|---|
| API 速率限制(429) | 中 | 并发≤2, 触发即退避;单干模式免疫 |
| 内存 OOM | 低 | node 全程串行, 生成器带节点/时间上限(既有规范) |
| 硬 A 型卡点(求解不可行) | 中 | 时间盒 90 分钟/款;超盒→FAIL 记卡点+升级清单, 不阻塞批次 |
| 内容缺陷激增(W3b/W3c 可能再掀出几十关无解) | 高 | 修复模板已成熟(预算重校/构造重生成/种子扫描/引擎笔误), 按既定模式处置 |
| 生产部署碰撞(推送时远端又进 ads commit) | 低 | push 前 fetch+rebase(既有流程) |

## 6. 一次性到达终点的路径

选定模式 → 按 W1→W2→W3a→W3b→W3c 顺序推进(先易后难, harness 复用最大化) → 每里程碑推送 → M-452 后跑 W5 终局回归 → W6 终报双版重写 → W7 验收交付(本地 server + 首页 + 终报 + 已验证清单) → 线上 2h 后抽查 → 会话 chrome 自查。全程不再需要用户介入, 除模式确认这一次。
