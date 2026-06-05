# Adsterra 接入方案

## 背景
Monetag Fill Rate 从 2026-03-13 起归零（账号级别限制），需要 Adsterra 作为备选广告网络。

## Adsterra 账号信息
- 状态：待注册
- 注册地址：https://www.adsterra.com
- 注册时选择网站类型：**Game**
- 网站URL：gamezipper.com

## 接入步骤

### 第一步：注册 Adsterra 账号（需要用户操作）
1. 访问 https://www.adsterra.com/register
2. 填写邮箱和密码（建议用现有邮箱）
3. 网站类型选择 "Games"
4. 添加网站 gamezipper.com
5. 等待审核（通常 1-24h）

### 第二步：获取广告代码
审核通过后，在 Adsterra Dashboard 获取：
- **Smart Script**（智能推荐，自动匹配最佳广告格式）或
- **In-Page Push** Zone ID
- **Banners** Zone ID

### 第三步：部署到 monetag-manager.js
Adsterra 提供两种接入方式：

#### 方式 A：Smart Script（推荐）
在 monetag-manager.js 的 `CONFIG` 中添加：
```javascript
ADSTERRA: {
  enabled: true,
  script: 'https://scripts.smartadserver.com/loader.js', // 从Adsterra获取
  siteId: 'YOUR_SITE_ID',  // 从Adsterra获取
}
```

#### 方式 B：Zone-based（类似 Monetag）
```javascript
ADSTERRA: {
  enabled: true,
  zones: {
    inpagePush: 'YOUR_ZONE_ID_1',
    banner: 'YOUR_ZONE_ID_2',
  }
}
```

### 第四步：部署 Fallback 逻辑
在 `loadZone` 函数中添加 Adsterra fallback：
```
优先顺序：AdSense → Monetag → Adsterra → 静默隐藏
```

## Monetag Token 刷新提醒
- Token 每 7 天过期
- 当前 Token：c1b3db82829b779087aaaac2ec9b1d18f22ef42e
- 过期时间：2026-06-12
- 刷新方式：登录 publishers.monetag.com → 浏览器控制台执行 `JSON.parse(localStorage.getItem('user')).apiToken`

## 预计收益提升
- Adsterra 游戏类 eCPM：$0.50-$2.00
- Monetag 当前：$0（Fill Rate 0%）
- 预计提升：大幅改善（等 Adsterra 接入后验证）
