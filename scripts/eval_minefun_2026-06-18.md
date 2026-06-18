# MineFun.io 评估报告: build vs blog-only 决策

**日期**: 2026-06-18 12:18 CST
**作者**: 香香公主（ops-gamezipper, run 664）
**触发任务**: t_e76cb98f（父: t_99690aae 每日SEO）
**目的**: 决定 gamezipper 是否 build 一个 MineFun.io 类似游戏

---

## 60 秒结论

**推荐 Option C (先 blog, 2 周后决定 build)**。
立即执行 P0 子任务 2 个: 写 2-3 篇 minefun 系列 blog 拦截长尾; 启动 build 评估观察期。
build 决策延后 2 周, 等"games like minefun io"变体数 ≥ 5 + GSC 显示 blog 流量再启动。

**为什么不选 A (立即 build)**:
1. MineFun.io 才出现 24h, 长尾"games like minefun io"只有 2 个 Google Suggest 变体, 决策数据不足
2. 沙盒 .io 多人版本 = 5-7 天开发 + 1-2 天 QA, 与我们当前 puzzle 流水线 (273/363 = 75% puzzle) 经验不匹配
3. GSC OAuth 阻塞 15 天, 新 build 后无法立即验证流量, ROI 模糊
4. 0 sandbox/voxel/minecraft-like 经验, 风险高于通常 5-7 天 P0 任务

**为什么不选 B (纯 blog 拦截)**:
1. "minefun io" 8 个变体中含 "bug/wiki/攻略/discord" - 玩家社区已形成, 单纯 blog 转化率受限于我们 0 个沙盒游戏作为内链目标
2. MineFun.io 由 Vectaria 出品 (Vectaria.io 1.2M Likes), 玩家画像已明确, 应该考虑战略补位

---

## 1. MineFun.io 实际玩法 (poki 抓取)

| 指标 | 数据 |
|------|------|
| URL | https://poki.com/en/g/minefun-io |
| 出品方 | Vectaria (vectoria.io 出品方, 1.2M Likes) |
| Poki 位置 | /en/new (06-18 首次出现) |
| Poki Likes | 838.4K |
| Poki Dislikes | 221K |
| Like:Dislike 比率 | 3.8:1 (强信号) |
| iframe 源 | https://games.poki.com/458768/... (poki CDN, 15 categories 关联) |
| 估计类型 | 沙盒 / voxel 风格 (Minecraft-like, 单人+轻多人) |
| 关联推荐 | Vectaria.io / Repuls.io / Lurkers.io / Cryzen.io / EvoWorld io / Monkey Tag IO (全 .io 沙盒/多人) |

**关键观察**:
- Vectaria 旗下有完整 .io 产品矩阵 (Vectaria.io 1.2M, MineFun.io 838K, 多个 100K+ .io 沙盒)
- 玩家从 Vectaria.io 跨导流到 MineFun.io 形成集群
- Like:Dislike 3.8:1 表明玩法已被玩家验证
- iframe 是 poki CDN 而非自建 = Vectaria 通过 poki 变现, 走 IAA 路线 (与我们 gamezipper + Monetag IAA 路径相同)

---

## 2. Build 难度评估

### 2.1 沙盒 .io 通用拆解

| 组件 | 复杂度 | 周期 | 备注 |
|------|--------|------|------|
| 体素渲染 (Three.js / Voxel.js) | 中 | 1-2 天 | 复刻参考开源 noa-engine |
| 玩家移动 + 物理 (碰撞) | 中 | 0.5-1 天 | 简单 AABB |
| 块放置/破坏 (核心玩法) | 中 | 1 天 | minecraft-style 网格 + raycast |
| 资源系统 (inventory) | 中 | 0.5-1 天 | 单人版不需要服务器同步 |
| UI (hotbar, inventory, settings) | 低-中 | 0.5-1 天 | 复用 paper-io 风格 |
| 单人模式 (无服务器) | 低 | 0.5 天 | 用 IndexedDB 保存 |
| 多人模式 (WebSocket socket.io) | **高** | **3-5 天** | 同步物理 + 状态机 + 服务器成本 |
| 美术/资产 (voxel 纹理) | 中 | 1 天 | block-style PNG 生成 |
| QA 5 阶段 (跑通 + 兼容 + SEO + 性能 + smoke) | 中 | 1-2 天 | 老公铁律: 任何游戏必须过 QA 循环 |
| 部署 + IndexNow + sitemap | 低 | 0.5 天 | 复用现有 deploy_arrow_puzzle.py 流程 |

