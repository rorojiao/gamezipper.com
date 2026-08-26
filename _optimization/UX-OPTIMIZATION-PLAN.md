# GameZipper 全站 UX 优化方案（书面落地计划）

> 版本 v1.0 · 制定: 2026-08-26 · 制定者: 游戏策划(QA侧) · 用户指令原文:
> "作为专业的游戏策划, 对全站以及所有的游戏进行一次全面的检查, 然后写一个详细的优化方案,
> 针对全站的交互、UI、新手引导、关卡数据等, 要一个书面落地的计划, 然后再完美的去执行这个计划, 覆盖率达到100%。"

## 0. 范围与覆盖口径

| 对象 | 数量 | 说明 |
|---|---|---|
| 游戏页 | 544 | 全部含 verify_engine.js 的游戏目录(453 目录内 + 91 隐藏真游戏), 无抽样 |
| 审计维度 | 6 | 新手引导 / 交互输入 / HUD 基础设施 / 视觉可读性 / 关卡难度结构 / 基础体验 |
| 覆盖判据 | 100% | 每款游戏×每维度均有审计结论(OK/缺失/待复核), 每个缺口要么修复要么书面豁免 |

## 1. 设计标准(分品类 UX 检查清单 — 审计与验收共用)

**全品类必备(P0)**
1. 新手引导: 首次进入 10 秒内能知道"这游戏是什么+怎么操作"(首访 how-to 覆盖层, 或游戏内可见的操作提示/帮助入口)
2. 输入可达: 触屏设备可完整操作(pointer/touch 事件, 不依赖 hover)

**品类差异标准**
- 解谜(puzzle, 240+): 关卡选择可见进度; 提示/undo 可选; 难度按梯度递增(30 关/5 梯度结构)
- 街机/技巧(arcade/racing, 60+): 即刻可玩(一键开始); 死亡→重开 ≤1 次点击; 前几关为教学难度
- 卡牌/字词(card/word, 40+): 规则随时可查(帮助入口常驻)
- 模拟/casual: 存档; 无软锁路径

**基础设施(P1/P2)**
3. 重开入口(P1): 任意游戏可 ≤1 次点击重开本关/本局(按钮或明确的键位)
4. 静音(P2): 有音频的游戏提供全局静音开关
5. 可读性(P2): 无 <10px 正文级文字; canvas 自适应视口
6. 站点壳层: 既有 site-check 9 项继续全绿

## 2. 审计方法(可复现)

工具 `_optimization/scripts/ux-audit.js`(已入库):
- **可见 DOM 提取**: 剥离 script/style/meta/schema 注释后做信号匹配 — 区分"游戏内真实引导 UI"与"SEO 文案"(避免 453 个 meta 命中误判)
- 信号集: helpUI/controlHint/firstRun/restart(文本+函数名+键位)/mute/levelSelect/hint/undo/touch/keys/storage/audio/canvasResponsive/tinyFont
- 难度数据: 从 verify evidence 提取每关解步数曲线(证据格式限制, 仅 1 款有可用曲线 — 见 §3.5 诚实说明)
- 产物: `_optimization/reports/ux-audit.json`(544 行×全维度)+ `/tmp/ux-lists.json`(缺口清单)

## 3. 审计结果(2026-08-26, 544/544 全覆盖)

### 3.1 总览
| 维度 | 有 | 缺 | 缺口等级 |
|---|---|---|---|
| 新手引导(helpUI 或 controlHint 或 firstRun) | 380 | **164** | **P0** |
| 触屏输入 | 450(+91 键盘可玩) | **3** | **P0** |
| 重开入口(文本/函数/键位) | 371 | **173** | P1 |
| 静音(有音频的 523 款中) | 180 | **343** | P2 |
| canvas 自适应 | 422(余为 DOM 游戏) | — | OK |
| 小字号(<10px, 含页脚/标签误报, 复核清单) | — | 317 | P2 复核 |
| 引导缺失品类分布 | puzzle 57, hidden 91, casual 2, arcade 8, word 1, racing 2, card 3 | | |

### 3.2 P0 清单要点
- **纯鼠标输入 3 款**: hexa-bridges, mosaic-master, star-loom → 改 pointer events
- **无引导 164 款**: 全部 91 款隐藏游戏 + 57 款解谜 + 16 款其他(全清单见 ux-audit.json)

### 3.3 P1 重开缺口 173 款(与 P0 集合部分重叠)

### 3.4 P2: 343 款有音频无静音; 317 款小字号复核清单

### 3.5 关卡难度 — 诚实说明
- verify evidence 证明"可解"但普遍不含每关步数曲线(544 款中 1 款有) — 数据源限制如实记录
- 替代口径: ① 目录游戏按"30 关/5 梯度"结构生成, 梯度序由生成器保证 → 抽查 30 款验证关卡数组梯度单调性; ② 战役期已知的玩家侧难度异常(woodoku 5 关无解已修、easy-as-abc 星级不可达已修、tower-defense L21+ 经济已调)均已闭环; ③ 剩余难度调优以 honest-FAIL 三款的关卡预算为观察点(非缺陷)

