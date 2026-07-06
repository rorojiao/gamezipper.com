# GameZipper 全站广告方案 v1.0
## 基于 Poki.com 模式 + 行业最佳实践 + 三平台协同

> 调研日期: 2026-07-06 | 网站规模: 578 个游戏页面 | 7 日 UV: 2,850 | 7 日 PV: 3,705

---

## 一、调研结论

### 1.1 Poki.com 模式分析（行业标杆）

Poki 是全球最大的 H5 游戏平台（月 10 亿+ 次游戏启动），其核心广告策略：

| 策略 | 实现方式 | 效果 |
|------|---------|------|
| **Rewarded Video 为主** | 玩家主动选择看广告换取奖励（复活、跳关、提示、倍数金币） | 占休闲游戏收入 39%，iOS eCPM 同比 +18% |
| **Interstitial 为辅** | 自然过渡点插入全屏广告（关卡间、游戏结束、模式切换） | 同比 +15%，休闲游戏中占收入 44% |
| **广告频率：Call Often, System Decides** | 游戏频繁调用广告 API，由系统决定是否真正展示（cooldown + 上限保护） | 用户无感知频率压力 |
| **绝不阻塞核心玩法** | Rewarded 永远是可选的；Interstitial 只在自然 break 点出现 | 保持用户信任和留存 |
| **纯广告变现** | 无 IAP、无付费墙，100% 广告收入 | 降低用户进入门槛 |

**关键洞察**: Poki 不用 Popunder（弹窗广告）——因为弹窗会破坏用户体验和信任。Poki 也不用 Social Bar——保持页面干净。

### 1.2 行业数据 (2025 H1 TopOn 报告)

| 广告格式 | 收入占比 | eCPM 趋势 | 适用场景 |
|---------|---------|----------|---------|
| Rewarded Video | 39% (休闲) / 50%+ (中重度) | iOS +18% YoY | 高参与度、用户主动触发 |
| Interstitial | 44% (休闲) | +15% YoY | 关卡间、自然 break |
| Banner | 10-15% | 稳定但低 | 持续曝光、底部/顶部 |
| Native | 5-10% | 稳定 | 内容流嵌入 |

### 1.3 Adsterra 格式分析

| 格式 | UX 影响 | 预估 RPM | GameZipper 适用度 |
|------|--------|---------|------------------|
| **Popunder** | 高（后台弹窗，用户切换标签才看到） | $3-5 | ⚠️ 中——频率 1 次/20 分钟/用户 |
| **Social Bar** | 中（页面内通知样式） | $2-3 | ✅ 好——通知样式不挡游戏 |
| **In-Page Push** | 中低（页面内推送，类似浏览器推送） | $2-4 | ✅ 好——Adsterra 最有效格式，CTR 15-33% |
| **Interstitial/Vignette** | 高（全屏覆盖） | $3-5 | ✅ 好——关卡间自然过渡 |
| **Native Banner** | 低（融入内容） | $1-2 | ✅ 好——首页/分类页 |
| **Banner** | 低（标准展示） | $0.5-1.5 | ✅ 好——底部/侧边稳定收入 |

---

## 二、GameZipper 现状审计

### 2.1 当前广告栈

| 平台 | 状态 | 配置 | 7 日表现 |
|------|------|------|---------|
| **Google AdSense** | ✅ 运行中 | pub-8346383990981353，全站 578 页 | banner_fill: 1,124 / commercial_break_fill: 170 / no_fill: 277 |
| **Monetag** | ⚠️ 部分运行 | zone 11012002 (In-Page Push) 唯一存活 zone | fill: 75 / no_fill: 108 (41% fill rate) |
| **Adsterra** | ❌ 未激活 | pub-PENDING-SETUP，全 placeholder | 0 展示 |

### 2.2 现有架构

```
monetag-manager.js v5.11 (100KB):
├── Tier 1: AdSense (主) — banner + commercial break
├── Tier 2: Monetag (备) — In-Page Push zone 11012002
├── Tier 3: Commercial break fallback — Monetag inpagePush
├── Tier 4: Adsterra (预留) — enabled=false
├── Frequency cap: Per-zone exponential backoff (10→30→60min)
├── Dead zone culling: 11012003/09/10/11 已禁用 (0% fill)
└── GZ Analytics 事件追踪

adsterra-manager.js (placeholder):
├── Popunder (with 20min cooldown + BroadcastChannel sync)
├── In-Page Push
├── Container Ad (banner)
├── Interstitial
└── Social Bar
```

