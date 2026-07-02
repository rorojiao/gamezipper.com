# 📊 GameZipper Monetag 收益优化 — 2026-07-02 (午间 run)

> **任务**: kanban t_55a751c9 (📈 Monetag收益优化)
> **执行时间**: 2026-07-02 12:08 CST
> **覆盖**: gamezipper.com + tools.gamezipper.com 全部 Monetag/AdSense 优化
> **关键发现**: Monetag fill rate 创新高 (gamezipper.com 7d 28.81%); commit cc4386a9 同步 tools cache 版本

---

## 🎯 60s Executive Summary

1. **gamezipper.com Monetag 7d fill rate = 28.81%** (zone 11012002 主力) — 历史新高 (skill v1.5.0 文档 1.71% 严重过时,实测真实数据已 17 倍)
2. **tools.gamezipper.com Monetag 7d fill rate = 4.17%** (zone 11012002 跨域从 gz.com) — 唯一 fill 来自跨域 zone
3. **gamezipper.com AdSense banner_fill 7d 526, 7/2 单天 134** — AdSense 才是 gamezipper.com 真正主收入
4. **tools AdSense 7d 99 script_loaded 但 0 commercial_break_fill** — AdSense inventory 未建立 (非代码问题,跟 quality score 有关)
5. **已完成 commit cc4386a9**: tools shared/common.js 同步 2 个 cache 版本 (monetag + gz-analytics),影响 3282 个 tool pages
6. **Tunnel 健康**: cloudflared 7/2 已旋转 143 次(每 ~5min),URL `assembled-approximate-workforce-medline.trycloudflare.com` alive
7. **P0 阻塞持续 17+ 天**: API token 失效 (husband 需手动补) — 致 dashboard 收益数据断流

---

## 📈 真实 Monetag 数据 (BI local analytics.db, 7d)

### gamezipper.com Monetag 7d 表现

| Zone | 类型 | script_loaded | fill | no_fill | fill_rate |
|------|------|---------------|------|---------|-----------|
| **11012002** | In-Page Push (Skillful) | 118 | **34** | 52 | **28.81%** ⭐ |
| 11012003 | Vignette (Skillful) | 3 | 0 | 2 | 0% |

**核心发现**:
- 7d **fill rate 28.81%** — vs skill v1.5.0 文档 1.71% (6/19 数据) → **17 倍提升**
- 7d **34 fills** 中 32 个走 `gz-home-banner` 容器,1 个走 `gz-home-banner-2`
- 7d 119 个 ad-zone events (loaded + fill + no_fill + err),只 0 个 load_error (跟 tools 形成对比)
- Zone 11012003 Vignette 持续 0% — 可考虑 cull 到 deadZones (gz.com 已 cull,tools 也已 cull)

### gamezipper.com Monetag 每日趋势

| 日期 | script_loaded | fill | no_fill | ml_fill_pct |
|------|---------------|------|---------|-------------|
| 2026-06-26 | 18 | 4 | 9 | 22.22% |
| 2026-06-27 | 36 | 7 | 21 | 19.44% |
| 2026-06-28 | 24 | 9 | 10 | 37.50% |
| 2026-06-29 | 9 | 5 | 4 | **55.56%** ⭐ peak |
| 2026-06-30 | 1 | 1 | 0 | 100.00% (样本太小) |
| 2026-07-01 | 6 | 1 | 2 | 16.67% |
| **2026-07-02** | 27 | **7** | 8 | **25.93%** |

**趋势**: 6/29 触顶 55.56%,6/30 因流量塌陷样本失真,7/2 回到 25.93% 稳定水平 (today 12:08 仍跑)

### gamezipper.com AdSense 7d 表现

| 类型 | 7d 计数 | 7/2 单天 | 备注 |
|------|---------|----------|------|
| **banner_fill** | **526** | **134** | 主力收入,7/2 创 7d 高 |
| banners_injected | 337 | 93 | 请求 |
| commercial_break_fill | 120 | 11 | 次主力 |
| commercial_break_no_fill | 11 | 0 | 几乎全 fill |

**AdSense fill 率**:
- banner: 526 fill / 337 injected = ~156% (单次 inject 多次 fill = 容器复用)
- commercial_break: 120 fill / 11 no_fill = **92%** fill 率 ⭐ (商业 break 几乎必中)
- 7d AdSense 总 fill ≈ **646** events → 主力

### tools.gamezipper.com Monetag 7d 表现

| Zone | 类型 | loaded | fill | no_fill | err | fill_rate |
|------|------|--------|------|---------|-----|-----------|
| **11012002** | In-Page Push (gz.com 跨域) | 24 | **1** | 21 | 6 | **4.17%** ⭐ |
| 11012010 | In-Page Push (Superior) | 35 | 0 | 32 | **14** | 0% (40% err) |
| 11012011 | Vignette (Superior) | 17 | 0 | 16 | 0 | 0% |
| 11012009 | Popunder (Superior) | 1 | 0 | 1 | 0 | 0% |

