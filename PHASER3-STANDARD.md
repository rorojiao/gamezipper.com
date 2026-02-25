# Phaser 3 游戏开发标准

## CDN
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/phaser/3.88.2/phaser.min.js"></script>
```

## 文件结构
所有游戏单文件 `index.html`，包含：
- HTML head（SEO meta + AdSense + analytics）
- CSS（全屏黑色背景）
- Phaser 3 Game 配置
- Scene 类（Preload / Create / Update）

## 必须包含的标准功能
1. 响应式画布（mobile + desktop）
2. Google AdSense（ca-pub-8346383990981353）
3. analytics 埋点（site-analytics.cap.1ktower.com）
4. 音效系统（Web Audio API beep 函数）
5. localStorage 存储最高分
6. 游戏失败/胜利 modal（HTML 覆盖层，不用 Phaser DOM）
7. 分享按钮
8. 手机触摸支持（Phaser 自动处理）

## Phaser 3 配置模板
```javascript
const config = {
  type: Phaser.AUTO,
  width: 400,
  height: 700,
  backgroundColor: '#0A0A1A',
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scene: [BootScene, GameScene]
};
```

## 场景标准结构
```javascript
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }
  preload() { /* 加载资源（程序生成则跳过）*/ }
  create() { /* 创建游戏对象 */ }
  update(time, delta) { /* 每帧逻辑 */ }
}
```

## 颜色规范
- 背景：`#0A0A1A`（深紫黑）
- 主色：`#FFD080`（金色）
- 强调：`#FF6B35`（橙红）
- 成功：`#44CC88`（绿）
- 危险：`#FF4444`（红）

## 里程碑系统（所有游戏必须加）
- 无限循环游戏必须设置 3-5 个分数里程碑节点
- 里程碑时显示 Toast 提示 + 音效

## 分享按钮（所有游戏必须加）
- 游戏结束时显示「🔗 Share」按钮
- 调用 navigator.share 或 Twitter Intent
