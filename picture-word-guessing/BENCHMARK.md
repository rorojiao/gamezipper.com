# 4 Pics 1 Word 类型游戏竞品分析报告
# Picture Word Guessing Game Competitive Benchmark

> 目标: 为 GameZipper (picture-word-guessing) 项目建立开发基准
> 参考: LOTUM 原版 + Poki 第三方移植版 + App Store 类似产品
> 更新: 2026-05-31

---

## 一、竞品概览 / Top Competitors

### 1. 原版: 4 Pics 1 Word (LOTUM GmbH)

| 指标 | 数据 |
|------|------|
| 开发者 | LOTUM GmbH (iOS/Android) / RedSpell (iOS早期) |
| 发布日期 | 2013年2月22日 |
| 下载量 | Google Play: 100M+ / App Store: 10M+ (官方) |
| 评分 | Google Play ~4.4 / App Store ~4.6 |
| 盈利模式 | Freemium (免费+内购+广告) |
| 关卡设计 | 无限关卡，无尽内容，每日挑战 |
| 平台 | iOS, Android |

**核心功能:**
- 4张图片显示 → 玩家猜出共同词汇
- 字母网格 (给定字母 + 额外干扰字母)
- 提示系统消耗金币
- 星星评级 (根据使用提示数量)
- 每日挑战 (Daily Challenge) 促进留存
- 广告: 免费金币观看激励广告

---

### 2. Web版: Poki 移植版 (Unico Studio)

| 指标 | 数据 |
|------|------|
| 平台 | Web (Poki 独占) |
| 开发商 | Unico Studio |
| Poki 评分 | 3.7 / 5 |
| 投票数 | 7,690 票 |
| 关卡 | 几十个关卡 (Web碎片化设计) |
| 玩法 | 鼠标选择字母，与原版机制一致 |

**特点:**
- 界面干净简洁
- 字母选择交互: 鼠标点击字母放入答案槽
- 无原生APP那样的金币/内购系统 (纯浏览器体验)
- Poki 平台提供: 全屏模式、报告功能

---

### 3. 类似产品: Guess The Picture / Word Pictures 系列 (App Store)

| 产品 | 下载量 | 特点 |
|------|--------|------|
| 4 Pics 1 Word (原版) | 100M+ | 行业标准，金币+广告模式 |
| What's The Word? (类似) | 10M+ | 4图模式，简化提示系统 |
| Word Pictures (小型) | 1M-5M | 独立开发者，emoji风格变体 |
| Emoji Quiz (Apprope) | 50M+ | 纯emoji替代真实照片 |

---

## 二、核心机制拆解 / Core Mechanics Breakdown

### 2.1 游戏循环 (Core Loop)

```
展示4张图片 → 观察共同点 → 从字母网格选字母 → 填入答案槽 → 提交答案
     ↓                                    ↑
  答错 → 继续尝试 / 使用提示            答对 → 进入下一关 / 获得金币+星星
```

### 2.2 字母网格系统 (Letter Grid System)

**原版规则:**
- 字母数量 = 答案长度 + 2~4个干扰字母
- 例如: 答案 "CAT" (3字母) → 网格给出 5~7 个字母
- 额外字母随机打散分布
- 玩家点击字母放入答案槽 (按顺序)
- 可点击答案槽中的字母退回网格

**GameZipper 建议实现:**
```
答案: "DOG"
网格: [D, O, G, A, M, K]  (答案字母 + 3个干扰字母)
答案槽: [_][_][_]  (3格，对应 D O G 顺序)
```

### 2.3 提示系统 (Hint System)

| 提示类型 | LOTUM原版 | 建议实现 |
|----------|-----------|----------|
| 揭示字母 (Reveal Letter) | 消耗金币，显示一个正确字母位置 | 50金币/次 |
| 去除干扰字母 (Remove Letters) | 消耗金币，随机移除2~3个错误字母 | 100金币/次 |
| 跳过关卡 (Skip Level) | 消耗金币，直接进入下一关 | 200金币/次 |

**金币经济:**
- 初始赠送: 100~200 金币
- 完成关卡奖励: 10~50 金币 (根据星星数)
- 观看激励广告: +50~100 金币
- 连续正确奖励: 额外金币加成

### 2.4 星星评级系统 (Star Rating)

