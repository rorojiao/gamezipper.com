// ============================================
// Chocolate Bean Storm - 100%对标Bubble Storm (Adgard/Poki)
// 基于原始源码反编译还原的六角蜂巢射击消除游戏
// ============================================

(function() {
    'use strict';

    // === 精灵图加载 ===
    const BEAN_FILES = [
        'assets/bean_red.png',
        'assets/bean_green.png',
        'assets/bean_blue.png',
        'assets/bean_pink.png',
        'assets/bean_cyan.png',
        'assets/bean_yellow.png',
        'assets/bean_darkgreen.png',
        'assets/bean_purple.png',
        'assets/bean_lightblue.png',
        'assets/bean_orange.png',
        'assets/bean_white.png',
    ];
    const RAINBOW_FILE = 'assets/bean_rainbow.png';
    let beanSprites = [];
    let rainbowSprite = null;
    let spritesLoaded = false;
    let spritesReady = new Promise(resolve => {
        let loaded = 0;
        const total = BEAN_FILES.length + 1;
        function onLoad() {
            loaded++;
            if (loaded >= total) { spritesLoaded = true; resolve(); }
        }
        BEAN_FILES.forEach((src, i) => {
            const img = new Image();
            img.onload = onLoad;
            img.onerror = onLoad;
            img.src = src;
            beanSprites[i] = img;
        });
        rainbowSprite = new Image();
        rainbowSprite.onload = onLoad;
        rainbowSprite.onerror = onLoad;
        rainbowSprite.src = RAINBOW_FILE;
    });

    // === 方向常量 ===
    const DIR_TOP = 0, DIR_RIGHT = 1, DIR_BOTTOM = 2, DIR_LEFT = 3;

    // === 游戏配置 - 100%对标原始 ===
    const isHorizontal = window.innerWidth > window.innerHeight;

    // 原始: window.horis ? (29,17) : (16,32)
    const SIZE_X = isHorizontal ? 29 : 16;
    const SIZE_Y = isHorizontal ? 17 : 32;

    // 原始: window.horis ? (10,6) : (5,10) - startSize
    const START_SIZE_X = isHorizontal ? 10 : 5;
    const START_SIZE_Y = isHorizontal ? 6 : 10;

    // 原始: offset - window.horis ? (42,40) : (34,34)
    const OFFSET_X = isHorizontal ? 42 : 34;
    const OFFSET_Y = isHorizontal ? 40 : 34;

    // 原始: size = Point(42,36)
    const CELL_W = 42;
    const CELL_H = 36;

    // 原始: pair=false时偏移20
    const ODD_ROW_OFFSET = 20;

    // 原始: levelRadius = 16
    const LEVEL_RADIUS = 16;

    // 原始: ball size 40x41px spritesheet, 17 frames (0-16)
    const BALL_W = 40;
    const BALL_H = 41;

    // 原始: aimPoint - window.horis ? (628,328) : (348,574)
    const AIM_POINT_X = isHorizontal ? 628 : 348;
    const AIM_POINT_Y = isHorizontal ? 328 : 574;

    // 原始: startPoint - window.horis ? (600,684) : (684,600)
    const START_POINT_X = isHorizontal ? 600 : 684;
    const START_POINT_Y = isHorizontal ? 684 : 600;

    // 原始: wall bounds
    const WALL_LEFT = 0;
    const WALL_RIGHT = isHorizontal ? 1280 : 720;
    const WALL_TOP = 0;
    const WALL_BOTTOM = isHorizontal ? 720 : 1280;

    // 原始: 游戏分辨率
    const GAME_W = isHorizontal ? 1280 : 720;
    const GAME_H = isHorizontal ? 720 : 1280;

    // 原始: initialColorsNumber=5, startColorsNumber=10, maxColorsNumber=16
    // storage.initColors初始=3，随关卡递增
    const INITIAL_COLORS = 3;
    const MAX_COLORS = 10;
    const RAINBOW_TYPE = 16;

    // 原始: speed=1500, constDt=0.018
    const SHOOT_SPEED = 1500;
    const CONST_DT = 0.018;

    // 原始: radiusWall=50
    const RADIUS_WALL = 50;

    // 原始颜色值
    const COLORS_HEX = [
        '#FD0B0B', '#1FFF1F', '#0000FF', '#FE08FE', '#0EFFFF',
        '#FFFF00', '#009933', '#9900FF', '#008FFE', '#FF6600', '#FFFFFF'
    ];
    const COLORS_LIGHT = [
        '#ff4d4d', '#66ff66', '#4d4dff', '#fe66fe', '#66ffff',
        '#ffff66', '#33cc66', '#b366ff', '#4db3ff', '#ff994d', '#ffffff'
    ];
    const COLORS_DARK = [
        '#b00808', '#14b314', '#0000b3', '#b305b3', '#0ab3b3',
        '#b3b300', '#006622', '#6b00b3', '#0066b3', '#b34700', '#cccccc'
    ];

    // === Canvas ===
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    let W, H, dpr, gameScale;
    let bgCache = null;

    function setupCanvas() {
        dpr = window.devicePixelRatio || 1;
        const container = document.getElementById('game-container');
        const cw = container.clientWidth;
        const ch = container.clientHeight;

        gameScale = Math.min(cw / GAME_W, ch / GAME_H);
        W = Math.floor(GAME_W * gameScale);
        H = Math.floor(GAME_H * gameScale);

        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        bgCache = null;
    }

    setupCanvas();
    window.addEventListener('resize', () => { setupCanvas(); });

    // === 坐标转换: 游戏坐标 -> 屏幕坐标 ===
    function toScreen(gx, gy) {
        return { x: gx * gameScale, y: gy * gameScale };
    }

    function fromScreen(sx, sy) {
        return { x: sx / gameScale, y: sy / gameScale };
    }

    // === 六角网格节点 - 100%对标原始class K ===
    class GridNode {
        constructor(col, row) {
            this.col = col;
            this.row = row;
            this.pair = row % 2 === 0; // 原始: pair=true for even rows
            this.tile = null; // tile type (0-10=颜色, 16=彩虹)
            this.removed = false;
            this.locked = false;
            this.floated = true;
            this.hintFlag = true;
            this.static = false;

            // 计算位置 - 100%对标原始
            let offsetX = 0;
            if (!this.pair) offsetX = ODD_ROW_OFFSET;
            this.x = col * CELL_W + offsetX + OFFSET_X;
            this.y = row * CELL_H + OFFSET_Y;

            // 邻居 - sync()时设置
            this.right = null;
            this.left = null;
            this.left_top = null;
            this.left_bottom = null;
            this.right_top = null;
            this.right_bottom = null;
        }

        getNeighbours() {
            return [this.right, this.left, this.left_top, this.left_bottom, this.right_top, this.right_bottom];
        }

        getNeigboursEmpty() {
            return this.getNeighbours().filter(n => n && n.tile === null);
        }

        getNeigboursFull() {
            return this.getNeighbours().filter(n => n && n.tile !== null);
        }
    }

    // === 游戏状态 ===
    let gridArray = [];
    let gameState = 'menu';
    let currentLevel = 1;
    let score = 0;
    let hitCounter = 10;
    let hitCounterMax = 10;
    let failCounter = 0;
    let comboCount = 0;
    let comboTimer = 0;
    let animFrame = 0;
    let particles = [];
    let fallingBeans = [];
    let flyBall = null;
    let directions = [1, 1, 1, 1]; // 4面墙壁
    let startColorsNumber = INITIAL_COLORS;

    // 射击器
    let shooter = {
        angle: -Math.PI / 2,
        currentType: 0,
        queue: [],
        status: 'none',
        firstAd: false,
        prevColor: -1,
        maxBalls: 6,
        currentBalls: 6
    };

    // === 网格初始化 ===
    function initGrid() {
        gridArray = [];
        for (let row = 0; row < SIZE_Y; row++) {
            gridArray[row] = [];
            for (let col = 0; col < SIZE_X; col++) {
                gridArray[row][col] = new GridNode(col, row);
            }
        }
        syncGrid();
    }

    // 100%对标原始sync() - 链接所有邻居
    function syncGrid() {
        for (let row = 0; row < SIZE_Y; row++) {
            for (let col = 0; col < SIZE_X; col++) {
                const node = gridArray[row][col];
                node.right = getRight(col, row);
                node.left = getLeft(col, row);
                node.left_top = getLeftTop(col, row);
                node.left_bottom = getLeftBottom(col, row);
                node.right_top = getRightTop(col, row);
                node.right_bottom = getRightBottom(col, row);
            }
        }
    }

    // 100%对标原始邻居计算 - pair影响对角线邻居
    function getRight(col, row) {
        if (col + 1 < SIZE_X) return gridArray[row][col + 1];
        return null;
    }

    function getLeft(col, row) {
        if (col - 1 >= 0) return gridArray[row][col - 1];
        return null;
    }

    function getLeftTop(col, row) {
        const pair = row % 2 === 0;
        const offset = pair ? -1 : 0;
        const nc = col + offset;
        const nr = row - 1;
        if (nc >= 0 && nr >= 0) return gridArray[nr][nc];
        return null;
    }

    function getLeftBottom(col, row) {
        const pair = row % 2 === 0;
        const offset = pair ? -1 : 0;
        const nc = col + offset;
        const nr = row + 1;
        if (nc >= 0 && nr < SIZE_Y) return gridArray[nr][nc];
        return null;
    }

    function getRightTop(col, row) {
        const pair = row % 2 === 0;
        const offset = pair ? 0 : 1;
        const nc = col + offset;
        const nr = row - 1;
        if (nc < SIZE_X && nr >= 0) return gridArray[nr][nc];
        return null;
    }

    function getRightBottom(col, row) {
        const pair = row % 2 === 0;
        const offset = pair ? 0 : 1;
        const nc = col + offset;
        const nr = row + 1;
        if (nc < SIZE_X && nr < SIZE_Y) return gridArray[nr][nc];
        return null;
    }

    // === 碰撞检测 - 100%对标原始circleIntersection ===
    function circleIntersection(x1, y1, r1, x2, y2, r2) {
        const dx = x1 - x2;
        const dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy) < r1 + r2;
    }

    // 100%对标原始checkAimBall - 飞行球碰撞
    function checkAimBall(ball) {
        for (let row = 0; row < SIZE_Y; row++) {
            for (let col = 0; col < SIZE_X; col++) {
                const node = gridArray[row][col];
                if (node.tile !== null && circleIntersection(
                    ball.x + BALL_W / 2, ball.y + BALL_H / 2, LEVEL_RADIUS,
                    node.x + BALL_W / 2, node.y + BALL_H / 2, LEVEL_RADIUS
                )) {
                    return node;
                }
            }
        }
        return null;
    }

    // 100%对标原始checkTopWall - 顶墙吸附
    function checkTopWall(ball) {
        for (let col = 0; col < SIZE_X; col++) {
            const node = gridArray[0][col];
            if (node.tile === null && circleIntersection(
                ball.x + BALL_W / 2, ball.y + BALL_H / 2, LEVEL_RADIUS,
                node.x + BALL_W / 2, node.y + BALL_H / 2, LEVEL_RADIUS
            )) {
                return node;
            }
        }
        return null;
    }

    // === 颜色匹配 - 100%对标原始getNeighboursByType ===
    function getNeighboursByType(startNode) {
        const result = [startNode];
        const type = startNode.tile;
        let added = true;

        while (added) {
            added = false;
            const currentBatch = [...result];
            for (const node of currentBatch) {
                const neighbours = node.getNeighbours();
                for (const n of neighbours) {
                    if (n && n.tile !== null && result.indexOf(n) === -1) {
                        if (n.tile === type || type === RAINBOW_TYPE) {
                            result.push(n);
                            added = true;
                        }
                    }
                }
            }
        }
        return result;
    }

    // === 浮动检测 - 100%对标原始checkFloatBubbles ===
    function checkFloatBubbles() {
        doFloated();

        // 从四面墙壁开始BFS标记不浮动的
        if (directions[DIR_TOP]) {
            for (let col = 0; col < SIZE_X; col++) {
                const node = gridArray[0][col];
                if (node.tile !== null) {
                    doNotFloated(node);
                }
            }
        }
        if (directions[DIR_BOTTOM]) {
            for (let col = 0; col < SIZE_X; col++) {
                const node = gridArray[SIZE_Y - 1][col];
                if (node.tile !== null) {
                    doNotFloated(node);
                }
            }
        }
        if (directions[DIR_LEFT]) {
            for (let row = 0; row < SIZE_Y; row++) {
                const node = gridArray[row][0];
                if (node.tile !== null) {
                    doNotFloated(node);
                }
            }
        }
        if (directions[DIR_RIGHT]) {
            for (let row = 0; row < SIZE_Y; row++) {
                const node = gridArray[row][SIZE_X - 1];
                if (node.tile !== null) {
                    doNotFloated(node);
                }
            }
        }

        return removeFloated();
    }

    function doFloated() {
        for (let row = 0; row < SIZE_Y; row++)
            for (let col = 0; col < SIZE_X; col++)
                if (gridArray[row][col].tile !== null)
                    gridArray[row][col].floated = true;
    }

    function doNotFloated(startNode) {
        const visited = new Set();
        const queue = [startNode];
        visited.add(startNode);
        while (queue.length > 0) {
            const node = queue.shift();
            node.floated = false;
            const neighbours = node.getNeighbours();
            for (const n of neighbours) {
                if (n && n.tile !== null && !visited.has(n)) {
                    visited.add(n);
                    queue.push(n);
                }
            }
        }
    }

    function removeFloated() {
        const result = [];
        for (let row = 0; row < SIZE_Y; row++)
            for (let col = 0; col < SIZE_X; col++) {
                const node = gridArray[row][col];
                if (node.tile !== null && node.floated)
                    result.push(node);
            }
        return result;
    }

    // === 失败检测 - 100%对标原始failGrids ===
    function checkForFail() {
        // 垂直模式的failGrids
        const failGrids = isHorizontal ? [
            [14,8],[13,8],[15,8],[13,7],[14,7],[13,9],[14,9]
        ] : [
            [8,16],[7,16],[7,14],[8,14],[6,15],[8,15]
        ];

        for (const [col, row] of failGrids) {
            if (gridArray[row] && gridArray[row][col] && gridArray[row][col].tile !== null)
                return true;
        }
        return false;
    }

    // === 检查通关 - 100%对标原始checkFirstLine ===
    function checkFirstLine() {
        let count = 0;
        let allEmpty = true;
        let rainbowCount = 0;

        for (let dir = 0; dir < 4; dir++) {
            count = 0;
            switch (dir) {
                case DIR_TOP:
                    for (let col = 0; col < SIZE_X; col++) {
                        const node = gridArray[0][col];
                        if (node.tile !== null) { count++; allEmpty = false; if (node.tile === RAINBOW_TYPE) rainbowCount++; }
                    }
                    if (directions[DIR_TOP] && count === 0) { directions[DIR_TOP] = 0; }
                    break;
                case DIR_BOTTOM:
                    for (let col = 0; col < SIZE_X; col++) {
                        const node = gridArray[SIZE_Y - 1][col];
                        if (node.tile !== null) { count++; allEmpty = false; if (node.tile === RAINBOW_TYPE) rainbowCount++; }
                    }
                    if (directions[DIR_BOTTOM] && count === 0) { directions[DIR_BOTTOM] = 0; }
                    break;
                case DIR_LEFT:
                    for (let row = 0; row < SIZE_Y; row++) {
                        const node = gridArray[row][0];
                        if (node.tile !== null) { count++; allEmpty = false; if (node.tile === RAINBOW_TYPE) rainbowCount++; }
                    }
                    if (directions[DIR_LEFT] && count === 0) { directions[DIR_LEFT] = 0; }
                    break;
                case DIR_RIGHT:
                    for (let row = 0; row < SIZE_Y; row++) {
                        const node = gridArray[row][SIZE_X - 1];
                        if (node.tile !== null) { count++; allEmpty = false; if (node.tile === RAINBOW_TYPE) rainbowCount++; }
                    }
                    if (directions[DIR_RIGHT] && count === 0) { directions[DIR_RIGHT] = 0; }
                    break;
            }
        }

        let activeDirs = 0;
        for (let d = 0; d < 4; d++) if (directions[d] === 0) activeDirs++;
        allEmpty = activeDirs === 4;

        return allEmpty;
    }

    // === 颜色数 - 100%对标原始initColors ===
    function initColors(level) {
        let e = 2;
        if (level === 0) e = 3;
        else {
            switch (level) {
                case 1: e = 4; break;
                case 2: e = 5; break;
                case 3: e = 6; break;
                case 4: e = 7; break;
                case 5: e = 8; break;
                case 6: case 7: e = 9; break;
                default: e = 10; break;
            }
        }
        return e - 1;
    }

    function getColorCount() {
        if (startColorsNumber > MAX_COLORS) startColorsNumber = MAX_COLORS;
        return startColorsNumber;
    }

    function getHitCounter(level) {
        return level === 1 ? 10 : 5 + 4 * level - 1;
    }

    function randomType() {
        const count = getColorCount();
        const inGrid = new Set();
        for (let row = 0; row < SIZE_Y; row++)
            for (let col = 0; col < SIZE_X; col++)
                if (gridArray[row][col].tile !== null && gridArray[row][col].tile !== RAINBOW_TYPE)
                    inGrid.add(gridArray[row][col].tile);
        if (inGrid.size > 0) {
            const arr = Array.from(inGrid);
            return arr[Math.floor(Math.random() * arr.length)];
        }
        return Math.floor(Math.random() * count);
    }

    function initQueue() {
        shooter.queue = [];
        for (let i = 0; i < 5; i++) {
            shooter.queue.push(randomType());
        }
        shooter.currentType = shooter.queue.shift();
        shooter.queue.push(randomType());
    }

    // === 关卡加载 - 100%对标原始loadLevel ===
    function loadLevel() {
        let count = 0;
        if (startColorsNumber > MAX_COLORS) startColorsNumber = MAX_COLORS;

        // 顶部
        for (let row = 0; row < START_SIZE_Y; row++) {
            for (let col = 0; col < SIZE_X; col++) {
                const node = gridArray[row][col];
                if (node.tile === null) {
                    const type = Math.floor(Math.random() * startColorsNumber);
                    node.tile = type;
                    count++;
                }
            }
        }

        // 底部
        for (let row = SIZE_Y - 1; row > SIZE_Y - 1 - START_SIZE_Y; row--) {
            for (let col = 0; col < SIZE_X; col++) {
                const node = gridArray[row][col];
                if (node.tile === null) {
                    const type = Math.floor(Math.random() * startColorsNumber);
                    node.tile = type;
                    count++;
                }
            }
        }

        // 左侧
        for (let row = 0; row < SIZE_Y; row++) {
            for (let col = 0; col < START_SIZE_X; col++) {
                const node = gridArray[row][col];
                if (node.tile === null) {
                    const type = Math.floor(Math.random() * startColorsNumber);
                    node.tile = type;
                    count++;
                }
            }
        }

        // 右侧
        for (let row = 0; row < SIZE_Y; row++) {
            for (let col = SIZE_X - 1; col > SIZE_X - 2 - START_SIZE_X; col--) {
                const node = gridArray[row][col];
                if (node.tile === null) {
                    const type = Math.floor(Math.random() * startColorsNumber);
                    node.tile = type;
                    count++;
                }
            }
        }

        // 放一个彩虹球
        if (currentLevel > 1) {
            const singles = [];
            for (let row = 1; row < SIZE_Y - 1; row++)
                for (let col = 1; col < SIZE_X - 1; col++) {
                    const node = gridArray[row][col];
                    if (node.tile !== null) singles.push(node);
                }
            if (singles.length > 0) {
                shuffleArray(singles);
                singles[0].tile = RAINBOW_TYPE;
            }
        }

        return count;
    }

    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    // === 消除检查 - 100%对标原始getColor ===
    function checkColors(node) {
        if (node.tile === null) return;

        const connected = getNeighboursByType(node);
        if (connected.length <= 2) return;

        // 过滤掉static节点
        const removable = connected.filter(n => !n.static);

        if (removable.length > 1) {
            comboCount++;
            const pts = removable.length * 10 * comboCount;
            score += pts;

            for (const n of removable) {
                const s = toScreen(n.x, n.y);
                const t = n.tile;
                const color = (t < COLORS_HEX.length) ? COLORS_HEX[t] : '#fff';
                spawnParticles(s.x, s.y, color, 8);
                spawnFallingBean(s.x, s.y, t);
                n.tile = null;
                n.removed = false;
            }

            showCombo(comboCount, removable.length);

            // 浮动检测
            const floating = checkFloatBubbles();
            if (floating.length > 0) {
                score += floating.length * 15 * comboCount;
                for (const n of floating) {
                    const s = toScreen(n.x, n.y);
                    const t = n.tile;
                    const color = (t < COLORS_HEX.length) ? COLORS_HEX[t] : '#fff';
                    spawnParticles(s.x, s.y, color, 5);
                    spawnFallingBean(s.x, s.y, t);
                    n.tile = null;
                }
            }
        } else {
            comboCount = 0;
        }
    }

    // === 射击系统 - 100%对标原始aim class ===
    function shoot() {
        if (shooter.status !== 'none' || gameState !== 'playing') return;
        shooter.status = 'fly';
        flyBall = {
            x: AIM_POINT_X,
            y: AIM_POINT_Y,
            rotation: shooter.angle,
            type: shooter.currentType
        };
    }

    function updateFlyBall() {
        if (!flyBall || shooter.status !== 'fly') return;

        const dt = CONST_DT;

        // 100%对标原始update: hitBall.x += t * speed * Math.sin(hitRotation)
        flyBall.x += dt * SHOOT_SPEED * Math.sin(flyBall.rotation);
        flyBall.y -= dt * SHOOT_SPEED * Math.cos(flyBall.rotation);

        // 碰到已有球体
        const hitNode = checkAimBall(flyBall);
        if (hitNode) {
            snapBubble(hitNode, flyBall);
            return;
        }

        // 碰到顶墙
        const topNode = checkTopWall(flyBall);
        if (topNode) {
            snapBubbleToWall(topNode, flyBall);
            return;
        }

        // 出界检查
        if (flyBall.y <= WALL_TOP - RADIUS_WALL || flyBall.y >= WALL_BOTTOM + RADIUS_WALL) {
            shooter.status = 'none';
            flyBall = null;
            minusQueue();
            reborn();
            return;
        }
        if (flyBall.x <= WALL_LEFT - RADIUS_WALL || flyBall.x > WALL_RIGHT + RADIUS_WALL) {
            shooter.status = 'none';
            flyBall = null;
            minusQueue();
            reborn();
            return;
        }
    }

    // 100%对标原始snapBubble
    function snapBubble(hitNode, ball) {
        const emptyNeighbours = hitNode.getNeigboursEmpty();
        const fullNeighbours = hitNode.getNeigboursFull();

        // 找最近空位
        const target = getNearestGrid(emptyNeighbours, ball);
        if (target) {
            target.tile = ball.type;
            hitCounter--;
            checkColors(target);

            // 检查失败
            if (checkForFail()) {
                gameState = 'gameover';
                showGameOver();
                shooter.status = 'none';
                flyBall = null;
                return;
            }

            // 检查通关
            if (checkFirstLine()) {
                completeLevel();
                shooter.status = 'none';
                flyBall = null;
                return;
            }

            minusQueue();
            reborn();
        } else {
            shooter.status = 'none';
            flyBall = null;
            minusQueue();
            reborn();
        }
    }

    function snapBubbleToWall(topNode, ball) {
        topNode.tile = ball.type;
        hitCounter--;
        checkColors(topNode);

        if (checkForFail()) {
            gameState = 'gameover';
            showGameOver();
            shooter.status = 'none';
            flyBall = null;
            return;
        }

        if (checkFirstLine()) {
            completeLevel();
            shooter.status = 'none';
            flyBall = null;
            return;
        }

        minusQueue();
        reborn();
    }

    // 100%对标原始getNearestGrid
    function getNearestGrid(nodes, ball) {
        let bestDist = 2000;
        let best = null;
        for (const n of nodes) {
            const dx = n.x - ball.x;
            const dy = n.y - ball.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < bestDist) {
                bestDist = dist;
                best = n;
            }
        }
        return best;
    }

    // 100%对标原始minusQueue - failCounter在此递增
    function minusQueue() {
        failCounter++;
        if (hitCounter <= 0 && !shooter.firstAd) {
            shooter.firstAd = true;
            if (currentLevel === 1) {
                shooter.currentType = RAINBOW_TYPE;
            }
            hitCounter = getHitCounter(currentLevel);
            hitCounterMax = hitCounter;
        } else if (shooter.firstAd && hitCounter <= 0) {
            hitCounter = getHitCounter(currentLevel);
            hitCounterMax = hitCounter;
        }
        if (shooter.queue.length > 0) {
            shooter.queue.pop();
        }
    }

    function reborn() {
        if (shooter.queue.length > 0) {
            shooter.prevColor = shooter.currentType;
            shooter.currentType = shooter.queue.shift();
        } else {
            shooter.currentType = randomType();
        }
        shooter.queue.push(randomType());
        shooter.status = 'none';
        flyBall = null;
    }

    function completeLevel() {
        gameState = 'levelcomplete';
        score += 500;
        setTimeout(() => {
            currentLevel++;
            if (currentLevel > 40) currentLevel = 40;
            startColorsNumber = initColors(currentLevel);
            hitCounter = getHitCounter(currentLevel);
            hitCounterMax = hitCounter;
            shooter.firstAd = false;
            failCounter = 0;
            comboCount = 0;
            directions = [1, 1, 1, 1];
            initGrid();
            loadLevel();
            initQueue();
            gameState = 'playing';
            updateUI();
        }, 1500);
    }

    // === 轨迹预览 - 100%对标原始emulateUpdate ===
    function calcTrajectory(rotation) {
        const pts = [];
        let x = AIM_POINT_X;
        let y = AIM_POINT_Y;
        const speed = SHOOT_SPEED;
        const dt = CONST_DT;
        let bouncePoints = [];

        for (let i = 0; i < 100; i++) {
            x += dt * speed * Math.sin(rotation);
            y -= dt * speed * Math.cos(rotation);

            // 碰撞检查
            let hit = null;
            for (let row = 0; row < SIZE_Y; row++) {
                for (let col = 0; col < SIZE_X; col++) {
                    const node = gridArray[row][col];
                    if (node.tile !== null && circleIntersection(
                        x + BALL_W / 2, y + BALL_H / 2, LEVEL_RADIUS,
                        node.x + BALL_W / 2, node.y + BALL_H / 2, LEVEL_RADIUS
                    )) {
                        hit = node;
                        break;
                    }
                }
                if (hit) break;
            }

            if (hit) {
                pts.push({ x, y });
                break;
            }

            // 顶墙
            if (y <= WALL_TOP + RADIUS_WALL) {
                pts.push({ x, y });
                break;
            }

            // 左右墙（记录位置但不反弹，100%对标原始）
            if (x <= WALL_LEFT + RADIUS_WALL) {
                bouncePoints.push({ x, y });
            }
            if (x > WALL_RIGHT - RADIUS_WALL) {
                bouncePoints.push({ x, y });
            }

            pts.push({ x, y });

            if (y >= WALL_BOTTOM + RADIUS_WALL) break;
        }
        return pts;
    }

    // === 渲染 ===
    function drawBackground() {
        if (!bgCache || bgCache.width !== canvas.width) {
            bgCache = document.createElement('canvas');
            bgCache.width = canvas.width;
            bgCache.height = canvas.height;
            const bgCtx = bgCache.getContext('2d');
            bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

            const grad = bgCtx.createLinearGradient(0, 0, W * 0.3, H);
            grad.addColorStop(0, '#ff8c42');
            grad.addColorStop(0.35, '#ff6b6b');
            grad.addColorStop(0.65, '#ee5a24');
            grad.addColorStop(1, '#ff8c42');
            bgCtx.fillStyle = grad;
            bgCtx.fillRect(0, 0, W, H);

            for (let i = 0; i < 15; i++) {
                const bx = Math.random() * W;
                const by = Math.random() * H;
                const br = 20 + Math.random() * 60;
                bgCtx.beginPath();
                bgCtx.arc(bx, by, br, 0, Math.PI * 2);
                const g = bgCtx.createRadialGradient(bx, by, 0, bx, by, br);
                g.addColorStop(0, 'rgba(255,255,255,0.12)');
                g.addColorStop(1, 'rgba(255,255,255,0)');
                bgCtx.fillStyle = g;
                bgCtx.fill();
            }
        }
        ctx.drawImage(bgCache, 0, 0, canvas.width, canvas.height, 0, 0, W, H);
    }

    function drawBean3D(x, y, type, radius, alpha) {
        radius = Math.max(2, radius);
        const a = alpha !== undefined ? alpha : 1;

        if (spritesLoaded) {
            const sprite = type === RAINBOW_TYPE ? rainbowSprite
                         : (type >= 0 && type < beanSprites.length) ? beanSprites[type]
                         : null;
            if (sprite && sprite.complete && sprite.naturalWidth > 0) {
                ctx.save();
                ctx.globalAlpha = a;
                ctx.drawImage(sprite, x - radius, y - radius, radius * 2, radius * 2);
                ctx.restore();
                return;
            }
        }

        const isRainbow = type === RAINBOW_TYPE;
        const ci = (!isRainbow && type >= 0 && type < COLORS_HEX.length) ? type : -1;

        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(x, y);

        ctx.beginPath();
        ctx.ellipse(1, radius * 0.12, radius * 0.82, radius * 0.28, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 0.92, radius * 0.78, 0, 0, Math.PI * 2);
        if (isRainbow) {
            const g = ctx.createLinearGradient(-radius, -radius, radius, radius);
            g.addColorStop(0, '#e74c3c'); g.addColorStop(0.17, '#e67e22');
            g.addColorStop(0.33, '#f1c40f'); g.addColorStop(0.5, '#2ecc71');
            g.addColorStop(0.67, '#3498db'); g.addColorStop(0.83, '#9b59b6');
            g.addColorStop(1, '#e74c3c');
            ctx.fillStyle = g;
        } else if (ci >= 0) {
            const g = ctx.createRadialGradient(-radius * 0.25, -radius * 0.3, radius * 0.08, 0, 0, radius);
            g.addColorStop(0, COLORS_LIGHT[ci]);
            g.addColorStop(0.5, COLORS_HEX[ci]);
            g.addColorStop(1, COLORS_DARK[ci]);
            ctx.fillStyle = g;
        } else {
            ctx.fillStyle = '#ccc';
        }
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(-radius * 0.2, -radius * 0.22, radius * 0.32, radius * 0.18, -0.3, 0, Math.PI * 2);
        const hl = ctx.createRadialGradient(-radius * 0.2, -radius * 0.22, 0, -radius * 0.2, -radius * 0.22, radius * 0.32);
        hl.addColorStop(0, 'rgba(255,255,255,0.65)');
        hl.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = hl;
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 0.9, radius * 0.76, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.restore();
    }

    function drawGrid() {
        if (gridArray.length === 0) return;
        const r = BALL_W * 0.45 * gameScale;
        for (let row = 0; row < SIZE_Y; row++) {
            if (!gridArray[row]) continue;
            for (let col = 0; col < SIZE_X; col++) {
                const node = gridArray[row][col];
                if (node && node.tile !== null) {
                    const s = toScreen(node.x, node.y);
                    drawBean3D(s.x, s.y, node.tile, r, 1);
                }
            }
        }
    }

    function drawShooter() {
        if (gameState !== 'playing' && gameState !== 'levelcomplete') return;

        const s = toScreen(AIM_POINT_X, AIM_POINT_Y);
        const sx = s.x, sy = s.y;
        const r = BALL_W * 0.45 * gameScale;

        // 底座圆盘 - 100%对标原始 central.png
        ctx.save();
        ctx.translate(sx, sy);

        // 外圈光晕
        ctx.beginPath();
        ctx.arc(0, 0, r * 2.5, 0, Math.PI * 2);
        const outerGlow = ctx.createRadialGradient(0, 0, r * 1.5, 0, 0, r * 2.5);
        outerGlow.addColorStop(0, 'rgba(255,200,100,0.15)');
        outerGlow.addColorStop(1, 'rgba(255,200,100,0)');
        ctx.fillStyle = outerGlow;
        ctx.fill();

        // 中心圆盘
        ctx.beginPath();
        ctx.arc(0, 0, r * 2, 0, Math.PI * 2);
        const bg = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.3, 0, 0, r * 2);
        bg.addColorStop(0, 'rgba(90,50,140,0.9)');
        bg.addColorStop(0.6, 'rgba(60,30,100,0.85)');
        bg.addColorStop(1, 'rgba(40,20,70,0.7)');
        ctx.fillStyle = bg;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 内圈
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.3, 0, Math.PI * 2);
        const inner = ctx.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r * 1.3);
        inner.addColorStop(0, 'rgba(120,80,180,0.6)');
        inner.addColorStop(1, 'rgba(60,30,100,0.3)');
        ctx.fillStyle = inner;
        ctx.fill();
        ctx.restore();

        // 方向箭头 - 100%对标原始arrows (setOrigin(.5, 3.6)表示锚点在下方远处)
        if (shooter.status === 'none') {
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(shooter.angle + Math.PI / 2);

            // 箭头线（从中心向上延伸）
            const arrowLen = r * 3.6;
            const arrowW = r * 0.3;

            ctx.beginPath();
            ctx.moveTo(-arrowW, 0);
            ctx.lineTo(-arrowW * 0.6, -arrowLen * 0.85);
            ctx.lineTo(0, -arrowLen);
            ctx.lineTo(arrowW * 0.6, -arrowLen * 0.85);
            ctx.lineTo(arrowW, 0);
            ctx.closePath();

            const ag = ctx.createLinearGradient(0, 0, 0, -arrowLen);
            ag.addColorStop(0, 'rgba(200,160,255,0.8)');
            ag.addColorStop(0.5, 'rgba(180,140,240,0.5)');
            ag.addColorStop(1, 'rgba(160,120,220,0.2)');
            ctx.fillStyle = ag;
            ctx.fill();

            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.restore();
        }

        // 轨迹预览
        if (shooter.status === 'none') {
            const traj = calcTrajectory(shooter.angle);
            ctx.save();
            ctx.setLineDash([5, 7]);
            ctx.strokeStyle = 'rgba(255,255,255,0.22)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            if (traj.length > 0) {
                const p0 = toScreen(traj[0].x, traj[0].y);
                ctx.moveTo(p0.x, p0.y);
                for (let i = 1; i < traj.length; i++) {
                    const p = toScreen(traj[i].x, traj[i].y);
                    ctx.lineTo(p.x, p.y);
                }
            }
            ctx.stroke();
            ctx.setLineDash([]);

            if (traj.length > 1) {
                const last = toScreen(traj[traj.length - 1].x, traj[traj.length - 1].y);
                ctx.beginPath();
                ctx.arc(last.x, last.y, r * 0.8, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255,255,255,0.15)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
            ctx.restore();
        }

        // 当前球
        if (shooter.status === 'none') {
            drawBean3D(sx, sy, shooter.currentType, r, 1);
            if (shooter.currentType === RAINBOW_TYPE) {
                ctx.save();
                ctx.globalAlpha = 0.3 + Math.sin(animFrame * 0.08) * 0.15;
                ctx.beginPath();
                ctx.arc(sx, sy, r * 1.5, 0, Math.PI * 2);
                const gg = ctx.createRadialGradient(sx, sy, r * 0.3, sx, sy, r * 1.5);
                gg.addColorStop(0, 'rgba(255,255,255,0.3)');
                gg.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.fillStyle = gg;
                ctx.fill();
                ctx.restore();
            }
        }

        // 队列预览 - 100%对标原始initBalls（在startPoint左侧排列）
        const sp = toScreen(START_POINT_X, START_POINT_Y);
        const qr = r * 0.55;
        for (let i = 0; i < Math.min(5, shooter.queue.length); i++) {
            drawBean3D(sp.x - (i + 1) * qr * 2.2, sp.y, shooter.queue[i], qr, 0.6 - i * 0.08);
        }

        // Hit Counter环
        const progress = 1 - (hitCounter / hitCounterMax);
        const pr = r * 2.5;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.beginPath();
        ctx.arc(0, 0, pr, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 3;
        ctx.stroke();
        if (progress > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, pr, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
            ctx.strokeStyle = progress > 0.8 ? '#e74c3c' : '#ffd700';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.floor(r * 0.9)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(hitCounter, 0, 0);
        ctx.restore();
    }

    function drawFlyBall() {
        if (!flyBall || shooter.status !== 'fly') return;
        const r = BALL_W * 0.45 * gameScale;
        const s = toScreen(flyBall.x, flyBall.y);
        drawBean3D(s.x, s.y, flyBall.type, r, 1);
    }

    function drawDangerZone() {
        if (checkForFail()) {
            const alpha = 0.3 + Math.sin(animFrame * 0.06) * 0.15;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.setLineDash([8, 4]);
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 2;
            const y0 = toScreen(0, 0).y;
            const y1 = toScreen(0, WALL_BOTTOM).y;
            ctx.beginPath();
            ctx.moveTo(15, y0);
            ctx.lineTo(W - 15, y0);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(15, y1);
            ctx.lineTo(W - 15, y1);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }
    }

    // === 粒子 ===
    function spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const sp = 2 + Math.random() * 4;
            particles.push({
                x, y,
                vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2,
                radius: 2 + Math.random() * 3,
                color, life: 1, decay: 0.018 + Math.random() * 0.02
            });
        }
    }

    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.14; p.life -= p.decay;
            if (p.life <= 0) particles.splice(i, 1);
        }
    }

    function drawParticles() {
        for (const p of particles) {
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(1, p.radius * p.life), 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.restore();
        }
    }

    function spawnFallingBean(x, y, type) {
        fallingBeans.push({
            x, y,
            vx: (Math.random() - 0.5) * 4,
            vy: -2 + Math.random() * 2,
            type: type,
            life: 1,
            rot: Math.random() * Math.PI * 2,
            rotS: (Math.random() - 0.5) * 0.3
        });
    }

    function updateFallingBeans() {
        for (let i = fallingBeans.length - 1; i >= 0; i--) {
            const fb = fallingBeans[i];
            fb.x += fb.vx; fb.y += fb.vy; fb.vy += 0.28; fb.rot += fb.rotS; fb.life -= 0.013;
            if (fb.y > H + 50 || fb.life <= 0) fallingBeans.splice(i, 1);
        }
    }

    function drawFallingBeans() {
        const r = BALL_W * 0.45 * gameScale;
        for (const fb of fallingBeans) {
            ctx.save();
            ctx.globalAlpha = fb.life;
            ctx.translate(fb.x, fb.y);
            ctx.rotate(fb.rot);
            drawBean3D(0, 0, fb.type, r, fb.life);
            ctx.restore();
        }
    }

    // === UI ===
    function showCombo(c, count) {
        const el = document.getElementById('combo-display');
        if (!el) return;
        el.textContent = c > 1 ? `${c}x 连击! +${count * 10 * c}` : count >= 5 ? `超级消除! x${count}` : `+${count * 10}`;
        el.classList.add('show');
        clearTimeout(comboTimer);
        comboTimer = setTimeout(() => el.classList.remove('show'), 1200);
    }

    function updateUI() {
        const s = document.getElementById('score-value');
        const w = document.getElementById('wave-value');
        if (s) s.textContent = score;
        if (w) w.textContent = currentLevel;
    }

    function showGameOver() {
        document.getElementById('final-score').textContent = score;
        document.getElementById('final-wave').textContent = currentLevel;
        document.getElementById('game-over-screen').classList.remove('hidden');
    }

    // === 输入 ===
    function updateAim(cx, cy) {
        const rect = canvas.getBoundingClientRect();
        const mx = cx - rect.left;
        const my = cy - rect.top;
        if (gameState !== 'playing' || shooter.status !== 'none') return;

        // 转换到游戏坐标
        const s = toScreen(AIM_POINT_X, AIM_POINT_Y);
        const dx = mx - s.x, dy = my - s.y;
        let angle = Math.atan2(dy, dx);

        // 100%对标原始: leftLimit = -PI/2 + 0.2, rightLimit = PI/2 - 0.2
        if (angle > -Math.PI / 2 + 0.2) angle = -Math.PI / 2 + 0.2;
        if (angle < -Math.PI / 2 - 0.2 + (-Math.PI)) angle = -Math.PI / 2 - 0.2 + (-Math.PI);
        shooter.angle = angle;
    }

    canvas.addEventListener('mousemove', e => updateAim(e.clientX, e.clientY));
    canvas.addEventListener('click', () => { if (gameState === 'playing') shoot(); });
    canvas.addEventListener('touchmove', e => { e.preventDefault(); updateAim(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
    canvas.addEventListener('touchstart', e => { e.preventDefault(); updateAim(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
    canvas.addEventListener('touchend', e => { e.preventDefault(); if (gameState === 'playing') shoot(); }, { passive: false });

    // === 主循环 ===
    function gameLoop() {
        animFrame++;
        ctx.clearRect(0, 0, W, H);
        drawBackground();
        drawDangerZone();
        drawGrid();

        if (gameState === 'playing') updateFlyBall();
        drawFlyBall();
        updateParticles();
        drawParticles();
        updateFallingBeans();
        drawFallingBeans();

        if (gameState === 'playing' || gameState === 'levelcomplete') drawShooter();

        if (gameState === 'levelcomplete') {
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#ffd700';
            ctx.font = `bold ${Math.floor(W * 0.06)}px "Righteous", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(255,200,0,0.5)';
            ctx.shadowBlur = 20;
            ctx.fillText(`关卡 ${currentLevel} 完成!`, W / 2, H / 2);
            ctx.restore();
        }

        requestAnimationFrame(gameLoop);
    }

    // === 启动 ===
    function startGame() {
        score = 0;
        currentLevel = 1;
        comboCount = 0;
        startColorsNumber = 3;
        hitCounter = getHitCounter(currentLevel);
        hitCounterMax = hitCounter;
        failCounter = 0;
        shooter.firstAd = false;
        shooter.status = 'none';
        shooter.prevColor = -1;
        flyBall = null;
        particles = [];
        fallingBeans = [];
        bgCache = null;
        directions = [1, 1, 1, 1];

        initGrid();
        loadLevel();
        initQueue();

        gameState = 'playing';
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');
        updateUI();
    }

    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('restart-btn').addEventListener('click', startGame);

    gameLoop();
})();