### 2.3 问题诊断

1. **AdSense fill rate ~58%** (170 fill / 447 total commercial break) —— 大量广告位空置
2. **Monetag 仅 1 个 zone 存活** —— 其他 4 个 zone 0% fill 被 cull
3. **无 Rewarded Video** —— 错过行业最高 eCPM 格式
4. **无 Adsterra** —— 单一渠道依赖风险
5. **首屏广告位** —— `#gz-ad-mid-grid` 100px 高的空 div（fill 率极低）

---

## 三、全面广告设计方案

### 3.1 分层广告架构（三层瀑布流 + 格式分层）

```
┌─────────────────────────────────────────────────┐
│  Layer 1: 稳定基线 (100% 页面覆盖)              │
│  ├── AdSense Responsive Banner (顶部 + 底部)     │
│  └── Adsterra Native Banner (中间内容区)         │
│  → 预期 RPM: $0.8-1.5                            │
├─────────────────────────────────────────────────┤
│  Layer 2: 商业插播 (Commercial Break)           │
│  ├── 关卡间: AdSense Interstitial → Monetag     │
│  │   In-Page Push → Adsterra Vignette           │
│  ├── 游戏结束: AdSense → Adsterra Interstitial  │
│  └── 首次点击: Popunder (Adsterra, 1次/20min)   │
│  → 预期 RPM: $2-4                                │
├─────────────────────────────────────────────────┤
│  Layer 3: 高参与度 (Opt-in Rewarded Video)      │
│  ├── 暂无（需集成 Google AdMob Rewarded 或       │
│  │   Adsterra Rewarded Video，需游戏引擎支持）    │
│  └── 短期用 Adsterra Social Bar 替代             │
│  → 预期 RPM: $3-8                                │
└─────────────────────────────────────────────────┘

目标混合 RPM: $1.5-3.0 (基于 2850 UV/7d = ~407 UV/d)
日收入预估: $0.6 - $1.2 (初期) → $2-5 (优化后)
```

### 3.2 Adsterra 广告格式推荐（适配 GameZipper）

| 优先级 | 格式 | 创建数量 | 用途 | 频率限制 |
|-------|------|---------|------|---------|
| **P0** | **Popunder** | 1 zone (gz.com) + 1 zone (tools) | 用户首次点击触发，20min/次/用户 | 1 次/20min, 最多 3 次/会话 |
| **P1** | **In-Page Push** | 1 zone (gz.com) + 1 zone (tools) | 页面内推送通知样式，高 CTR | 页面加载后 3-5s 延迟显示 |
| **P1** | **Vignette (Interstitial)** | 1 zone (gz.com) + 1 zone (tools) | 关卡间全屏广告 | 关卡间自然 break，AdSense miss 后触发 |
| **P2** | **Social Bar** | 1 zone (共享) | 页面角通知样式 | 低频，1 次/页面 |
| **P2** | **Native Banner** | 1 zone (共享) | 首页/分类页中间内容区 | 静态展示 |

**合计需要创建**: gz.com 4 个 zone + tools 2 个 zone = 6 个 zone

### 3.3 广告位置规划（对标 Poki）

```
gamezipper.com 首页 (/)
┌──────────────────────────────────────┐
│ [AdSense Banner 728x90]  ← 顶部横幅  │
├──────────────────────────────────────┤
│  Game Grid                           │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐               │
│  │G1│ │G2│ │G3│ │G4│  游戏卡片      │
│  └──┘ └──┘ └──┘ └──┘               │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐               │
│  │G5│ │G6│ │G7│ │G8│               │
│  └──┘ └──┘ └──┘ └──┘               │
│ [Adsterra Native Banner] ← 中间原生 │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐               │
│  │G9│ │..│ │..│ │..│               │
│  └──┘ └──┘ └──┘ └──┘               │
├──────────────────────────────────────┤
│ [AdSense Banner 728x90]  ← 底部横幅  │
└──────────────────────────────────────┘

游戏页面 (/2048/ 等)
┌──────────────────────────────────────┐
│ [AdSense Banner] ← 游戏上方          │
├──────────────────────────────────────┤
│                                      │
│        ╔══════════════════╗          │
│        ║                  ║          │
│        ║   GAME CANVAS    ║          │
│        ║                  ║          │
│        ╚══════════════════╝          │
│                                      │
├──────────────────────────────────────┤
│ [Monetag In-Page Push / Adsterra]    │ ← 游戏下方
├──────────────────────────────────────┤
│ Commercial Break (关卡间触发):       │
│   AdSense → Monetag → Adsterra      │ ← 三层瀑布
│                                      │
│ Popunder: 首次点击触发 (20min cap)  │ ← Adsterra
└──────────────────────────────────────┘
```

