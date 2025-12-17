/**
 * TRON Arena v3 - Light Cycle Game
 * Enhanced with fading trail support and better gameplay
 */

(function () {
    'use strict';

    const canvas = document.getElementById('tron-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Game settings
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    // Difficulty levels
    const LEVELS = [
        { name: 'Черепаха', speed: 1.5, color: '#00FF00' },
        { name: 'Новичок', speed: 2, color: '#88FF00' },
        { name: 'Легко', speed: 2.5, color: '#FFFF00' },
        { name: 'Нормально', speed: 3.5, color: '#FF8800' },
        { name: 'Сложно', speed: 4.5, color: '#FF0000' },
        { name: 'Безумие', speed: 6, color: '#FF00FF' }
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

    // FADE TRAIL FEATURE
    let fadeTrailEnabled = false;
    const FADE_TRAIL_LENGTH = 150; // Trail points before fade starts
    const FADE_SPEED = 0.02; // How fast trail fades

    // Background particles
    let bgParticles = [];
    for (let i = 0; i < 30; i++) {
        bgParticles.push({
            x: Math.random() * WIDTH,
            y: Math.random() * HEIGHT,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            size: Math.random() * 2 + 0.5,
            alpha: Math.random() * 0.15 + 0.05
        });
    }

    function init() {
        speed = LEVELS[currentLevel].speed;

        // Player 1 starts left, moving right
        player1 = {
            x: 100,
            y: HEIGHT / 2,
            dx: speed,
            dy: 0,
            color: COLORS.player1,
            trailColor: COLORS.player1Trail,
            glow: COLORS.player1Glow,
            alive: true,
            trail: [], // {x, y, alpha}
            name: 'CYAN'
        };

        // Player 2 starts right, moving left
        player2 = {
            x: WIDTH - 100,
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
        const levelEl = document.getElementById('tron-level');
        const p1ScoreEl = document.getElementById('tron-p1-score');
        const p2ScoreEl = document.getElementById('tron-p2-score');
        const fadeBtn = document.getElementById('tron-fade-btn');

        if (levelEl) levelEl.textContent = LEVELS[currentLevel].name;
        if (p1ScoreEl) p1ScoreEl.textContent = p1Score;
        if (p2ScoreEl) p2ScoreEl.textContent = p2Score;
        if (fadeBtn) {
            fadeBtn.textContent = fadeTrailEnabled ? '🔥 Затухание: ON' : '🔥 Затухание: OFF';
            fadeBtn.classList.toggle('active', fadeTrailEnabled);
        }
    }

    function checkCollision(x, y, player, skipRecent = 15) {
        // Wall collision with margin
        const margin = 8;
        if (x < margin || x >= WIDTH - margin || y < margin || y >= HEIGHT - margin) {
            return true;
        }

        // Check collision with own trail (skip recent points)
        const checkRadius = 5;
        const ownTrail = player.trail.slice(0, -skipRecent);
        for (let i = 0; i < ownTrail.length; i++) {
            const t = ownTrail[i];
            // Skip faded trails in collision
            if (fadeTrailEnabled && t.alpha < 0.3) continue;
            const dist = Math.sqrt((x - t.x) ** 2 + (y - t.y) ** 2);
            if (dist < checkRadius) return true;
        }

        // Check collision with opponent trail
        const opponent = player === player1 ? player2 : player1;
        for (let i = 0; i < opponent.trail.length; i++) {
            const t = opponent.trail[i];
            // Skip faded trails in collision
            if (fadeTrailEnabled && t.alpha < 0.3) continue;
            const dist = Math.sqrt((x - t.x) ** 2 + (y - t.y) ** 2);
            if (dist < checkRadius) return true;
        }

        return false;
    }

    function updatePlayer(player) {
        if (!player.alive) return;

        // Add current position to trail with alpha
        player.trail.push({ x: player.x, y: player.y, alpha: 1 });

        // Move player
        player.x += player.dx;
        player.y += player.dy;

        // Fade old trail points if enabled
        if (fadeTrailEnabled) {
            player.trail.forEach((t, i) => {
                if (i < player.trail.length - FADE_TRAIL_LENGTH) {
                    t.alpha -= FADE_SPEED;
                }
            });
            // Remove fully faded points
            player.trail = player.trail.filter(t => t.alpha > 0);
        }

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
        ctx.globalAlpha = 0.25;
        for (let x = 0; x < WIDTH; x += 25) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, HEIGHT);
            ctx.stroke();
        }
        for (let y = 0; y < HEIGHT; y += 25) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(WIDTH, y);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Border with level color
        ctx.strokeStyle = LEVELS[currentLevel].color;
        ctx.lineWidth = 4;
        ctx.strokeRect(3, 3, WIDTH - 6, HEIGHT - 6);

        // Draw trails
        drawTrail(player1);
        drawTrail(player2);

        // Draw bikes
        drawBike(player1);
        drawBike(player2);

        // Countdown overlay
        if (countdown > 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillRect(0, 0, WIDTH, HEIGHT);

            ctx.fillStyle = COLORS.text;
            ctx.font = 'bold 80px Orbitron, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = COLORS.player1Glow;
            ctx.shadowBlur = 40;
            ctx.fillText(countdown, WIDTH / 2, HEIGHT / 2);
            ctx.shadowBlur = 0;
        }

        // HUD on canvas
        ctx.font = 'bold 14px Orbitron, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = LEVELS[currentLevel].color;
        ctx.fillText(LEVELS[currentLevel].name.toUpperCase(), 15, 25);

        if (fadeTrailEnabled) {
            ctx.fillStyle = '#FF6B00';
            ctx.fillText('FADE ON', 15, 45);
        }

        ctx.textAlign = 'right';
        ctx.fillStyle = '#666';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText(`Скорость: ${LEVELS[currentLevel].speed}`, WIDTH - 15, 25);
    }

    function drawTrail(player) {
        if (player.trail.length < 2) return;

        // Draw trail segments with individual alpha
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 1; i < player.trail.length; i++) {
            const prev = player.trail[i - 1];
            const curr = player.trail[i];

            const alpha = fadeTrailEnabled ? curr.alpha : 1;
            if (alpha <= 0) continue;

            ctx.beginPath();
            ctx.strokeStyle = player.trailColor;
            ctx.lineWidth = 4 * alpha;
            ctx.globalAlpha = alpha;
            ctx.shadowColor = player.glow;
            ctx.shadowBlur = 10 * alpha;

            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(curr.x, curr.y);
            ctx.stroke();
        }

        // Connect to current position
        if (player.trail.length > 0 && player.alive) {
            const last = player.trail[player.trail.length - 1];
            ctx.beginPath();
            ctx.strokeStyle = player.trailColor;
            ctx.lineWidth = 4;
            ctx.globalAlpha = 1;
            ctx.shadowColor = player.glow;
            ctx.shadowBlur = 10;
            ctx.moveTo(last.x, last.y);
            ctx.lineTo(player.x, player.y);
            ctx.stroke();
        }

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }

    function drawBike(player) {
        if (!player.alive) {
            // Explosion effect
            ctx.fillStyle = COLORS.explosion;
            ctx.shadowColor = COLORS.explosion;
            ctx.shadowBlur = 35;
            ctx.beginPath();
            const explosionSize = 15 + Math.sin(frameCount * 0.4) * 5;
            ctx.arc(player.x, player.y, explosionSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            return;
        }

        ctx.save();
        ctx.translate(player.x, player.y);
        let angle = Math.atan2(player.dy, player.dx);
        ctx.rotate(angle);

        ctx.shadowColor = player.glow;
        ctx.shadowBlur = 20;
        ctx.fillStyle = player.color;

        // Bike shape - sleek light cycle
        ctx.beginPath();
        ctx.moveTo(12, 0);    // Nose
        ctx.lineTo(5, -6);    // Top front
        ctx.lineTo(-8, -5);   // Top back
        ctx.lineTo(-12, 0);   // Tail
        ctx.lineTo(-8, 5);    // Bottom back
        ctx.lineTo(5, 6);     // Bottom front
        ctx.closePath();
        ctx.fill();

        // Windshield
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(5, -4);
        ctx.lineTo(5, 4);
        ctx.closePath();
        ctx.fill();

        // Engine glow
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(-10, 0, 3, 0, Math.PI * 2);
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
            ctx.textBaseline = 'middle';

            if (winner === 'НИЧЬЯ') {
                ctx.fillStyle = '#FFF';
                ctx.font = 'bold 48px Orbitron, sans-serif';
                ctx.fillText('НИЧЬЯ!', WIDTH / 2, HEIGHT / 2 - 30);
            } else {
                const winColor = winner === 'CYAN' ? COLORS.player1 : COLORS.player2;
                ctx.fillStyle = winColor;
                ctx.shadowColor = winColor;
                ctx.shadowBlur = 30;
                ctx.font = 'bold 50px Orbitron, sans-serif';
                ctx.fillText(winner + ' WINS!', WIDTH / 2, HEIGHT / 2 - 30);
                ctx.shadowBlur = 0;
            }

            ctx.fillStyle = '#888';
            ctx.font = '16px Inter, sans-serif';
            ctx.fillText('Нажми "Старт" для новой игры', WIDTH / 2, HEIGHT / 2 + 30);

            ctx.fillStyle = '#666';
            ctx.font = '14px Inter, sans-serif';
            ctx.fillText(`CYAN: ${p1Score}  |  ORANGE: ${p2Score}`, WIDTH / 2, HEIGHT / 2 + 60);
        }, 350);

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
        }, 800); // Faster countdown
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

    function toggleFade() {
        fadeTrailEnabled = !fadeTrailEnabled;
        updateUI();
        if (!isRunning) drawStartScreen();
    }

    function handleKeyDown(e) {
        // Check if TRON view is active
        const view = document.getElementById('view-tron');
        if (!view || view.classList.contains('hidden')) return;

        // Toggle fade with F key
        if (e.key.toLowerCase() === 'f') {
            toggleFade();
            e.preventDefault();
            return;
        }

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
            // Start with Space or Enter
            if (e.key === ' ' || e.key === 'Enter') {
                startGame();
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
        for (let x = 0; x < WIDTH; x += 25) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, HEIGHT);
            ctx.stroke();
        }
        for (let y = 0; y < HEIGHT; y += 25) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(WIDTH, y);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Border
        ctx.strokeStyle = LEVELS[currentLevel].color;
        ctx.lineWidth = 4;
        ctx.strokeRect(3, 3, WIDTH - 6, HEIGHT - 6);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Title with glow
        ctx.fillStyle = COLORS.player1;
        ctx.font = 'bold 56px Orbitron, sans-serif';
        ctx.shadowColor = COLORS.player1Glow;
        ctx.shadowBlur = 40;
        ctx.fillText('TRON', WIDTH / 2, HEIGHT / 2 - 100);
        ctx.shadowBlur = 0;

        ctx.font = '20px Orbitron, sans-serif';
        ctx.fillStyle = COLORS.player2;
        ctx.fillText('LIGHT CYCLE ARENA', WIDTH / 2, HEIGHT / 2 - 60);

        // Level selector
        ctx.fillStyle = LEVELS[currentLevel].color;
        ctx.font = 'bold 26px Orbitron, sans-serif';
        ctx.fillText(`◀  ${LEVELS[currentLevel].name.toUpperCase()}  ▶`, WIDTH / 2, HEIGHT / 2);

        ctx.font = '14px Orbitron, sans-serif';
        ctx.fillStyle = '#666';
        ctx.fillText(`Скорость: ${LEVELS[currentLevel].speed}`, WIDTH / 2, HEIGHT / 2 + 30);

        // Fade status
        if (fadeTrailEnabled) {
            ctx.fillStyle = '#FF6B00';
            ctx.font = 'bold 16px Orbitron, sans-serif';
            ctx.fillText('🔥 ЗАТУХАНИЕ ВКЛЮЧЕНО', WIDTH / 2, HEIGHT / 2 + 60);
        }

        // Controls
        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = '#888';
        ctx.fillText('CYAN: W A S D  •  ORANGE: ← ↑ ↓ →', WIDTH / 2, HEIGHT / 2 + 100);

        ctx.fillStyle = '#666';
        ctx.fillText('F — затухание  |  Space/Enter — старт  |  ← → — уровень', WIDTH / 2, HEIGHT / 2 + 125);
    }

    // Setup event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.getElementById('tron-start')?.addEventListener('click', startGame);
    document.getElementById('tron-level-down')?.addEventListener('click', () => changeLevel(-1));
    document.getElementById('tron-level-up')?.addEventListener('click', () => changeLevel(1));
    document.getElementById('tron-fade-btn')?.addEventListener('click', toggleFade);

    // Initial setup
    init();
    drawStartScreen();

    console.log('[TRON] Arena v3 - Now with Fading Trails!');
})();