## 4. 落地方案(波次)

### W1 · P0 交互修复(3 款) — hexa-bridges/mosaic-master/star-loom
改 mousedown/mousemove → pointerdown/pointermove(保留语义), 每款过 verify_engine 门 + 触屏模拟冒烟。

### W2 · P0 新手引导系统(164 款) — 共享组件方案
**架构**(单文件+单行注入, 避免 164 处手工 HTML 改动):
1. 新建 `/gz-ux.js`: 首访引导覆盖层(localStorage 键 `gz-ux-onboarded-<slug>`):
   - 内容三段: 游戏名+一句话玩法(取自 games-data desc, 构建期内联进配置表) / 操作方式(自动探测: 触屏/键盘/鼠标) / 大号 "开始游戏" 按钮
   - 消失方式: 点击按钮/Enter/ESC → **节点整体 remove**(不留 pointer-events 隐患, 不 stopPropagation, 不拦截游戏自身启动)
   - 仅无自有引导的 164 款激活(配置表白名单), 350 款已有引导的不动
2. 注入脚本 `_optimization/scripts/inject-ux.js`: 在目标页 `</body>` 前插入 `<script src="/gz-ux.js?v=ux1"></script>`(幂等: 已含则跳过)
3. 91 款隐藏游戏不在 GAMES: 配置表用页面 `<title>` 生成通用文案
**验收**: ① 164 款 verify_engine 全部 PASS(引擎零干扰证明); ② site-check 全绿(新资产存在); ③ 抽样 20 款视觉冒烟(覆盖层出现+消失后游戏可交互)

### W3 · P1 重开入口(173 款) — 共享 HUD
gz-ux.js 追加: 右上角悬浮 ↻ 按钮(仅缺口名单激活):
- 有 `window.gzRestart()` 则调用; 否则 `location.reload()`(游戏有 localStorage 进档, 重开回到当前关)
- 视觉规范: 40px 圆钮, 半透明底, 不遮挡 HUD 主信息区(避开右上角前 120px — 多数游戏分数区)
**验收**: 同 W2 三项 + 抽样确认按钮不与游戏自有 UI 重叠

### W4 · P1 难度梯度抽查(30 款抽样→异常全修)
- 脚本提取关卡数组的规模指标(网格大小/箱数/线索密度), 验证梯度单调; 异常款重排序(关卡数据移动, 不改内容) + verify_engine 门
- 目录 desc 与实际机制不符的(抽查发现)修正文案

### W5 · P2 静音(343 款) — 共享按钮
gz-ux.js 追加 🔊/🔇 切换(仅音频缺口名单):
- HTMLAudio/Video: 遍历 muted + patch `HTMLMediaElement.prototype.play` 尊重全局标志
- WebAudio: patch AudioContext 构造器(静音态自动 suspend); 已建上下文的旧引擎覆盖不到 → 文档化残留
**验收**: 同 W2 + 3 款音频游戏实测静音生效

### W6 · P2 可读性复核(317 清单)
- 过滤误报(页脚/法务/标签文字非游戏 UI); 真实正文 <10px 的逐款修(≥12px)
- 复核后清单归档进 ux-audit 附录

### W7 · 终验 R7
- 544 款 verify_engine 全量回归(14 分块, 零新缺陷门)
- site-check 9 项 + rebuild-store 三方一致
- 改动面视觉复检(≥30 款抽样 + 视觉模型)
- 双副本协议: push 前 fetch, theirs-only 三集并集甄别(R5 教训)

## 5. 风险与回滚
| 风险 | 缓解 | 回滚 |
|---|---|---|
| 共享脚本干扰引擎(事件/启动) | 覆盖层 remove 而非 hide; 不 preventDefault; 白名单窄激活 | 删注入行(每页 1 行)即整体回滚 |
| 与对方副本 R5xx 管线冲突 | 注入标记 `?v=ux1` 可识别; 对方 sed 以注释锚点为目标时不撞行 | git revert |
| verify 翻转 | 每波次门禁: 触动款全跑, FAIL 即回退该款 | 单款回退 c843f079f43 式基线 |
| 静音 patch 影响引擎音频时序 | 仅 muted 属性与构造期 suspend, 不动 play() 调度 | 移除 W5 配置 |

## 6. 覆盖率追踪(执行后回填)
| 波次 | 对象数 | 修复数 | 豁免数(书面理由) | 验证 |
|---|---|---|---|---|
| W1 | 3 | (待填) | | verify+触屏冒烟 |
| W2 | 164 | (待填) | | verify×164+site-check+视觉20 |
| W3 | 173 | (待填) | | verify+抽样 |
| W4 | 30 抽样 | (待填) | | verify |
| W5 | 343 | (待填) | | verify+实测3 |
| W6 | 317 复核 | (待填) | | 视觉 |
| W7 | 544 | — | | 全量回归零新缺陷 |

## 7. 执行顺序
W1 → W2 → W3(与 W2 同一注入通道, 合并执行验证) → W4 → W5 → W6 → W7。全程证据入 `_optimization/reports/`, 每波次 git commit 一次。
