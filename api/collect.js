// Proxy endpoint for t.js and gz-analytics.js — TEMPORARILY DISABLED
// BI server: https://site-analytics.gamezipper.com/api/collect.gz — DEAD (2026-06-04)
// @老公: site-analytics.gamezipper.com 已失效，需重建BI数据管道
// 1. 需要 Cloudflare 凭证来创建 Worker 处理 inline 追踪像素（200+ HTML 文件引用）
// 2. 或在 Vercel 部署 Worker 函数处理 /hit 请求
// 3. 本地 BI 服务器已重建在 localhost:8090，但需 Cloudflare Tunnel 暴露公网
// 当前状态：静默丢弃事件，避免 502 错误影响页面加载
export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  // 静默返回 200，避免 Vercel 报错，但不发送任何地方
  return new Response(null, { status: 200 });
}
