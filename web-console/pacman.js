/**
 * PAC-MAN Classic
 * Classic Pac-Man game implementation
 */

(function () {
    'use strict';

    const canvas = document.getElementById('pacman-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Game settings
    const TILE_SIZE = 20;
    const COLS = 21;
    const ROWS = 21;

    // Colors
    const COLORS = {
        background: '#000',
        wall: '#2121DE',
        dot: '#FFB8FF',
        powerPellet: '#FFB8FF',
        pacman: '#FFFF00',
        blinky: '#FF0000',  // Red ghost
        pinky: '#FFB8FF',   // Pink ghost
        inky: '#00FFFF',    // Cyan ghost
        clyde: '#FFB852',   // Orange ghost
        frightened: '#2121FF',
        text: '#FFFF00'
    };

    // Classic Pac-Man maze (simplified)
    // 0 = empty, 1 = wall, 2 = dot, 3 = power pellet, 4 = empty path
    const MAZE = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
        [1, 3, 1, 1, 2, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 2, 1, 1, 3, 1],
        [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
        [1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1],
        [1, 2, 2, 2, 2, 1, 2, 2, 2, 2, 1, 2, 2, 2, 2, 1, 2, 2, 2, 2, 1],
        [1, 1, 1, 1, 2, 1, 1, 1, 1, 4, 1, 4, 1, 1, 1, 1, 2, 1, 1, 1, 1],
        [4, 4, 4, 1, 2, 1, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1, 2, 1, 4, 4, 4],
        [1, 1, 1, 1, 2, 1, 4, 1, 1, 4, 4, 4, 1, 1, 4, 1, 2, 1, 1, 1, 1],
        [4, 4, 4, 4, 2, 4, 4, 1, 4, 4, 4, 4, 4, 1, 4, 4, 2, 4, 4, 4, 4],
        [1, 1, 1, 1, 2, 1, 4, 1, 1, 1, 1, 1, 1, 1, 4, 1, 2, 1, 1, 1, 1],
        [4, 4, 4, 1, 2, 1, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1, 2, 1, 4, 4, 4],
        [1, 1, 1, 1, 2, 1, 4, 1, 1, 1, 1, 1, 1, 1, 4, 1, 2, 1, 1, 1, 1],
        [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
        [1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 2, 1, 1, 2, 1],
        [1, 3, 2, 1, 2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 1, 2, 3, 1],
        [1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1],
        [1, 2, 2, 2, 2, 1, 2, 2, 2, 2, 1, 2, 2, 2, 2, 1, 2, 2, 2, 2, 1],
        [1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1],
        [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ];

    // Game state
    let maze = [];
    let pacman = null;
    let ghosts = [];
    let score = 0;
    let lives = 3;
    let level = 1;
    let dotsRemaining = 0;
    let gameLoop = null;
    let isRunning = false;
    let isPaused = false;
    let mouthAngle = 0;
    let mouthDirection = 1;
    let frightenedTimer = 0;
    let frameCount = 0;

    function init() {
        // Copy maze
        maze = MAZE.map(row => [...row]);

        // Count dots
        dotsRemaining = 0;
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (maze[y][x] === 2 || maze[y][x] === 3) dotsRemaining++;
            }
        }

        // Pac-Man starting position
        pacman = {
            x: 10,
            y: 15,
            dx: 0,
            dy: 0,
            nextDx: 0,
            nextDy: 0,
            speed: 0.15
        };

        // Ghosts
        ghosts = [
            { x: 9, y: 9, dx: -1, dy: 0, color: COLORS.blinky, name: 'Blinky', frightened: false },
            { x: 10, y: 9, dx: 0, dy: -1, color: COLORS.pinky, name: 'Pinky', frightened: false },
            { x: 11, y: 9, dx: 1, dy: 0, color: COLORS.inky, name: 'Inky', frightened: false },
            { x: 10, y: 10, dx: 0, dy: 1, color: COLORS.clyde, name: 'Clyde', frightened: false }
        ];

        frightenedTimer = 0;
        updateUI();
    }

    function updateUI() {
        const scoreEl = document.getElementById('pacman-score');
        const livesEl = document.getElementById('pacman-lives');
        const levelEl = document.getElementById('pacman-level');
        if (scoreEl) scoreEl.textContent = score;
        if (livesEl) livesEl.textContent = '❤️'.repeat(lives);
        if (levelEl) levelEl.textContent = level;
    }

    function canMove(x, y) {
        const col = Math.floor(x);
        const row = Math.floor(y);
        if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return true; // Tunnel
        return maze[row][col] !== 1;
    }

    function update() {
        frameCount++;

        // Animate mouth
        mouthAngle += 0.15 * mouthDirection;
        if (mouthAngle > 0.4 || mouthAngle < 0) mouthDirection *= -1;

        // Update frightened timer
        if (frightenedTimer > 0) {
            frightenedTimer--;
            if (frightenedTimer === 0) {
                ghosts.forEach(g => g.frightened = false);
            }
        }

        // Try to change direction
        const nextX = pacman.x + pacman.nextDx;
        const nextY = pacman.y + pacman.nextDy;
        if (canMove(nextX, nextY)) {
            pacman.dx = pacman.nextDx;
            pacman.dy = pacman.nextDy;
        }

        // Move Pac-Man
        const newX = pacman.x + pacman.dx * pacman.speed;
        const newY = pacman.y + pacman.dy * pacman.speed;

        if (canMove(Math.floor(newX + 0.5), Math.floor(newY + 0.5))) {
            pacman.x = newX;
            pacman.y = newY;
        }

        // Tunnel wrap
        if (pacman.x < -0.5) pacman.x = COLS - 0.5;
        if (pacman.x > COLS - 0.5) pacman.x = -0.5;

        // Eat dots
        const px = Math.floor(pacman.x + 0.5);
        const py = Math.floor(pacman.y + 0.5);
        if (px >= 0 && px < COLS && py >= 0 && py < ROWS) {
            if (maze[py][px] === 2) {
                maze[py][px] = 4;
                score += 10;
                dotsRemaining--;
            } else if (maze[py][px] === 3) {
                maze[py][px] = 4;
                score += 50;
                dotsRemaining--;
                // Power pellet - frighten ghosts
                frightenedTimer = 400;
                ghosts.forEach(g => g.frightened = true);
            }
        }

        // Move ghosts
        ghosts.forEach(ghost => {
            // Simple AI
            if (frameCount % 10 === 0) {
                const directions = [
                    { dx: 1, dy: 0 },
                    { dx: -1, dy: 0 },
                    { dx: 0, dy: 1 },
                    { dx: 0, dy: -1 }
                ].filter(d => {
                    // Can't reverse
                    if (d.dx === -ghost.dx && d.dy === -ghost.dy) return false;
                    const nx = ghost.x + d.dx;
                    const ny = ghost.y + d.dy;
                    return canMove(nx, ny);
                });

                if (directions.length > 0) {
                    if (ghost.frightened) {
                        // Random movement when frightened
                        const choice = directions[Math.floor(Math.random() * directions.length)];
                        ghost.dx = choice.dx;
                        ghost.dy = choice.dy;
                    } else {
                        // Chase Pac-Man
                        directions.sort((a, b) => {
                            const distA = Math.abs((ghost.x + a.dx) - pacman.x) + Math.abs((ghost.y + a.dy) - pacman.y);
                            const distB = Math.abs((ghost.x + b.dx) - pacman.x) + Math.abs((ghost.y + b.dy) - pacman.y);
                            return distA - distB;
                        });
                        ghost.dx = directions[0].dx;
                        ghost.dy = directions[0].dy;
                    }
                }
            }

            const speed = ghost.frightened ? 0.06 : 0.1;
            const gx = ghost.x + ghost.dx * speed;
            const gy = ghost.y + ghost.dy * speed;

            if (canMove(Math.floor(gx + 0.5), Math.floor(gy + 0.5))) {
                ghost.x = gx;
                ghost.y = gy;
            }

            // Tunnel wrap
            if (ghost.x < -0.5) ghost.x = COLS - 0.5;
            if (ghost.x > COLS - 0.5) ghost.x = -0.5;
        });

        // Collision detection
        ghosts.forEach(ghost => {
            const dist = Math.sqrt(Math.pow(ghost.x - pacman.x, 2) + Math.pow(ghost.y - pacman.y, 2));
            if (dist < 0.8) {
                if (ghost.frightened) {
                    // Eat ghost
                    score += 200;
                    ghost.x = 10;
                    ghost.y = 9;
                    ghost.frightened = false;
                } else {
                    // Pac-Man dies
                    lives--;
                    if (lives <= 0) {
                        gameOver();
                    } else {
                        // Reset positions
                        pacman.x = 10;
                        pacman.y = 15;
                        pacman.dx = 0;
                        pacman.dy = 0;
                        ghosts.forEach((g, i) => {
                            g.x = 9 + i;
                            g.y = 9;
                        });
                    }
                }
            }
        });

        // Level complete
        if (dotsRemaining === 0) {
            levelUp();
        }

        updateUI();
        draw();
    }

    function levelUp() {
        level++;
        init();
        // Keep score and lives
    }

    function draw() {
        // Clear
        ctx.fillStyle = COLORS.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw maze
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const tile = maze[y][x];
                const px = x * TILE_SIZE;
                const py = y * TILE_SIZE;

                if (tile === 1) {
                    // Wall
                    ctx.fillStyle = COLORS.wall;
                    ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                } else if (tile === 2) {
                    // Dot
                    ctx.fillStyle = COLORS.dot;
                    ctx.beginPath();
                    ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 2, 0, Math.PI * 2);
                    ctx.fill();
                } else if (tile === 3) {
                    // Power pellet (animated)
                    const size = 5 + Math.sin(frameCount * 0.2) * 2;
                    ctx.fillStyle = COLORS.powerPellet;
                    ctx.beginPath();
                    ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // Draw ghosts
        ghosts.forEach(ghost => {
            const gx = ghost.x * TILE_SIZE + TILE_SIZE / 2;
            const gy = ghost.y * TILE_SIZE + TILE_SIZE / 2;
            const radius = TILE_SIZE / 2 - 2;

            // Ghost body
            ctx.fillStyle = ghost.frightened
                ? (frightenedTimer < 100 && frameCount % 20 < 10 ? '#FFF' : COLORS.frightened)
                : ghost.color;

            ctx.beginPath();
            ctx.arc(gx, gy - 2, radius, Math.PI, 0, false);
            ctx.lineTo(gx + radius, gy + radius - 2);

            // Wavy bottom
            const waves = 3;
            for (let i = waves; i > 0; i--) {
                const wx = gx + radius - (i * radius * 2 / waves);
                const wy = gy + radius - 2 + (i % 2 === 0 ? 3 : 0);
                ctx.lineTo(wx, wy);
            }
            ctx.lineTo(gx - radius, gy + radius - 2);
            ctx.closePath();
            ctx.fill();

            // Eyes
            if (!ghost.frightened) {
                // White of eyes
                ctx.fillStyle = '#FFF';
                ctx.beginPath();
                ctx.ellipse(gx - 4, gy - 2, 4, 5, 0, 0, Math.PI * 2);
                ctx.ellipse(gx + 4, gy - 2, 4, 5, 0, 0, Math.PI * 2);
                ctx.fill();

                // Pupils (look at Pac-Man)
                const angle = Math.atan2(pacman.y - ghost.y, pacman.x - ghost.x);
                const pupilDist = 2;
                ctx.fillStyle = '#00F';
                ctx.beginPath();
                ctx.arc(gx - 4 + Math.cos(angle) * pupilDist, gy - 2 + Math.sin(angle) * pupilDist, 2, 0, Math.PI * 2);
                ctx.arc(gx + 4 + Math.cos(angle) * pupilDist, gy - 2 + Math.sin(angle) * pupilDist, 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Frightened face
                ctx.fillStyle = '#FFF';
                ctx.beginPath();
                ctx.arc(gx - 4, gy - 2, 2, 0, Math.PI * 2);
                ctx.arc(gx + 4, gy - 2, 2, 0, Math.PI * 2);
                ctx.fill();

                // Wavy mouth
                ctx.strokeStyle = '#FFF';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(gx - 5, gy + 4);
                for (let i = 0; i < 4; i++) {
                    ctx.lineTo(gx - 5 + i * 3.5, gy + 4 + (i % 2 === 0 ? 0 : 3));
                }
                ctx.stroke();
            }
        });

        // Draw Pac-Man
        const px = pacman.x * TILE_SIZE + TILE_SIZE / 2;
        const py = pacman.y * TILE_SIZE + TILE_SIZE / 2;
        const radius = TILE_SIZE / 2 - 2;

        // Direction angle
        let angle = 0;
        if (pacman.dx === 1) angle = 0;
        else if (pacman.dx === -1) angle = Math.PI;
        else if (pacman.dy === 1) angle = Math.PI / 2;
        else if (pacman.dy === -1) angle = -Math.PI / 2;

        ctx.fillStyle = COLORS.pacman;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.arc(px, py, radius, angle + mouthAngle, angle + Math.PI * 2 - mouthAngle);
        ctx.closePath();
        ctx.fill();

        // Eye
        const eyeX = px + Math.cos(angle - 0.5) * (radius * 0.4);
        const eyeY = py + Math.sin(angle - 0.5) * (radius * 0.4);
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    function gameOver() {
        isRunning = false;
        if (gameLoop) {
            cancelAnimationFrame(gameLoop);
            gameLoop = null;
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);

        ctx.fillStyle = COLORS.text;
        ctx.font = '20px Arial';
        ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 15);

        ctx.font = '14px Arial';
        ctx.fillStyle = '#888';
        ctx.fillText('Нажми "Старт" для новой игры', canvas.width / 2, canvas.height / 2 + 50);

        document.getElementById('pacman-start')?.removeAttribute('disabled');
    }

    function start() {
        if (isRunning) return;
        isRunning = true;
        score = 0;
        lives = 3;
        level = 1;
        init();
        document.getElementById('pacman-start')?.setAttribute('disabled', 'true');
        loop();
    }

    function loop() {
        if (!isRunning || isPaused) return;
        update();
        gameLoop = requestAnimationFrame(loop);
    }

    function handleKeyDown(e) {
        if (!isRunning) return;

        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                pacman.nextDx = 0;
                pacman.nextDy = -1;
                e.preventDefault();
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                pacman.nextDx = 0;
                pacman.nextDy = 1;
                e.preventDefault();
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                pacman.nextDx = -1;
                pacman.nextDy = 0;
                e.preventDefault();
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                pacman.nextDx = 1;
                pacman.nextDy = 0;
                e.preventDefault();
                break;
        }
    }

    // Setup
    document.addEventListener('keydown', handleKeyDown);
    document.getElementById('pacman-start')?.addEventListener('click', start);

    // Initial draw
    init();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.pacman;
    ctx.font = 'bold 36px Arial';
    ctx.fillText('PAC-MAN', canvas.width / 2, canvas.height / 2 - 40);

    ctx.font = '16px Arial';
    ctx.fillStyle = '#888';
    ctx.fillText('← ↑ ↓ → или WASD', canvas.width / 2, canvas.height / 2);
    ctx.fillText('Собирай точки, избегай призраков!', canvas.width / 2, canvas.height / 2 + 25);
    ctx.fillText('Нажми "Старт" для начала', canvas.width / 2, canvas.height / 2 + 60);

    console.log('[PACMAN] Game initialized');
})();