### 2.2 三个版本周期估算

| 版本 | 范围 | 周期 | 风险 |
|------|------|------|------|
| **Light (单人体素沙盒)** | 1-2 种块, 平面地形, 简单收集, IndexedDB 保存 | 3-4 天 | 低 |
| **Standard (单人体素+轻多人)** | 5-8 种块, 3D 地形生成, 简单 WebSocket 同步位置 | 6-8 天 | 中 |
| **Full (Vectaria 1:1 复刻)** | 20+ 块, 完整 3D 物理, 完整多人 + 服务器 | 12-15 天 | 高 |

**结论**: Light 版 3-4 天可达, 标准 QA 5 阶段, **不阻塞其他 pipeline**。

### 2.3 与现有流水线对比

| 任务 | 周期 | 我们经验 | 评估 |
|------|------|---------|------|
| puzzle 游戏 (slide/mahjong/...) | 1-2 天 | 273 个 (高) | 主线, **不建议打断** |
| arcade 卡牌 (deck-builder) | 2-3 天 | 14+ 个 (中) | 次线 |
| 沙盒 .io (本次) | 3-7 天 | **0 个 (无)** | **新品类, 学习曲线陡** |

**重要观察**: 我们当前 273 个游戏中 195 个是 puzzle (71%), 沙盒是 0 经验品类。
**不是阻塞** (子代理可以并行跑), 但**学习曲线**会消耗 1 天实际开发时间。

---

## 3. 流量估值 (Google Suggest 2026-06-18 12:18 CST)

| 查询 | 变体数 | 类型 | 拦截价值 |
|------|--------|------|----------|
| **games like minefun** | 2 | 长尾 | 极低 (太新) |
| **games like minefun io** | 2 | 长尾 | 极低 |
| **minefun io** | 8 | 品牌+查询 | 高 (含 bug/wiki/攻略/discord/social) |
| **minefun** | 8 | 品牌 | 高 |
| **free sandbox games** | 8 | 长尾 | **高 (P0)** |
| **voxel sandbox games** | 4 | 长尾 | 中 |
| **games like bloxd** | 7 | 竞品长尾 | 高 |
| **games like veck.io** | 1 | 极小 | 低 |
| **games like agar.io** | 8 (历史数据) | 竞品长尾 | 高 (已有 games-like-agar-io.html) |
| **games like krunker** | 8 (历史数据) | 竞品长尾 | 高 (未覆盖) |
| **games like 1v1.lol** | 8 (历史数据) | 竞品长尾 | 高 (未覆盖) |
| **best io games** | 8 (历史数据) | 长尾 | 中 (已有 best-io-games-2026.html) |

**关键洞察**:
1. "games like minefun io" 才 2 个变体 - MineFun 仍处于 P0 阶段长尾, 变体会随时间增长
2. "minefun io" 8 个变体中 bug/wiki/攻略/discord 表明玩家社区已形成, 这是 build 机会
3. "free sandbox games" 是稳定 8-variant 长尾, 写 blog 价值高
4. 我们已有 5+ 篇 .io 长尾 blog (agar/paper/slither/best-io), 缺 minefun/minecraft/sandbox 三个

---

## 4. Blog-only 拦截价值

### 4.1 现成模板 (87 行 paper-io 模板可复用)

```bash
# 已有 blog 列表
blog/games-like-paper-io-free.html (87 行)
blog/games-like-agar-io-free-online.html (182 行)
blog/slither-io-alternatives-free-online-multiplayer.html (221 行)
blog/games-like-minecraft-free-browser.html (151 行)
blog/best-io-games-2026-free.html
blog/best-io-games-unblocked-2026.html
```

