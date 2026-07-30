const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const menu = document.getElementById('menu');
const startBtn = document.getElementById('startBtn');

const coinsEl = document.getElementById('coins');
const livesEl = document.getElementById('lives');

const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const jumpBtn = document.getElementById('jumpBtn');

let worldWidth = 3800;
let gravity = 0.8;
let gameRunning = false;
let cameraX = 0;
let coinAnimation = 0;
let currentLevel = 1;
let coyoteTime = 0;
let jumpBuffer = 0;

const COYOTE_FRAMES = 8;
const JUMP_BUFFER_FRAMES = 8;

const ACCELERATION = 0.8;
const FRICTION = 0.75;
const MAX_SPEED = 5;

const totalLevels = 2;

function resizeCanvas() {
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
        canvas.width = window.innerWidth - 20;
        canvas.height = window.innerHeight - 180; // espaço para HUD e controles
    } else {
        canvas.width = Math.min(window.innerWidth - 40, 900);
        canvas.height = 500;
    }
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const player = {
    x: 100,
    y: 100,
    width: 40,
    height: 50,
    vx: 0,
    vy: 0,
    speed: 5,
    jump: -16,
    grounded: false,
    coins: 0,
    lives: 3

};

const enemies = [
    { x: 700, y: 310, w: 36, h: 36, dir: 1, min: 650, max: 820 },
    { x: 1450, y: 280, w: 36, h: 36, dir: -1, min: 1320, max: 1600 },
    { x: 2100, y: 320, w: 36, h: 36, dir: 1, min: 1980, max: 2200 },
    { x: 2750, y: 200, w: 36, h: 36, dir: -1, min: 2650, max: 2850 }
];

let invincible = false;
let invincibleTime = 0;

const keys = {
    left: false,
    right: false,
    up: false
};

const groundY = canvas.height - 60;

const platforms = [
    // chão inicial
    { x: 0, y: groundY, w: 520, h: 60 },

    // plataforma de aprendizado
    { x: 580, y: groundY - 70, w: 120, h: 25 },

    // chão
    { x: 740, y: groundY, w: 420, h: 60 },

    // sequência de plataformas
    { x: 900, y: groundY - 110, w: 100, h: 25 },
    { x: 1040, y: groundY - 150, w: 100, h: 25 },
    { x: 1180, y: groundY - 110, w: 100, h: 25 },

    // chão
    { x: 1320, y: groundY, w: 380, h: 60 },

    // plataforma central
    { x: 1500, y: groundY - 90, w: 140, h: 25 },

    // chão
    { x: 1740, y: groundY, w: 340, h: 60 },

    // plataformas
    { x: 1880, y: groundY - 130, w: 120, h: 25 },
    { x: 2050, y: groundY - 170, w: 120, h: 25 },

    // chão
    { x: 2200, y: groundY, w: 300, h: 60 },

    // plataforma
    { x: 2340, y: groundY - 100, w: 140, h: 25 },

    // chão final
    { x: 2580, y: groundY, w: 520, h: 60 }
];

const movingPlatforms = [
    {
        x: 880,
        y: groundY - 140,
        w: 120,
        h: 20,
        startX: 880,
        endX: 1080,
        speed: 1.2,
        dir: 1,
        vertical: false
    },
    {
        x: 1750,
        y: groundY - 200,
        w: 120,
        h: 20,
        startY: groundY - 240,
        endY: groundY - 80,
        speed: 1,
        dir: 1,
        vertical: true
    },
    {
        x: 2500,
        y: groundY - 120,
        w: 140,
        h: 20,
        startX: 2500,
        endX: 2780,
        speed: 2,
        dir: 1,
        vertical: false
    }
];

const blocks = [
    { x: 900, y: 180, w: 40, h: 40, broken: false },
    { x: 940, y: 180, w: 40, h: 40, broken: false },
    { x: 980, y: 180, w: 40, h: 40, broken: false },
    { x: 1700, y: 150, w: 40, h: 40, broken: false },
    { x: 1740, y: 150, w: 40, h: 40, broken: false }
];

const pipes = [
    { x: 1200, y: 300, w: 70, h: 100 },
    { x: 1850, y: 260, w: 70, h: 140 },
    { x: 2450, y: 280, w: 70, h: 120 }
];

