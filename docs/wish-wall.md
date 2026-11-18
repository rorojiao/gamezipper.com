# GameZipper Wish Wall

唯一文档：心愿墙的产品入口、实际生产架构、运维与验收说明。版本历史由 Git 管理。

## 线上入口与当前状态

- 公开许愿墙：`https://gamezipper.com/wishes/`
- 管理收件箱：`https://gamezipper.com/admin/wishes/`
- API 健康检查：`https://wishes.gamezipper.com/api/health`
- 首页入口：首屏 `Request a Game`、主导航 `Wish Wall`、热门游戏后的社区横幅、页脚链接。
- 原 `/admin/` 面板也有 `Open Wish Inbox` 入口。
- 2026-11-18 已完成真实部署和线上闭环验收，测试愿望与测试投票均已删除。

玩家流程：填写游戏名/分类/可选昵称与理由 → 保存为待审核 → 管理员收到邮件 → 审核公开 → 其他玩家点赞 → 管理员标记已上线并填写游戏链接。无需玩家账号，不要求玩家邮箱，不生成虚假留言或虚假统计。

## 实际生产架构

```text
GitHub Pages（公开页/后台静态文件）
        │ HTTPS
        ▼
wishes.gamezipper.com（Cloudflare DNS + Tunnel）
        │
        ▼
CapRover 应用 wishes（Node 22，非 root 容器）
        ├─ worker/src/index.js：唯一 API 业务核心
        ├─ server/index.js：Node HTTP / SQLite / SMTP 适配
        ├─ named volume gamezipper-wishes-data → /app/server/data（SQLite 持久化）
        └─ Stalwart SMTP → 管理员通知邮箱
```

生产环境**不使用 D1、Workers KV 或 Resend**。`worker/` 是共享 API 核心和可选 Worker 运行入口，不是当前部署依赖。`server/` 复用同一核心，避免两套审核、投票、安全和邮件逻辑漂移。

公开列表使用 30 秒内存缓存，审核与票数变化最多有 30 秒展示延迟。SQLite 开启 WAL、外键与 busy timeout；数据库迁移在启动时自动执行。容器监听 80 端口，并通过 `cap_net_bind_service` 保持非 root 运行。

## 安全与隐私边界

- 管理密码只存在 CapRover 环境变量；仓库和前端没有硬编码密码。首次生成的独立密码已通过现有邮件系统发给管理员，聊天和文档均不记录明文。
- 登录成功后签发 8 小时 HMAC 会话，Cookie 为 `HttpOnly + Secure + SameSite=Strict`。退出登录清除浏览器 Cookie；已复制的无状态令牌最长可使用到原过期时间，轮换管理密码会使旧会话全部失效。
- CORS 仅允许 `WISH_ALLOWED_ORIGINS`；写请求校验 Origin；预检允许 `Content-Type, Cache-Control, Pragma`，覆盖硬刷新和 DevTools Disable cache。
- 标题、昵称和理由限制长度；拦截链接与邮箱；蜜罐、提交时长、IP 哈希限流；共享核心支持可选 Turnstile。
- 点赞按 IP 派生的 keyed hash 去重，不信任客户端生成的 voter ID。同一网络对同一愿望只能投一次，每小时投票请求限 10 次。原始 IP 不落库。
- 请求体按实际字节流限制为 16 KiB，不依赖可缺失的 Content-Length；转发头不能用于伪造限流身份。
- 公开响应不含邮件状态；待审核和隐藏内容不会出现在公共 API。
- 邮件先保存愿望再后台发送。SMTP 或邮件状态更新失败不会丢失愿望，后台可重试。
- 隐私政策已同步为 Cloudflare Tunnel、现有托管数据库和 Stalwart 邮件服务，不再写成 Resend。

## CapRover 生产配置

应用：`wishes`

持久卷：`gamezipper-wishes-data` → `/app/server/data`

敏感配置通过 CapRover 环境变量维护：

- `WISH_ADMIN_PASSWORD`：独立管理密码。
- `WISH_ALLOWED_ORIGINS`：`https://gamezipper.com,https://www.gamezipper.com`。
- `WISH_ADMIN_URL`：后台地址。
- `WISH_DB_PATH`：`/app/server/data/wishes.db`。
- `WISH_EMAIL_TO`：通知接收地址。
- `WISH_EMAIL_FROM`：已验证邮箱发件地址。
- `SMTP_HOST`、`SMTP_PORT`、`SMTP_USER`、`SMTP_PASS`、`SMTP_VERIFY_ON_START`。

