# DEV-BRIEF.md — Baba Is You (GameZipper 版)

## 概述
基于 Baba Is You 核心机制的浏览器简化版。规则是可推动的文字方块，玩家通过操纵规则来过关。

## 核心机制
1. 网格上放置实体和文字方块
2. 文字方块横向/纵向对齐3个以上形成规则
3. 玩家推动文字方块来创建/破坏规则
4. 规则立即生效——改变BABA IS YOU中任意方块即可改变规则

## 实体系统 (10个)

### 可玩实体
| ID | 名称 | 颜色 | 默认属性 |
|----|------|------|----------|
| b | BABA | 白色 | YOU |
| k | KEKE | 粉色 | — |

### 环境实体
| ID | 名称 | 颜色 | 默认属性 |
|----|------|------|----------|
| w | WALL | 深灰 | STOP |
| r | ROCK | 灰色 | PUSH |
| f | FLAG | 黄色 | WIN |
| a | WATER | 蓝色 | SINK |
| l | LAVA | 橙色 | HOT |
| s | SKULL | 白色 | DEFEAT |
| y | KEY | 金色 | PUSH |
| d | DOOR | 棕色 | SHUT |

## 属性系统 (14个)

| 属性 | 效果 |
|------|------|
| YOU | 玩家控制 |
| WIN | 胜利条件 |
| STOP | 阻挡 |
| PUSH | 可推动 |
| PULL | 离开时拉拽 |
| DEFEAT | 致命接触 |
| HOT | 灼烧MELT |
| MELT | 被HOT销毁 |
| SINK | 共格销毁双方 |
| MOVE | 自动前进 |
| OPEN | 与SHUT互消 |
| SHUT | 与OPEN互消 |
| FLOAT | 忽略碰撞 |
| SAFE | 不可销毁 |

## 连接词 (2个)
- AND — 组合属性 (ROCK IS PUSH AND WIN)
- NOT — 否定属性 (WALL IS NOT STOP)

## 规则解析器
```
扫描方向：水平(左→右) + 垂直(上→下)
触发条件：移动后、销毁后、转化后
有效模式：NOUN IS PROPERTY / NOUN IS NOUN / NOUN IS NOT PROPERTY / NOUN IS PROP AND PROP
```

## 关卡设计

### 第一章：初识规则 (8关)
1. 介绍：BABA IS YOU, FLAG IS WIN（走到旗帜）
2. 推动文字：推动IS改变规则
3. 破坏规则：推开STOP让你穿过WALL
4. 创建规则：推动文字形成新规则
5. FLAG IS PUSH：旗帜被推走了，怎么赢？
6. WALL IS PUSH AND STOP：组合属性
7. BABA IS STOP：自己变成了墙
8. 综合：多个规则操纵

### 第二章：转化之谜 (10关)
9. ROCK IS FLAG：转化石头为旗帜
10. BABA IS ROCK：转化自己
11. WALL IS WATER：转化墙壁为水
12. FLAG IS SKULL：旗帜变成了致命的
13. WATER IS FLAG：水变成了胜利点
14. SKULL IS WATER：骷髅变成水
15. BABA IS FLAG：自己变成旗帜
16. 关键教学：如何防止转化 (X IS X)
17. 多重转化：同时转化多种实体
18. 综合转化谜题

### 第三章：推与拉 (10关)
19. PULL教学：拉开门背后的钥匙
20. 推链：推动一串PUSH对象
21. PULL陷阱：拉动会导致失败
22. PUSH + SINK组合
23. KEY IS OPEN, DOOR IS SHUT
24. PULL保护：用PULL拉出安全路径
25. 推动文字创造PULL规则
26. 复杂推动链
27. PULL + PUSH联合
28. 综合推拉谜题

### 第四章：否定与逻辑 (12关)
29. NOT教学：WALL IS NOT STOP
30. BABA IS NOT DEFEAT
31. LAVA IS NOT HOT
32. WATER IS NOT SINK
33. 多重NOT：SKULL IS NOT DEFEAT AND NOT STOP
34. 破坏NOT：推开NOT恢复规则
35. NOT + 转化：WALL IS NOT WALL
36. 创建NOT规则
37. AND + NOT组合
38. 隐藏规则：需要发现未显示的NOT
39. NOT循环：多重NOT交互
40. 综合逻辑谜题

### 第五章：终极挑战 (10关)
41. 多规则并行：同时操纵3+规则
42. MOVE陷阱：MOVE对象改变规则位置
43. 自我胜利：BABA IS YOU AND WIN
44. 全部转化：每个实体都被转化
45. SINK策略：利用SINK清除障碍
46. HOT/MELT路径：穿越危险区域
47. 规则锁：文字方块被锁住，需要巧妙操纵
48. FLOAT + PUSH组合
49. 三规则交集：三个方向规则互相影响
50. 终极谜题：综合所有机制

## 技术规格

### 渲染
- Canvas 2D
- 网格：15x11（移动端）或 20x15（桌面端）
- 方块大小：min(screenWidth/15, screenHeight/11)
- 动画：移动(150ms), 消失(200ms), 规则高亮(500ms)

### 输入
- 键盘：方向键/WASD
- 触摸：滑动方向
- Z：撤销
- R：重置
- H：提示

### 音频
- Web Audio API
- BGM：循环8-bit风格
- SFX：移动、推动、销毁、胜利、失败

### UI
- 顶部：关卡名 + 步数
- 右上角：暂停/菜单按钮
- 底部：撤销/重置/提示按钮
- 星级：步数达标（1-3星）

### 参考模板
- `/home/msdn/gamezipper.com/checkers/index.html` — 游戏模板
- Monetag广告位：110120(banner), 110121(native), 110122(interstitial)
- SEO meta标签 + 结构化数据
- 中文注释

## 实现优先级
1. 网格渲染 + 实体显示
2. 规则解析器（NOUN IS PROPERTY）
3. 移动系统 + 推动链条
4. 碰撞检测 + 属性效果
5. 胜利/失败判定
6. 撤销系统
7. IS NOUN 转化
8. AND / NOT 连接词
9. PULL 机制
10. MOVE 自移动
11. 关卡加载系统
12. UI + 星级评价
13. 音频
14. 触摸输入
15. SEO + 广告