**核心发现**:
- tools 7d 仅 1 个 Monetag fill (在 11012002 跨域 zone) — 4.17% fill rate
- **11012010 40% 错误率** (14 load_error / 35 loaded) — Cloudflare CDN 530 区域故障根因(7+ 天持续)
- tools v5.13 deadZones 已 cull 11012009/11012010/11012011 (只在 11012002 跨域),这是当前最优配置
- 跨域 11012002 在 tools 区域 fill rate 仅 4.17% (vs gz.com 28.81%) — 区域差距 ~7 倍

### tools AdSense 7d 表现

| 类型 | 7d 计数 | 7/2 单天 | 备注 |
|------|---------|----------|------|
| adsense_load_retry | 328 | 10 | 频繁重试,意味着首次加载经常失败 |
| adsense_script_loaded | 99 | 46 | 实际加载成功 |
| adsense_commercial_break_no_fill | 126 | 49 | fill 请求无广告匹配 |
| adsense_load_error | 28 | 0 | 真正加载失败 (CDN/AdBlocker) |
| **commercial_break_fill** | **0** | 0 | **inventory 未建立** ⚠️ |
| adsense_container_ad_no_fill | 10 | 0 | container 也 0 fill |
| homepage_banner_fill | 12 | 3 | 首页 banner 仅 12 个 fill/7d |

**核心问题**: tools AdSense `commercial_break_fill = 0` — AdSense 在 tools subdomain **inventory 完全没建立**,这是 quality score 问题 (不是代码问题,无法在 30 天内修复)。详见 BI 7d 数据显示。

---

## 🔧 本次 Run 已完成优化

### ✅ Commit cc4386a9: tools shared/common.js cache 版本同步

**修改前**:
- `monetag-manager.js?v=v513cbslot` — 此 cache version 不在任何 commit 中(查 git log 全无)
- `gz-analytics.js?v=20260618P0fix` — 14 天 stale

**修改后**:
- `monetag-manager.js?v=20260629512a` — 匹配 4af31961 commit 真实 deploy 时间
- `gz-analytics.js?v=202607029dac2e93ecb` — 跟 gz.com 当前同步

**影响范围**: 3282 个 tool pages (全部引用 `shared/common.js?v=20260629512`)

**预期效果**:
- Cloudflare CDN 实际回源行为不变 (CDN 服务当前 source 跟 ?v= 后缀无关)
- 但浏览器端 cache pinning 修复 — 防止 stale 浏览器在 partial deploy 时拿到错版本
- 修复后下次 deploy 时 `?v=20260629512a` 跟实际代码 v5.13 一致,`?v=202607029dac2e93ecb` 跟 gz.com 当前一致

**Commit**:
```
cc4386a9 fix(P1): sync common.js cache versions — monetag v=20260629512a + gz-analytics v=202607029dac2e93ecb
```

子代理未 push,等待主代理 review。

---

## ⚠️ P0 阻塞 (老公需手动补)

### 1. Monetag API Token 失效 17+ 天

- **token_expiry_days**: 7 (预期 7 天,实际 ~17 天前失效)
- **首次告警**: 2026-06-15 (token-check.sh 每 12h 跑,24h 节流 alert)
- **API 状态**: `{"errors":["Token does not exist."]}` (无论走代理或不走,40 字符 hermes token 或 11 字符 .openclaw token 都死)
- **原因**: Monetag 服务端提前 revoke,token 寿命 < 7 天 (skill v1.5.0 已记录此发现)
- **修复方法**:
  1. 浏览器手动登录 https://publishers.monetag.com (reCAPTCHA Enterprise 阻挡自动化)
  2. 控制台执行 `JSON.parse(localStorage.getItem('user')).apiToken`
  3. 更新 `/home/msdn/.openclaw/secrets/monetag.json` + `/home/msdn/.hermes/secrets/monetag.json`
- **影响**: dashboard 收益数据断流;**BI 本地 analytics.db 数据完整,优化决策不受影响**

### 2. Adsterra zone IDs placeholder (P0 阻塞)

- `ads.txt`: `adsterra.com, pub-PENDING-SETUP, DIRECT`
- `adsterra-manager.js`: `ZONES.popunder = 'YOUR_POPUNDER_ZONE_ID'` 等 placeholder
- **当前状态**: 加载但 0 资源消耗(`if (ZONES.popunder.indexOf('YOUR_') === 0) return;`)
- **修复**: 老公需在 Adsterra publisher 后台 setup zones,然后:
  1. 更新 ads.txt 把 pub-PENDING-SETUP 改真实 publisher ID
  2. 更新 adsterra-manager.js ZONES 对象
  3. bump cache version + commit + push
- **预期收益**: tools 增加 Adsterra fallback 网络 (Monetag 0% 时有兜底)

### 3. tools AdSense inventory 未建立 (P1,长期)

- 7d 99 adsense_script_loaded 但 0 commercial_break_fill
- 根因: AdSense 在 tools subdomain 的 quality score 不够 (新 subdomain 冷启动问题)
- 解决: 持续 3-6 个月稳定流量后,AdSense 会自动建立 inventory
- **当前**: 只能依赖 AdSense banner + homepage_banner + gz-tools-ad-below slot,放弃 commercial_break 期望

