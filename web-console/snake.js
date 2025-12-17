/**
 * Classic Snake Game
 * Simple snake with speed control only (no levels)
 */

(function () {
    'use strict';

    const canvas = document.getElementById('snake-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Game settings
    const GRID_SIZE = 20;
    const COLS = Math.floor(canvas.width / GRID_SIZE);
    const ROWS = Math.floor(canvas.height / GRID_SIZE);

    // Speed options (ms between updates - lower = faster)
    const SPEEDS = [
        { name: 'Черепаха', interval: 200 },
        { name: 'Медленно', interval: 150 },
        { name: 'Нормально', interval: 100 },
        { name: 'Быстро', interval: 70 },
        { name: 'Очень быстро', interval: 50 },
        { name: 'Безумие', interval: 35 }
    ];

    // Colors
    const COLORS = {
        background: '#0a0a1a',
        grid: '#1a1a3a',
        snake: '#00D4FF',
        snakeHead: '#FFFFFF',
        snakeGlow: 'rgba(0, 212, 255, 0.6)',
        food: '#00FF88',
        foodGlow: 'rgba(0, 255, 136, 0.5)',
        superFood: '#FF00FF',
        text: '#00D4FF',
        gameOver: '#FF0040'
    };

    // Game state
    let snake = [];
    let food = null;
    let direction = { x: 1, y: 0 };
    let nextDirection = { x: 1, y: 0 };
    let score = 0;
    let highScore = parseInt(localStorage.getItem('snakeHighScore') || '0');
    let currentSpeed = 2; // Default to "Нормально"
    let gameLoop = null;
    let isRunning = false;
    let frameCount = 0;

    // Background particles
    let bgParticles = [];
    for (let i = 0; i < 30; i++) {
        bgParticles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 2 + 0.5,
            alpha: Math.random() * 0.3 + 0.1
        });
    }

    function init() {
        // Start snake in the middle
        const startX = Math.floor(COLS / 4);
        const startY = Math.floor(ROWS / 2);
        snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];
        direction = { x: 1, y: 0 };
        nextDirection = { x: 1, y: 0 };
        score = 0;
        spawnFood();
        updateUI();
    }

    function spawnFood() {
        let attempts = 0;
        do {
            food = {
                x: Math.floor(Math.random() * COLS),
                y: Math.floor(Math.random() * ROWS),
                isSuper: Math.random() > 0.85 // 15% chance for super food
            };
            attempts++;
        } while (attempts < 100 && snake.some(s => s.x === food.x && s.y === food.y));
    }

    function updateUI() {
        const scoreEl = document.getElementById('snake-score');
        const highEl = document.getElementById('snake-high');
        const speedEl = document.getElementById('snake-speed-label');

        if (scoreEl) scoreEl.textContent = score;
        if (highEl) highEl.textContent = highScore;
        if (speedEl) speedEl.textContent = SPEEDS[currentSpeed].name;
    }

    function update() {
        frameCount++;

        // Update background particles
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

        // Calculate new head position
        const head = {
            x: snake[0].x + direction.x,
            y: snake[0].y + direction.y
        };

        // Wall collision
        if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
            gameOver();
            return;
        }

        // Self collision (skip first 2 segments)
        if (snake.slice(2).some(s => s.x === head.x && s.y === head.y)) {
            gameOver();
            return;
        }

        // Add new head
        snake.unshift(head);

        // Check food collection
        if (food && head.x === food.x && head.y === food.y) {
            score += food.isSuper ? 50 : 10;
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('snakeHighScore', highScore.toString());
            }
            spawnFood();
            // Don't remove tail - snake grows
        } else {
            // Remove tail - snake moves
            snake.pop();
        }

        updateUI();
        draw();
    }

    function draw() {
        // Background
        ctx.fillStyle = COLORS.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Background particles
        bgParticles.forEach(p => {
            ctx.fillStyle = `rgba(0, 212, 255, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // Grid
        ctx.strokeStyle = COLORS.grid;
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.3;
        for (let x = 0; x <= COLS; x++) {
            ctx.beginPath();
            ctx.moveTo(x * GRID_SIZE, 0);
            ctx.lineTo(x * GRID_SIZE, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y <= ROWS; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * GRID_SIZE);
            ctx.lineTo(canvas.width, y * GRID_SIZE);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Food
        if (food) {
            const fx = food.x * GRID_SIZE + GRID_SIZE / 2;
            const fy = food.y * GRID_SIZE + GRID_SIZE / 2;
            const pulse = Math.sin(frameCount * 0.15) * 2 + GRID_SIZE / 2;

            // Glow
            ctx.fillStyle = food.isSuper ? 'rgba(255, 0, 255, 0.4)' : COLORS.foodGlow;
            ctx.beginPath();
            ctx.arc(fx, fy, pulse, 0, Math.PI * 2);
            ctx.fill();

            // Food
            ctx.fillStyle = food.isSuper ? COLORS.superFood : COLORS.food;
            ctx.beginPath();
            ctx.arc(fx, fy, GRID_SIZE / 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Snake
        snake.forEach((seg, i) => {
            const isHead = i === 0;
            const x = seg.x * GRID_SIZE;
            const y = seg.y * GRID_SIZE;

            // Fade effect for tail
            ctx.globalAlpha = 1 - (i / snake.length) * 0.4;

            if (isHead) {
                // Head with glow
                ctx.shadowColor = COLORS.snakeGlow;
                ctx.shadowBlur = 15;
                ctx.fillStyle = COLORS.snakeHead;

                // Draw head shape based on direction
                ctx.save();
                ctx.translate(x + GRID_SIZE / 2, y + GRID_SIZE / 2);
                let angle = 0;
                if (direction.x === 1) angle = 0;
                else if (direction.x === -1) angle = Math.PI;
                else if (direction.y === 1) angle = Math.PI / 2;
                else if (direction.y === -1) angle = -Math.PI / 2;
                ctx.rotate(angle);

                // Simple arrow head
                ctx.beginPath();
                ctx.moveTo(8, 0);
                ctx.lineTo(-6, -7);
                ctx.lineTo(-3, 0);
                ctx.lineTo(-6, 7);
                ctx.closePath();
                ctx.fill();
                ctx.restore();

                ctx.shadowBlur = 0;
            } else {
                // Body segments
                ctx.fillStyle = COLORS.snake;
                ctx.fillRect(x + 2, y + 2, GRID_SIZE - 4, GRID_SIZE - 4);
            }
        });
        ctx.globalAlpha = 1;

        // HUD on canvas
        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 14px Orbitron, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Счёт: ${score}`, 10, 22);
        ctx.textAlign = 'right';
        ctx.fillText(`Рекорд: ${highScore}`, canvas.width - 10, 22);
    }

    function gameOver() {
        isRunning = false;
        if (gameLoop) {
            clearInterval(gameLoop);
            gameLoop = null;
        }

        // Draw game over screen
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = COLORS.gameOver;
        ctx.font = 'bold 36px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = COLORS.gameOver;
        ctx.shadowBlur = 20;
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);
        ctx.shadowBlur = 0;

        ctx.fillStyle = COLORS.text;
        ctx.font = '22px Orbitron, sans-serif';
        ctx.fillText(`Счёт: ${score}`, canvas.width / 2, canvas.height / 2 + 10);

        if (score === highScore && score > 0) {
            ctx.fillStyle = '#FFD700';
            ctx.font = '18px Orbitron, sans-serif';
            ctx.fillText('🏆 Новый рекорд!', canvas.width / 2, canvas.height / 2 + 40);
        }

        ctx.fillStyle = '#666';
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText('Нажми "Старт" для новой игры', canvas.width / 2, canvas.height / 2 + 75);

        document.getElementById('snake-start')?.removeAttribute('disabled');
    }

    function startGame() {
        if (isRunning) return;

        init();
        isRunning = true;
        document.getElementById('snake-start')?.setAttribute('disabled', 'true');
        gameLoop = setInterval(update, SPEEDS[currentSpeed].interval);
    }

    function changeSpeed(delta) {
        if (isRunning) return;
        currentSpeed = Math.max(0, Math.min(SPEEDS.length - 1, currentSpeed + delta));
        updateUI();
        drawStartScreen();
    }

    function handleKeyDown(e) {
        const view = document.getElementById('view-snake');
        if (!view || view.classList.contains('hidden')) return;

        // Speed control when not running
        if (!isRunning) {
            if (e.key === 'ArrowLeft') {
                changeSpeed(-1);
                e.preventDefault();
                return;
            }
            if (e.key === 'ArrowRight') {
                changeSpeed(1);
                e.preventDefault();
                return;
            }
            if (e.key === ' ' || e.key === 'Enter') {
                startGame();
                e.preventDefault();
                return;
            }
        }

        if (!isRunning) return;

        // Movement controls
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

    function drawStartScreen() {
        ctx.fillStyle = COLORS.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Background particles
        bgParticles.forEach(p => {
            ctx.fillStyle = `rgba(0, 212, 255, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // Grid
        ctx.strokeStyle = COLORS.grid;
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.2;
        for (let x = 0; x <= COLS; x++) {
            ctx.beginPath();
            ctx.moveTo(x * GRID_SIZE, 0);
            ctx.lineTo(x * GRID_SIZE, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y <= ROWS; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * GRID_SIZE);
            ctx.lineTo(canvas.width, y * GRID_SIZE);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Title
        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.snake;
        ctx.font = 'bold 42px Orbitron, sans-serif';
        ctx.shadowColor = COLORS.snakeGlow;
        ctx.shadowBlur = 30;
        ctx.fillText('🐍 SNAKE', canvas.width / 2, canvas.height / 2 - 70);
        ctx.shadowBlur = 0;

        // Speed selector
        ctx.fillStyle = '#FFD43B';
        ctx.font = 'bold 20px Orbitron, sans-serif';
        ctx.fillText(`◀  ${SPEEDS[currentSpeed].name}  ▶`, canvas.width / 2, canvas.height / 2 - 10);

        ctx.fillStyle = '#666';
        ctx.font = '12px Orbitron, sans-serif';
        ctx.fillText('← → для выбора скорости', canvas.width / 2, canvas.height / 2 + 15);

        // High score
        ctx.fillStyle = '#888';
        ctx.font = '16px Inter, sans-serif';
        ctx.fillText(`🏆 Рекорд: ${highScore}`, canvas.width / 2, canvas.height / 2 + 50);

        // Controls hint
        ctx.fillStyle = '#666';
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText('W A S D или ← ↑ ↓ →', canvas.width / 2, canvas.height / 2 + 85);
        ctx.fillText('Нажми "Старт" или Space', canvas.width / 2, canvas.height / 2 + 105);
    }

    // Event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.getElementById('snake-start')?.addEventListener('click', startGame);
    document.getElementById('snake-speed-down')?.addEventListener('click', () => changeSpeed(-1));
    document.getElementById('snake-speed-up')?.addEventListener('click', () => changeSpeed(1));

    // Initialize
    init();
    drawStartScreen();

    console.log('[SNAKE] Classic snake game loaded!');
})();
