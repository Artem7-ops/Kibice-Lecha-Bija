const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const messages = ["Lech znów przegrał 😭", "Ale debilizm!", "Kurwa!", "Czemu lech zawsze przegrywa 🤬", "Lech tak chujowo gra 😑"];

let enemies = [];
const spriteSizeRatio = 0.05;
const speedRatio = 0.002;
const flightSpeedRatio = 0.003;
let lastTime = 0;
let isPaused = false;

function initializeEnemies() {
    enemies = [];
    for (let i = 0; i < 5; i++) {
        enemies.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            width: canvas.width * spriteSizeRatio,
            height: canvas.width * spriteSizeRatio,
            speed: canvas.width * speedRatio,
            angle: 0,
            flying: false,
            flightSpeed: canvas.width * flightSpeedRatio,
            flightAngle: 0,
            waitTime: 0,
            health: 100,
            img: new Image(),
            deadImg: new Image(),
            target: null,
            bubble: null,
            bubbleTimer: 0,
            isDead: false,
            deathTime: 0,
            deathDuration: 1
        });
        enemies[i].img.src = 'img' + i + '.png';
        enemies[i].deadImg.src = 'co' + i + '.png';
    }
}

function reInitEnemy(enemy){
    enemy.width = canvas.width * spriteSizeRatio;
    enemy.height = canvas.width * spriteSizeRatio;
    enemy.speed = canvas.width * speedRatio;
    enemy.flightSpeed = canvas.width * flightSpeedRatio;
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    enemies.forEach(reInitEnemy);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function gameLoop(timestamp) {
    if (!isPaused) {
        const deltaTime = (timestamp - lastTime) / 1000;

        update(deltaTime);
        draw();
    }
    lastTime = timestamp;
    requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
    for (let i = 0; i < enemies.length; i++) {
        if (enemies[i].isDead) {
            enemies[i].deathTime += deltaTime;
            if (enemies[i].deathTime > enemies[i].deathDuration) {
                enemies[i].deathTime = enemies[i].deathDuration;
            }
            continue;
        }

        if (!enemies[i].flying) {
            if (!enemies[i].target) {
                enemies[i].target = getRandomEnemy(enemies[i]);
            }
            moveTowards(enemies[i], enemies[i].target, deltaTime);
        } else {
            updateFlying(enemies[i], deltaTime);
        }

        for (let j = i + 1; j < enemies.length; j++) {
            if (!enemies[j].isDead && !enemies[j].flying && checkCollision(enemies[i], enemies[j])) {
                startFlying(enemies[i]);
                startFlying(enemies[j]);
                enemies[i].health -= 1;
                enemies[j].health -= 1;

                if (enemies[i].health <= 0) {
                    enemies[i].isDead = true;
                    enemies[i].health = 0;
                }
                if (enemies[j].health <= 0) {
                    enemies[j].isDead = true;
                    enemies[j].health = 0;
                }
            }
        }

        checkBounds(enemies[i]);

        if (enemies[i].bubbleTimer > 0) {
            enemies[i].bubbleTimer -= deltaTime;
            if (enemies[i].bubbleTimer <= 0) {
                enemies[i].bubble = null;
                enemies[i].bubbleTimer = 0;
            }
        } else if (Math.random() < 0.005) {
            enemies[i].bubble = getRandomMessage();
            enemies[i].bubbleTimer = 1;
        }
    }
}

function moveTowards(e1, e2, deltaTime) {
    if (e1.isDead) return;

    let dx = e2.x - e1.x;
    let dy = e2.y - e1.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    e1.angle = Math.atan2(dy, dx);

    if (distance > 1) {
        e1.x += (dx / distance) * e1.speed * deltaTime * 60;
        e1.y += (dy / distance) * e1.speed * deltaTime * 60;
    }
}

function getRandomEnemy(currentEnemy) {
    let randomEnemy;
    do {
        randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];
    } while (randomEnemy === currentEnemy || randomEnemy.isDead);
    return randomEnemy;
}

function checkCollision(e1, e2) {
    if (e1.isDead || e2.isDead) return false;

    const dx = e1.x - e2.x;
    const dy = e1.y - e2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < Math.max(e1.width, e1.height);
}

function startFlying(enemy) {
    if (enemy.isDead) return;

    enemy.flying = true;
    enemy.flightAngle = Math.random() * Math.PI * 2;
    enemy.angle = enemy.flightAngle;
    enemy.waitTime = Math.random() * 150 + 30;
    enemy.target = null;
}

function updateFlying(enemy, deltaTime) {
    if (enemy.isDead) return;

    if (enemy.flying) {
        if (enemy.waitTime > 0) {
            enemy.x += Math.cos(enemy.flightAngle) * enemy.flightSpeed * deltaTime * 60;
            enemy.y += Math.sin(enemy.flightAngle) * enemy.flightSpeed * deltaTime * 60;
            enemy.angle += 0.1 * deltaTime * 60;
            enemy.waitTime -= deltaTime * 60;
        } else {
            enemy.flying = false;
        }
    }
}