const coins = [
    { x: 600, y: 300, collected: false },
    { x: 850, y: 250, collected: false },
    { x: 1100, y: 200, collected: false },
    { x: 1380, y: 270, collected: false },
    { x: 1700, y: 210, collected: false },
    { x: 2050, y: 310, collected: false },
    { x: 2380, y: 250, collected: false },
    { x: 2680, y: 190, collected: false }
];

const flag = {
    x: 3050,
    y: 250,
    width: 30,
    height: 130
};

const checkpoint = {
    x: 2000,
    y: 280,
    w: 20,
    h: 120,
    activated: false
};

let respawnX = 100;
let respawnY = 100;

function startGame() {
    menu.style.display = 'none';
    canvas.style.display = 'block';
    document.getElementById('mobileControls').style.display = 'flex';

    player.x = 100;
    player.y = 100;
    player.vx = 0;
    player.vy = 0;
    player.coins = 0;
    player.lives = 3;

    coins.forEach(c => c.collected = false);

    coinsEl.textContent = 0;
    livesEl.textContent = 3;

    cameraX = 0;
    gameRunning = true;
    currentLevel = 1;
    loadLevel(currentLevel);
    gameLoop();
}

startBtn.addEventListener('click', startGame);

document.addEventListener('keydown', e => {

    const tecla = e.key.toLowerCase();

    if (tecla === 'arrowleft' || tecla === 'a') {
        keys.left = true;
    }

    if (tecla === 'arrowright' || tecla === 'd') {
        keys.right = true;
    }

    if (
        tecla === 'arrowup' ||
        tecla === 'w' ||
        tecla === ' '
    ) {
        keys.up = true;
        jumpBuffer = JUMP_BUFFER_FRAMES;
    }
});

document.addEventListener('keyup', e => {

    const tecla = e.key.toLowerCase();

    if (tecla === 'arrowleft' || tecla === 'a') {
        keys.left = false;
    }

    if (tecla === 'arrowright' || tecla === 'd') {
        keys.right = false;
    }

    if (
        tecla === 'arrowup' ||
        tecla === 'w' ||
        tecla === ' '
    ) {
        keys.up = false;
    }
});

// ==============================
// CONTROLES MOBILE
// ==============================

function setupMobileButton(button, keyName) {

    const press = (e) => {
        e.preventDefault();
        keys[keyName] = true;

        if (keyName === 'up') {
            jumpBuffer = JUMP_BUFFER_FRAMES;
        }
    };

    const release = (e) => {
        e.preventDefault();
        keys[keyName] = false;
    };

    // Touch
    button.addEventListener('touchstart', press, { passive: false });
    button.addEventListener('touchend', release, { passive: false });
    button.addEventListener('touchcancel', release, { passive: false });

    // Pointer (Android e iPhone)
    button.addEventListener('pointerdown', press);
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('pointerleave', release);

    // Evita menu de contexto
    button.addEventListener('contextmenu', e => e.preventDefault());
}

setupMobileButton(leftBtn, 'left');
setupMobileButton(rightBtn, 'right');
setupMobileButton(jumpBtn, 'up');