### 3.4 三平台分工

| 平台 | 角色 | 格式 | 激活条件 |
|------|------|------|---------|
| **Google AdSense** | 主力 (Tier 1) | Banner + Commercial Break Interstitial | ✅ 已激活 |
| **Monetag** | 备用 (Tier 2) | In-Page Push (zone 11012002) | ✅ 已激活 |
| **Adsterra** | 补充 (Tier 3-4) | Popunder + Vignette + Social Bar + Native | ⏳ 等 API token |

### 3.5 Adsterra 激活后的完整瀑布流

```
Commercial Break (关卡间):
  1. AdSense Interstitial (2.5s 等待)
  2. → miss → Monetag In-Page Push zone 11012002 (2s)
  3. → miss → Adsterra Vignette (5s)
  4. → miss → 无广告（记录 no_fill）

Banner 位:
  1. AdSense Responsive Banner (主)
  2. → miss → Adsterra Native Banner (备用)

首次点击:
  → Adsterra Popunder (20min/用户 cap, BroadcastChannel 同步)

页面加载 5s 后:
  → Adsterra Social Bar (通知样式，低频)
```

---

## 四、实施计划

### Phase 1: Adsterra 激活（当前阻塞——需 API token）

```
老公操作:
  1. 登录 publishers.adsterra.com
  2. Dashboard → API → GENERATE NEW TOKEN
  3. 把 token 发给我

我自动完成:
  adsterra-api-deploy <TOKEN>
  → 自动 fetch zones → 运行 setup-adsterra.sh → commit → push
  → CDN 4h 全量生效
```

### Phase 2: 首屏广告位修复

```
当前: #gz-ad-mid-grid 100px 空 div (fill 率极低)
修复: 替换为 Adsterra Native Banner (higher fill + higher eCPM)
状态: 代码已预留，等 Adsterra zone IDs
```

### Phase 3: Rewarded Video 接入（中长期）

```
Poki 模式: 玩家主动看广告换奖励
方案 A: Google AdMob Rewarded (需 GPT tag 升级)
方案 B: Adsterra Rewarded Video (如果支持)
优先在 puzzle 类游戏（hint/skip）和 arcade 类（revive）接入
```

### Phase 4: 频率优化 + A/B 测试

```
- AdSense vs Adsterra fill rate A/B (各 50% 流量)
- Popunder 频率: 20min → 30min → 测试跳出率
- Commercial break cooldown: 60s → 90s → 测试 session length
- Monitor: BI events + GSC 跳出率 + Core Web Vitals
```

---

## 五、预期收益模型

| 指标 | 当前 (AdSense only) | Phase 1 后 (+Adsterra) | Phase 3 后 (+Rewarded) |
|------|--------------------|-----------------------|----------------------|
| 日 UV | ~407 | ~407 | ~407 |
| Fill Rate | ~58% | ~75-85% | ~85-95% |
| 混合 RPM | $0.3-0.5 | $1.0-2.0 | $1.5-3.0 |
| 日收入 | $0.12-0.20 | $0.40-0.80 | $0.60-1.20 |
| 月收入 | $4-6 | $12-24 | $18-36 |

> 注: 当前 AdSense 7d 仅 170 次 commercial_break_fill，说明大部分广告位空置。加入 Adsterra 后 fill rate 大幅提升是主要增长动力。

---

## 六、风险控制

| 风险 | 缓解措施 |
|------|---------|
| Popunder 影响用户体验 | 严格 20min/用户 cap + BroadcastChannel 多标签同步 |
| Adsterra 广告质量 | 监控 BI 事件 + 用户反馈；定期检查 Adsterra dashboard |
| Core Web Vitals 下降 | 所有广告 async load + 延迟加载 + saveData 模式跳过 |
| AdSense 政策违规 | Adsterra 作为 Tier 3/4 备用，不与 AdSense 直接竞争同一展示位 |
| Adblock 用户 | Monetag/Adsterra 自带 anti-adblock 绕过能力 |

---

*方案文档完成。等老公提供 Adsterra API token 后，一键部署。*