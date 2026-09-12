# Monkey Mart 游戏资源深度分析报告

## 分析概述

**游戏名称**: MonkeyMart  
**游戏版本**: 6.9  
**游戏引擎**: Defold (非Unity)  
**平台**: HTML5 (WASM)  
**分析日期**: 2026-05-22

---

## 一、核心文件清单

| 文件名 | 大小 | 说明 |
|--------|------|------|
| dmloader.js | 47KB | Defold引擎HTML5加载器 |
| MonkeyMart_wasm.js | 287KB | WASM胶水代码(WebAssembly glue code) |
| MonkeyMart.wasm | ~5MB | WebAssembly二进制游戏逻辑 |
| resources.zip | 5MB | 资源包(已解压到resources_extracted/) |
| game0.projectc | 4.9KB | Defold引擎配置文件 |
| game0.arci | 49KB | Defold资源档案索引 |
| game0.arcd | - | Defold资源档案数据 |

---

## 二、Defold引擎配置 (game0.projectc)

### 基本信息
- **游戏标题**: MonkeyMart
- **版本号**: 6.9
- **压缩存档**: 启用

### 显示配置
- **分辨率**: 960 x 640 像素
- **高DPI**: 启用
- **更新频率**: 60 FPS
- **垂直同步**: 启用

### 物理配置
- **物理类型**: 2D
- **重力**: Y=-10
- **最大碰撞对象**: 128
- **最大碰撞接触点**: 128

### HTML5特定配置
- **堆内存大小**: 128MB
- **WASM流式加载**: 禁用
- **全屏按钮**: 隐藏
- **显示Defold标识**: 隐藏
- **缩放模式**: stretch (拉伸填充)

---

## 三、dmloader.js 配置参数

```javascript
CUSTOM_PARAMETERS = {
    archive_location_filter: function(path) {
        return ("archive" + path + "");
    },
    engine_arguments: ["--verify-graphics-calls=false"],
    custom_heap_size: 134217728,  // 128MB
    full_screen_container: "#canvas-container",
    disable_context_menu: true,
    retry_time: 1.0,
    retry_count: 10,
    unsupported_webgl_callback: function() {...},
    start_success: function() {...},
    start_error: function(error) {...},
    update_progress: function(progress) {...},
    update_imports: function(imports) {...}
}
```

---

## 四、资源包分析 (resources.zip)

### 资源结构
- **总文件数**: 48个
- **包含内容**:
  - Lua脚本编译后的字节码(.luac)
  - 游戏纹理图集(atlas)
  - GUI界面配置
  - 音频文件
  - LiveUpdate清单文件

### 关键发现 - 可识别的游戏资源

#### 1. GUI脚本路径
```
/main/gui/debug.gui_scriptc
/main/gui/debug_sfx.gui_scriptc
```

#### 2. UI元素标识符(从字符串推断)
- `ui/btn_buy` - 购买按钮
- `btn_buyZ` - 购买按钮变体
- `buyPlace` - 购买位置
- `checkbox1/Q` - 复选框
- `image` - 图片元素
- `icon_choiseZ` - 选择图标

#### 3. 游戏功能模块(从字符串推断)
| 标识符 | 可能的游戏功能 |
|--------|--------------|
| `QueueCashbox` | 收银台队列 |
| `ankomat` | 自动取款机/收银 |
| `hooligan` | 流氓/随机事件 |
| `funsquad` | 娱乐设施/团队 |
| `parrot` | 鹦鹉(可能是商品或装饰) |
| `tilegrig` | 瓷砖/地面 |
| `skipTutorial` | 跳过教程 |
| `updateBot` | 更新机器人 |
| `goMart` | 前往市场 |
| `Boost` | 加速/增益 |
| `energy` | 能量系统 |
| `coinsX2` | 双倍金币 |
| `gems` | 宝石(虚拟货币) |
| `Queue` | 队列系统 |
| `Market` | 市场/商店 |
| `sleep` | 睡眠/等待 |
| `fillSklad` | 填充仓库 |

#### 4. IAP (应用内购买) 标识
- `iap_finish` - IAP完成
- `iap_force` - 强制IAP
- `coinsX2` - 金币加倍购买项

---