function updatePlayer() {

    // Movimento horizontal
    if (keys.left) {
        player.vx -= ACCELERATION;
    } else if (keys.right) {
        player.vx += ACCELERATION;
    } else {
        player.vx *= FRICTION;
        if (Math.abs(player.vx) < 0.1) player.vx = 0;
    }

    player.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, player.vx));

    // Coyote time
    if (player.grounded) {
        coyoteTime = COYOTE_FRAMES;
    } else {
        coyoteTime--;
    }

    // Jump buffer
    if (jumpBuffer > 0) jumpBuffer--;

    // Pulo
    if (jumpBuffer > 0 && coyoteTime > 0) {
        player.vy = player.jump;
        player.grounded = false;
        jumpBuffer = 0;
        coyoteTime = 0;
    }

    // Gravidade
    player.vy += gravity;

    // Pulo variável
    if (!keys.up && player.vy < 0) {
        player.vy *= 0.6;
    }

    // Guarda posição anterior
    const prevX = player.x;
    const prevY = player.y;

    // Movimento
    player.x += player.vx;
    player.y += player.vy;

    // Assume que está no ar
    player.grounded = false;

    // =============================
    // PLATAFORMAS NORMAIS
    // =============================
    platforms.forEach(p => {

        const hit =
            player.x < p.x + p.w &&
            player.x + player.width > p.x &&
            player.y < p.y + p.h &&
            player.y + player.height > p.y;

        if (!hit) return;

        // Caiu em cima
        if (prevY + player.height <= p.y + 5 && player.vy >= 0) {
            player.y = p.y - player.height;
            player.vy = 0;
            player.grounded = true;
        }

        // Bateu por baixo
        else if (prevY >= p.y + p.h - 5 && player.vy < 0) {
            player.y = p.y + p.h;
            player.vy = 0;
        }

        // Colisão lateral esquerda
        else if (prevX + player.width <= p.x + 5 && player.vx > 0) {
            player.x = p.x - player.width;
            player.vx = 0;
        }

        // Colisão lateral direita
        else if (prevX >= p.x + p.w - 5 && player.vx < 0) {
            player.x = p.x + p.w;
            player.vx = 0;
        }

    });

    // =============================
    // PLATAFORMAS MÓVEIS
    // =============================
    movingPlatforms.forEach(p => {

        const hit =
            player.x < p.x + p.w &&
            player.x + player.width > p.x &&
            player.y < p.y + p.h &&
            player.y + player.height > p.y;

        if (!hit) return;

        // Apenas pousando por cima
        if (prevY + player.height <= p.y + 8 && player.vy >= 0) {

            player.y = p.y - player.height;
            player.vy = 0;
            player.grounded = true;

            // Move junto com a plataforma
            player.x += p.dx;
            player.y += p.dy;
        }

    });

    // Limites do mundo
    player.x = Math.max(0, Math.min(player.x, worldWidth - player.width));

    // Câmera suave
    const targetCamera = player.x - canvas.width / 3;
    cameraX += (targetCamera - cameraX) * 0.08;
    cameraX = Math.max(0, Math.min(cameraX, worldWidth - canvas.width));

    // Caiu do mapa
    if (player.y > canvas.height + 200) {

        player.lives--;
        livesEl.textContent = player.lives;

        player.x = respawnX;
        player.y = respawnY;
        player.vx = 0;
        player.vy = 0;

        if (player.lives <= 0) {
            gameOver();
        }
    }
}
function updateCoins() {

    coins.forEach(c => {

        if (c.collected) return;

        if (
            player.x < c.x + 24 &&
            player.x + player.width > c.x &&
            player.y < c.y + 24 &&
            player.y + player.height > c.y
        ) {

            c.collected = true;
            player.coins++;
            coinsEl.textContent = player.coins;
        }
    });
}

function checkFlag() {

    const hit =
        player.x < flag.x + flag.width &&
        player.x + player.width > flag.x &&
        player.y < flag.y + flag.height &&
        player.y + player.height > flag.y;

    if (!hit) return;

    gameRunning = false;

    setTimeout(() => {

        if (currentLevel < totalLevels) {

            currentLevel++;

            loadLevel(currentLevel);

            gameRunning = true;

            gameLoop();

        } else {

            alert(
                `🎉 Você terminou o jogo!\n\nMoedas: ${player.coins}`
            );

            menu.style.display = 'block';
            canvas.style.display = 'none';
            document.getElementById('mobileControls').style.display = 'none';
        }

    }, 500);
}

