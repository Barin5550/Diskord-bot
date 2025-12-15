/**
 * Snake Game
 * Classic snake for the bot console
 */

(function () {
    'use strict';

    const canvas = document.getElementById('snake-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Game settings
    const GRID_SIZE = 20;
    const TILE_COUNT = canvas.width / GRID_SIZE;

    // Colors
    const COLORS = {
        background: '#1a1a2e',
        grid: '#252540',
        snake: '#FFE989',
        snakeHead: '#FFF',
        food: '#FF6B6B',
        foodGlow: 'rgba(255, 107, 107, 0.3)',
        text: '#FFE989',
        gameOver: '#FF6B6B'
    };

    // Game state
    let snake = [];
    let food = { x: 0, y: 0 };
    let direction = { x: 0, y: 0 };
    let nextDirection = { x: 0, y: 0 };
    let score = 0;
    let gameLoop = null;
    let isRunning = false;
    let gameSpeed = 100;

    // Initialize game
    function init() {
        snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        direction = { x: 1, y: 0 };
        nextDirection = { x: 1, y: 0 };
        score = 0;
        updateScore();
        spawnFood();
        draw();
    }

    // Spawn food at random position
    function spawnFood() {
        do {
            food = {
                x: Math.floor(Math.random() * TILE_COUNT),
                y: Math.floor(Math.random() * TILE_COUNT)
            };
        } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
    }

    // Update score display
    function updateScore() {
        const scoreEl = document.getElementById('snake-score');
        if (scoreEl) scoreEl.textContent = score;
    }

    // Game update
    function update() {
        // Apply next direction
        direction = { ...nextDirection };

        // Calculate new head position
        const head = {
            x: snake[0].x + direction.x,
            y: snake[0].y + direction.y
        };

        // Wrap around walls
        if (head.x < 0) head.x = TILE_COUNT - 1;
        if (head.x >= TILE_COUNT) head.x = 0;
        if (head.y < 0) head.y = TILE_COUNT - 1;
        if (head.y >= TILE_COUNT) head.y = 0;

        // Check self collision
        if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            gameOver();
            return;
        }

        // Move snake
        snake.unshift(head);

        // Check food collision
        if (head.x === food.x && head.y === food.y) {
            score += 10;
            updateScore();
            spawnFood();
            // Speed up slightly
            if (gameSpeed > 50) {
                gameSpeed -= 2;
                restartLoop();
            }
        } else {
            snake.pop();
        }

        draw();
    }

    // Restart game loop with new speed
    function restartLoop() {
        if (gameLoop) {
            clearInterval(gameLoop);
            gameLoop = setInterval(update, gameSpeed);
        }
    }

    // Draw game
    function draw() {
        // Clear canvas
        ctx.fillStyle = COLORS.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        ctx.strokeStyle = COLORS.grid;
        ctx.lineWidth = 0.5;
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

        // Draw food with glow
        ctx.fillStyle = COLORS.foodGlow;
        ctx.beginPath();
        ctx.arc(
            food.x * GRID_SIZE + GRID_SIZE / 2,
            food.y * GRID_SIZE + GRID_SIZE / 2,
            GRID_SIZE,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.fillStyle = COLORS.food;
        ctx.beginPath();
        ctx.arc(
            food.x * GRID_SIZE + GRID_SIZE / 2,
            food.y * GRID_SIZE + GRID_SIZE / 2,
            GRID_SIZE / 2 - 2,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // Draw snake
        snake.forEach((segment, index) => {
            const isHead = index === 0;
            const alpha = 1 - (index / snake.length) * 0.5;

            // Body
            ctx.fillStyle = isHead ? COLORS.snakeHead : COLORS.snake;
            ctx.globalAlpha = alpha;

            const x = segment.x * GRID_SIZE + 1;
            const y = segment.y * GRID_SIZE + 1;
            const size = GRID_SIZE - 2;
            const radius = isHead ? size / 2 : size / 4;

            // Rounded rectangle
            ctx.beginPath();
            ctx.roundRect(x, y, size, size, radius);
            ctx.fill();

            // Eyes on head
            if (isHead) {
                ctx.fillStyle = '#1a1a2e';
                ctx.globalAlpha = 1;

                const eyeSize = 3;
                const eyeOffset = 4;

                // Position eyes based on direction
                let eye1 = { x: size / 3, y: size / 3 };
                let eye2 = { x: size * 2 / 3, y: size / 3 };

                if (direction.x === -1) {
                    eye1 = { x: size / 4, y: size / 3 };
                    eye2 = { x: size / 4, y: size * 2 / 3 };
                } else if (direction.x === 1) {
                    eye1 = { x: size * 3 / 4, y: size / 3 };
                    eye2 = { x: size * 3 / 4, y: size * 2 / 3 };
                } else if (direction.y === -1) {
                    eye1 = { x: size / 3, y: size / 4 };
                    eye2 = { x: size * 2 / 3, y: size / 4 };
                } else if (direction.y === 1) {
                    eye1 = { x: size / 3, y: size * 3 / 4 };
                    eye2 = { x: size * 2 / 3, y: size * 3 / 4 };
                }

                ctx.beginPath();
                ctx.arc(x + eye1.x, y + eye1.y, eyeSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x + eye2.x, y + eye2.y, eyeSize, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        ctx.globalAlpha = 1;

        // Draw score on canvas too
        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 16px Orbitron, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${score}`, 10, 25);
    }

    // Game over
    function gameOver() {
        isRunning = false;
        if (gameLoop) {
            clearInterval(gameLoop);
            gameLoop = null;
        }

        // Draw game over screen
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = COLORS.gameOver;
        ctx.font = 'bold 36px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);

        ctx.fillStyle = COLORS.text;
        ctx.font = '24px Inter, sans-serif';
        ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);

        ctx.font = '16px Inter, sans-serif';
        ctx.fillStyle = '#888';
        ctx.fillText('Нажми "Заново" для новой игры', canvas.width / 2, canvas.height / 2 + 60);

        // Update button states
        const startBtn = document.getElementById('snake-start');
        if (startBtn) startBtn.disabled = false;
    }

    // Start game
    function start() {
        if (isRunning) return;
        isRunning = true;
        gameSpeed = 100;
        init();
        gameLoop = setInterval(update, gameSpeed);

        const startBtn = document.getElementById('snake-start');
        if (startBtn) startBtn.disabled = true;
    }

    // Restart game
    function restart() {
        if (gameLoop) {
            clearInterval(gameLoop);
            gameLoop = null;
        }
        isRunning = false;
        gameSpeed = 100;
        init();
        start();
    }

    // Handle keyboard input
    function handleKeyDown(e) {
        if (!isRunning) return;

        const key = e.key.toLowerCase();

        // Prevent reversing direction
        switch (key) {
            case 'arrowup':
            case 'w':
                if (direction.y !== 1) {
                    nextDirection = { x: 0, y: -1 };
                }
                e.preventDefault();
                break;
            case 'arrowdown':
            case 's':
                if (direction.y !== -1) {
                    nextDirection = { x: 0, y: 1 };
                }
                e.preventDefault();
                break;
            case 'arrowleft':
            case 'a':
                if (direction.x !== 1) {
                    nextDirection = { x: -1, y: 0 };
                }
                e.preventDefault();
                break;
            case 'arrowright':
            case 'd':
                if (direction.x !== -1) {
                    nextDirection = { x: 1, y: 0 };
                }
                e.preventDefault();
                break;
        }
    }

    // Setup event listeners
    document.addEventListener('keydown', handleKeyDown);

    const startBtn = document.getElementById('snake-start');
    const restartBtn = document.getElementById('snake-restart');

    if (startBtn) startBtn.addEventListener('click', start);
    if (restartBtn) restartBtn.addEventListener('click', restart);

    // Initial draw
    init();

    // Draw start screen
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 28px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🐍 SNAKE', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '16px Inter, sans-serif';
    ctx.fillStyle = '#888';
    ctx.fillText('Нажми "Старт" для начала', canvas.width / 2, canvas.height / 2 + 20);

    console.log('[SNAKE] Game initialized');
})();
