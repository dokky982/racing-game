const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas setup
canvas.width = 800;
canvas.height = 600;

// Game states
const GAME_STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    GAME_OVER: 'gameOver'
};

// Game variables
let gameState = GAME_STATE.MENU;
let score = 0;
let level = 1;
let gameSpeed = 3;
let isGameRunning = false;

// Player car
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 100,
    width: 50,
    height: 80,
    speed: 0,
    maxSpeed: 7,
    friction: 0.95,
    acceleration: 0.3
};

// Keyboard input
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Obstacle class
class Obstacle {
    constructor() {
        this.width = 50;
        this.height = 80;
        this.x = Math.random() * (canvas.width - this.width);
        this.y = -this.height;
        this.speed = gameSpeed;
    }

    draw() {
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

    update() {
        this.y += this.speed;
    }

    isOffScreen() {
        return this.y > canvas.height;
    }
}

// Power-up class
class PowerUp {
    constructor() {
        this.width = 30;
        this.height = 30;
        this.x = Math.random() * (canvas.width - this.width);
        this.y = -this.height;
        this.speed = gameSpeed - 1;
        this.type = Math.random() > 0.5 ? 'shield' : 'boost';
    }

    draw() {
        ctx.fillStyle = this.type === 'shield' ? '#4ecdc4' : '#ffd700';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    update() {
        this.y += this.speed;
    }

    isOffScreen() {
        return this.y > canvas.height;
    }
}

let obstacles = [];
let powerUps = [];
let shield = false;
let shieldTime = 0;

// Spawn obstacles
function spawnObstacle() {
    obstacles.push(new Obstacle());
}

// Spawn power-ups
function spawnPowerUp() {
    if (Math.random() < 0.1) {
        powerUps.push(new PowerUp());
    }
}

// Draw player car
function drawPlayer() {
    // Car body
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Car windows
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(player.x + 5, player.y + 10, 40, 20);
    ctx.fillRect(player.x + 5, player.y + 40, 40, 20);

    // Car wheels
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(player.x + 10, player.y + 70, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + 40, player.y + 70, 5, 0, Math.PI * 2);
    ctx.fill();

    // Shield effect
    if (shield) {
        ctx.strokeStyle = '#4ecdc4';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, 50, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// Draw road markings
function drawRoad() {
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 20]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

// Update player position
function updatePlayer() {
    // Handle input
    if (keys['ArrowLeft'] || keys['a']) {
        player.x -= 6;
    }
    if (keys['ArrowRight'] || keys['d']) {
        player.x += 6;
    }
    if (keys['ArrowUp'] || keys['w']) {
        player.speed = Math.min(player.speed + player.acceleration, player.maxSpeed);
    }
    if (keys['ArrowDown'] || keys['s']) {
        player.speed = Math.max(player.speed - player.acceleration, -3);
    }

    // Apply friction
    player.speed *= player.friction;

    // Boundary checking
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
}

// Check collision
function checkCollision(obj) {
    return (
        player.x < obj.x + obj.width &&
        player.x + player.width > obj.x &&
        player.y < obj.y + obj.height &&
        player.y + player.height > obj.y
    );
}

// Handle collisions
function handleCollisions() {
    // Check obstacle collisions
    for (let i = obstacles.length - 1; i >= 0; i--) {
        if (checkCollision(obstacles[i])) {
            if (shield) {
                shield = false;
                obstacles.splice(i, 1);
            } else {
                endGame();
            }
        }
    }

    // Check power-up collisions
    for (let i = powerUps.length - 1; i >= 0; i--) {
        if (checkCollision(powerUps[i])) {
            if (powerUps[i].type === 'shield') {
                shield = true;
                shieldTime = 300;
            } else {
                score += 50;
            }
            powerUps.splice(i, 1);
        }
    }
}

// Update HUD
function updateHUD() {
    document.getElementById('scoreValue').textContent = score;
    document.getElementById('speedValue').textContent = Math.abs(Math.round(player.speed * 10));
    document.getElementById('levelValue').textContent = level;
}

// Increase difficulty
function increaseDifficulty() {
    level++;
    gameSpeed += 0.5;
    obstacles.forEach(obs => obs.speed = gameSpeed);
    powerUps.forEach(powerUp => powerUp.speed = gameSpeed - 1);
}

// Game loop
let frameCount = 0;
let obstacleSpawnRate = 60;

function gameLoop() {
    if (gameState === GAME_STATE.PLAYING && isGameRunning) {
        // Clear canvas
        ctx.fillStyle = '#87ceeb';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw road
        drawRoad();

        // Update and draw player
        updatePlayer();
        drawPlayer();

        // Spawn obstacles and power-ups
        frameCount++;
        if (frameCount % obstacleSpawnRate === 0) {
            spawnObstacle();
        }
        spawnPowerUp();

        // Update and draw obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles[i].update();
            obstacles[i].draw();
            if (obstacles[i].isOffScreen()) {
                obstacles.splice(i, 1);
                score += 10;
            }
        }

        // Update and draw power-ups
        for (let i = powerUps.length - 1; i >= 0; i--) {
            powerUps[i].update();
            powerUps[i].draw();
            if (powerUps[i].isOffScreen()) {
                powerUps.splice(i, 1);
            }
        }

        // Update shield
        if (shield) {
            shieldTime--;
            if (shieldTime <= 0) {
                shield = false;
            }
        }

        // Check collisions
        handleCollisions();

        // Update difficulty
        if (score > 0 && score % 500 === 0 && score > (level - 1) * 500) {
            increaseDifficulty();
            obstacleSpawnRate = Math.max(40, obstacleSpawnRate - 5);
        }

        // Update HUD
        updateHUD();
    }

    requestAnimationFrame(gameLoop);
}

function startGame() {
    document.getElementById('startScreen').classList.add('hidden');
    gameState = GAME_STATE.PLAYING;
    isGameRunning = true;
    score = 0;
    level = 1;
    gameSpeed = 3;
    obstacleSpawnRate = 60;
    obstacles = [];
    powerUps = [];
    shield = false;
    player.x = canvas.width / 2 - 25;
    player.speed = 0;
}

function endGame() {
    gameState = GAME_STATE.GAME_OVER;
    isGameRunning = false;
    document.getElementById('gameOverScreen').classList.remove('hidden');
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalLevel').textContent = level;
}

function restartGame() {
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('startScreen').classList.remove('hidden');
    gameState = GAME_STATE.MENU;
}

// Start the game loop
gameLoop();