## 五、WASM胶水代码分析 (MonkeyMart_wasm.js)

### 数字频率统计 (出现次数最多的数值)
| 数值 | 出现次数 | 可能的用途 |
|------|---------|-----------|
| 0 | 1076 | 初始化/空值 |
| 2 | 823 | 布尔标志 |
| 1 | 564 | 启用/真 |
| 32 | 389 | 内存对齐/缓冲区大小 |
| 4 | 362 | 四方向/四象限 |
| 8 | 315 | 八方向/八进制 |
| 3 | 308 | 三星评价/三种状态 |
| 64 | 81 | 缓冲区大小 |
| 255 | 16 | 颜色最大值 |
| 1280 | 16 | 屏幕宽度相关 |
| 60 | 12 | 帧率/秒 |
| 1024 | 11 | KB换算/缓冲区 |

### 数组模式识别
```javascript
// 可能是月份天数
[0,31,59,90,120,151,181,212,243,273,304,334]  // 非闰年
[0,31,60,91,121,152,182,213,244,274,305,335]  // 闰年

// 可能是终端配置
[3,28,127,21,4,0,1,0,17,19,26,0,18,15,23,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
```

---

## 六、游戏内可见字符串分析

### 从资源二进制中提取的可见字符串

#### 主菜单/游戏流程
```lua
local is_lock_input = false
function on_btn_addCoins(self, params)
    msg.post(url_screen_game, "test9")
end
```

#### GUI文本元素
- `toy` - 玩具
- `on` - 开启状态
- `showGui` - 显示GUI
- `hide GUI` - 隐藏GUI
- `enable` - 启用
- `zoom` / `zoomTest` - 缩放测试
- `20%` - 缩放比例

#### 测试/调试相关
- `clickTest` - 点击测试
- `test 1:` / `test 2:` - 测试标签
- `editor` / `oeditor` - 编辑器
- `editorgrid` - 编辑器网格
- `map data` - 地图数据
- `debug` - 调试模式

---

## 七、重要发现与限制

### 已确认的信息
1. **游戏引擎**: Defold (非Unity)，编译为WebAssembly
2. **游戏版本**: 6.9
3. **显示分辨率**: 960x640 (4:3比例)
4. **目标帧率**: 60 FPS
5. **物理类型**: 2D Box2D

### 无法提取的信息
由于游戏核心逻辑编译为WebAssembly二进制文件(`MonkeyMart.wasm`)，以下游戏数值配置**无法直接提取**:
- ❌ 商品价格
- ❌ 升级成本
- ❌ 生产时间
- ❌ 玩家金币/宝石数量
- ❌ 经验值/等级配置
- ❌ 商品种类数据

这些数据以二进制格式存储在WASM中，需要:
1. 反编译WASM字节码
2. 或使用调试工具在运行时拦截

### 建议获取完整数值表的方法
1. 使用浏览器开发者工具在游戏运行时拦截网络请求
2. 使用WASM逆向工程工具(如wasm-decompile, Binaryen)
3. 在游戏运行时通过内存搜索找到数值地址

---

## 八、文件保存位置

所有分析文件已保存至:
```
/home/msdn/gamezipper.com/monkey-mart-ref/数值表/
├── dmloader.js                    # Defold加载器
├── MonkeyMart_wasm.js             # WASM胶水代码
├── game0.projectc                 # Defold项目配置
├── game0.arci                     # 资源档案索引
├── resources.zip                  # 资源压缩包
├── resources_extracted/           # 解压后的资源
└── MonkeyMart_数值分析报告.md      # 本报告
```

---

## 九、技术总结

| 项目 | 详情 |
|------|------|
| 游戏引擎 | Defold 1.2+ (WASM target) |
| 代码格式 | WebAssembly (WASM) |
| 资源配置 | 二进制存档(.arcd) |
| Lua脚本 | 编译为字节码 (无法直接反编译) |
| 资源格式 | 纹理图集(PNG), 音频(Ogg) |
| 存档格式 | Defold二进制格式 |

---

**报告生成时间**: 2026-05-22  
**分析工具**: strings, grep, file, curl, unzip  
**注意**: 本报告仅基于静态分析，游戏运行时数值可能与编译后的二进制数据不同。