| 星星数 | 条件 |
|--------|------|
| ⭐⭐⭐ (3星) | 零提示完成 |
| ⭐⭐ (2星) | 使用 1 个提示 |
| ⭐ (1星) | 使用 2 个提示 |
| 无星 | 使用 3+ 提示 或 跳过 |

**用途:**
- 关卡选择界面显示星星数量
- 3星关卡额外奖励金币
- 进度收集要素 (所有关卡3星)

---

## 三、关卡系统设计 / Level System Design

### 3.1 关卡数量与结构

| 阶段 | 数量 | 难度 | 答案长度 |
|------|------|------|----------|
| 初级 (Level 1-15) | 15 | 简单 | 3~4字母 |
| 中级 (Level 16-35) | 20 | 中等 | 4~6字母 |
| 高级 (Level 36-50) | 15 | 困难 | 6~8字母 |

**GameZipper 最低要求: 50关卡**

### 3.2 每日挑战 (Daily Challenge)

- 每天生成一个新关卡 (日期种子伪随机)
- 所有玩家挑战同一关卡
- 完成奖励: 金币 + 记录当日完成
- 促进日活留存

### 3.3 分类设计 (Categories)

建议内容分类 (避免版权):

| 分类 | 示例答案 | Emoji表示 |
|------|----------|-----------|
| Animals | CAT, DOG, ELEPHANT | 🐱🐶🐘 |
| Food | APPLE, BANANA, PIZZA | 🍎🍌🍕 |
| Objects | CHAIR, TABLE, PHONE | 🪑📱 |
| Nature | TREE, FLOWER, RAIN | 🌳🌸🌧️ |
| Transport | CAR, BIKE, PLANE | 🚗🚲✈️ |
| Jobs | DOCTOR, TEACHER, CHEF | 👨‍⚕️👩‍🏫👨‍🍳 |
| Sports | SOCCER, TENNIS, GOLF | ⚽🎾⛳ |
| Emotions | HAPPY, SAD, ANGRY | 😊😢😠 |

---

## 四、美术风格 / Art Style Notes

### 4.1 行业主流风格对比

| 风格 | 代表产品 | 优缺点 |
|------|----------|--------|
| 真实照片 (Photo) | LOTUM 原版 | 版权问题，4张图片需匹配 |
| Emoji 风格 | Emoji Quiz (Apprope) | 无版权问题，颜色丰富 |
| 扁平插画 (Flat Illustration) | 独立开发者 | 制作成本高 |
| 混合风格 | Poki Unico Studio | 照片为主，Emoji辅助 |

### 4.2 GameZipper 推荐方案

**采用 Procedural Emoji 风格 (程序化 Emoji):**

```
优势:
- 零版权成本 (Unicode Emoji 属于开放标准)
- 跨平台一致性 (所有设备渲染相同)
- Canvas 绘制简单
- 颜色鲜艳，适合休闲游戏

实现方式:
- 使用 Canvas fillText 绘制 Emoji 字符
- 配合简单几何背景装饰
- 每关 4 个 Emoji 大尺寸居中显示
- 无需加载外部图片资源
```

---

## 五、音乐与音效 / Music & SFX

### 5.1 行业标准

| 元素 | 原版 4 Pics 1 Word | 建议实现 |
|------|-------------------|----------|
| BGM | 轻快背景音乐，循环播放 | Web Audio 生成简单旋律 |
| 正确音效 | 成功音效 + 硬币声 | Web Audio 短促正向音 |
| 错误音效 | 错误提示音 | Web Audio 短促负向音 |
| 提示音效 | 点击提示按钮音效 | Web Audio 清脆音效 |
| 星星音效 | 获得星星时庆祝音 | Web Audio 上升音阶 |

### 5.2 Web Audio 实现方案

- 使用 `AudioContext` + `OscillatorNode` 生成 8-bit 风格音效
- BGM: 简单循环旋律 (Chiptune 风格)
- SFX: 短音效，随按随用
- 全局静音开关

---

## 六、盈利模式 / Monetization Approach

### 6.1 Freemium 模型

```
收入来源:
1. 激励广告 (观看广告获取金币) ← 主要
2. 金币内购 (直接购买金币包)
3. 无广告订阅 (可选高级版)
```

