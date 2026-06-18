# MineFun.io 2 周观察期报告 (2026-06-18 → 2026-07-02)

**任务**: t_25b55835
**报告生成**: 2026-06-18 12:35 CST (Day 1 baseline)
**作者**: 香香公主 (ops-gamezipper)
**目的**: 收集 build 决策依据

---

## 0. 60 秒结论 (Day 1)

**当前状态**: 观察期起点, 距离决策还有 13 天.

| 指标 | Day 1 实际 | 目标 (go) | 差距 | 趋势 |
|------|----------|----------|------|------|
| GS `games like minefun` 变体数 | **2** | >= 5 | -3 | [观察中] |
| MineFun.io Poki likes | **838.4K** | >= 1M | -161.6K | [观察中] |
| 5 篇 blog production HTTP 200 | **0/5** | 5/5 | -5 | pending push |
| GSC 数据 | **auth_required** | 5 URLs indexed | N/A | 老公需刷 token |
| IndexNow 提交 | ✅ 5 URLs (12:23) | 1× | done | done |

**决策建议 (Day 1)**: 数据不足以判断. 等待 7-14 天观察.

---

## 1. Google Suggest 变体数演化

| 日期 | Day | `games like minefun` | `games like minefun io` | `minefun io` | `minefun` |
|------|-----|---------------------|------------------------|-------------|-----------|
| 2026-06-18 | 1 | 2 | 1 | 8 | 8 |

### 1.1 Day 1 (2026-06-18) 原始数据

**`games like minefun`** (2):
1. games like minefun io
2. games like minefun

**`games like minefun io`** (1):
1. games like minefun io

**`minefun io`** (8):
1. minefun io
2. minefun io poki
3. minefun io social
4. minefun io game
5. minefun io 攻略
6. minefun io bug
7. minefun io wiki
8. minefun io zephron

**`minefun`** (8):
1. minefun
2. minefun io
3. minefun io poki
4. minefun io social
5. minefun space
6. minefun hacks
7. minefun sandbox
8. minefun.io discord

### 1.2 折线图占位 (Day 1 only)

```
games_like_minefun_count (target=5)
  5 |                    ___________
  4 |                  /
  3 |                /
  2 |______________/
  1 |
  0 +____________________________
    1   3   5   7   9   11  13
            Day
```

---

## 2. MineFun.io Poki 状态

| 日期 | Day | Likes | Dislikes | Ratio | /en/new | 开发者 |
|------|-----|-------|----------|-------|---------|--------|
| 2026-06-18 | 1 | 838.4K | 221.1K | 3.79 | ✅ | Vectaria |

**分类** (15): Adventure, Block, Platform, Zombie, Multiplayer, Shooting, Christmas, 3D, Halloween, **Minecraft**, Parkour, **.io**, Popular, Obby, Mobile, Difficult

**datePublished**: 2024-09-30 (poki 收录时间: 2026-06-18)

### 2.1 Likes 增长折线图占位 (Day 1 only)

```
Poki Likes (K, target=1000)
1000 |                  ___________
 900 |                /
 838 |______________/
 800 +____________________________
     1   3   5   7   9   11  13
             Day
```

---

## 3. GameZipper 5 篇 blog 收录状态

| URL | local HTTP 200 | prod HTTP 200 | Sitemap 收录 | GSC indexed | 流量 |
|-----|----------------|---------------|--------------|-------------|------|
| blog/games-like-minefun-free | ✅ | ❌ 404 | ✅ local | [pending] | [pending] |
| blog/minefun-io-wiki | ✅ | ❌ 404 | ✅ local | [pending] | [pending] |
| blog/best-free-sandbox-games-browser | ✅ | ❌ 404 | ✅ local | [pending] | [pending] |
| blog/games-like-bloxd-free | ✅ | ❌ 404 | ✅ local | [pending] | [pending] |
| blog/games-like-krunker-free | ✅ | ❌ 404 | ✅ local | [pending] | [pending] |

**关键观察**:
- 本地文件全部 HTTP 200, content/sitemap 正确 ✅
- Vercel production 0/5 HTTP 404, 部署 pending
- 阻塞: 36 commits ahead of origin/main, 老公需 push
- 5 篇 blog 一旦 push, 预计 2-3 天后被 Google 抓取, 1 周后 GSC 显示 impressions

---

## 4. GSC 数据 [pending 老公刷 token]

| URL | impressions | clicks | avg position | indexed |
|-----|-------------|--------|--------------|---------|
| [pending gsc.json] | - | - | - | - |

**状态**: GSC OAuth 阻塞 16+ 天, 老公手动刷 token 后才能验证 5 blog 流量.

---

## 5. 阻塞事项

1. **GSC OAuth 阻塞 16+ 天**: 缺 `/home/msdn/.openclaw/secrets/gsc.json` 和 `gsc-sa.json`. 老公手动刷 token → 解锁 5 blog 的 impressions/clicks 数据.
2. **Blog 部署 pending**: 36 commits ahead of origin/main. 5 篇 blog 无法在 production 被 Google 抓取.
3. **Tunnel watchdog 错误**: 当前 cloudflared tunnel 指向 port 8090 (gamezipper-bi), 应指向 gamezipper 主站. 老公修复 → 恢复 tunnel 健康监控.

---

## 6. Build 决策建议 (Day 1)

| 触发条件 | 当前 | 阈值 | 状态 |
|---------|------|------|------|
| GS 变体数 >= 5 | 2 | 5 | ❌ 缺口 3 |
| Poki likes >= 1M | 838.4K | 1M | ❌ 缺口 161.6K |
| Blog 有真实流量 | [pending] | >= 1 UV/day | ❌ [pending] |

**Day 1 建议**: 维持观察期, 等待 7-14 天. 暂不启动 build (t_minefun_build_light 推迟).

**再观察指标** (未来 13 天):
- GS 变体数是否增长 (目标: Day 7 >= 3, Day 14 >= 5)
- Poki likes 周增长 >= 30K (Day 14 >= 1M 是乐观估计)
- GSC 5 blog 收录后前 3 天的 impressions 是否 >= 10 (哪怕是低展现)

---

## 7. 后续追踪

- 父任务: t_e76cb98f (MineFun 评估 Option C)
- 父任务: t_0b52a163 (5 篇 blog P0 已写, 部署 pending)
- 同观察期: t_25b55835 (本任务, 14 天)
- 决策点: 2026-07-02 → t_minefun_build_decision
- 自动化: cron job `minefun-observe-daily` 每天 09:00 跑观察脚本


## Day 2 追加 (2026-06-19)

### Google Suggest
- `games like minefun`: 2 变体
- `games like minefun io`: 1 变体
- `minefun io`: 8 变体
- `minefun`: 8 变体

### Poki
- Likes: 838.3K
- Dislikes: 221.0K
- /en/new: N/A

### Blog
- Prod HTTP 200: 0/5
- Local HTTP 200: 5/5
- Deployment: PENDING_PUSH

### GSC
- auth_required