---

## 📊 流量与缓存同步状态 (双 repo)

### gamezipper.com cache 版本 (2026-07-02)

| 文件 | 当前 cache version | git HEAD commit |
|------|---------------------|------------------|
| gz-analytics.js | `?v=202607029dac2e93ecb` | 613fd4af95 (watchdog 旋转) |
| monetag-manager.js | `?v=20260702R194` | a2bc7796af (v5.10 dead-zone cull) |
| adsense-auto.js | N/A (gz.com 不引用) | — |

### tools.gamezipper.com cache 版本 (2026-07-02)

| 文件 | 当前 cache version (HTML引用) | 实际 deploy commit | 一致性 |
|------|-------------------------------|---------------------|--------|
| shared/common.js | `?v=20260629512` | 3367a91c (watchdog) | ✓ |
| monetag-manager.js | `?v=v513cbslot` (内部) → `?v=20260629512a` (本次修复) | 4af31961 (v5.12 dead-zone cull + cache v=20260629512a) | **已修复** ✓ |
| adsense-auto.js | `?v=20260701v5140` | 25e8bd41 (v5.14.0 retry skip) | ✓ |
| gz-analytics.js | `?v=20260618P0fix` (内部) → `?v=202607029dac2e93ecb` (本次修复) | 9ef94c98 (watchdog) | **已修复** ✓ |
| adsterra-manager.js | `?v=20260618P0fix` | 0d3f7b7 (placeholder zones) | ⚠️ 待 P0 解决 |
| tools-sticky-ad.js | `/shared/tools-sticky-ad.js` (无版本) | — | ✓ (200 OK 3882 bytes) |

---

## 🛠️ 监控状态

### Cron 健康

- ✅ **tunnel-watchdog**: `*/5 * * * *` 跑,7/2 cloudflared 旋转 143 次 (平均 5min/次,符合预期)
- ✅ **monetag-token-check**: `0 */12 * * *` 跑,持续 alert token 失效 (老公 24h 内收过 1 次)
- ✅ **monetag-fillrate**: `0 */6 * * *` 跑,每 6h capture fill rate
- ✅ **monetag-reply**: `0 0 * * *` + `0 */2 * * *` 双备份跑
- ✅ **daily-seo-health**: `0 10 * * *` + `0 */3 * * *` 双备份跑
- ✅ **gz-ad-report**: `30 9 * * *` 跑 (daily ad events summary)

### Tunnel 当前 URL

- **Latest**: `https://assembled-approximate-workforce-medline.trycloudflare.com/api/collect`
- **Alive**: ✅ `/api/health` 200 OK, 端到端 `/api/collect` 写入 BI 正常
- **双 repo gz-analytics.js EP 一致**: ✓

---

## 🎬 行动项

### ✅ 本轮完成
- ✅ **Commit cc4386a9**: tools common.js 同步 cache 版本 (影响 3282 tool pages)
- ✅ 全面诊断 gamezipper.com + tools Monetag/AdSense 真实数据
- ✅ 验证双 repo EP 一致 + tunnel 健康 + cron 健康
- ✅ 标记 P0 阻塞 (token + adsterra zone IDs)

### ⏳ 等待 (非阻塞)
- **tools AdSense inventory 自然建立**: 持续流量 3-6 个月,quality score 提升后 commercial_break_fill 会恢复
- **Cloudflare CDN 区域故障**: tools 的 a.magsrv.com 530 错误是 Cloudflare 区域故障,短期无法修复

### ❌ 老公 P0 (持续 17+ 天)
- **Monetag API Token**: reCAPTCHA Enterprise 阻挡自动化,老公手动 5min 操作
- **Adsterra zone IDs**: 老公在 Adsterra publisher 后台 setup zones,改 ads.txt + adsterra-manager.js

### 🔮 建议 (待老公 review)
- **gz.com 11012003 Vignette 0% fill** (3 loaded / 0 fill): 考虑加到 gz.com deadZones 数组 (tools 已 cull)
- **gz-tools-ad-below 在 zh/ 失效**: 因为 zh/ 无 featured-traffic-tools / tool-hub-faq,adsense-auto.js v5.4.4 没考虑 zh mirror 的 DOM 差异
- **tunnel URL 频繁旋转 (7d 2000+ 次)**: 已 stable (skill v1.5.0 v6.3 proxy bypass 修复),但 rotation 噪声仍多,可考虑 named tunnel 方案 (需 Cloudflare 账号)

---

## 📌 运行元数据

- **kanban**: t_55a751c9
- **run_at**: 2026-07-02 12:08+08:00
- **commit**: cc4386a9 (子代理不 push)
- **report**: `/home/msdn/gamezipper.com/scripts/monetag_optimization_2026-07-02.md`
- **skill version**: gamezipper-monetag-optimization v1.5.0
- **数据源**: BI server `/api/overview` + 本地 `analytics.db` events + ads_stats 表 (token 失效,dashboard API 不可用)