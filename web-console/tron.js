/**
 * TRON Classic - Light Cycle Arena
 * Classic 2-player TRON light cycle game with levels
 * FIXED: Slower speeds, easier gameplay, better collision detection
 */

(function () {
    'use strict';

    const canvas = document.getElementById('tron-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Game settings
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    // Difficulty levels - SLOWER SPEEDS
    const LEVELS = [
        { name: 'Черепаха', speed: 2, color: '#00FF00' },
        { name: 'Новичок', speed: 2.5, color: '#88FF00' },
        { name: 'Легко', speed: 3, color: '#FFFF00' },
        { name: 'Нормально', speed: 4, color: '#FF8800' },
        { name: 'Сложно', speed: 5, color: '#FF0000' },
        { name: 'Безумие', speed: 7, color: '#FF00FF' }
    ];

    // Colors
    const COLORS = {
        background: '#0a0a1a',
        grid: '#1a1a3a',
        player1: '#00D4FF',
        player1Trail: '#00A0CC',
        player1Glow: 'rgba(0, 212, 255, 0.8)',
        player2: '#FF6B00',
        player2Trail: '#CC5500',
        player2Glow: 'rgba(255, 107, 0, 0.8)',
        text: '#00D4FF',
        explosion: '#FF0040'
    };

    // Game state
    let player1, player2;
    let gameLoop = null;
    let isRunning = false;
    let winner = null;
    let countdown = 0;
    let frameCount = 0;
    let currentLevel = 2; // Default to "Легко"
    let speed = LEVELS[currentLevel].speed;
    let p1Score = 0;
    let p2Score = 0;

    // Background particles
    let bgParticles = [];
    for (let i = 0; i < 25; i++) {
        bgParticles.push({
            x: Math.random() * WIDTH,
            y: Math.random() * HEIGHT,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            size: Math.random() * 2 + 1,
            alpha: Math.random() * 0.2 + 0.05
        });
    }

    function init() {
        speed = LEVELS[currentLevel].speed;

        // Player 1 starts left, moving right
        player1 = {
            x: 80,
            y: HEIGHT / 2,
            dx: speed,
            dy: 0,
            color: COLORS.player1,
            trailColor: COLORS.player1Trail,
            glow: COLORS.player1Glow,
            alive: true,
            trail: [],
            name: 'CYAN'
        };

        // Player 2 starts right, moving left
        player2 = {
            x: WIDTH - 80,
            y: HEIGHT / 2,
            dx: -speed,
            dy: 0,
            color: COLORS.player2,
            trailColor: COLORS.player2Trail,
            glow: COLORS.player2Glow,
            alive: true,
            trail: [],
            name: 'ORANGE'
        };

        winner = null;
        frameCount = 0;
        updateUI();
    }

    function updateUI() {
        const p1Status = document.getElementById('tron-p1-status');
        const p2Status = document.getElementById('tron-p2-status');
        const levelEl = document.getElementById('tron-level');
        const p1ScoreEl = document.getElementById('tron-p1-score');
        const p2ScoreEl = document.getElementById('tron-p2-score');

        if (p1Status) p1Status.textContent = player1?.alive ? 'ACTIVE' : 'DEREZZ';
        if (p2Status) p2Status.textContent = player2?.alive ? 'ACTIVE' : 'DEREZZ';
        if (levelEl) levelEl.textContent = LEVELS[currentLevel].name;
        if (p1ScoreEl) p1ScoreEl.textContent = p1Score;
        if (p2ScoreEl) p2ScoreEl.textContent = p2Score;
    }

    function checkCollision(x, y, player, skipRecent = 20) {
        // Wall collision
        if (x < 5 || x >= WIDTH - 5 || y < 5 || y >= HEIGHT - 5) {
            return true;
        }

        // Check collision with own trail (skip recent points)
        const ownTrail = player.trail.slice(0, -skipRecent);
        for (let i = 0; i < ownTrail.length; i++) {
            const t = ownTrail[i];
            const dist = Math.sqrt((x - t.x) ** 2 + (y - t.y) ** 2);
            if (dist < 4) return true;
        }

        // Check collision with opponent trail
        const opponent = player === player1 ? player2 : player1;
        for (let i = 0; i < opponent.trail.length; i++) {
            const t = opponent.trail[i];
            const dist = Math.sqrt((x - t.x) ** 2 + (y - t.y) ** 2);
            if (dist < 4) return true;
        }

        return false;
    }

    function updatePlayer(player) {
        if (!player.alive) return;

        // Add current position to trail
        player.trail.push({ x: player.x, y: player.y });

        // Move player
        player.x += player.dx;
        player.y += player.dy;

        // Check collision
        if (checkCollision(player.x, player.y, player)) {
            player.alive = false;
        }
    }

    function update() {
        frameCount++;

        // Update background particles
        bgParticles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0) p.x = WIDTH;
            if (p.x > WIDTH) p.x = 0;
            if (p.y < 0) p.y = HEIGHT;
            if (p.y > HEIGHT) p.y = 0;
        });

        updatePlayer(player1);
        updatePlayer(player2);

        // Check game over conditions
        if (!player1.alive && !player2.alive) {
            winner = 'НИЧЬЯ';
            gameOver();
        } else if (!player1.alive) {
            winner = player2.name;
            p2Score++;
            gameOver();
        } else if (!player2.alive) {
            winner = player1.name;
            p1Score++;
            gameOver();
        }

        updateUI();
        draw();
    }

    function draw() {
        // Background
        ctx.fillStyle = COLORS.background;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

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
        for (let x = 0; x < WIDTH; x += 20) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, HEIGHT);
            ctx.stroke();
        }
        for (let y = 0; y < HEIGHT; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(WIDTH, y);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Border with level color
        ctx.strokeStyle = LEVELS[currentLevel].color;
        ctx.lineWidth = 3;
        ctx.strokeRect(2, 2, WIDTH - 4, HEIGHT - 4);

        // Draw trails
        drawTrail(player1);
        drawTrail(player2);

        // Draw bikes
        drawBike(player1);
        drawBike(player2);

        // Countdown
        if (countdown > 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
            ctx.fillStyle = COLORS.text;
            ctx.font = 'bold 72px Orbitron, monospace';
            ctx.textAlign = 'center';
            ctx.shadowColor = COLORS.player1Glow;
            ctx.shadowBlur = 30;
            ctx.fillText(countdown, WIDTH / 2, HEIGHT / 2);
            ctx.shadowBlur = 0;
        }

        // Level indicator
        ctx.font = 'bold 12px Orbitron, monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = LEVELS[currentLevel].color;
        ctx.fillText(`${LEVELS[currentLevel].name.toUpperCase()}`, 10, 20);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#666';
        ctx.fillText(`Скорость: ${LEVELS[currentLevel].speed}`, WIDTH / 2, 20);

        ctx.textAlign = 'right';
        ctx.fillStyle = COLORS.player1;
        ctx.fillText(`CYAN: ${p1Score}`, WIDTH / 2 - 60, HEIGHT - 10);
        ctx.fillStyle = COLORS.player2;
        ctx.fillText(`ORANGE: ${p2Score}`, WIDTH - 10, HEIGHT - 10);
    }

    function drawTrail(player) {
        if (player.trail.length < 2) return;

        ctx.beginPath();
        ctx.strokeStyle = player.trailColor;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = player.glow;
        ctx.shadowBlur = 8;

        ctx.moveTo(player.trail[0].x, player.trail[0].y);
        for (let i = 1; i < player.trail.length; i++) {
            ctx.lineTo(player.trail[i].x, player.trail[i].y);
        }
        ctx.lineTo(player.x, player.y);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    function drawBike(player) {
        if (!player.alive) {
            // Explosion effect
            ctx.fillStyle = COLORS.explosion;
            ctx.shadowColor = COLORS.explosion;
            ctx.shadowBlur = 30;
            ctx.beginPath();
            ctx.arc(player.x, player.y, 12 + Math.sin(frameCount * 0.5) * 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            return;
        }

        ctx.save();
        ctx.translate(player.x, player.y);
        let angle = Math.atan2(player.dy, player.dx);
        ctx.rotate(angle);

        ctx.shadowColor = player.glow;
        ctx.shadowBlur = 15;
        ctx.fillStyle = player.color;

        // Simple bike shape
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(3, -5);
        ctx.lineTo(-8, -4);
        ctx.lineTo(-10, 0);
        ctx.lineTo(-8, 4);
        ctx.lineTo(3, 5);
        ctx.closePath();
        ctx.fill();

        // Windshield
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(4, -3);
        ctx.lineTo(4, 3);
        ctx.closePath();
        ctx.fill();

        // Engine glow
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(-8, 0, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.restore();
    }

    function gameOver() {
        isRunning = false;
        if (gameLoop) {
            cancelAnimationFrame(gameLoop);
            gameLoop = null;
        }

        setTimeout(() => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
            ctx.textAlign = 'center';

            if (winner === 'НИЧЬЯ') {
                ctx.fillStyle = '#FFF';
                ctx.font = 'bold 42px Orbitron, monospace';
                ctx.fillText('НИЧЬЯ', WIDTH / 2, HEIGHT / 2 - 20);
            } else {
                const winColor = winner === 'CYAN' ? COLORS.player1 : COLORS.player2;
                ctx.fillStyle = winColor;
                ctx.shadowColor = winColor;
                ctx.shadowBlur = 20;
                ctx.font = 'bold 42px Orbitron, monospace';
                ctx.fillText(winner + ' WINS!', WIDTH / 2, HEIGHT / 2 - 20);
                ctx.shadowBlur = 0;
            }

            ctx.fillStyle = '#888';
            ctx.font = '14px Inter, sans-serif';
            ctx.fillText('← / → для смены уровня', WIDTH / 2, HEIGHT / 2 + 20);
            ctx.fillText('Нажми "Старт" для новой игры', WIDTH / 2, HEIGHT / 2 + 45);
        }, 400);

        document.getElementById('tron-start')?.removeAttribute('disabled');
    }

    function startGame() {
        if (isRunning) return;

        init();
        countdown = 3;
        draw();

        const countdownInterval = setInterval(() => {
            countdown--;
            draw();
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                isRunning = true;
                document.getElementById('tron-start')?.setAttribute('disabled', 'true');
                gameLoop = requestAnimationFrame(loop);
            }
        }, 1000);
    }

    function loop() {
        if (!isRunning) return;
        update();
        gameLoop = requestAnimationFrame(loop);
    }

    function changeLevel(delta) {
        if (isRunning) return;
        currentLevel = Math.max(0, Math.min(LEVELS.length - 1, currentLevel + delta));
        speed = LEVELS[currentLevel].speed;
        updateUI();
        drawStartScreen();
    }

    function handleKeyDown(e) {
        // Check if TRON view is active
        const view = document.getElementById('view-tron');
        if (!view || view.classList.contains('hidden')) return;

        // Level selection when not running
        if (!isRunning) {
            if (e.key === 'ArrowLeft') {
                changeLevel(-1);
                e.preventDefault();
                return;
            }
            if (e.key === 'ArrowRight') {
                changeLevel(1);
                e.preventDefault();
                return;
            }
        }

        if (!isRunning) return;

        // Player 1: WASD
        switch (e.key.toLowerCase()) {
            case 'w':
                if (player1.dy === 0) { player1.dx = 0; player1.dy = -speed; }
                e.preventDefault();
                break;
            case 's':
                if (player1.dy === 0) { player1.dx = 0; player1.dy = speed; }
                e.preventDefault();
                break;
            case 'a':
                if (player1.dx === 0) { player1.dx = -speed; player1.dy = 0; }
                e.preventDefault();
                break;
            case 'd':
                if (player1.dx === 0) { player1.dx = speed; player1.dy = 0; }
                e.preventDefault();
                break;
        }

        // Player 2: Arrow keys
        switch (e.key) {
            case 'ArrowUp':
                if (player2.dy === 0) { player2.dx = 0; player2.dy = -speed; }
                e.preventDefault();
                break;
            case 'ArrowDown':
                if (player2.dy === 0) { player2.dx = 0; player2.dy = speed; }
                e.preventDefault();
                break;
            case 'ArrowLeft':
                if (player2.dx === 0) { player2.dx = -speed; player2.dy = 0; }
                e.preventDefault();
                break;
            case 'ArrowRight':
                if (player2.dx === 0) { player2.dx = speed; player2.dy = 0; }
                e.preventDefault();
                break;
        }
    }

    function drawStartScreen() {
        ctx.fillStyle = COLORS.background;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

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
        for (let x = 0; x < WIDTH; x += 20) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, HEIGHT);
            ctx.stroke();
        }
        for (let y = 0; y < HEIGHT; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(WIDTH, y);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Title
        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.player1;
        ctx.font = 'bold 48px Orbitron, monospace';
        ctx.shadowColor = COLORS.player1Glow;
        ctx.shadowBlur = 30;
        ctx.fillText('TRON', WIDTH / 2, HEIGHT / 2 - 80);
        ctx.shadowBlur = 0;

        ctx.font = '18px Orbitron, monospace';
        ctx.fillStyle = COLORS.player2;
        ctx.fillText('LIGHT CYCLE ARENA', WIDTH / 2, HEIGHT / 2 - 50);

        // Level selector
        ctx.fillStyle = LEVELS[currentLevel].color;
        ctx.font = 'bold 22px Orbitron, monospace';
        ctx.fillText(`◀ ${LEVELS[currentLevel].name.toUpperCase()} ▶`, WIDTH / 2, HEIGHT / 2);

        ctx.font = '12px Orbitron, monospace';
        ctx.fillStyle = '#666';
        ctx.fillText(`Скорость: ${LEVELS[currentLevel].speed}`, WIDTH / 2, HEIGHT / 2 + 22);

        // Controls
        ctx.font = '13px Inter, sans-serif';
        ctx.fillStyle = '#888';
        ctx.fillText('CYAN: W A S D  •  ORANGE: ← ↑ ↓ →', WIDTH / 2, HEIGHT / 2 + 55);
        ctx.fillText('Нажми "Старт" или выбери уровень стрелками', WIDTH / 2, HEIGHT / 2 + 78);
    }

    // Setup event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.getElementById('tron-start')?.addEventListener('click', startGame);
    document.getElementById('tron-level-down')?.addEventListener('click', () => changeLevel(-1));
    document.getElementById('tron-level-up')?.addEventListener('click', () => changeLevel(1));

    // Initial setup
    init();
    drawStartScreen();

    console.log('[TRON] Light Cycle Arena v2 - Slower & Easier');
})();