不要把上述值写进 Git、tar 包、构建日志或聊天。`server/.env.example` 只有占位符。CapRover 构建时可能出现“env build-args were not consumed”的提示，这些是运行时环境变量而非 Docker build args，不影响运行。

## 更新部署

在包含 `captain-definition`、`server/`、`worker/` 的仓库根目录执行：

```bash
npm run test:wishes
tar --exclude='server/node_modules' --exclude='server/.env' \
  -czf /tmp/gamezipper-wishes.tar.gz captain-definition server worker
CAPROVER_URL=https://captain.gamezipper.com \
CAPROVER_APP=wishes \
CAPROVER_TAR_FILE=/tmp/gamezipper-wishes.tar.gz \
CAPROVER_PASSWORD='从凭证笔记读取，不要写入历史' \
npx caprover deploy
```

前端或后台静态文件变更后，推送 `main` 并运行 GitHub Actions `Deploy to GitHub Pages`。Cloudflare Tunnel 和 DNS 已配置 `wishes.gamezipper.com`，常规版本更新不需要重复修改。

部署后必须运行生产验收，而不是只看容器“Deployed successfully”：

```bash
WISH_TEST_ADMIN_PASSWORD='从安全来源读取' npm run test:wishes:production:api
WISH_TEST_ADMIN_PASSWORD='从安全来源读取' npm run test:wishes:production:ui
```

两个测试都会创建带唯一标题的测试愿望，并在成功后删除；失败时也会尝试清理。生产测试不要用于压测或高频循环。

## 本地 Node 运行

```bash
npm install
npm install --prefix server
WISH_ADMIN_PASSWORD=local-test-password \
WISH_ALLOWED_ORIGINS=http://127.0.0.1:8080,http://localhost:8080 \
WISH_DB_PATH=/tmp/gamezipper-wishes-local.db \
PORT=8787 HOST=127.0.0.1 \
node server/index.js

# 另一个终端，在仓库根目录：
python3 -m http.server 8080
```

打开 `http://127.0.0.1:8080/wishes/` 和 `http://127.0.0.1:8080/admin/wishes/`。本地页面自动使用当前主机名的 8787 端口，确保管理 Cookie 同站。未配置 SMTP 时，愿望仍保存，邮件状态为 `not_configured`。

## 验证命令

```bash
# UI、输入校验、安全、邮件转义、脚本语法；Playwright bundled Chromium 会显式关闭
npm run test:wishes

# 当前 Node + SQLite 适配的完整 API 生命周期（先启动本地服务）
npm run test:wishes:worker

# 线上真实 API + SMTP + 浏览器闭环
WISH_TEST_ADMIN_PASSWORD='从安全来源读取' npm run test:wishes:production:api
WISH_TEST_ADMIN_PASSWORD='从安全来源读取' npm run test:wishes:production:ui
```

2026-11-18 实际验收证据：

- 11/11 UI 与单元测试通过；Node + SQLite 完整生命周期通过。
- 线上 API 健康检查 200；CORS 硬刷新预检通过；缓存第二次请求为 HIT。
- 真实提交、SMTP `sent`、IMAP 收件箱完整主题匹配、审核、公开、点赞、重复点赞拦截、上线链接、隐藏、删除全部通过。
- 真实浏览器后台登录、邮件警告隐藏、硬刷新、移动端无横向溢出通过；页面脚本错误 0、API 5xx 0。
- 截图：`/tmp/opencode/live-wishes-desktop.png`、`live-wishes-mobile.png`、`live-wishes-admin.png`。

## 运维说明

- 邮件状态：`sent` 已发送、`failed` 可重试、`not_configured` 未配置、`pending` 正在处理。
- SQLite 备份：备份 CapRover named volume 中的 `wishes.db` 及 WAL 文件；恢复前先停止写入。删除愿望不可撤销，后台有确认。
- 清理：限流记录按 1% 请求概率删除过期项；点赞记录随愿望删除。
- 修改管理密码会同时改变会话和 IP/vote 哈希派生，旧限流与点赞去重记录不会沿用。
- 管理密码遗失时，从 CapRover 环境变量安全读取或轮换，不要从旧聊天、截图或 Git 历史寻找。
