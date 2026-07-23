# Phase 0/1 全站游戏清洗裁决书 (2026-07-23)
> 标准: 玩法特别简单/特别粗糙/重复 → 删除; 保留高质量精品。
> 判定轴: ①WIN条件 ②允许动作 (两轴相同=重复) ③实现质量(关卡数/功能/体积) ④是否换皮。
> 删除=目录保留但 index.html 换成 noindex 重定向 stub → 最近的精品 canonical，SEO 权益不丢。

## 删除清单 (75)

### Sudoku 变体精简 28→16 (删12)
同一动作(填数字)+同一胜利(填满约束)，仅约束微调，模板化量产(统一27关/6档)。
- anti-king-sudoku → anti-knight-sudoku (王移≈马移，留更知名的马移)
- hyper-sudoku → windmill-sudoku (额外区域小变体)
- color-sudoku → sudoku (数字换颜色=换皮)
- meowdoku → star-battle (描述=1星 Star Battle 换猫皮)
- twodoku → samurai-sudoku (多联宫⊂samurai)
- butterfly-sudoku → samurai-sudoku (四宫交叠≈samurai)
- girandola-sudoku → sudoku (单额外区域小变体)
- sohei-sudoku → windmill-sudoku (描述布局与 windmill 几乎相同)
- marginal-sudoku → outside-sudoku (规则描述逐字相同: 外侧提示最近格)
- search-9-sudoku → outside-sudoku (单数字位置提示=outside 子集)
- little-killer-sudoku → killer-sudoku (对角线和=killer 子集)
- consecutive-sudoku → kropki-sudoku (相邻连续约束≈kropki 白点)
保留: sudoku, anti-knight, killer, thermo, kropki, arrow, sandwich, samurai, windmill, jigsaw, x, greater-than, palindrome, odd-even, outside, str8ts

### Merge 精简 (删3)
- duck-merge → merge-sweets (拖拽同级合并，同动作同胜利)
- merge-kingdom → merge-sweets (拖合并+订单，merge-sweets 为其 392KB 旗舰版)
- mosaic-merge → merge-sweets (点选相邻合并，换皮)

### Match-3/Pop 精简 (删4)
- bejeweled → jewel-crush (swap-match3，jewel-crush 50关+道具更完整)
- dessert-blast → jewel-crush (31KB 最薄 swap-match3)
- ocean-gem-pop → bubble-shooter (自认 bubble shooter 换皮)
- bubble-pop → bubble-shooter (瞄准射击match3泡泡，同机制)

### Block 精简 (删3)
- blockudoku → woodoku (描述逐字相同: 9x9 block+sudoku)
- blocky-blast → woodoku (8x8 同行列消除，woodoku 为其超集)
- brainrot-blocks → woodoku (同上换皮)

### Mahjong/Tile 精简 (删3)
- mahjong-connect → onet (同一游戏: 二连通≤2折，onet 为经典名+194KB)
- mahjong-solitaire → tile-dynasty (同机制，tile-dynasty 24关战役更完整)
- triple-tile → tile-master (逐字相同: 托盘7格match3，tile-master 已审计30/30)

### Pin/Screw 精简 (删3)
- pin-pull-puzzle → pull-the-pin (同机制: 拔针导向，pull-the-pin 物理更完整)
- screw-jam → pin-master (同机制: 拧螺丝掉板)
- screw-master → pin-master (同机制，pin-master 40+关+hints+undo+星级)

### Sort 精简 (删4)
- color-sort → magic-sort (水排序，magic-sort 为 215000 关旗舰)
- color-pour → magic-sort (同上换皮)
- hoop-stack → magic-sort (柱上套环排序=水排序同构)
- words-klondike → word-card-sort (同动作: 单词归入分类)

### Flow/Pipe 精简 (删3)
- numberlink → flow-connect (同机制: 连点对填满，flow-connect 100关)
- flow-free-puzzle → flow-connect (同机制换皮)
- pipe-connect → liquid-connect (同动作: 旋转管件连通)

### 真重复成对 (删2)
- spiral-galaxies → spiral-galaxy (两名一游戏，R15 已验证 spiral-galaxy 29/29)
- tents-and-trees → tents (同一游戏两名)

### 涂色/填色 精简 (删4)
- cross-stitch → color-by-number (选色点编号格，同机制换皮)
- perler-beads → color-by-number (同上)
- gem-paint → color-by-number (同上)
- paint-splash → color-by-number (无目标的泡泡涂色玩具，薄)

### 物理画线 (删1)
- fill-glass → happy-glass (逐字相同: 画线导水入杯)

### Runner 精简 (删3)
- neon-run → neon-dash (28KB 薄跑酷，neon-dash 124KB 关卡节奏版)
- snow-rider → slope (下坡躲障收集=同机制换皮)
- roll-rush → going-balls (滚球30关躲障，同机制)

### 粗糙小游戏 (删5)
- alien-whack → whack-a-mole (打地鼠换皮)
- catch-turkey → whack-a-mole (30KB 薄反应游戏)
- ball-catch → brick-breaker (27KB 接球场，薄)
- fruit-slash → slice-master (17KB 全场最薄切水果)
- chocolate-bean-storm → bubble-shooter (16KB 泡泡龙换皮，全场最薄)

### Word 精简 (删3)
- anagram → text-twist (同机制: 6字母找所有词)
- word-puzzle → wordle (自认 "Wordle-style unlimited"=换皮)
- word-cookies → wordscapes (同机制: 字母轮盘填crossword)

### 经营管理 精简 (删2)
- kitty-cafe → kitchen-rush (同 loop: 接单-制作-上菜)
- hospital-hero → hotel-rush (同 loop 模板: 分配-服务-清理)

### Helix/Hole (删2)
- color-helix-smash → helix-jump (旋转塔落球，helix-jump 184KB 经典)
- hole-stars → black-hole (吞噬成长同机制)

### Arrow (删2)
- arrow-block-escape → tap-away (自述 "3D tap-away puzzles"=同一游戏)
- arrow-escape → tap-away (同机制: 按顺序移除通路无阻挡块)

### 整理/堆叠 (删3)
- tidy-organize → unpacking (同机制: 拖物归位)
- stacker → tower-stacker-3d (同机制: 计时落块堆塔)
- sushi-stack → tower-stacker-3d (落食材堆叠=同机制换皮)

### 其他换皮 (删2)
- jelly-dye → flood-fill (逐字相同: 左上角蔓延填色限步)
- audio-rhythm-puzzle → simon-says (听音复现序列=Simon 换皮)

### 科学仪器量产系列 13→1+3 (删11)
同一 "旋转耦合转盘 mod N 对齐目标" 模板换仪器皮(多个验证器已坏佐证量产)。
- armillary-align, sextant-celestial, orrery-planetary-gear, interferometer-align,
  gyroscope-precession, crankshaft-linkage, camshaft-timing, geneva-drive,
  resonance-lock, anemometer-wind-map → antikythera-mechanism (最丰富+最知名)
- vortex-valve → valve-network (流体皮版同模板)
保留: antikythera-mechanism(代表), trebuchet-trajectory(弹道双参,不同动词),
  electromagnet-field(极性路由,不同), crucible-alloy(线性组合,不同),
  canal-lock/valve-network(液压动词不同), centrifuge-separation(67KB 定时RPM)

## 保留数: 522 - 75 = 447 精品
## Phase 2 待办: 447 游戏 × 前3关玩家视角实测 (camoufox, 禁作弊码)
