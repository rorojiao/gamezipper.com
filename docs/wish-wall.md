# GameZipper Wish Wall

唯一文档：心愿墙的产品入口、架构、配置、部署与验收说明。版本历史由 Git 管理。

## 产品入口与流程

- 公开许愿墙：`https://gamezipper.com/wishes/`
- 管理收件箱：`https://gamezipper.com/admin/wishes/`（原 `/admin/` 面板也新增了入口）
- API：`https://wishes.gamezipper.com/api/`
- 首页入口：首屏 `Request a Game`、主导航 `Wish Wall`、热门游戏后的社区横幅、页脚链接。
- 玩家流程：填写游戏名/分类/可选昵称与理由 → 保存为待审核 → 管理员收到邮件 → 审核公开 → 其他玩家点赞 → 管理员标记已上线并填写游戏链接。
- 不收集玩家邮箱，不做虚假留言或虚假统计。待审核与隐藏内容永不出现在公开 API。

## 架构

主站继续使用 GitHub Pages。独立 Cloudflare Worker 提供同源站点的子域 API，Cloudflare D1 持久化数据，Resend 发送邮件。主站不需要迁移到 Vercel/Node 服务器。

```text
gamezipper.com/wishes/  ──HTTPS──>  wishes.gamezipper.com (Worker)
gamezipper.com/admin/wishes/              ├─ D1: wishes / wish_votes / wish_rate_limits
                                          ├─ Resend: new-wish email
                                          └─ optional Turnstile verification
```

安全边界：

- 管理密码仅存在 Worker secret；后台没有硬编码密码。登录成功后签发 8 小时 HMAC 会话，Cookie 为 `HttpOnly + Secure + SameSite=Strict`。
- CORS 只允许 `WISH_ALLOWED_ORIGINS`；所有写请求校验 Origin。
- 标题、昵称、理由有长度限制；拦截链接和邮箱；蜜罐、提交时长、IP 哈希限流；可选 Turnstile。
- 点赞按 IP 派生的 keyed hash 去重，不信任可伪造的浏览器 ID；同一网络对同一愿望只能投一次，且每小时投票请求限为 10 次。原始 IP 不落库，限流记录自动过期。共享网络可能共享去重边界，这不是账户级身份认证。
- 公开响应不含邮件状态；管理响应必须持有效会话。公开列表在 Worker Cache API 缓存 30 秒以降低 D1 读取成本，审核和票数变化最多可能有 30 秒展示延迟。
- 邮件先保存愿望再通过 `ctx.waitUntil` 后台发送，不阻塞玩家响应；失败可在后台重试，邮件或邮件状态更新故障都不会丢失愿望。
- 退出登录会清除当前浏览器 Cookie。无状态会话在其 8 小时有效期内仍可能被已复制的令牌使用；修改管理密码会立即使所有旧会话失效。

## 首次部署（需要管理员账号）

### 1. 创建并迁移 D1

```bash
npm install
npx wrangler login
npx wrangler d1 create gamezipper-wishes --config worker/wrangler.toml
```

将命令输出的真实 `database_id` 填入 `worker/wrangler.toml`，替换全零占位值，然后执行：

```bash
npm run worker:migrate:remote
```

### 2. 配置管理密码与 Resend

在 Resend 验证发件域名，取得 API key。以下命令会交互式读取 secret，不会把值写入仓库：

```bash
npx wrangler secret put WISH_ADMIN_PASSWORD --config worker/wrangler.toml
npx wrangler secret put RESEND_API_KEY --config worker/wrangler.toml
npx wrangler secret put WISH_EMAIL_TO --config worker/wrangler.toml
npx wrangler secret put WISH_EMAIL_FROM --config worker/wrangler.toml
```

- `WISH_ADMIN_PASSWORD`：使用密码管理器生成的独立长密码，不复用旧后台密码。
- `WISH_EMAIL_TO`：你的心愿通知收件邮箱；多个收件人可用英文逗号分隔。
- `WISH_EMAIL_FROM`：例如 `GameZipper Wishes <wishes@your-verified-domain.com>`，必须使用 Resend 已验证域名。

### 3. 可选：开启 Turnstile

1. 在 Cloudflare Turnstile 为 `gamezipper.com` 创建 widget。
2. 把公开 site key 写入 `worker/wrangler.toml` 的 `TURNSTILE_SITE_KEY`。
3. 保存服务端密钥：

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY --config worker/wrangler.toml
```

未配置时，仍有蜜罐、时长检查、内容校验和限流；公开流量增长后建议开启。

### 4. 部署 Worker 并绑定域名

```bash
npm run worker:deploy
```

在 Cloudflare Dashboard → Workers & Pages → `gamezipper-wishes` → Settings → Domains & Routes，添加 Custom Domain：

```text
wishes.gamezipper.com
```

前台与后台的 `gz-wish-api` meta 已指向这个域名。若改用其他域名，需要同时修改：

- `wishes/index.html`
- `admin/wishes/index.html`

最后验证：

```bash
curl https://wishes.gamezipper.com/api/health
curl https://wishes.gamezipper.com/api/wishes
```

打开 `/admin/wishes/` 登录，提交一条测试心愿，确认：收到邮件 → 审核公开 → 点赞 → 标记 `/2048/` 为已上线 → 公共墙出现 Play now。验证后删除测试心愿。

## 本地运行

1. 复制 `worker/.dev.vars`（此文件已被 Git 忽略）：

```bash
cp .env.example worker/.dev.vars
# 填入本地测试密码；邮件变量可留空，邮件状态会记录为 not_configured。
```

2. 如需浏览器联调，在 `worker/.dev.vars` 添加：

```text
WISH_ALLOWED_ORIGINS=https://gamezipper.com,http://127.0.0.1:8080,http://localhost:8080
```

3. 初始化本地 D1 并启动两个服务：

```bash
npm run worker:migrate:local
npm run worker:dev
# 另一个终端，在仓库根目录：
python3 -m http.server 8080
```

本地页面自动使用当前主机名的 `8787` 端口作为 API（例如 `http://127.0.0.1:8787`），确保管理会话在本地仍为同站 Cookie。打开 `http://127.0.0.1:8080/wishes/` 与 `http://127.0.0.1:8080/admin/wishes/`。

## 验证命令

```bash
# 输入校验、安全、邮件转义、入口与脚本语法 + 浏览器 UI（无外部浏览器实例）
npm run test:wishes

# 真实 Worker + 本地 D1 完整 API 生命周期（先启动本地 Worker）
npm run worker:migrate:local
npm run worker:dev
# 另一个终端：
npm run test:wishes:worker
```

UI 测试使用 Playwright bundled Chromium，测试结束会显式关闭浏览器；截图写入 `/tmp/opencode/`，不进入仓库。

## 运维说明

- 数据库备份：在 Cloudflare D1 控制台按账号策略配置时间点恢复/导出；删除愿望不可撤销，后台有确认。
- 邮件状态：`sent` 已发送、`failed` 可重试、`not_configured` 未配置、`pending` 刚创建尚未处理。
- 会话失效：修改 `WISH_ADMIN_PASSWORD` 会使所有既有管理会话失效，并改变 IP/vote 哈希派生。轮换密码前应注意旧限流和点赞去重记录不会沿用。
- 清理：限流记录按 1% 请求概率批量删除过期项；点赞去重记录随愿望删除，正常保留以维持同一网络对同一愿望的一票限制。
- 合规：隐私政策已说明用户主动提交内容、Cloudflare/Resend/Turnstile 和哈希反滥用处理。用户可申请删除自己的心愿。