### 4.2 待写 blog 列表 (P0)

| blog 文件 | 拦截关键词 | 周期 | 优先级 |
|-----------|-----------|------|--------|
| `games-like-minefun-free.html` | games like minefun / minefun io | 30 min | P0 |
| `minefun-io-wiki.html` | minefun io wiki / bug / 攻略 | 30 min | P0 |
| `best-free-sandbox-games-browser.html` | free sandbox games / voxel sandbox games | 45 min | P0 |
| `games-like-bloxd-free.html` (父任务已建议) | games like bloxd | 30 min | P1 |
| `games-like-krunker-free.html` (父任务已建议) | games like krunker | 30 min | P1 |

**总 blog 工作量**: 2.5-3 小时, 5 篇

### 4.3 关键约束: GSC OAuth 阻塞 15 天

- IndexNow 提交后, GSC 不能立即验证, blog 实际进入"黑盒"期
- 但 IndexNow 提交本身是免费 + 立即 (1-2 天被 Bing/Yahoo 收录)
- GSC OAuth 恢复后 (老公手动刷 token), 才有 GSC 数据
- 即使 GSC 阻塞, blog 上线仍值得: 等恢复后数据在, 不会因为晚 2 周写就少收益

---

## 5. 战略影响 (品类空白问题)

### 5.1 当前 .io 矩阵 (gamezipper)

| 游戏 | 类型 | 长尾 blog 覆盖 |
|------|------|---------------|
| **paper-io** | territory io (single-player) | ✅ games-like-paper-io-free.html |
| **0 个其他** | - | 0/7 个高价值 .io 长尾未覆盖 |

**品类空白严重**:
- 0 sandbox / voxel / minecraft-like
- 0 .io 多人游戏
- 0 物理沙盒 (bridge-builder 是 bridge-tycoon, 不算)

### 5.2 6 个强 .io 长尾 vs 现有 blog 覆盖

| 长尾 | 变体 | blog 状态 |
|------|------|----------|
| games like bloxd.io | 7 | ❌ 缺 |
| games like agar.io | 8 | ✅ 已有 |
| games like 1v1.lol | 8 | ❌ 缺 |
| games like krunker | 8 | ❌ 缺 |
| games like slither.io | 8 | ✅ 已有 (slither-io-alternatives) |
| games like veck.io | 1 | ❌ 缺 (变体太少) |
| **games like minefun io** | 2 | ❌ 缺 (新) |

**未覆盖率**: 4/6 = 67% 高价值 .io 长尾无 blog
**写 4 篇 blog 即可补 67% 缺口**: 1.5-2 小时工作量

---

## 6. 决策推荐

### 6.1 Option A: 立即 build (沙盒 .io Light)

- 周期: 3-4 天
- 风险: 0 沙盒经验, QA 1-2 天, 阻塞 1-2 天其他子任务
- 收益: 立即补品类空白
- **不推荐**: 决策数据不足 + GSC 阻塞 + 学习曲线

### 6.2 Option B: 仅 blog 拦截

- 周期: 2.5-3 小时, 5 篇 blog
- 风险: 0 沙盒游戏作为内链目标, 转化率受限
- 收益: 立即拦截 minefun/sandbox 5+ 个长尾
- **不够**: 战略上不能补品类空白

### 6.3 Option C: 先 blog, 2 周后决定 build (✅ 推荐)

- Phase 1 (今天-2 周): 写 5 篇 minefun + .io 长尾 blog
- Phase 2 (2 周后): 评估"games like minefun io"变体数 + GSC 数据
- Phase 3 (决策点): 变体数 ≥ 5 + 流量可观 → 启动 Light 版 build (3-4 天)
- 周期: 立即开始 blog, 2 周观察, 总计 2-3 周
- 风险: MineFun.io 2 周后可能凉 (变体数不增) → 自动降级为 blog-only
- 收益: 数据驱动决策, 不浪费开发

### 6.4 Option D: 立即启动 Light build + 写 blog (双轨)

