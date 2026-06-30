# Waterwheel Forge — Competitive Benchmark

## 目标游戏
- Waterwheel Forge: 旋转动力传输 puzzle，水流驱动水轮 → 带动锻造锤/磨盘

## 竞品分析

### 1. Cut the Rope (ZeptoLab, 2010)
- **Downloads**: 10亿+ (2024)
- **核心机制**: 割断绳子, 糖果掉落, 受重力和弹力影响
- **成功因素**:
  - 物理引擎 (重力、弹性、碰撞)
  - 可爱的角色 (Om Nom)
  - 收集星星增加重玩价值
  - 逐级难度递增
- **差异化机会**:
  - Waterwheel 基于 rotation 而非 fall
  - 连续传输而非一次性掉落
  - 调节水流大小而非割断绳索

### 2. Angry Birds (Rovio, 2009)
- **Downloads**: 40亿+ (2024)
- **核心机制**: 拖拽弹弓 → 瞄准 → 发射 → 破坏
- **成功因素**:
  - 物理引擎 (trajectory prediction, 碰撞)
  - 收藏级关卡设计
  - 物理破坏的满足感
- **差异化机会**:
  - Waterwheel 是 constructive (build/operate) 而非 destructive
  - 调节而非发射
  - 连续运转而非一次性冲击

### 3. Pipe Dream / Connect the Pipes (LucasArts, 1989)
- **Downloads**: N/A (经典街机游戏)
- **核心机制**: 旋转管道, 连接水源到目标
- **成功因素**:
  - 时间压力 (流体到达前完成)
  - 简单的管道连接机制
  - 逐级复杂度增加
- **差异化机会**:
  - Waterwheel 物理驱动而非纯连接
  - 水流大小影响转速 (Bernoulli 原理)
  - 连续运转而非单次连接

### 4. Where's My Water? (Disney, 2011)
- **Downloads**: 100M+
- **核心机制**: 挖掘地形, 引导水流到目标
- **成功因素**:
  - 流体模拟 (泥土、水流)
  - 收集鸭子增加目标
  - 逐级地形复杂度
- **差异化机会**:
  - Waterwheel 固定管道系统而非挖掘地形
  - 水轮驱动机制
  - 转速目标而非水量目标

## Waterwheel Forge 设计要点

### 核心机制
1. **水流系统**:
   - 水源 (进水阀门, 可调节大小)
   - 管道网络 (固定位置, 不可旋转)
   - 水轮 (接收水流, 产生转速)
   - 锻造锤/磨盘 (由水轮驱动)

2. **物理模型**:
   - 水流大小 = 阀门开度 (0-100%)
   - 水轮转速 = f(水流大小, 水轮半径)
   - 目标转速 range (min ≤ speed ≤ max)

3. **关卡结构**:
   - 30 levels, 5 tiers (6 levels each)
   - Tier 1: 单水轮, 单阀门
   - Tier 2: 单水轮, 多阀门 (并联)
   - Tier 3: 多水轮, 单阀门 (串联)
   - Tier 4: 多水轮, 多阀门 (复杂网络)
   - Tier 5: 带齿轮/传动系统

4. **UI/UX**:
   - 阀门拖拽调节 (0-100%)
   - 实时转速显示 (仪表盘)
   - 目标转速范围指示
   - 3-star 评分 (efficiency-based: how close to target)

### 技术实现
- **Canvas 2D**: 水流粒子 + 水轮旋转动画
- **Physics**: 简单角速度计算 (ω = Q / (2πr × efficiency))
- **Particle System**: 水流粒子 (150-200 particles max)
- **Responsive**: 480×800 基准, 适配 375px-414px 宽度

### 差异化总结
| 维度 | Waterwheel Forge | Canal Lock | Pipe Connect | Slingshot |
|------|------------------|------------|--------------|-----------|
| 核心机制 | 旋转动力 | 水位均衡 | 管道连接 | 弹射破坏 |
| 输入类型 | 调节阀门 | 开关闸门 | 旋转管道 | 拖拽弹弓 |
| 物理维度 | 角速度 | 液位 | 拓扑连接 | 轨迹 |
| 主题 | 工业/机械 | 水利工程 | 管道工程 | 物理 |
| 玩法深度 | 调节精度 | 逻辑顺序 | 路径规划 | 角度/力度 |

## 质量门禁
- [ ] 30 levels, 5 tiers, all solvable
- [ ] Valve control via drag (0-100% range)
- [ ] Real-time speed display with target range
- [ ] 3-star scoring (accuracy-based)
- [ ] Particle water flow (≤200 particles)
- [ ] Web Audio SFX (water flow, wheel spin, hammer hit)
- [ ] Mobile responsive (touch drag)
- [ ] No console.log, no Chinese
- [ ] Single-file HTML5, ≤60KB