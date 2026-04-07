# GameZipper 平台提交指南

> 生成时间：2026-04-08 | 目标：为 gamezipper.com 整理主流平台的提交流程

---

## 1. itch.io（独立游戏平台）

| 项目 | 详情 |
|------|------|
| **提交URL** | https://itch.io/game/new （登录后） |
| **需要账号** | ✅ 是（免费注册，支持 Google/GitHub 登录） |
| **费用** | 🆓 完全免费 |
| **预估审核时间** | ⏱️ 即时上线（无人工审核） |

### 步骤概要
1. 注册 itch.io 账号（https://itch.io/register）
2. 进入 Dashboard → **Create new project**
3. 填写游戏信息：
   - **Title**: GameZipper（或按单个游戏提交）
   - **Classification**: Game / Tool
   - **Kind of project**: HTML（嵌入 iframe 或上传 HTML5 zip）
   - **Cover image**: 630×500 推荐
   - **Screenshots**: 至少 3 张
   - **Description**: 详细介绍 + 标签
4. **Uploads**：上传 HTML5 zip 包或设置 **Embed URL** 指向 gamezipper.com
5. 设置 **Download / Purchase** 为 Free
6. 点击 **Publish** 即时上线

### ⚠️ 注意事项
- itch.io 主要面向**单游戏**提交，GameZipper 作为游戏合集站，建议：
  - 方案A：以 "Game Platform / Tool" 分类提交整个站
  - 方案B：挑选最热门的 2-3 个游戏单独提交，描述中带 GameZipper 链接
- 支持设置"可在线玩"（Play in browser），体验好

---

## 2. AlternativeTo.net（软件替代品推荐）

| 项目 | 详情 |
|------|------|
| **提交URL** | https://alternativeto.net/manage/new/ |
| **需要账号** | ✅ 是（免费注册） |
| **费用** | 🆓 完全免费 |
| **预估审核时间** | ⏱️ 1-7 天（社区审核） |

### 步骤概要
1. 注册账号（https://alternativeto.net/account/register/）
2. 点击 **Add New Application** 或直接访问提交URL
3. 填写信息：
   - **Name**: GameZipper
   - **Description**: 详细功能描述（英文）
   - **Platform**: Web / Online
   - **License**: Free
   - **Tags**: browser-games, html5-games, free-games, gaming-platform
   - **Alternative to**: Miniclip, CrazyGames, Poki 等
   - **Official Website**: https://gamezipper.com
   - **Screenshots**: 上传截图
4. 提交后等待社区投票和审核

### ⚠️ 注意事项
- AlternativeTo 核心是"XX 的替代品"，必须填写 **Alternative to** 字段
- 推荐作为 CrazyGames/Poki/Miniclip 的免费替代品
- 英文描述质量直接影响通过率
- 审核通过后会自动获得 SEO 反链

---

## 3. Product Hunt（产品发现平台）

| 项目 | 详情 |
|------|------|
| **提交URL** | https://www.producthunt.com/posts/new |
| **需要账号** | ✅ 是（支持 Twitter/Google/GitHub/Apple 登录） |
| **费用** | 🆓 完全免费 |
| **预估审核时间** | ⏱️ 当天上线（选 Launch Day 即时发布） |

### 步骤概要
1. 注册 Product Hunt 账号
2. 点击 **Submit / Launch** → **Create Post**
3. 填写信息：
   - **Product Name**: GameZipper
   - **Tagline**: 简短有力（如 "Free browser games, no download needed"）
   - **Description**: 详细介绍产品功能和价值
   - **Thumbnail**: 240×240
   - **Gallery**: 6-8 张截图或 GIF
   - **Website URL**: https://gamezipper.com
   - **Topics/Galleries**: Gaming, Browser Games, Entertainment
   - **Pricing**: Free
4. 选择 **Launch Date**（建议选周二到周四，流量最高）
5. 发布后：
   - 准备 First Comment 讲述开发故事
   - 在 Twitter/Reddit/HN 同步宣传，引导 upvote
   - 回复所有评论

### ⚠️ 注意事项
- **时机非常重要**：Product Hunt 按太平洋时间（UTC-8）计算，建议在前一天晚上准备好
- **周二-周四流量最高**，避免周末发布
- 需要**社区互动**：回复评论、感谢支持者
- 准备好 **Maker Comment**：讲述为什么做这个产品、技术亮点
- 如果能拿到 **Featured** 位，流量暴增
- Product Hunt 的 SEO 反链质量非常高（DA 90+）

---

## 综合对比

| 平台 | 自由度 | SEO价值 | 流量潜力 | 推荐优先级 |
|------|--------|---------|----------|------------|
| **itch.io** | ⭐⭐⭐⭐⭐ 即时发布 | ⭐⭐⭐ 中等 | ⭐⭐⭐ 游戏玩家 | 🥈 第二批 |
| **AlternativeTo** | ⭐⭐⭐ 需审核 | ⭐⭐⭐⭐ 高 | ⭐⭐⭐ 搜索流量 | 🥈 第二批 |
| **Product Hunt** | ⭐⭐⭐⭐ 即时发布 | ⭐⭐⭐⭐⭐ 极高 | ⭐⭐⭐⭐⭐ 爆发式 | 🥇 **最优先** |

### 推荐执行顺序
1. **Product Hunt** — 最大流量爆发，需要精心准备 Launch Day
2. **AlternativeTo** — 长期 SEO 反链，一次性提交
3. **itch.io** — 可多次提交（每个游戏一个页面），持续操作

---

## 当前提交状态

根据 `submission-log.md` 记录：
- ✅ 目录站草稿已准备（5 个目录站待手动提交）
- ✅ Reddit 推广草稿已准备
- ✅ 外链钩子文章已创建
- ❌ 本文件中的三个平台均**未提交**
- ⚠️ `web_fetch` 验证 gamezipper.com 受沙箱限制未完成（需主代理验证）

### 下一步行动
1. 主代理验证 gamezipper.com 站点可正常访问
2. 优先准备 Product Hunt Launch（准备素材：tagline、截图、maker story）
3. 提交 AlternativeTo（填 CrazyGames 替代品）
4. itch.io 上传 2-3 个热门单游戏
