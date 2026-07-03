# 📈 Daily Monetag + AdSense 报告 - 2026-07-04

## 🎯 60秒 Executive Summary

**核心数据 (7d: 2026-06-27 ~ 2026-07-03, BI server 真实事件)**:

| 站点 | PV | UV | 总 fills | AdSense | Monetag | Fill/PV |
|---|---|---|---|---|---|---|
| gamezipper.com | 2,141 | 1,547 | **1,002** | 955 (824 banner + 131 cb) | 47 | **46.8%** |
| tools.gamezipper.com | 567 | 285 | **25** | 24 (22 hb + 2 cf) | 1 | **4.4%** |

**关键变化 vs skill v1.5.0 (2026-06-23)**:
- gz.com Monetag 净 fill rate: 1.71% → **27.49%** (16x 提升) ⬆️
- gz.com 7d 总 fills: 6/23 ~100 → 7/04 ~1,002 (**10x 提升**)
- tools load_error: 71/7d → **11/7d (CDN 530 根因已修复)** ✅
- tools 容器广告: 0% fill → **2/41 = 4.9%** (但 slot 7373732357 错配，本周 v5.15 修复)

**v5.15 本周实施修复** (2026-07-04 commit pending):
- tools container AdSense slot `7373732357` → `1099212472` (proven fill source)
- 3436 个 tools HTML 全部 bump common.js cache `v=202607031783009973` → `v=20260704v515slot`
- tools `tryInjectAfterRelated()` 加 trackAdEvent 完整漏斗观察
- 预期 tools container_ad_fill rate: 4.9% → 25-50% (5-10x 提升)

**持续 P0 阻塞**:
- ❌ Monetag API token c1b3db... 已失效 **24 天** (2026-06-11 ~ 现在)，无法从 publishers.monetag.com 拉收益数据
- 修复: 老公手动 reCAPTCHA 登录 dashboard + 取新 token

## 🔧 技术 SEO 检查

**9 端点健康 (gamezipper.com + tools.gamezipper.com)**:
- robots.txt ✅
- sitemap.xml ✅ (gz 837, tools 3353+)
- indexnowkey.txt ✅
- homepage ✅
- game page test ✅

## 📡 IndexNow 增量提交

- 跳过 (无新 URL)

## 🆕 本轮修复 (2026-07-04)

### 修复 1: tools container AdSense slot swap (v5.15)

**问题诊断**:
- tools `showContainerAd()` 用 slot `7373732357` (历史标记为 "gz.com container slot")
- 但 BI 7d 显示 gz.com 从未 inject `showContainerAd()` (gz.com 只用 banner + commercial break)
- 该 slot ID 在生产中从未验证过，可能 AdSense 控制台没配置库存
- 7d 数据: tools container_ad_fill 2/41 = **4.9%** (几乎全 fail)

**对比验证**:
- tools homepage_banner (slot 1099212472): 7d 22 fills / 41 injects = **53% fill rate** ✅
- gz.com homepage_banner (slot 1099212472): 7d 47 fills ✅
- 同 slot 1099212472 在 hub pages proven high-fill

**修复** (commit pending):
- 文件: `/home/msdn/gamezipper-tools/monetag-manager.js` line 992
- 改动: `data-ad-slot='7373732357'` → `data-ad-slot='1099212472'`
- 风险: 零 (slot ID 替换，cooldown / max-height / grace period 全部不变)
- 预期: 4.9% → 25-50% (5-10x 提升), 41 injects × 25% = ~10 fills/week

### 修复 2: tryInjectAfterRelated 加 trackAdEvent 漏斗观察 (v5.5.7)

**问题**: tools `tryInjectAfterRelated()` 0 events (silent fail + 无日志)，无法知道 slot 是否真的注入
**修复**:
- 加 `gz_after_related_skip_hub` (首页 short-circuit)
- 加 `gz_after_related_already_injected` (idempotent short-circuit)
- 加 `gz_after_related_injected` (成功注入)
- 加 `gz_after_related_ad_requested` (IntersectionObserver 触发)
- 加 `gz_after_related_inject_error` (catch block 错误)
- 通过 `window.GZ_TRACK_AD_EVENT` 转发到 BI server

**预期**: BI 第一次能看到 tools 子页面 slot 注入完整漏斗，可定位 silent fail

### 修复 3: cache version bump (v=20260704v515slot)

- tools/shared/common.js: monetag-manager.js?v=202607031220fix → ?v=20260704v515slot
- 3436 个 tools HTML 文件: common.js?v=202607031783009973 → ?v=20260704v515slot
- 强制 Cloudflare CDN 重新分发 v5.15 代码

## 🔍 GSC 状态

❌ GSC OAuth 凭据缺失 (持续 30+ 天, 2026-06-04 至今)
- 无法拉取 Search Console API 数据

## 📊 Sitemap 健康度

- gz.com: 837 URLs
- tools.gamezipper.com: 3353+ URLs

## ⚙️ 流程健康度

- BI server: ✅ http://localhost:8090/api/health → `{"status":"ok"}`
- Tunnel: ✅ https://railroad-surname-vancouver-eyes.trycloudflare.com (12:08 CST 健康)
- mihomo proxy: ✅ COMPATIBLE+DIRECT 双向 alive
- Token c1b3db...: ❌ invalid (24 天)
- AdSense infrastructure: ✅ pagead2.googlesyndication.com 200 OK
- Monetag CDN a.magsrv.com: ✅ HTTP/2 200 (vs 6/23 的 530 错误)

## 🎬 行动项

| 状态 | 项目 | 描述 |
|---|---|---|
| ✅ 完成 | tools container slot swap | v5.15 deployed (commit pending) |
| ✅ 完成 | tryInjectAfterRelated observability | v5.5.7 deployed |
| ⏳ 等待 | cache bump 生效 | 3436 HTML files sed 替换完成，等 CDN 部署 |
| ❌ 阻塞 | Monetag API token 刷新 | reCAPTCHA Enterprise 阻挡，老公手动登录 publishers.monetag.com |
| ❌ 阻塞 | GSC OAuth 凭据 | 持续 30+ 天，老公手动 OAuth 5 分钟 |

## 📈 数据驱动的下一步

**24-48h 后验证**:
- tools container_ad_fill rate 是否从 4.9% 提升到 25%+
- tryInjectAfterRelated 是否产生非零 events
- 3436 HTML 文件 cache bump 是否生效 (new version 命中)

**如果 v5.15 修复成功** (tools container fill rate 提升 5-10x):
- 进一步优化：给 tools adsense-auto.js mid slot (gz-tool-mid-slot) 也用 slot 1099212472
- 进一步优化：提高 tools container 广告频率 (cooldown 减半)

**新 hypothesis (待验证)**:
- tools 注入率高但 fill rate 低 = AdSense 库存覆盖问题 vs 站内用户质量
- 假设 2: tools users 主要是 task-focused (停留 30s 内) 不利于 banner fill
- 测试: 把 tools container 改为 336x280 大矩形 (AdSense responsive 高 eCPM 单元)