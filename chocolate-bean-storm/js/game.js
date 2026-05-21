// ============================================
// Chocolate Bean Storm - 100%对标Bubble Storm
// 六角蜂巢网格 + BFS消除 + 轨迹预览 + 关卡系统
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

    // === 布局参数 ===
    const isHorizontal = window.innerWidth > window.innerHeight;

    // 球体参数
    const BALL_SIZE = 40;
    const BALL_RADIUS = BALL_SIZE / 2;

    // 游戏区域逻辑尺寸
    const GAME_W = isHorizontal ? 1280 : 720;
    const GAME_H = isHorizontal ? 720 : 1280;

    // 网格尺寸 - 垂直16列, 水平29列
    const GRID_COLS = isHorizontal ? 29 : 16;
    const GRID_ROWS = isHorizontal ? 17 : 32;

    // 初始填充尺寸
    const INIT_COLS = isHorizontal ? 10 : 5;
    const INIT_ROWS = isHorizontal ? 6 : 10;

    // 颜色定义 - 对标原始11种颜色
    const COLORS = [
        { name:'red',       css:'#FD0B0B', light:'#ff4d4d', dark:'#b00808' },
        { name:'green',     css:'#1FFF1F', light:'#66ff66', dark:'#14b314' },
        { name:'blue',      css:'#0000FF', light:'#4d4dff', dark:'#0000b3' },
        { name:'pink',      css:'#FE08FE', light:'#fe66fe', dark:'#b305b3' },
        { name:'cyan',      css:'#0EFFFF', light:'#66ffff', dark:'#0ab3b3' },
        { name:'yellow',    css:'#FFFF00', light:'#ffff66', dark:'#b3b300' },
        { name:'darkgreen', css:'#009933', light:'#33cc66', dark:'#006622' },
        { name:'purple',    css:'#9900FF', light:'#b366ff', dark:'#6b00b3' },
        { name:'lightblue', css:'#008FFE', light:'#4db3ff', dark:'#0066b3' },
        { name:'orange',    css:'#FF6600', light:'#ff994d', dark:'#b34700' },
        { name:'white',     css:'#FFFFFF', light:'#ffffff', dark:'#cccccc' },
    ];
    const RAINBOW_TYPE = 16;

    // 关卡数据
    const LEVEL_GOALS = [
        [9900,1e4,10,0,0,0,0,0,0,0],[99,10,5,5,0,0,0,0,0,0],[99,20,0,0,0,0,0,0,0,0],
        [99,10,10,10,10,0,0,0,0,0],[100,10,0,0,0,0,0,0,0,0],[100,0,0,0,0,0,0,0,0,0],
        [100,50,0,0,0,0,0,0,0,0],[100,20,20,0,0,0,0,0,0,0],[10,0,0,0,0,0,0,0,0,0],
        [10,20,20,20,0,0,0,0,0,0],[10,50,0,0,0,0,0,0,0,0],[100,50,100,0,0,0,0,0,0],
        [100,70,70,0,0,0,0,0,0,0],[100,40,40,40,0,0,0,0,0,0],[100,80,70,60,0,0,0,0,0],
        [100,0,0,80,80,0,0,0,0,0],[100,0,70,70,0,0,0,0,0,0],[100,80,0,0,80,0,0,0,0,0],
        [100,90,0,0,0,0,0,0,0,0],[100,90,0,0,0,0,0,0,0,0],[100,90,0,0,0,0,0,0,0,0],
        [100,0,0,0,0,0,0,0,0,0],[100,0,0,0,0,0,0,0,0,0],[100,0,0,0,0,0,0,0,0,0],
        [100,0,0,0,0,0,0,0,0,0],[100,0,0,0,0,0,0,0,0,0],[100,0,0,0,0,0,0,0,0,0],
        [100,0,0,0,0,0,0,0,0,0],[100,0,0,0,0,0,0,0,0,0],[100,0,0,0,0,0,0,0,0,0],
        [100,0,0,0,0,0,0,0,0,0],[100,0,0,0,0,0,0,0,0,0],[100,0,0,0,0,0,0,0,0,0],
        [100,0,0,0,0,0,0,0,0,0],[100,0,0,0,0,0,0,0,0,0],[100,0,0,0,0,0,0,0,0,0],
        [100,0,0,0,0,0,0,0,0,0],[100,0,0,0,0,0,0,0,0,0],[100,0,0,0,0,0,0,0,0,0],
        [100,0,0,0,0,0,0,0,0,0],[100,0,0,0,0,0,0,0,0,0]
    ];

    // === Canvas设置 ===
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    let W, H, dpr, scale;
    let cellSize, gridOffX, gridOffY, gridWidth, gridHeight;
    let aimX, aimY;
    let bgCache = null;

    function setupCanvas() {
        dpr = window.devicePixelRatio || 1;
        const container = document.getElementById('game-container');
        const cw = container.clientWidth;
        const ch = container.clientHeight;

        // 缩放以适应屏幕
        scale = Math.min(cw / GAME_W, ch / GAME_H);
        W = Math.floor(GAME_W * scale);
        H = Math.floor(GAME_H * scale);

        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // 网格单元格大小 - 基于游戏宽度
        // 球体大小 = 40px * scale, 但确保网格能容纳所有列
        cellSize = (W * 0.92) / GRID_COLS;
        const ballRadius = cellSize / 2 * 0.85;

        // 网格居中
        gridWidth = GRID_COLS * cellSize;
        gridHeight = GRID_ROWS * cellSize * 0.87;
        gridOffX = (W - gridWidth) / 2;
        gridOffY = W * 0.02;

        // 射击点位置
        if (isHorizontal) {
            aimX = W * 0.49;
            aimY = H * 0.85;
        } else {
            aimX = W * 0.5;
            aimY = H * 0.87;
        }

        bgCache = null;
    }

    setupCanvas();
    window.addEventListener('resize', setupCanvas);

    // === 网格系统 ===
    let grid = [];

    function initGrid() {
        grid = [];
        for (let r = 0; r < GRID_ROWS; r++) {
            grid[r] = [];
            for (let c = 0; c < GRID_COLS; c++) {
                grid[r][c] = null;
            }
        }
    }

    // 六角网格像素坐标
    function cellPos(row, col) {
        const halfCell = cellSize / 2;
        const offset = (row % 2 === 1) ? halfCell : 0;
        const x = gridOffX + col * cellSize + halfCell + offset;
        const y = gridOffY + row * cellSize * 0.87 + halfCell;
        return { x, y };
    }

    // 获取六角邻居
    function getNeighbors(row, col) {
        const even = row % 2 === 0;
        const offsets = even
            ? [[-1,-1],[-1,0],[0,-1],[0,1],[1,-1],[1,0]]
            : [[-1,0],[-1,1],[0,-1],[0,1],[1,0],[1,1]];
        const result = [];
        for (const [dr, dc] of offsets) {
            const nr = row + dr, nc = col + dc;
            if (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS) {
                result.push({ row: nr, col: nc });
            }
        }
        return result;
    }

    // BFS找同色相连
    function findConnected(row, col) {
        const startType = grid[row][col];
        if (startType === null) return [];
        const visited = new Set();
        const connected = [];
        const queue = [{ row, col }];
        visited.add(`${row},${col}`);

        while (queue.length > 0) {
            const { row: r, col: c } = queue.shift();
            const type = grid[r][c];
            if (type === null) continue;

            const match = startType === RAINBOW_TYPE ||
                          type === RAINBOW_TYPE ||
                          type === startType;
            if (!match) continue;

            connected.push({ row: r, col: c });
            for (const n of getNeighbors(r, c)) {
                const key = `${n.row},${n.col}`;
                if (!visited.has(key)) {
                    visited.add(key);
                    queue.push(n);
                }
            }
        }
        return connected;
    }

    // 找悬浮球体
    function findFloating() {
        const connected = new Set();
        const queue = [];
        for (let c = 0; c < GRID_COLS; c++) {
            if (grid[0][c] !== null) {
                queue.push({ row: 0, col: c });
                connected.add(`0,${c}`);
            }
        }
        while (queue.length > 0) {
            const { row, col } = queue.shift();
            for (const n of getNeighbors(row, col)) {
                const key = `${n.row},${n.col}`;
                if (!connected.has(key) && grid[n.row][n.col] !== null) {
                    connected.add(key);
                    queue.push(n);
                }
            }
        }
        const floating = [];
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                if (grid[r][c] !== null && !connected.has(`${r},${c}`)) {
                    floating.push({ row: r, col: c });
                }
            }
        }
        return floating;
    }

    // === 游戏状态 ===
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

    // 射击器
    let shooter = {
        angle: -Math.PI / 2,
        currentType: 0,
        queue: [],
        status: 'none',
        firstAd: false
    };

    // 可用颜色数
    function getColorCount() {
        return Math.min(3 + (currentLevel - 1), COLORS.length);
    }

    function getHitCounter(level) {
        return level === 1 ? 10 : 5 + 4 * level - 1;
    }

    function randomType() {
        const count = getColorCount();
        // 优先选择网格中存在的颜色
        const inGrid = new Set();
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                if (grid[r][c] !== null && grid[r][c] !== RAINBOW_TYPE) {
                    inGrid.add(grid[r][c]);
                }
            }
        }
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

    // === 关卡加载 ===
    function loadLevel() {
        const colorCount = getColorCount();
        const rows = Math.min(INIT_ROWS, GRID_ROWS);
        const cols = Math.min(INIT_COLS, GRID_COLS);

        // 居中列偏移
        const colOffset = Math.floor((GRID_COLS - cols) / 2);

        for (let r = 0; r < rows; r++) {
            const rowCols = (r % 2 === 1) ? Math.max(0, cols - 1) : cols;
            const rowOff = (r % 2 === 1) ? colOffset + 1 : colOffset;
            for (let c = 0; c < rowCols; c++) {
                const gc = rowOff + c;
                if (gc >= 0 && gc < GRID_COLS) {
                    grid[r][gc] = Math.floor(Math.random() * colorCount);
                }
            }
        }
    }

    // === 碰撞和吸附 ===
    function getNearestEmpty(px, py) {
        let best = null, bestDist = Infinity;
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                if (grid[r][c] !== null) continue;
                const pos = cellPos(r, c);
                const dx = px - pos.x, dy = py - pos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < bestDist && dist < cellSize * 1.3) {
                    if (r === 0 || hasNeighborTile(r, c)) {
                        bestDist = dist;
                        best = { row: r, col: c };
                    }
                }
            }
        }
        return best;
    }

    function hasNeighborTile(r, c) {
        return getNeighbors(r, c).some(n => grid[n.row] && grid[n.row][n.col] !== null);
    }

    // === 射击系统 ===
    function shoot() {
        if (shooter.status !== 'none' || gameState !== 'playing') return;
        shooter.status = 'fly';
        const speed = 12;
        flyBall = {
            x: aimX,
            y: aimY,
            vx: Math.cos(shooter.angle) * speed,
            vy: Math.sin(shooter.angle) * speed,
            type: shooter.currentType
        };
    }

    function updateFlyBall() {
        if (!flyBall || shooter.status !== 'fly') return;

        const steps = 4;
        const svx = flyBall.vx / steps;
        const svy = flyBall.vy / steps;

        for (let s = 0; s < steps; s++) {
            flyBall.x += svx;
            flyBall.y += svy;

            // 左右墙壁反弹
            const margin = gridOffX + cellSize * 0.4;
            const rightBound = W - margin;
            if (flyBall.x < margin) {
                flyBall.x = margin;
                flyBall.vx = -flyBall.vx;
            }
            if (flyBall.x > rightBound) {
                flyBall.x = rightBound;
                flyBall.vx = -flyBall.vx;
            }

            // 碰到顶部
            if (flyBall.y <= gridOffY + cellSize * 0.3) {
                doSnap();
                return;
            }

            // 碰到已有球体
            for (let r = 0; r < GRID_ROWS; r++) {
                for (let c = 0; c < GRID_COLS; c++) {
                    if (grid[r][c] === null) continue;
                    const pos = cellPos(r, c);
                    const dx = flyBall.x - pos.x, dy = flyBall.y - pos.y;
                    if (Math.sqrt(dx * dx + dy * dy) < cellSize * 0.75) {
                        doSnap();
                        return;
                    }
                }
            }
        }
    }

    function doSnap() {
        const snap = getNearestEmpty(flyBall.x, flyBall.y);
        if (!snap) {
            reborn();
            return;
        }

        let ballType = flyBall.type;

        // 彩虹球匹配附近颜色
        if (ballType === RAINBOW_TYPE) {
            const neighbors = getNeighbors(snap.row, snap.col);
            for (const n of neighbors) {
                if (grid[n.row][n.col] !== null && grid[n.row][n.col] !== RAINBOW_TYPE) {
                    ballType = grid[n.row][n.col];
                    break;
                }
            }
        }

        grid[snap.row][snap.col] = ballType;

        // BFS匹配
        const connected = findConnected(snap.row, snap.col);
        if (connected.length >= 3) {
            comboCount++;
            const pts = connected.length * 10 * comboCount;
            score += pts;

            for (const item of connected) {
                const pos = cellPos(item.row, item.col);
                const t = grid[item.row][item.col];
                const color = (t !== null && t < COLORS.length) ? COLORS[t].css : '#fff';
                spawnParticles(pos.x, pos.y, color, 8);
                spawnFallingBean(pos.x, pos.y, t);
                grid[item.row][item.col] = null;
            }

            // 悬浮球体
            const floating = findFloating();
            if (floating.length > 0) {
                score += floating.length * 15 * comboCount;
                for (const item of floating) {
                    const pos = cellPos(item.row, item.col);
                    const t = grid[item.row][item.col];
                    const color = (t !== null && t < COLORS.length) ? COLORS[t].css : '#fff';
                    spawnParticles(pos.x, pos.y, color, 5);
                    spawnFallingBean(pos.x, pos.y, t);
                    grid[item.row][item.col] = null;
                }
            }

            showCombo(comboCount, connected.length);
        } else {
            comboCount = 0;
        }

        // 减少hitCounter
        hitCounter--;

        // 检查失败
        if (checkFail()) {
            gameState = 'gameover';
            showGameOver();
            return;
        }

        // 检查通关
        if (checkWin()) {
            completeLevel();
            return;
        }

        // hitCounter耗尽时给彩虹球
        if (hitCounter <= 0) {
            if (!shooter.firstAd) {
                shooter.firstAd = true;
                shooter.currentType = RAINBOW_TYPE;
                hitCounter = getHitCounter(currentLevel);
                hitCounterMax = hitCounter;
                shooter.status = 'none';
                flyBall = null;
                return;
            }
            hitCounter = getHitCounter(currentLevel);
            hitCounterMax = hitCounter;
        }

        reborn();
    }

    function reborn() {
        if (shooter.queue.length > 0) {
            shooter.currentType = shooter.queue.shift();
            shooter.queue.push(randomType());
        } else {
            shooter.currentType = randomType();
        }
        shooter.status = 'none';
        flyBall = null;
    }

    function checkFail() {
        const dangerRow = GRID_ROWS - 3;
        for (let r = dangerRow; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                if (grid[r][c] !== null) return true;
            }
        }
        return false;
    }

    function checkWin() {
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                if (grid[r][c] !== null) return false;
            }
        }
        return true;
    }

    function completeLevel() {
        gameState = 'levelcomplete';
        score += 500;
        setTimeout(() => {
            currentLevel++;
            if (currentLevel > 40) currentLevel = 40;
            hitCounter = getHitCounter(currentLevel);
            hitCounterMax = hitCounter;
            shooter.firstAd = false;
            failCounter = 0;
            comboCount = 0;
            initGrid();
            loadLevel();
            initQueue();
            gameState = 'playing';
            updateUI();
        }, 1500);
    }

    // === 轨迹预览 ===
    function calcTrajectory(angle) {
        const pts = [];
        let x = aimX, y = aimY;
        const speed = 8;
        let vx = Math.cos(angle) * speed;
        let vy = Math.sin(angle) * speed;
        pts.push({ x, y });

        for (let i = 0; i < 100; i++) {
            x += vx;
            y += vy;
            const margin = gridOffX + cellSize * 0.4;
            const rightBound = W - margin;
            if (x < margin) { x = margin; vx = -vx; }
            if (x > rightBound) { x = rightBound; vx = -vx; }
            if (y <= gridOffY + cellSize * 0.3) { pts.push({ x, y }); break; }

            let hit = false;
            for (let r = 0; r < GRID_ROWS && !hit; r++) {
                for (let c = 0; c < GRID_COLS && !hit; c++) {
                    if (grid[r][c] === null) continue;
                    const pos = cellPos(r, c);
                    const dx = x - pos.x, dy = y - pos.y;
                    if (Math.sqrt(dx * dx + dy * dy) < cellSize * 0.75) hit = true;
                }
            }
            pts.push({ x, y });
            if (hit) break;
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

            // 暖色渐变（对标原始bg0.png）
            const grad = bgCtx.createLinearGradient(0, 0, W * 0.3, H);
            grad.addColorStop(0, '#ff8c42');
            grad.addColorStop(0.35, '#ff6b6b');
            grad.addColorStop(0.65, '#ee5a24');
            grad.addColorStop(1, '#ff8c42');
            bgCtx.fillStyle = grad;
            bgCtx.fillRect(0, 0, W, H);

            // 半透明光球
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

            // 游戏区域半透明底
            const gw = gridWidth + 10;
            const gh = GRID_ROWS * cellSize * 0.87 + 10;
            bgCtx.fillStyle = 'rgba(0,0,0,0.08)';
            bgCtx.beginPath();
            bgCtx.roundRect(gridOffX - 5, gridOffY - 5, gw, gh, 12);
            bgCtx.fill();
        }
        ctx.drawImage(bgCache, 0, 0, canvas.width, canvas.height, 0, 0, W, H);
    }

    function drawBean3D(x, y, type, radius, alpha) {
        radius = Math.max(2, radius);
        const a = alpha !== undefined ? alpha : 1;

        // 尝试使用AI生成的精灵图
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

        // 降级：Canvas 2D绘制
        const isRainbow = type === RAINBOW_TYPE;
        const colorObj = (!isRainbow && type >= 0 && type < COLORS.length) ? COLORS[type] : null;

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
        } else if (colorObj) {
            const g = ctx.createRadialGradient(-radius * 0.25, -radius * 0.3, radius * 0.08, 0, 0, radius);
            g.addColorStop(0, colorObj.light);
            g.addColorStop(0.5, colorObj.css);
            g.addColorStop(1, colorObj.dark);
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
        const r = cellSize * 0.42;
        for (let row = 0; row < GRID_ROWS; row++) {
            for (let col = 0; col < GRID_COLS; col++) {
                if (!grid[row]) continue;
                const type = grid[row][col];
                if (type !== null) {
                    const pos = cellPos(row, col);
                    drawBean3D(pos.x, pos.y, type, r, 1);
                }
            }
        }
    }

    function drawShooter() {
        if (gameState !== 'playing' && gameState !== 'levelcomplete') return;

        const sx = aimX, sy = aimY;
        const r = cellSize * 0.42;

        // 底座
        ctx.save();
        ctx.translate(sx, sy);
        ctx.beginPath();
        ctx.arc(0, 0, r * 2.2, 0, Math.PI * 2);
        const bg = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 2.2);
        bg.addColorStop(0, 'rgba(60,30,90,0.8)');
        bg.addColorStop(1, 'rgba(30,15,50,0.6)');
        ctx.fillStyle = bg;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 发射管
        ctx.save();
        ctx.rotate(shooter.angle + Math.PI / 2);
        const tw = 10, th = r * 2.8;
        ctx.beginPath();
        ctx.roundRect(-tw / 2, -th, tw, th, 4);
        const tg = ctx.createLinearGradient(-tw / 2, 0, tw / 2, 0);
        tg.addColorStop(0, '#5a4080');
        tg.addColorStop(0.5, '#7b5ea7');
        tg.addColorStop(1, '#5a4080');
        ctx.fillStyle = tg;
        ctx.fill();
        ctx.restore();
        ctx.restore();

        // 轨迹预览
        if (shooter.status === 'none') {
            const traj = calcTrajectory(shooter.angle);
            ctx.save();
            ctx.setLineDash([5, 7]);
            ctx.strokeStyle = 'rgba(255,255,255,0.22)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            if (traj.length > 0) {
                ctx.moveTo(traj[0].x, traj[0].y);
                for (let i = 1; i < traj.length; i++) ctx.lineTo(traj[i].x, traj[i].y);
            }
            ctx.stroke();
            ctx.setLineDash([]);

            if (traj.length > 1) {
                const last = traj[traj.length - 1];
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

        // 队列预览
        const qx0 = sx + r * 3;
        const qy0 = sy;
        for (let i = 0; i < Math.min(3, shooter.queue.length); i++) {
            const a = 0.5 - i * 0.12;
            drawBean3D(qx0 + i * r * 1.2, qy0, shooter.queue[i], r * 0.55, a);
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
        const r = cellSize * 0.42;
        drawBean3D(flyBall.x, flyBall.y, flyBall.type, r, 1);

        ctx.save();
        for (let i = 1; i <= 3; i++) {
            ctx.globalAlpha = 0.2 / i;
            drawBean3D(flyBall.x - flyBall.vx * i, flyBall.y - flyBall.vy * i, flyBall.type, r * 0.8, 0.2 / i);
        }
        ctx.restore();
    }

    function drawDangerZone() {
        const dangerRow = GRID_ROWS - 3;
        const y = gridOffY + dangerRow * cellSize * 0.87;
        let danger = false;
        for (let r = Math.max(0, dangerRow - 2); r <= dangerRow; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                if (grid[r] && grid[r][c] !== null) { danger = true; break; }
            }
            if (danger) break;
        }
        if (danger) {
            const alpha = 0.3 + Math.sin(animFrame * 0.06) * 0.15;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.setLineDash([8, 4]);
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(15, y);
            ctx.lineTo(W - 15, y);
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
        const r = cellSize * 0.42;
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
        const mx = (cx - rect.left) * (W / rect.width);
        const my = (cy - rect.top) * (H / rect.height);
        if (gameState !== 'playing' || shooter.status !== 'none') return;

        const dx = mx - aimX, dy = my - aimY;
        let angle = Math.atan2(dy, dx);

        if (angle > -0.15) angle = -0.15;
        if (angle < -Math.PI + 0.15) angle = -Math.PI + 0.15;
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
        hitCounter = getHitCounter(currentLevel);
        hitCounterMax = hitCounter;
        failCounter = 0;
        shooter.firstAd = false;
        shooter.status = 'none';
        flyBall = null;
        particles = [];
        fallingBeans = [];
        bgCache = null;

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
