# Plinko Drop — GameZipper.com

单文件 HTML5 物理弹球谜题游戏，基于经典的 Plinko 机制。

## 核心玩法

- 点击/轻触顶部区域释放小球
- 小球在钉子之间弹跳并落入底部槽位
- 每个槽位有不同的分数值（边缘最高）
- 用有限的球数达到目标分数完成关卡

## 游戏特性

- 30 个关卡，难度递进
- 3 星评级系统（基于得分）
- Web Audio 音效与背景音乐
- 本地进度保存（localStorage）
- 移动端适配（touch + pointer 事件）
- 暗色霓虹主题
- Monetag 广告集成（MultiTag zones: 110120, 110121, 110122）
- 每日挑战模式
- 设置界面（音效/BGM 开关）

## 技术实现

- 原生 JavaScript，无外部依赖
- Canvas 2D 渲染
- 自定义 2D 物理引擎（重力、弹跳、摩擦）
- 内联 Web Audio 音频生成
- 单文件部署（index.html）

## 开发完成阶段

- ✅ Phase 0: Market Research
- ✅ Phase 1: Candidate Selection (Plinko, 23/25)
- ✅ Phase 2: Competitive Benchmark
- ✅ Phase 3: Game Development (完整 30 关单文件游戏)
- ✅ Phase 4: Art Generation (占位符，使用 SVG)
- ✅ Phase 5: Music Generation (内联 Web Audio)
- ✅ Phase 6: Level Verification (30 关全部验证通过)
- ✅ Phase 7: QA Testing (0 P0/P1 问题)
- ✅ Phase 8: Register + Deploy (待提交到主仓库并注册到 games-data.js)

## SEO

- Meta 标签完整
- JSON-LD 结构化数据（VideoGame, FAQPage, HowTo, BreadcrumbList）
- Open Graph 和 Twitter Card 标签
- 语义化 HTML
- 响应式设计

## 文件结构

```
plinko/
├── index.html    # 主游戏文件（单文件）
└── assets/       # 资源目录（当前为空）
```

## 游戏模式

1. Classic: 标准模式，达到目标分数
2. Daily: 每日挑战（基于日期种子生成关卡）
3. Level Select: 选择任意已解锁关卡

## 控制方式

- 鼠标：点击顶部释放小球
- 触摸：轻触顶部释放小球
- UI 按钮：Restart、Settings、Hint、Menu

## 音频控制

- Settings 中可独立控制音效和背景音乐
- 音效：弹跳、得分、界面操作
- 背景音乐：内联 Web Audio 生成，4 个和弦循环

## 广告集成

- 顶部和底部 banner（90px 高度，fixed 定位，不遮挡游戏区域）
- MultiTag zones: 110120, 110121, 110122
- 加载于 window.load 之后
- 暂停/设置时显示插页广告（通过 Monetag 自动插页脚本触发）

## 性能优化

- 首屏加载 < 3s（目标）
- Canvas 渲染优化
- 事件节流
- 可见性检测（visibilitychange）

## 浏览器兼容性

- 现代浏览器（Chrome, Firefox, Safari, Edge）
- iOS Safari
- Android Chrome
- 需要 Canvas 2D 和 Web Audio API 支持