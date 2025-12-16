/**
 * TRON Light Cycles - Single Player
 * Snake game reimagined as Tron light cycles with levels
 * Fixed version with better collision detection and animated background
 */

(function () {
    'use strict';

    const canvas = document.getElementById('snake-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Game settings
    const GRID_SIZE = 20;
    const TILE_COUNT = Math.floor(canvas.width / GRID_SIZE);

    // TRON Colors
    const COLORS = {
        player: '#00D4FF',
        playerGlow: 'rgba(0, 212, 255, 0.6)',
        enemy: '#FF6B00',
        enemyGlow: 'rgba(255, 107, 0, 0.6)',
        powerup: '#00FF88',
        powerupGlow: 'rgba(0, 255, 136, 0.5)',
        superPowerup: '#FF00FF',
        background: '#0a0a1a',
        grid: '#1a1a3a',
        text: '#00D4FF',
        gameOver: '#FF0040'
    };

    // Levels
    const LEVELS = [
        { name: 'Training', speed: 150, hasEnemy: false, obstacles: 0, powerups: 3 },
        { name: 'Easy', speed: 120, hasEnemy: false, obstacles: 3, powerups: 3 },
        { name: 'Normal', speed: 100, hasEnemy: false, obstacles: 5, powerups: 4 },
        { name: 'Duel', speed: 90, hasEnemy: true, obstacles: 3, powerups: 4 },
        { name: 'Hard', speed: 80, hasEnemy: true, obstacles: 6, powerups: 5 },
        { name: 'Insane', speed: 60, hasEnemy: true, obstacles: 10, powerups: 6 }
    ];

    // Game state
    let snake = [];
    let enemy = [];
    let enemyDir = { x: 0, y: 0 };
    let powerups = [];
    let obstacles = [];
    let direction = { x: 1, y: 0 };
    let nextDirection = { x: 1, y: 0 };
    let score = 0;
    let level = 0;
    let gameLoop = null;
    let isRunning = false;
    let gameSpeed = 100;
    let frameCount = 0;

    // Background particles
    let bgParticles = [];
    for (let i = 0; i < 40; i++) {
        bgParticles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
            size: Math.random() * 2 + 1,
            alpha: Math.random() * 0.4 + 0.1
        });
    }

    function init() {
        const lvl = LEVELS[level];
        gameSpeed = lvl.speed;

        // Player
        const startY = Math.floor(TILE_COUNT / 2);
        snake = [
            { x: 5, y: startY },
            { x: 4, y: startY },
            { x: 3, y: startY }
        ];
        direction = { x: 1, y: 0 };
        nextDirection = { x: 1, y: 0 };

        // Enemy
        if (lvl.hasEnemy) {
            enemy = [
                { x: TILE_COUNT - 5, y: startY },
                { x: TILE_COUNT - 4, y: startY },
                { x: TILE_COUNT - 3, y: startY }
            ];
            enemyDir = { x: -1, y: 0 };
        } else {
            enemy = [];
        }

        // Generate obstacles (not near spawn)
        obstacles = [];
        for (let i = 0; i < lvl.obstacles; i++) {
            let attempts = 0;
            let pos;
            do {
                pos = {
                    x: Math.floor(Math.random() * (TILE_COUNT - 4)) + 2,
                    y: Math.floor(Math.random() * (TILE_COUNT - 4)) + 2
                };
                attempts++;
            } while (attempts < 50 && (isNearSpawn(pos) || isOccupied(pos)));
            if (attempts < 50) obstacles.push(pos);
        }

        // Generate powerups
        powerups = [];
        for (let i = 0; i < lvl.powerups; i++) {
            spawnPowerup();
        }

        updateUI();
    }

    function isNearSpawn(pos) {
        return (pos.x < 8 && Math.abs(pos.y - TILE_COUNT / 2) < 3) ||
            (pos.x > TILE_COUNT - 8 && Math.abs(pos.y - TILE_COUNT / 2) < 3);
    }

    function isOccupied(pos) {
        return snake.some(s => s.x === pos.x && s.y === pos.y) ||
            enemy.some(e => e.x === pos.x && e.y === pos.y) ||
            obstacles.some(o => o.x === pos.x && o.y === pos.y) ||
            powerups.some(p => p.x === pos.x && p.y === pos.y);
    }

    function spawnPowerup() {
        let attempts = 0;
        let pos;
        do {
            pos = {
                x: Math.floor(Math.random() * (TILE_COUNT - 2)) + 1,
                y: Math.floor(Math.random() * (TILE_COUNT - 2)) + 1,
                type: Math.random() > 0.8 ? 'super' : 'normal'
            };
            attempts++;
        } while (attempts < 50 && isOccupied(pos));
        if (attempts < 50) powerups.push(pos);
    }

    function updateUI() {
        const scoreEl = document.getElementById('snake-score');
        const levelEl = document.getElementById('snake-level');
        if (scoreEl) scoreEl.textContent = score;
        if (levelEl) levelEl.textContent = LEVELS[level].name;
    }

    function updateEnemy() {
        if (enemy.length === 0) return;

        const head = enemy[0];

        // Simple chase AI with random turns
        if (frameCount % 8 === 0) {
            const moves = [
                { x: 1, y: 0 }, { x: -1, y: 0 },
                { x: 0, y: 1 }, { x: 0, y: -1 }
            ].filter(m => {
                if (m.x === -enemyDir.x && m.y === -enemyDir.y) return false;
                const nx = head.x + m.x;
                const ny = head.y + m.y;
                if (nx < 0 || nx >= TILE_COUNT || ny < 0 || ny >= TILE_COUNT) return false;
                if (obstacles.some(o => o.x === nx && o.y === ny)) return false;
                if (enemy.some(e => e.x === nx && e.y === ny)) return false;
                return true;
            });

            if (moves.length > 0) {
                // 60% chase, 40% random
                if (Math.random() > 0.4) {
                    moves.sort((a, b) => {
                        const dA = Math.abs((head.x + a.x) - snake[0].x) + Math.abs((head.y + a.y) - snake[0].y);
                        const dB = Math.abs((head.x + b.x) - snake[0].x) + Math.abs((head.y + b.y) - snake[0].y);
                        return dA - dB;
                    });
                    enemyDir = moves[0];
                } else {
                    enemyDir = moves[Math.floor(Math.random() * moves.length)];
                }
            }
        }

        const newHead = { x: head.x + enemyDir.x, y: head.y + enemyDir.y };

        // Check enemy death
        if (newHead.x < 0 || newHead.x >= TILE_COUNT ||
            newHead.y < 0 || newHead.y >= TILE_COUNT ||
            obstacles.some(o => o.x === newHead.x && o.y === newHead.y) ||
            enemy.slice(1).some(e => e.x === newHead.x && e.y === newHead.y)) {
            // Respawn enemy
            setTimeout(() => {
                if (isRunning && LEVELS[level].hasEnemy) {
                    const ry = Math.floor(Math.random() * (TILE_COUNT - 6)) + 3;
                    enemy = [
                        { x: TILE_COUNT - 3, y: ry },
                        { x: TILE_COUNT - 2, y: ry }
                    ];
                    enemyDir = { x: -1, y: 0 };
                }
            }, 2000);
            enemy = [];
            score += 100; // Bonus for enemy death
            return;
        }

        enemy.unshift(newHead);

        // Enemy eats powerup
        const pIdx = powerups.findIndex(p => p.x === newHead.x && p.y === newHead.y);
        if (pIdx !== -1) {
            powerups.splice(pIdx, 1);
            spawnPowerup();
        } else {
            enemy.pop();
        }
    }

    function update() {
        frameCount++;

        // Update background
        bgParticles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;
        });

        // Apply direction
        direction = { ...nextDirection };

        const head = {
            x: snake[0].x + direction.x,
            y: snake[0].y + direction.y
        };

        // Wall collision
        if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
            gameOver();
            return;
        }

        // Self collision (skip first few segments)
        if (snake.slice(3).some(s => s.x === head.x && s.y === head.y)) {
            gameOver();
            return;
        }

        // Obstacle collision
        if (obstacles.some(o => o.x === head.x && o.y === head.y)) {
            gameOver();
            return;
        }

        // Enemy collision
        if (enemy.some(e => e.x === head.x && e.y === head.y)) {
            gameOver();
            return;
        }

        snake.unshift(head);

        // Powerup collection
        const pIdx = powerups.findIndex(p => p.x === head.x && p.y === head.y);
        if (pIdx !== -1) {
            const p = powerups[pIdx];
            score += p.type === 'super' ? 50 : 10;
            powerups.splice(pIdx, 1);
            spawnPowerup();

            // Level up check
            if (score >= (level + 1) * 150 && level < LEVELS.length - 1) {
                levelUp();
                return;
            }
        } else {
            snake.pop();
        }

        // Update enemy
        updateEnemy();

        updateUI();
        draw();
    }

    function levelUp() {
        level++;
        isRunning = false;
        if (gameLoop) clearInterval(gameLoop);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = COLORS.player;
        ctx.font = 'bold 28px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = COLORS.playerGlow;
        ctx.shadowBlur = 20;
        ctx.fillText('LEVEL UP!', canvas.width / 2, canvas.height / 2 - 20);
        ctx.shadowBlur = 0;

        ctx.font = '18px Orbitron, monospace';
        ctx.fillStyle = '#FFE989';
        ctx.fillText(LEVELS[level].name, canvas.width / 2, canvas.height / 2 + 15);

        setTimeout(() => {
            init();
            isRunning = true;
            gameLoop = setInterval(update, gameSpeed);
        }, 2000);
    }

    function draw() {
        // Animated background
        ctx.fillStyle = COLORS.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Background particles
        bgParticles.forEach(p => {
            ctx.fillStyle = `rgba(0, 212, 255, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // Animated grid
        ctx.strokeStyle = COLORS.grid;
        ctx.lineWidth = 0.5;
        const pulse = Math.sin(frameCount * 0.02) * 0.15 + 0.25;
        ctx.globalAlpha = pulse;
        for (let i = 0; i <= TILE_COUNT; i++) {
            ctx.beginPath();
            ctx.moveTo(i * GRID_SIZE, 0);
            ctx.lineTo(i * GRID_SIZE, canvas.height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * GRID_SIZE);
            ctx.lineTo(canvas.width, i * GRID_SIZE);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Obstacles
        obstacles.forEach(o => {
            ctx.fillStyle = '#404060';
            ctx.shadowColor = 'rgba(100, 100, 150, 0.5)';
            ctx.shadowBlur = 5;
            ctx.fillRect(o.x * GRID_SIZE + 2, o.y * GRID_SIZE + 2, GRID_SIZE - 4, GRID_SIZE - 4);
            ctx.shadowBlur = 0;
        });

        // Powerups
        powerups.forEach(p => {
            const glow = Math.sin(frameCount * 0.15) * 3 + GRID_SIZE / 2;
            const color = p.type === 'super' ? COLORS.superPowerup : COLORS.powerup;
            const glowColor = p.type === 'super' ? 'rgba(255,0,255,0.4)' : COLORS.powerupGlow;

            ctx.fillStyle = glowColor;
            ctx.beginPath();
            ctx.arc(p.x * GRID_SIZE + GRID_SIZE / 2, p.y * GRID_SIZE + GRID_SIZE / 2, glow, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(p.x * GRID_SIZE + GRID_SIZE / 2, p.y * GRID_SIZE + GRID_SIZE / 2, GRID_SIZE / 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // Enemy
        enemy.forEach((seg, i) => {
            const isHead = i === 0;
            ctx.fillStyle = isHead ? '#FFA500' : COLORS.enemy;
            ctx.globalAlpha = 1 - i / Math.max(enemy.length, 1) * 0.4;
            if (isHead) {
                ctx.shadowColor = COLORS.enemyGlow;
                ctx.shadowBlur = 10;
            }
            ctx.fillRect(seg.x * GRID_SIZE + 2, seg.y * GRID_SIZE + 2, GRID_SIZE - 4, GRID_SIZE - 4);
            ctx.shadowBlur = 0;
        });
        ctx.globalAlpha = 1;

        // Player
        snake.forEach((seg, i) => {
            const isHead = i === 0;
            ctx.fillStyle = isHead ? '#FFFFFF' : COLORS.player;
            ctx.globalAlpha = 1 - i / snake.length * 0.3;

            if (isHead) {
                ctx.shadowColor = COLORS.playerGlow;
                ctx.shadowBlur = 15;
            }

            const x = seg.x * GRID_SIZE;
            const y = seg.y * GRID_SIZE;

            if (isHead) {
                // Motorcycle shape
                ctx.save();
                ctx.translate(x + GRID_SIZE / 2, y + GRID_SIZE / 2);
                let angle = 0;
                if (direction.x === 1) angle = 0;
                else if (direction.x === -1) angle = Math.PI;
                else if (direction.y === 1) angle = Math.PI / 2;
                else if (direction.y === -1) angle = -Math.PI / 2;
                ctx.rotate(angle);

                ctx.fillStyle = '#FFF';
                ctx.beginPath();
                ctx.moveTo(8, 0);
                ctx.lineTo(3, -6);
                ctx.lineTo(-6, -4);
                ctx.lineTo(-8, 0);
                ctx.lineTo(-6, 4);
                ctx.lineTo(3, 6);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = COLORS.player;
                ctx.beginPath();
                ctx.ellipse(2, 0, 4, 3, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = COLORS.player;
                ctx.beginPath();
                ctx.arc(-7, 0, 3, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            } else {
                ctx.fillRect(x + 2, y + 2, GRID_SIZE - 4, GRID_SIZE - 4);
            }

            ctx.shadowBlur = 0;
        });
        ctx.globalAlpha = 1;

        // HUD
        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 12px Orbitron, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${score}`, 8, 16);
        ctx.textAlign = 'right';
        ctx.fillText(`${LEVELS[level].name.toUpperCase()}`, canvas.width - 8, 16);
    }

    function gameOver() {
        isRunning = false;
        if (gameLoop) {
            clearInterval(gameLoop);
            gameLoop = null;
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = COLORS.gameOver;
        ctx.font = 'bold 32px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = COLORS.gameOver;
        ctx.shadowBlur = 20;
        ctx.fillText('DEREZZ', canvas.width / 2, canvas.height / 2 - 25);
        ctx.shadowBlur = 0;

        ctx.fillStyle = COLORS.text;
        ctx.font = '20px Orbitron, monospace';
        ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);

        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = '#666';
        ctx.fillText('Нажми "Заново" для новой игры', canvas.width / 2, canvas.height / 2 + 45);

        document.getElementById('snake-start')?.removeAttribute('disabled');
    }

    function start() {
        if (isRunning) return;
        isRunning = true;
        level = 0;
        score = 0;
        init();
        document.getElementById('snake-start')?.setAttribute('disabled', 'true');
        gameLoop = setInterval(update, gameSpeed);
    }

    function restart() {
        if (gameLoop) {
            clearInterval(gameLoop);
            gameLoop = null;
        }
        isRunning = false;
        level = 0;
        score = 0;
        init();
        start();
    }

    function handleKeyDown(e) {
        // Only respond if snake view is active
        const view = document.getElementById('view-snake');
        if (!view || view.classList.contains('hidden')) return;
        if (!isRunning) return;

        const key = e.key.toLowerCase();
        switch (key) {
            case 'arrowup':
            case 'w':
                if (direction.y !== 1) nextDirection = { x: 0, y: -1 };
                e.preventDefault();
                break;
            case 'arrowdown':
            case 's':
                if (direction.y !== -1) nextDirection = { x: 0, y: 1 };
                e.preventDefault();
                break;
            case 'arrowleft':
            case 'a':
                if (direction.x !== 1) nextDirection = { x: -1, y: 0 };
                e.preventDefault();
                break;
            case 'arrowright':
            case 'd':
                if (direction.x !== -1) nextDirection = { x: 1, y: 0 };
                e.preventDefault();
                break;
        }
    }

    // Setup
    document.addEventListener('keydown', handleKeyDown);
    document.getElementById('snake-start')?.addEventListener('click', start);
    document.getElementById('snake-restart')?.addEventListener('click', restart);

    // Initial screen
    init();

    // Draw start screen with animation
    function drawStartScreen() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        bgParticles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            ctx.fillStyle = `rgba(0, 212, 255, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.player;
        ctx.font = 'bold 28px Orbitron, monospace';
        ctx.shadowColor = COLORS.playerGlow;
        ctx.shadowBlur = 20;
        ctx.fillText('LIGHT CYCLES', canvas.width / 2, canvas.height / 2 - 35);
        ctx.shadowBlur = 0;

        ctx.font = '14px Orbitron, monospace';
        ctx.fillStyle = '#888';
        ctx.fillText('← ↑ ↓ → или WASD', canvas.width / 2, canvas.height / 2);
        ctx.fillText('Собирай энергию, избегай стен', canvas.width / 2, canvas.height / 2 + 25);
        ctx.fillText('Нажми "Старт"', canvas.width / 2, canvas.height / 2 + 55);

        if (!isRunning) requestAnimationFrame(drawStartScreen);
    }

    drawStartScreen();

    console.log('[LIGHT CYCLES] Game initialized');
})();