function drawBackground() {

    // Céu
    ctx.fillStyle = '#7bd3ff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sol
    ctx.fillStyle = '#ffd54f';
    ctx.beginPath();
    ctx.arc(canvas.width - 80, 70, 35, 0, Math.PI * 2);
    ctx.fill();

    // Montanhas (camada 1)
    ctx.fillStyle = '#8ec07c';

    for (let i = 0; i < 8; i++) {

        const x = i * 400 - cameraX * 0.2;

        ctx.beginPath();
        ctx.moveTo(x, 420);
        ctx.lineTo(x + 120, 220);
        ctx.lineTo(x + 240, 420);
        ctx.closePath();
        ctx.fill();
    }

    // Árvores (camada 2)
    ctx.fillStyle = '#3a7d44';

    for (let i = 0; i < 20; i++) {

        const x = i * 170 - cameraX * 0.5;

        ctx.fillRect(x, 320, 20, 100);

        ctx.beginPath();
        ctx.arc(x + 10, 300, 30, 0, Math.PI * 2);
        ctx.fill();
    }

    // Nuvens (camada 3)
    ctx.fillStyle = '#ffffff';

    for (let i = 0; i < 10; i++) {

        const x = i * 220 - cameraX * 0.1;
        const y = 50 + (i % 3) * 30;

        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.arc(x + 18, y - 8, 22, 0, Math.PI * 2);
        ctx.arc(x + 40, y, 18, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawPlatforms() {

    platforms.forEach(p => {

        // Base do bloco
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(
            p.x - cameraX,
            p.y,
            p.w,
            p.h
        );

        // Grama em cima
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(
            p.x - cameraX,
            p.y,
            p.w,
            8
        );

        // Textura do solo
        ctx.fillStyle = '#6d4420';

        for (let i = 0; i < p.w; i += 24) {

            ctx.fillRect(
                p.x - cameraX + i,
                p.y + 16,
                12,
                6
            );

            ctx.fillRect(
                p.x - cameraX + i + 8,
                p.y + 34,
                10,
                6
            );
        }
    });
}

function drawCoins() {

    coinAnimation += 0.1;

    coins.forEach(c => {

        if (c.collected) return;

        const offset = Math.sin(coinAnimation + c.x * 0.01) * 4;

        ctx.fillStyle = '#ffd60a';

        ctx.beginPath();
        ctx.arc(
            c.x - cameraX + 12,
            c.y + 12 + offset,
            10,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.fillStyle = '#fff3b0';

        ctx.beginPath();
        ctx.arc(
            c.x - cameraX + 8,
            c.y + 8 + offset,
            3,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });
}

function drawFlag() {

    ctx.fillStyle = '#8b5a2b';

    ctx.fillRect(
        flag.x - cameraX,
        flag.y,
        6,
        flag.height
    );

    ctx.fillStyle = '#ff3b3b';

    ctx.beginPath();

    ctx.moveTo(flag.x - cameraX + 6, flag.y);

    ctx.lineTo(flag.x - cameraX + 40, flag.y + 15);

    ctx.lineTo(flag.x - cameraX + 6, flag.y + 30);

    ctx.closePath();

    ctx.fill();
}

function drawPlayer() {

    if (invincible && Math.floor(invincibleTime / 4) % 2 === 0) {
        return;
    }

    ctx.fillStyle = '#2563eb';

    ctx.fillRect(
        player.x - cameraX,
        player.y,
        player.width,
        player.height
    );

    ctx.fillStyle = '#f8d5b8';

    ctx.fillRect(
        player.x - cameraX + 8,
        player.y + 6,
        24,
        16
    );

    ctx.fillStyle = '#1d4ed8';

    ctx.fillRect(
        player.x - cameraX + 5,
        player.y + 22,
        30,
        20
    );
}

function gameOver() {

    gameRunning = false;

    setTimeout(() => {
        alert('Game Over');
        menu.style.display = 'block';
        canvas.style.display = 'none';
        document.getElementById('mobileControls').style.display = 'none';
    }, 100);
}

function drawEnemies() {

    enemies.forEach(enemy => {

        // corpo

        ctx.fillStyle = '#8b0000';

        ctx.fillRect(
            enemy.x - cameraX,
            enemy.y,
            enemy.w,
            enemy.h
        );

        // olhos

        ctx.fillStyle = '#ffffff';

        ctx.fillRect(
            enemy.x - cameraX + 6,
            enemy.y + 8,
            6,
            6
        );

        ctx.fillRect(
            enemy.x - cameraX + 24,
            enemy.y + 8,
            6,
            6
        );

        // pupilas

        ctx.fillStyle = '#000';

        ctx.fillRect(
            enemy.x - cameraX + 8,
            enemy.y + 10,
            2,
            2
        );

        ctx.fillRect(
            enemy.x - cameraX + 26,
            enemy.y + 10,
            2,
            2
        );

        // boca

        ctx.fillStyle = '#ffaaaa';

        ctx.fillRect(
            enemy.x - cameraX + 10,
            enemy.y + 24,
            16,
            4
        );
    });
}

function updateEnemies() {

    enemies.forEach(enemy => {

        enemy.x += enemy.dir * 1.5;

        if (enemy.x < enemy.min) enemy.dir = 1;
        if (enemy.x > enemy.max) enemy.dir = -1;

        const hit =
            player.x < enemy.x + enemy.w &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.h &&
            player.y + player.height > enemy.y;

        if (!hit) return;

        const caiuEmCima =
            player.vy > 0 &&
            player.y + player.height - 10 < enemy.y;

        if (caiuEmCima) {

            player.vy = -10;

            enemies.splice(enemies.indexOf(enemy), 1);

            player.coins += 2;

            coinsEl.textContent = player.coins;

            return;
        }

        if (!invincible) {

            player.lives--;

            livesEl.textContent = player.lives;

            invincible = true;

            invincibleTime = 60;

            player.x = Math.max(0, player.x - 80);

            if (player.lives <= 0) {
                gameOver();
            }
        }
    });

    if (invincible) {

        invincibleTime--;

        if (invincibleTime <= 0) {
            invincible = false;
        }
    }
}

function drawPipes() {
    pipes.forEach(pipe => {
        // corpo
        ctx.fillStyle = '#2e8b57';
        ctx.fillRect(
            pipe.x - cameraX,
            pipe.y,
            pipe.w,
            pipe.h
        );

        // topo
        ctx.fillStyle = '#3cb371';
        ctx.fillRect(
            pipe.x - cameraX - 5,
            pipe.y,
            pipe.w + 10,
            16
        );

        // brilho
        ctx.fillStyle = '#6ee7a8';
        ctx.fillRect(
            pipe.x - cameraX + 8,
            pipe.y + 8,
            10,
            pipe.h - 16
        );
    });
}

function updatePipes() {
    pipes.forEach(pipe => {
        const hit =
            player.x < pipe.x + pipe.w &&
            player.x + player.width > pipe.x &&
            player.y < pipe.y + pipe.h &&
            player.y + player.height > pipe.y;

        if (!hit) return;

        // vindo da esquerda
        if (player.vx > 0) {
            player.x = pipe.x - player.width;
        }

        // vindo da direita
        if (player.vx < 0) {
            player.x = pipe.x + pipe.w;
        }

        // caindo em cima
        if (player.vy > 0 && player.y + player.height - 10 < pipe.y) {
            player.y = pipe.y - player.height;
            player.vy = 0;
            player.grounded = true;
        }
    });
}

function drawCheckpoint() {
    // poste
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(
        checkpoint.x - cameraX,
        checkpoint.y,
        6,
        checkpoint.h
    );

    // bandeira
    ctx.fillStyle = checkpoint.activated ? '#39ff88' : '#ffd60a';

    ctx.beginPath();
    ctx.moveTo(checkpoint.x - cameraX + 6, checkpoint.y);
    ctx.lineTo(checkpoint.x - cameraX + 34, checkpoint.y + 14);
    ctx.lineTo(checkpoint.x - cameraX + 6, checkpoint.y + 28);
    ctx.closePath();
    ctx.fill();
}

function updateCheckpoint() {
    if (checkpoint.activated) return;

    const hit =
        player.x < checkpoint.x + checkpoint.w &&
        player.x + player.width > checkpoint.x &&
        player.y < checkpoint.y + checkpoint.h &&
        player.y + player.height > checkpoint.y;

    if (hit) {
        checkpoint.activated = true;
        respawnX = checkpoint.x;
        respawnY = checkpoint.y - player.height;
    }
}

function loadLevel(level) {

    // reset do checkpoint
    checkpoint.activated = false;
    respawnX = 100;
    respawnY = 100;

    // limpa moedas
    coins.forEach(c => c.collected = false);

    // limpa blocos
    blocks.forEach(b => b.broken = false);

    // posição inicial do jogador
    player.x = 100;
    player.y = 100;
    player.vx = 0;
    player.vy = 0;

    cameraX = 0;

    // altera a fase
    if (level === 1) {

        flag.x = 3050;
        flag.y = 250;

} else if (level === 2) {

    // posição da bandeira
    flag.x = 3560;
    flag.y = groundY - 300;

    // plataformas finais
    platforms.push(
        { x: 3150, y: groundY - 120, w: 180, h: 30 },
        { x: 3320, y: groundY - 180, w: 140, h: 20 }, // plataforma móvel
        { x: 3480, y: groundY - 170, w: 170, h: 25 }  // plataforma da bandeira
    );

    // move a plataforma móvel
    movingPlatforms[1] = {
        x: 3320,
        y: groundY - 180,
        w: 140,
        h: 20,
        startY: groundY - 220,
        endY: groundY - 120,
        speed: 1,
        dir: 1,
        vertical: true
    };

    // inimigos
    enemies.push(
        { x: 3200, y: groundY - 156, w: 36, h: 36, dir: 1, min: 3150, max: 3330 },
        { x: 3500, y: groundY - 206, w: 36, h: 36, dir: -1, min: 3460, max: 3600 }
    );
}

    document.querySelector('.hud div:last-child').textContent =
        `🏁 Fase ${level}`;
}

function drawMovingPlatforms() {

    movingPlatforms.forEach(p => {

        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(p.x - cameraX + 10, p.y);
        ctx.lineTo(p.x - cameraX + 10, p.y - 30);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(p.x - cameraX + p.w - 10, p.y);
        ctx.lineTo(p.x - cameraX + p.w - 10, p.y - 30);
        ctx.stroke();

        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(
            p.x - cameraX,
            p.y,
            p.w,
            p.h
        );

        ctx.fillStyle = '#6d4420';

        for (let i = 0; i < p.w; i += 20) {

            ctx.fillRect(
                p.x - cameraX + i,
                p.y + 4,
                2,
                p.h - 8
            );

        }

    });

}

function updateMovingPlatforms() {

    movingPlatforms.forEach(p => {

        p.dx = 0;
        p.dy = 0;

        if (p.vertical) {

            p.dy = p.speed * p.dir;
            p.y += p.dy;

            if (p.y <= p.startY || p.y >= p.endY) {
                p.dir *= -1;
            }

        } else {

            p.dx = p.speed * p.dir;
            p.x += p.dx;

            if (p.x <= p.startX || p.x >= p.endX) {
                p.dir *= -1;
            }
        }
    });
}

function gameLoop() {
    if (!gameRunning) return;

    updateMovingPlatforms();
    updatePlayer();
    updateCoins();
    updateEnemies();
    updateBlocks();
    updatePipes();
    updateCheckpoint();
    checkFlag();

    drawBackground();
    drawPlatforms();
    drawMovingPlatforms();
    drawPipes();
    drawBlocks();
    drawCoins();
    drawEnemies();
    drawCheckpoint();
    drawFlag();
    drawPlayer();

    requestAnimationFrame(gameLoop);
}

function resetKeys() {
    keys.left = false;
    keys.right = false;
    keys.up = false;
}

// Quando a janela perder o foco
window.addEventListener('blur', resetKeys);

// Quando mudar de aba
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        resetKeys();
    }
});

function drawBlocks() {

    blocks.forEach(block => {

        if (block.broken) return;

        // bloco principal
        ctx.fillStyle = '#c97c2c';
        ctx.fillRect(
            block.x - cameraX,
            block.y,
            block.w,
            block.h
        );

        // borda
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            block.x - cameraX,
            block.y,
            block.w,
            block.h
        );

        // detalhe
        ctx.fillStyle = '#f5d06f';
        ctx.fillRect(
            block.x - cameraX + 8,
            block.y + 8,
            24,
            24
        );
    });
}

function updateBlocks() {

    blocks.forEach(block => {

        if (block.broken) return;

        const hit =

            player.x < block.x + block.w &&
            player.x + player.width > block.x &&
            player.y < block.y + block.h &&
            player.y + player.height > block.y;

        if (!hit) return;

        // bateu por baixo
        const bateuPorBaixo =

            player.vy < 0 &&
            player.y > block.y;

        if (bateuPorBaixo) {

            block.broken = true;

            player.vy = 2;

            // recompensa
            player.coins++;
            coinsEl.textContent = player.coins;
        }
    });
}