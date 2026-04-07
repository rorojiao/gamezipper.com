# 提交结果 2026-04-08

| 平台 | URL | 状态 | 备注 |
|------|-----|------|------|
| Ping-o-matic | http://pingomatic.com/ping/ | ✅ 成功 | HTTP 200，已ping多个搜索引擎 |
| Google Sitemap Ping | http://www.google.com/ping?sitemap=... | ❌ 失败 | HTTP 404，Google已关闭此接口 |
| Yandex IndexNow | https://yandex.com/indexnow | ✅ 成功 | HTTP 202 Accepted |
| Bing IndexNow | https://www.bing.com/indexnow | ❌ 失败 | HTTP 403（需验证key文件） |
| api.indexnow.org | https://api.indexnow.org/indexnow | ❌ 失败 | HTTP 403（需验证key文件） |
| Seznam IndexNow | https://search.seznam.cz/indexnow | ❌ 失败 | HTTP 403 |
| SubmitX.com | https://submitx.com/ | ⚠️ 需手动 | 表单需浏览器提交，有captcha可能 |
| itch.io | https://itch.io/game/new | ⚠️ 需手动 | 需注册账号 → Create a new project → 填写游戏信息 → 逐个游戏提交 |
| AlternativeTo | https://alternativeto.net/manage/new/ | ⚠️ 需手动 | 需注册账号，提交单个游戏或网站 |
| idev.games | https://idev.games/ | ⚠️ 需手动 | 独立游戏目录，需注册后提交游戏 |
| indiegames.press | https://indiegames.press/ | ⚠️ 需手动 | 有提交表单，需填写游戏信息 |
| Reddit r/webgames | — | 📝 已准备 | 见 reddit-final-posts.md，需手动发帖 |
| Reddit r/InternetIsBeautiful | — | 📝 已准备 | 见 reddit-final-posts.md，需手动发帖 |
| Reddit r/HTML5 | — | 📝 已准备 | 见 reddit-final-posts.md，需手动发帖 |
| Hacker News | — | 📝 已准备 | 见 hn-show-post.md，需手动发帖 |
| freewebdirectory.com.ar | https://freewebdirectory.com.ar/ | ⚠️ 需手动 | 有提交表单，需浏览器操作 |

## 自动成功提交（2个）
1. **Ping-o-matic** — 通知了 weblogs.com, blogs, technorati, feedburner 等15+服务
2. **Yandex IndexNow** — 202 Accepted，已提交主页和sitemap

## IndexNow 说明
Bing/Yandex/Seznam 共用 IndexNow 协议。需要在网站根目录放置 key 文件才能验证。
建议：创建 `https://gamezipper.com/gamezipper.txt` 内容为 `gamezipper`，然后重试 Bing IndexNow。

## itch.io 提交步骤
1. 注册 itch.io 账号（可用 Google 登录）
2. 进入 https://itch.io/game/new
3. 填写：游戏名称、描述、上传封面图、分类选 HTML5
4. 勾选 "This file will be played in the browser"
5. 设置为 HTML5 上传 zip 或嵌入外部 URL
6. 每个游戏需单独提交（40+个 = 大工程）
7. 替代方案：创建一个 "Game Collection" 页面

## 后续建议
1. **优先级高**：Reddit 发帖（流量最大）、HN Show HN
2. **SEO**：修复 IndexNow key 文件后重试 Bing 提交
3. **游戏平台**：itch.io 注册并提交（可获大量独立游戏玩家）
4. **更多目录**：dmoz 替代品如 jasminedirectory.com, blogarama.com