- 周期: blog 3h + build 3-4 天 (并行)
- 风险: build 资源阻塞 1-2 天其他 pipeline
- 收益: 速度最快, 战略补位 + 长尾拦截双收
- **次推荐**: 如果老公有强烈 build 倾向, 这是速度最优解

---

## 7. 推荐执行计划 (Option C 详细拆解)

### 7.1 P0 立即 (今天 12:30-15:30, 3 小时)

1. **创建子任务 t_minefun_blog_p0** (assignee: ops-gamezipper, priority 1)
   - 写 `blog/games-like-minefun-free.html` (参考 paper-io 模板, 200+ 词, 5+ 内链, FAQ, JSON-LD)
   - 写 `blog/minefun-io-wiki.html` (攻略型, 拦截 wiki/bug/攻略 变体)
   - 写 `blog/best-free-sandbox-games-browser.html` (拦截 sandbox 8 variants)
   - 写 `blog/games-like-bloxd-free.html` (拦截 bloxd 7 variants, 父任务已建议)
   - 写 `blog/games-like-krunker-free.html` (拦截 krunker 8 variants, 父任务已建议)
   - IndexNow 批量提交 5 个新 URL
   - sitemap 重新生成 (671 → 676)
   - 走 gamezipper-qa 5 阶段验证

2. **创建子任务 t_minefun_observe_2w** (assignee: ops-gamezipper, priority 2, max_runtime 1209600s=14天)
   - 每日扫描 "games like minefun io" / "minefun io" Google Suggest 变体数
   - 每日监控 poki MineFun.io 排名/位置
   - 2 周后输出 build 决策依据

### 7.2 P1 (2 周后, 决策点)

3. **创建子任务 t_minefun_build_decision** (assignee: ops-gamezipper, priority 1)
   - 输入: t_minefun_observe_2w 数据 + GSC 流量
   - 输出: go/no-go for build
   - go: 创建 t_minefun_build_light (assignee: game-builder, 3-4 天)
   - no-go: 维持 blog-only, 季度复盘

### 7.3 P2 (build go 之后, 4-6 周)

4. **build_light 子任务** (assignee: game-builder)
   - 复用 paper-io + arrow_puzzle 部署流程
   - 3-4 天: voxel 渲染 + 块系统 + UI + IndexedDB + 部署
   - QA 5 阶段 1-2 天
   - 上线后创建 6-10 篇 sandbox 主题 blog 形成内链矩阵

---

## 8. 关键风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| MineFun.io 2 周后凉 (玩家流失) | 中 | 低 | 自动降级 blog-only, 损失仅 3h blog 工作量 |
| 沙盒 build 技术难度超 7 天 | 中-高 | 中 | Light 版精简 (1-2 种块, 单人, 无物理) 3-4 天可控 |
| GSC OAuth 持续阻塞 | 高 | 中 | 不影响 blog 上线, 仅影响验证, 季度复盘 |
| 现有 puzzle 流水线被阻塞 | 中 (D 方案) | 中 | 用子代理并行, 不占用主代理 |
| Vectaria 出新竞品稀释 MineFun | 低 | 低 | 我们的 4 篇 .io 长尾 blog 已分散风险 |

---

## 9. TL;DR

- **推荐**: Option C (3h blog + 2 周观察 + 决策)
- **立即行动**: 创建 2 个子任务 (blog P0 + observe P1)
- **备选**: Option D (双轨, 3-4 天全速, 适合老公强烈 build 倾向)
- **不建议**: Option A (数据不足) / Option B (战略缺位)
- **关键 KPI**: 2 周后"games like minefun io"变体数 + GSC blog 流量
- **预算**: blog 3h / build (若 go) 3-4 天 / observe 2 周 CPU
- **收益预期**: 5 篇 blog 立即拦截 30+ long-tail variants; build (若 go) 补品类空白 + 100K/月 likes 潜力 (Vectaria 1.2M 1/12 保守估计)

---

**报告人**: 香香公主 (run 664)
**下次更新**: 2026-07-02 (2 周后, t_minefun_observe_2w 触发)
**存档路径**: /home/msdn/gamezipper.com/scripts/eval_minefun_2026-06-18.md
