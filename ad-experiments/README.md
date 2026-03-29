# Monetag 广告模式实验方案

## 当前广告集成分析

### 现有架构
- **monetag-safe.js**: 游戏 page 延迟到 game-over 才加载 Monetag popunder；Hub page 立即加载
- **ad-interstitial.js**: Hub page 推荐栏（非广告，是游戏推荐）
- **zone216786**: gamezipper.com 的 Monetag zone
- **zone216916**: tools.gamezipper.com 的 Monetag zone
- **Google AdSense**: 首页有 adsbygoogle

### 问题
- 目前游戏页只有 popunder（game-over 后触发），收入模式单一
- 没有banner、插屏、原生广告等多样化广告形式
- 没有A/B测试框架，无法数据驱动优化

## 实验优先级排序

| 优先级 | 方案 | 预期收益 | 风险 | 实施难度 |
|--------|------|---------|------|---------|
| P0 | 游戏页底部固定banner | ⭐⭐⭐⭐ | 低 | 简单 |
| P1 | 关卡间插屏广告 | ⭐⭐⭐⭐⭐ | 中 | 中等 |
| P2 | 工具站结果页推荐区 | ⭐⭐⭐ | 低 | 简单 |
| P3 | 侧边栏原生广告 | ⭐⭐ | 低 | 中等 |
| P4 | Native push notification | ⭐⭐⭐ | 中 | 简单 |

## 实施计划
1. **第1天**: 部署A/B测试框架 + P0 banner实验（Snake游戏）
2. **第2天**: P1 插屏广告实验
3. **第3天**: P2 工具站推荐区
4. **第4天**: P3+P4 侧边栏+Push
5. **每步**: 跑完Playwright测试，观察48h数据，决定保留/回滚
