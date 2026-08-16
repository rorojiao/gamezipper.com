# /_optimization/ — 全站游戏质量闭环工程

> 目标:543 款游戏「测试 → 策划评估 → 方案 → 落地修复 → 验收」完整闭环,交付每一关可实测通关、难度曲线合理、留存友好、商业化上线品质的游戏网站。
> 铁律:一切结论必须有运行证据(日志/截图/通关记录);修复必须附 before/after 证据;无证据 = 未完成。

## 文档索引

| 文档 | 内容 | 阶段 |
|---|---|---|
| [../game-catalog.md](../game-catalog.md) | 543 款游戏清单(名称/路径/类别/引擎/关卡数据/验证器/音频/状态) | Phase 0 |
| [state/inventory.json](state/inventory.json) | 机器可读全量清单 | Phase 0 |
| [state/catalog.json](state/catalog.json) | 站点目录原始数据(js/games-data.js 提取) | Phase 0 |
| [reports/smoke-results.json](reports/smoke-results.json) | Phase 1 无头浏览器冒烟测试结果 | Phase 1 |
| [reports/solvability-results.json](reports/solvability-results.json) | Phase 2 逐关可解性验证结果 | Phase 2 |
| [reports/scoring.md](reports/scoring.md) | Phase 3 策划评分(9 维度) | Phase 3 |
| [optimization-plan.md](optimization-plan.md) | Phase 4 优化方案(按游戏按 P0–P3 排期) | Phase 4 |
| [final-report.md](final-report.md) | Phase 5 最终交付报告(前后对比/曲线/证据/遗留) | Phase 5 |

## 目录结构

```
_optimization/
├── README.md                 # 本索引
├── scripts/                  # 所有自动化脚本(可重跑)
│   ├── extract-catalog.js    # 从 js/games-data.js 提取目录
│   ├── build-inventory.js    # 全量清单 + 技术栈检测
│   ├── gen-catalog-md.js     # 生成 game-catalog.md
│   ├── serve.js              # 本地静态服务(测试用)
│   └── smoke-test.js         # Phase 1 Playwright 冒烟测试
├── state/                    # 机器状态(可续跑)
├── reports/                  # 各阶段结果报告
└── evidence/<游戏名>/        # 每游戏证据(截图/日志/通关记录)
```

## 进度看板

- [x] Phase 0 游戏清单盘点(543 款 = 452 真游戏 + 91 重定向桩,2026-08-16)
- [x] Phase 1 全站冒烟测试(452 PASS / 0 FAIL;3 个 P0 崩溃当场修复,4 个 flaky 降级观察 → `reports/phase1-report.md`)
- [x] Phase 2 逐关可解性验证(**144 款 verify_engine 144/144 全 PASS**;两波 P0 内容缺陷 10 款全部闭环 → 修复记录见下)
- [x] Phase 3 策划评分(9 维度 452 款 → `reports/scoring.md`)
- [x] Phase 4 优化方案(`optimization-plan.md`,P0–P3 排期)
- [x] Phase 5 修复落地 + 终报(`final-report.md`)

### Phase 2 P0 内容缺陷 — 全部闭环(2026-08-16)

| 游戏 | 缺陷 | 修复 | 终态证据 |
|---|---|---|---|
| suguru | 30/30 关无解(数据层坏) + daily 生成器空盘误调唯一解器→栈溢出/分钟级卡死 | 30 关全量重生成(5-worker MRV 唯一解生成器) + generateDaily 重写(正交分区+修复遍+MRV 双求解器+阶梯+贪心抛光) | 30/30 双语义唯一可解, 100 随机种子 100/100 唯一, 14 天探针 0 异常, daily ≤416ms, 浏览器 e2e 0 pageerror |
| tap-away | 22/30 关不可解(视线死角互锁) | 构造式重新生成(`scripts/gen-tapaway-levels.js`) | verify PASS |
| unblock-me | 27/50 关数学证明无解 + 生成器 TELEPORT bug(只查目标 footprint→方块穿墙) | moves() 重写为引擎逐步语义 + scrambleFromSolved 构造 + 爬山拒绝不可解突变; 曲线峰值 18→15 校正(18 源自坏关卡数据) | 50/50 BFS-optimal 可解, 无 INCONCLUSIVE, 曲线 1→15 锯齿 |
| train-tracks | 30/30 引擎 bug:`traceTrack()` 用 `lvl.start.dir` 未取反 → checkWin 恒 false | 一行引擎修复(`start.dir` → `OPP[start.dir]`) | verify PASS |
| sandwich-sudoku | L8–L27 共 20 关线索与内嵌解矛盾 | 从内嵌解重算线索字段 | verify PASS |

### Phase 5 其他落地项(全部带前后证据)

| 项 | 内容 | 证据 |
|---|---|---|
| Wave C 崩溃修复 | 8 款游戏 pageError 清零 | `evidence/<slug>/` + verify-crashfix |
| solitaire P1.4 | node-vm 验证器重写(kachilu-browser 脚本替换): 发牌完整性 10/10 + forced-win + 9/10 Monte-Carlo 策略胜局全引擎回放 | `evidence/solitaire/verify.json` |
| tetris P2 | 最高分持久化(localStorage, ★ NEW BEST ★ + HUD Best 档) | `evidence/tetris/persistence-probe.json` |
| snake P2 | 前期减速带(前 10 次进食每次 -4ms, 之后每 5 次 -10ms, 下限 60) | 引擎内探针 |
| gokigen P2 | 30 关唯一性审计全通过 | `evidence/gokigen-naname/uniqueness-audit.json` |
| 新手引导 | 9 款解谜首访 How to Play overlay(统一实现, localStorage 免打扰) | `evidence/onboarding-rollout.md` |
| slope 公平性 | spawn-flash/预生成墙修复后 40 局探针 | `evidence/slope/fairness-probe.json` |

### Phase 1 修复记录(已完成)

| 游戏 | 缺陷 | 修复 |
|---|---|---|
| rosette | 胜利界面按钮 id 引用错(null addEventListener) | 改为正确 id,30/30 verify + 截图 |
| color-cars-parking | handleClick 在 gameState 初始化前触发 null 崩溃 | 加空值守卫 + 复测截图 |
| bubble-shooter | cleanup() 对 const timers 重新赋值 | const→let + 复测截图 |

## 关键约定

- **本地测试**:仅用 Playwright **bundled chromium**(`chromium.launch()` 默认,绝不带 `channel`/系统 Chrome 路径);用完即关。
- **验证器约定**:复用仓库既有 `verify_engine.js` 规范(node vm 沙箱载入游戏 JS,对每关应用内嵌解/搜索解,断言胜利条件),exit 0 = 全关通过。
- **P0** = 无法启动/致命 JS 错误/核心资源 404;**P1** = 核心玩法失效或不可通关;**P2** = 体验问题;**P3** = 打磨。
