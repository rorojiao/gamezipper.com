# Blog P0 MineFun 批量报告 (2026-06-18 12:25)

## 任务

执行 `eval_minefun_2026-06-18.md` 推荐 Option C Phase 1 — 写 5 篇 .io/sandbox 长尾 blog 拦截流量。

## 5 篇 blog 交付 (按优先级)

| # | 文件 | 词数 | 内部链接 | JSON-LD | FAQ | 状态 |
|---|------|------|----------|---------|-----|------|
| 1 | `blog/games-like-minefun-free.html` | 1370 | 10 | 3 (Article + FAQ + Breadcrumb) | 5 | ✅ |
| 2 | `blog/minefun-io-wiki.html` | 2138 | 5 | 4 (Article + FAQ + HowTo + Breadcrumb) | 5 | ✅ |
| 3 | `blog/best-free-sandbox-games-browser.html` | 1818 | 12 | 3 (Article + FAQ + Breadcrumb) | 6 | ✅ |
| 4 | `blog/games-like-bloxd-free.html` | 1377 | 10 | 3 (Article + FAQ + Breadcrumb) | 5 | ✅ |
| 5 | `blog/games-like-krunker-free.html` | 1463 | 10 | 3 (Article + FAQ + Breadcrumb) | 5 | ✅ |

**总词数**: 8166 词
**总 JSON-LD schema**: 16 个 (5 Article + 5 FAQ + 1 HowTo + 5 Breadcrumb)
**总 FAQ 问题**: 26 个
**每篇 blog 互链**: 4 个 (cross-link 矩阵)

## 5 阶段 QA 结果

| 阶段 | 检查项 | 结果 |
|------|--------|------|
| 1 | Sitemap 收录 5 个新 URL (sitemap.xml 671→679) | ✅ 通过 |
| 2 | JSON-LD schema 完整性 (Article+FAQ+Breadcrumb) | ✅ 通过 (wiki 多 1 个 HowTo) |
| 3 | 内部链接 5+ (游戏跳转) | ✅ 通过 (5-12 范围) |
| 4 | Assets (scripts/ad slot/monetag-manager) | ✅ 通过 (每篇 4-5 scripts + gz-ad-below-game) |
| 5 | Smoke (DOCTYPE/article/footer/html-close) | ✅ 通过 (5/5) |

**0 critical issues, 0 minor issues**

## 关键词拦截矩阵

| Blog | 拦截长尾词 | Google Suggest 变体数 |
|------|-----------|----------------------|
| games-like-minefun-free | games like minefun + games like minefun io | 2+2 = 4 |
| minefun-io-wiki | minefun io wiki/bug/攻略 (8 variants: bug, wiki, strategy, how to play, etc.) | 8 |
| best-free-sandbox-games-browser | free sandbox games + voxel sandbox games + browser sandbox | 8+4 = 12 |
| games-like-bloxd-free | games like bloxd + bloxd io alternative | 7 |
| games-like-krunker-free | games like krunker + krunker unblocked | 8 |

**总拦截变体数**: 39 个长尾搜索意图

## IndexNow 提交

- **API**: api.indexnow.org
- **方法**: POST + JSON
- **key**: gamezipper2026indexnow
- **HTTP 状态**: 200 ✅
- **提交数**: 5 URLs
- **日志**: `scripts/indexnow_submitted_2026-06-18_minefun.txt`

## 部署状态

- **本地分支**: v6.5-adsterra-on-v5.3 (本地领先 origin/main 13 commits)
- **5 篇 blog 已 commit**: ✅ (跨 be21981b1 + 87b0eba8b)
- **push 到 origin/main**: ⏳ 待主代理 push (按铁律子代理不 push)
- **Vercel 部署**: push 后自动触发
- **预计生效**: push 后 2-5 分钟

## 关联 commit

```
be21981b1 watchdog: tunnel URL rotated (含 blog/games-like-minefun-free.html)
87b0eba8b watchdog: tunnel URL rotated (含 blog/minefun-io-wiki.html + best-free-sandbox-games-browser.html + games-like-bloxd-free.html + games-like-krunker-free.html)
83345bd9e watchdog: tunnel URL rotated (含 sitemap.xml 679 + indexnow_latest.txt)
```

## 后续追踪

- 父任务 `t_e76cb98f` MineFun 评估推荐 Option C (blog+2周观察)
- 关联子任务 `t_25b55835` 2周观察 (监控 Google Suggest 变体/GSC 收录)
- 决策点: 2周后根据 GSC 收录+流量决定是否 build MineFun 完整版本

## 预期 ROI

- 单 blog 1300-2100 词,5 篇覆盖 39 个长尾变体
- 1 个月窗口预估: 5 篇合计 200-500 organic UV (保守)
- 3 个月窗口: 1000-3000 organic UV (基于 t_1dee8bc2 类似 batch 数据)
- eCPM 折算: 假设 $0.5 eCPM,月化 $1-15 收益
- 主要价值: 拦截"games like minefun io"/"free sandbox games"等高意图搜索流量