function checkBounds(enemy) {
    if (enemy.isDead) return;

    if (enemy.x < 0 || enemy.x + enemy.width > canvas.width) {
        enemy.flightAngle = Math.PI - enemy.flightAngle;
        enemy.angle = enemy.flightAngle;
    }
    if (enemy.y < 0 || enemy.y + enemy.height > canvas.height) {
        enemy.flightAngle = -enemy.flightAngle;
        enemy.angle = enemy.flightAngle;
    }
    if (enemy.x < -enemy.width || enemy.x > canvas.width || enemy.y < -enemy.height || enemy.y > canvas.height) {
        enemy.x = Math.random() * (canvas.width - enemy.width);
        enemy.y = Math.random() * (canvas.height - enemy.height);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < enemies.length; i++) {
        drawEnemy(enemies[i]);
    }
}

function drawDontClean() {
    //ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < enemies.length; i++) {
        drawEnemy(enemies[i]);
    }
}

function drawEnemy(enemy) {
    ctx.save();
    ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
    ctx.rotate(enemy.angle);

    if (enemy.isDead) {
        const alpha = enemy.deathTime / enemy.deathDuration;
        ctx.globalAlpha = alpha;
        ctx.drawImage(enemy.deadImg, -enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);
        ctx.globalAlpha = 1;
    } else {
        ctx.drawImage(enemy.img, -enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);
    }

    ctx.restore();

    if (enemy.isDead) return;

    const txt = `Health: ${enemy.health}`;
    const bubbleWidthW = ctx.measureText(txt).width + 3;
    const bubbleHeight = 13;

    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(enemy.x - bubbleWidthW / 30, enemy.y + enemy.height + 3, bubbleWidthW, bubbleHeight);
    ctx.stroke();
    ctx.fill();
    ctx.fillStyle = "black";
    ctx.fillText(txt, enemy.x, enemy.y + enemy.height + bubbleHeight);

    if (enemy.bubble) {
        ctx.fillStyle = "white";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        const bubbleWidth = ctx.measureText(enemy.bubble).width + 5;
        ctx.beginPath();
        ctx.rect(enemy.x - bubbleWidth / 2, enemy.y - bubbleHeight - 12, bubbleWidth, bubbleHeight);
        ctx.stroke();
        ctx.fill();
        ctx.fillStyle = "black";
        ctx.fillText(enemy.bubble, enemy.x - bubbleWidth / 2 + 5, enemy.y - 15);
    }
}

function getRandomMessage() {
    return messages[Math.floor(Math.random() * messages.length)];
}

function randomNum(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var imageUrl = '';

function changeBackgroundImage() {
    const randomIndex = randomNum(0, 9);
    imageUrl = `bg${randomIndex}.jpg`;
    document.body.style.backgroundImage = `url('${imageUrl}')`;
}

function takeScreenshot() {
    try {
        isPaused = true;
        const bg = new Image();
        bg.src = imageUrl; 
        bg.onload = function(){
            const pattern = ctx.createPattern(this, "repeat");
            ctx.fillStyle = pattern;
            ctx.fill();
            drawDontClean()
            const dataURL = canvas.toDataURL();
            isPaused = false;
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = 'screenshot.png';
            link.click();
        };
    } catch (error) {
        console.error('Failed to take screenshot:', error);
    }
    //isPaused = false;
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.log(`Error attempting to enable fullscreen mode: ${err.message}`));
    } else {
        document.exitFullscreen();
    }
}

function restartGame() {
    initializeEnemies();
    lastTime = 0;
}

document.getElementById('pauseButton').addEventListener('click', () => {
    isPaused = true;
    document.getElementById('pauseButton').style.display = 'none';
    document.getElementById('resumeButton').style.display = 'block';
});

document.getElementById('resumeButton').addEventListener('click', () => {
    isPaused = false;
    document.getElementById('pauseButton').style.display = 'block';
    document.getElementById('resumeButton').style.display = 'none';
});

document.getElementById('restartButton').addEventListener('click', restartGame);
document.getElementById('fullscreenButton').addEventListener('click', toggleFullscreen);
document.getElementById('screenshotButton').addEventListener('click', takeScreenshot);

document.addEventListener('fullscreenchange', function() {
    const controls = document.querySelector('.controls');
    if (document.fullscreenElement) {
        controls.style.display = 'none';
    } else {
        controls.style.display = 'flex';
    }
    changeBackgroundImage();
});

changeBackgroundImage();
setInterval(changeBackgroundImage, 10000);

initializeEnemies();
requestAnimationFrame(gameLoop);