### 6.2 广告位设计

| 广告位置 | 类型 | 触发条件 |
|----------|------|----------|
| 通关后 | 激励视频 (可选跳过) | 每5关强制观看一次 |
| 金币不足时 | 激励视频 | 提示不够时展示 |
| 关卡间 | 插屏广告 | 可选，每关后展示 |
| 底部 | 横幅广告 | 持续显示 (可选) |

### 6.3 GameZipper Web版建议

- **无内购** (Web平台不适合)
- **激励广告**: 观看广告获得金币
- **广告频率**: 通关后偶尔展示，不强制
- **保持免费体验**: 提示可通过观看广告免费获取

---

## 七、技术实现要点 / Implementation Recommendations

### 7.1 单文件 HTML5 Canvas 结构

```javascript
// 核心模块划分 (写在单文件中)
- GameState: 关卡进度、星星数量、金币
- LevelData: 50+ 关卡数据 (Emoji组合 + 答案)
- Renderer: Canvas 2D 渲染
- AudioManager: Web Audio BGM + SFX
- UIController: 按钮点击、触摸事件
- StorageManager: localStorage 持久化
```

### 7.2 必需功能清单

| 功能 | 优先级 | 说明 |
|------|--------|------|
| 50+ 关卡 | P0 | 最少50关，建议可扩展 |
| 字母网格选择 | P0 | 核心交互 |
| 答案验证 | P0 | 正确/错误反馈 |
| 3种提示系统 | P0 | Reveal/Remove/Skip |
| 星星评级 | P1 | 基于提示数量 |
| 每日挑战 | P1 | 日期种子伪随机 |
| Web Audio BGM | P2 | 背景音乐 |
| Web Audio SFX | P2 | 交互音效 |
| localStorage 存档 | P1 | 进度保存 |
| 移动端适配 | P0 | 触摸事件支持 |

### 7.3 关卡数据结构

```javascript
const LEVELS = [
  {
    id: 1,
    pictures: ["🐱", "🐶", "🐘", "🦁"],  // 4个 Emoji
    answer: "ANIMAL",     // 答案
    letters: ["A","N","I","M","L","O"], // 网格字母
    hint_cost: 50
  },
  // ... 50 关
];
```

---

## 八、竞品总结对比表

| 维度 | LOTUM 原版 | Poki Web版 | GameZipper 目标 |
|------|-----------|------------|-----------------|
| 关卡数量 | 无限 | 几十个 | 50+ |
| 图片来源 | 真实照片 | 真实照片 | Emoji (版权-free) |
| 提示系统 | 3种 | 无 | 3种 |
| 金币系统 | 有 | 无 | 有 |
| 星星评级 | 有 | 无 | 有 |
| 每日挑战 | 有 | 无 | 有 |
| 盈利模式 | 广告+内购 | 无 | 广告 |
| 平台 | iOS/Android | Web | Web (单文件) |
| BGM/SFX | 有 | 无 | Web Audio 实现 |

---

## 九、开发建议总结

### 9.1 立即实施 (Must Have)

1. **50个关卡** 包含完整 Emoji 组合和答案
2. **字母网格交互**: 点击选择、退回机制
3. **3种提示**: Reveal Letter / Remove Letters / Skip
4. **星星评级**: 基于提示使用数量
5. **每日挑战**: 基于日期的伪随机关卡
6. **进度存档**: localStorage 保存关卡/金币/星星
7. **Canvas 渲染**: 全屏幕 Emoji 显示

### 9.2 后续迭代 (Should Have)

1. **Web Audio BGM**: 轻快循环背景音乐
2. **Web Audio SFX**: 正确/错误/提示音效
3. **激励广告系统**: 看广告得金币
4. **关卡选择界面**: 显示星星数量
5. **关卡解锁**: 通关上一关解锁下一关

### 9.3 差异化方向

- **全Emoji渲染**: 零版权，随时上线
- **每日挑战**: 社交竞争留存
- **星星收集**: 100%完成动机
- **GameZipper 品牌**: 统一视觉风格

---

## 参考资料

- Wikipedia: https://en.wikipedia.org/wiki/4_Pics_1_Word
- Poki 4 Pics 1 Word: https://poki.com/en/g/4-pics-1-word
- App Store / Google Play 应用页面
