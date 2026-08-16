# Phase 3 · 策划评分报告(9 维度)

> 方法:全站 452 款自动评分(脚本 `scripts/score-games.js`,依据 = 冒烟 + 可解性验证 + playtest + 曲线分析 + 静态 UX 信号扫描);Top-15 流量游戏叠加人工策划深评(代码级取证:音效 API、存档、难度机制、死亡惩罚)。BI 流量取自 `~/gamezipper-bi/data/analytics.db`(events 表,page_view 计数)。

## 1. 全站总览

- 452 款真实游戏参与评分,全站均分 **3.58 / 5**(v2:静态信号扫描已覆盖外链 game.js,并合入 playtest 重判 198 款 + 3 款 P0 修复后 verdict)
- 自动标记:P0-unsolvable 5 款(suguru / tap-away / unblock-me / train-tracks / sandwich-sudoku,均已进入修复流程);P1-no-audio 若干(见 §3);P2-no-onboarding 少数(小众解谜)
- 明细数据:`reports/scoring-data.json`(每游戏 dims 九维 + flags + evidence 指针)

## 2. Top-15 流量游戏 · 策划深评表

| # | 游戏 | PV | 自动分 | 策划调整分 | 策划结论(关键证据) |
|---|------|----|--------|-----------|----------------------|
| 1 | snake | 6644 | 3.11 | **3.3** | 有 WebAudio 合成音 + localStorage(最高分留存✓);但难度全程平坦(无吃食加速/无关卡)→ 曲线 3 分;街机经典,上手即玩。**P2:加渐进提速** |
| 2 | 2048 | 5939 | 3.11 | **3.9** | ~~初判"零音效零存档"系扫描盲区(引擎在外链 game.js)~~ — game.js 取证:WebAudio 三档合成音效(swipe/merge/cheer,音高随合成块数值升调)+ `best2048` localStorage 持久化俱全。玩法自带难度爬升✓。保持 |
| 3 | tetris | 4787 | 3.06 | **3.4** | game.js 有音效(2 处 API);等级机制✓(每 10 行提速);**best/level 不持久化**(刷新清零)→ P2 补存档 |
| 4 | hexa-bridges | 4113 | 3.61 | **3.7** | 30/30 可解✓(python→node 移植验证器),关卡结构清晰。全站解谜标杆。保持 |
| 5 | bus-traffic-fever | 3452 | 3.33 | **3.6** | ~~"安慰剂音效开关"为误判~~ — game.js 有完整音频后端(18 处 API,sfx/music 双增益链,开关真实接线 save.sfx);vm 驱动验证 PASS 4/4(2 巴士出场+150 金币);存档✓。保持 |
| 6 | slope | 2229 | 3.33 | **2.6** | 音效✓ best 持久化✓(`slope_best`)。但 B2 代理插桩证实**出生帧闪撞缺陷**:spawnObstacle 生成位置即处碰撞窗(z=roadZ+ZLOOP-20,dz<30 同帧判定)+ 障碍在通过窗前被剔除 → 300 次插桩 100% 死于闪撞,30 秒存活数学不可达。**P1:修 spawn 位置/剔除窗口**(无尽跑酷的可玩性根基) |
| 7 | sudoku | 2149 | 3.61 | **3.7** | 验证器 PASS,多难度 + 每日谜题,留存钩子全站最强(4.5)。保持 |
| 8 | chess | 1906 | 3.11 | **3.2** | 有音效(4 处 API);无对局存档(可接受,中盘续玩缺失为 P3);AI 难度待实测。P2 |
| 9 | color-sort | 1657 | — | **n/a(stub)** | 1334B meta-refresh → /magic-sort/;magic-sort 验证 PASS✓。stub 行为正常,无需处理(记录:该流量实际由 magic-sort 承接) |
| 10 | memory-match | 1612 | 3.39 | **3.5** | 音效✓存档✓,5 处难度引用。健康。保持 |
| 11 | minesweeper | 1579 | 3.33 | **3.5** | 音效✓、难度选择✓(7 处 difficulty 引用)。经典完备。保持 |
| 12 | cookie-clicker | 1536 | 3.28 | **3.4** | 音效✓存档✓(放置游戏存档是刚需,已具备)。保持 |
| 13 | flappy-wings | 1518 | 3.39 | **3.3** | 手感 4.5(操作响应优秀);playtest DEGRADED 待复核(canvas 冻结误报嫌疑);死亡即重来符合品类。P2:复核 playtest 信号 |
| 14 | brick-breaker | 1406 | 3.78 | **3.9** | 全站自动分最高;验证 PASS + playtest PLAYABLE 双绿;手感 4.5。**街机品类标杆,保持** |
| 15 | phantom-blade | 1006 | 3.44 | **3.3** | 手感 4.5 + 音效存档俱全;playtest DEGRADED 待复核。P2 |

**Top-15 合计 PV ≈ 42.8k。修正说明:初版报告的"高流量街机缺音频/存档簇"系 index.html 单文件扫描盲区(引擎在外链 game.js),已用 game.js 逐款复核并翻案 — 2048/slope/bus-traffic-fever 音频与存报俱全;真正待修的是 slope 闪撞缺陷与 tetris 存档。**

## 3. 全站横向发现(策划视角)

| 发现 | 级别 | 说明 |
|------|------|------|
| 5 款关卡不可解 | **P0** | tap-away ✅已修(30/30)、train-tracks ✅已修(30/30)、sandwich-sudoku ✅已修(27/27);suguru/unblock-me 生成中;solitaire 待浏览器约定重写验证器 |
| slope 出生帧闪撞 | **P1** | spawnObstacle 生成即碰撞(300 次插桩 100% 闪撞死,30s 存活不可达)— B2 代理证据 `_optimization/evidence/slope/` |
| slice-master 点击穿透 | **P1 ✅已修** | `.ov>*` → `.ov.active>*`;前后对照 `evidence/slice-master/pointer-events-fix.json`(PRE 命中隐藏层按钮,POST 命中本屏元素) |
| playtest 页面异常簇 | **P1** | baba-is-you(grid null)/four-pics-one-word(H 未定义)/sliding-puzzle(x undefined)/liquid-connect(教程函数缺失)4 款 P0 级 + 4 款 P2 轻伤 — Wave C 代理修复中 |
| tetris 无存档 | P2 | best/level 刷新清零(音效已有) |
| pong 键盘路径量化 | P2 | 键盘 moveSpeed 量化使球拍存在无法防守区间(触摸路径正常)— B2 代理证据 |
| snake 无难度曲线 | P2 | 全速恒定,长局无张力递进 |
| playtest DEAD 误报 | ✅已处理 | 198 款凭 DOM 状态变化证据平反 PLAYABLE(297 PLAYABLE / 92 DEGRADED / 65 DEAD-UNCONFIRMED 观察名单,`reports/playtest-reclassified.json`) |
| gokigen-naname 退化解 | P2 | 全 '/' 布局也能过(验证器放行,数据侧加约束) |
| 小众解谜无引导 | P2 | kojun/usotatami 等规则小众无 tutorial(P2-no-onboarding flag 9 款) |

## 4. 评分快照(自动,9 维均值分布)

- ≥4.0:0 款(无短板全优游戏 — brick-breaker 3.78 最高)
- 3.5–3.9:约 90 款
- 3.0–3.4:约 280 款(主力区间)
- <3.0:约 80 款(多为纯静态或缺反馈游戏)

> 修复后(score-games.js 随新证据重跑)本表与 scoring-data.json 将刷新;最终对比进 final-report.md。
