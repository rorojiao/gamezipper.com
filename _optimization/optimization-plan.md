# gamezipper.com 全站优化执行方案(Phase 4)

> 依据:Phase 1 冒烟(452 PASS)+ Phase 2 可解性验证(121+ 验证器,5 款确认 P0)+ Phase 3 评分(scoring.md / scoring-data.json)。
> 执行纪律:每项修复必须产出 before/after 证据(`_optimization/evidence/<slug>/`);无证据 = 未完成。所有关卡替换必须通过该游戏 verify_engine.js 全绿 + 曲线分析 PASS。

## §四 验收标准(硬性,适用于所有修复项)

1. **逐关可解**:每关在引擎真实规则下有合法通关路径,验证器 100% PASS
2. **锯齿难度曲线**:整体 Spearman 上升 + 峰后回落 ≥ 峰值 15%(防单调疲劳)
3. **前三关留存生死线**:L1 ≤ 全局难度 20%(60 秒内首胜),前三关 ≤ 35%
4. **防挫败**:连续 N 次失败出现软性帮助(提示/跳关/降难)——验证器/静态扫描双确认
5. **即时正反馈**:得分/消除/通关瞬间有视听双通道反馈(音频 API + 视觉动效静态扫描确认)

---

## P0 — 关卡不可解(5 款,今日内)

| # | 游戏 | 缺陷 | 修复方案 | 验收 |
|---|------|------|----------|------|
| 0.1 | **tap-away** | 22/30 关不可解(块视线被挡) | 替换 `var LEVELS=[...]` 为生成器产出(`state/tap-away-levels.json`,构造式生成保证可解) | verify 30/30 + 曲线 PASS + L1 par≤5 |
| 0.2 | **suguru** | 30/30 关不可解(区域划分无解 + `S.solution=null` 崩溃提示系统) | 替换 easy/medium/hard 各 10 关为唯一解生成器产出(`state/suguru-levels.json`) | verify 30/30 + 每关唯一解重算 + 前三关 givens 密度 ≥ 0.45 |
| 0.3 | **unblock-me** | 27/50 数学证明不可解(状态空间穷尽) | 替换 50 关为反向打乱 + 爬山生成器产出(`state/unblock-me-levels.json`,BFS 验证最优步数贴合原曲线) | verify 50/50 + 最优步数曲线 Spearman 上升 + L1 ≤ 2 步 |
| 0.4 | **train-tracks** | 30/30 不可解(引擎 `traceTrack()` 用 `lvl.start.dir` 应为 `OPP[lvl.start.dir]`,数据本身有效) | 引擎 1 行修复(只改方向语义,不动关卡数据) | verify 30/30(数据未变,修复后原数据即全绿) |
| 0.5 | **sandwich-sudoku** | L8–L27(20 关)线索与内嵌解矛盾 | 用内嵌解重算三明治线索字段(数据保全:保留原解,只重算 sums) | verify 50/50 + 每关以解代入校验线索一致 |

## P1 — 高流量体验缺陷(修订版:game.js 复核后)

> 修订说明:初版 1.1–1.4 基于 index.html 单文件扫描,漏看外链 game.js;逐款复核后 2048/slope/bus-traffic-fever 音频与存档俱全,原 1.1/1.3/1.4 撤销,新增 slope 闪撞(B2 代理插桩证据)。

| # | 对象 | 缺陷 | 修复方案 | 验收 |
|---|------|------|----------|------|
| 1.1 | **slope**(2229 PV) | 出生帧闪撞:spawnObstacle 生成位 `z=roadZ+ZLOOP-20` 即处碰撞窗(dz<30 同帧判定),且障碍在通过窗前被剔除 → 300 次插桩 100% 闪撞死,30s 存活不可达 | spawn 位移到碰撞窗外 + 剔除延后到通过窗之后(2 处小改) | 插桩复跑:0 闪撞死;vm 驱动 30s 存活达成 |
| 1.2 | **slice-master** ✅ | overlay 隐形按钮点击穿透 | `.ov>*` → `.ov.active>*` | ✅ 前后对照 evidence/slice-master/pointer-events-fix.json |
| 1.3 | 运行时异常簇(baba-is-you / four-pics-one-word / sliding-puzzle / liquid-connect) | playtest pageErrors 抓到的崩溃级异常 | Wave C 代理修复中(最小侵入 + 复跑验证) | pageErrors 归零 + 交互恢复证据 |
| 1.4 | solitaire | verify 需浏览器约定(当前 node 跑法误报) | 按 klondike 发牌确定性重写验证器(只诊断) | verify PASS 全关卡可解 |
| 1.5 | ~~2048/tetris/slope/bus-traffic-fever 音频/存档簇~~ 撤销 | 复核翻案(game.js 已有实现);仅余 tetris best 持久化 → 降 P2 | tetris localStorage best/level | 刷新后 best 保留 |

## P2 — 品质提升(次日批)

| # | 对象 | 方案 | 验收 |
|---|------|------|------|
| 2.1 | snake | 吃食渐进提速(每 5 食 +6%,封顶 2.2x)+ 高分段音效升调 | 曲线静态确认 + 冒烟复测 |
| 2.2 | gokigen-naname | 生成侧加非退化约束(禁全 '/' 解,斜线均衡) | 重跑 verify 全绿且解非退化 |
| 2.3 | 小众解谜引导(kojun/usotatami 等 P2-no-onboarding flag 游戏) | 首关规则一句话浮层(纯 CSS/JS,无新资源) | 静态扫描 tutorial 信号 + 冒烟复测 |
| 2.4 | suguru 每日生成器 | dig 后补唯一解重算(与主线同一 solver) | 每日题 1000 次采样全唯一解 |

## P3 — 观察项(不主动改)

- chess 对局中断续玩、bus-traffic-fever 关卡化(流量支撑后再议)
- 其余 90 款 3.5+ 游戏保持现状(改动风险 > 收益)

---

## 执行顺序与产出

1. **P0.1–0.3**(生成器已就绪/在跑)→ 替换 index.html 关卡数据 → 各自 verify 全绿 → analyze-curves PASS → before/after 证据归档
2. **P0.4–0.5** 引擎/数据手术 → verify 全绿 → 证据归档
3. **P1.1–1.5** 逐项修复 → Playwright 断言(audio 节点/localStorage/点击)→ 证据归档
4. 全量回归:smoke 重跑 452 + run-verifiers 全量 + score-games 重跑 + analyze-curves 全量
5. 收敛判定:全站 P0=0、P1=0、全部关卡有通关证据 → 输出 `final-report.md`(前后分对比 + 曲线 + 证据链 + 遗留 P2/P3)
6. `game-catalog.md` 状态列同步;git 本地提交(不 push,待用户验收)
