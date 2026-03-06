const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreLabel = document.getElementById("scoreLabel");
const livesLabel = document.getElementById("livesLabel");
const levelLabel = document.getElementById("levelLabel");
const overlay = document.getElementById("overlay");

const keys = new Set();

const state = {
  width: canvas.width,
  height: canvas.height,
  score: 0,
  lives: 3,
  level: 1,
  isGameOver: false,
  canShoot: true,
  shootCooldownMs: 180,
  alienDirection: 1,
  alienStepY: 24,
  alienSpeed: 0.55,
  lastAlienShotAt: 0,
  alienShotEveryMs: 650,
  lastFrameAt: performance.now(),
  player: {
    x: canvas.width / 2,
    y: canvas.height - 42,
    w: 42,
    h: 20,
    speed: 5.8
  },
  bullets: [],
  alienBullets: [],
  aliens: []
};

function makeAliens(level) {
  const rows = 4;
  const cols = 12;
  const gapX = 58;
  const gapY = 44;
  const startX = 90;
  const startY = 70;
  const aliens = [];

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      aliens.push({
        x: startX + c * gapX,
        y: startY + r * gapY,
        w: 30,
        h: 22,
        alive: true,
        value: 10 + (rows - r) * 3
      });
    }
  }

  state.alienSpeed = 0.52 + level * 0.11;
  state.alienShotEveryMs = Math.max(240, 700 - level * 35);
  return aliens;
}

function resetGame() {
  state.score = 0;
  state.lives = 3;
  state.level = 1;
  state.isGameOver = false;
  state.alienDirection = 1;
  state.player.x = state.width / 2;
  state.bullets = [];
  state.alienBullets = [];
  state.aliens = makeAliens(state.level);
  overlay.textContent = "";
  updateHud();
}

function nextLevel() {
  state.level += 1;
  state.alienDirection = 1;
  state.bullets = [];
  state.alienBullets = [];
  state.aliens = makeAliens(state.level);
  overlay.textContent = `Level ${state.level}`;
  setTimeout(() => {
    if (!state.isGameOver) {
      overlay.textContent = "";
    }
  }, 900);
  updateHud();
}

function updateHud() {
  scoreLabel.textContent = `Score: ${state.score}`;
  livesLabel.textContent = `Lives: ${state.lives}`;
  levelLabel.textContent = `Level: ${state.level}`;
}

function shoot() {
  if (!state.canShoot || state.isGameOver) {
    return;
  }

  state.canShoot = false;
  state.bullets.push({
    x: state.player.x,
    y: state.player.y - 12,
    vy: -9,
    r: 4
  });

  setTimeout(() => {
    state.canShoot = true;
  }, state.shootCooldownMs);
}

function movePlayer(dt) {
  let dir = 0;
  if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) {
    dir -= 1;
  }
  if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) {
    dir += 1;
  }

  state.player.x += dir * state.player.speed * dt;
  state.player.x = Math.max(24, Math.min(state.width - 24, state.player.x));
}

function updateBullets(dt) {
  for (let i = state.bullets.length - 1; i >= 0; i -= 1) {
    const b = state.bullets[i];
    b.y += b.vy * dt;
    if (b.y < -12) {
      state.bullets.splice(i, 1);
      continue;
    }

    for (const alien of state.aliens) {
      if (!alien.alive) {
        continue;
      }
      if (pointInRect(b.x, b.y, alien)) {
        alien.alive = false;
        state.bullets.splice(i, 1);
        state.score += alien.value;
        updateHud();
        break;
      }
    }
  }

  for (let i = state.alienBullets.length - 1; i >= 0; i -= 1) {
    const b = state.alienBullets[i];
    b.y += b.vy * dt;
    if (b.y > state.height + 10) {
      state.alienBullets.splice(i, 1);
      continue;
    }

    if (pointInRect(b.x, b.y, {
      x: state.player.x - state.player.w / 2,
      y: state.player.y - state.player.h / 2,
      w: state.player.w,
      h: state.player.h
    })) {
      state.alienBullets.splice(i, 1);
      state.lives -= 1;
      updateHud();
      if (state.lives <= 0) {
        state.isGameOver = true;
        overlay.textContent = "Game Over - Press Enter";
      }
    }
  }
}

function updateAliens(dt, now) {
  let hitEdge = false;
  for (const alien of state.aliens) {
    if (!alien.alive) {
      continue;
    }
    alien.x += state.alienDirection * state.alienSpeed * dt;
    if (alien.x <= 14 || alien.x + alien.w >= state.width - 14) {
      hitEdge = true;
    }
  }

  if (hitEdge) {
    state.alienDirection *= -1;
    for (const alien of state.aliens) {
      if (!alien.alive) {
        continue;
      }
      alien.y += state.alienStepY;
      if (alien.y + alien.h >= state.player.y - 8) {
        state.isGameOver = true;
        overlay.textContent = "Game Over - Press Enter";
      }
    }
  }

  const alive = state.aliens.filter((a) => a.alive);
  if (alive.length === 0 && !state.isGameOver) {
    nextLevel();
    return;
  }

  if (!state.isGameOver && now - state.lastAlienShotAt >= state.alienShotEveryMs && alive.length > 0) {
    const shooter = alive[Math.floor(Math.random() * alive.length)];
    state.alienBullets.push({
      x: shooter.x + shooter.w / 2,
      y: shooter.y + shooter.h,
      vy: 4.2 + state.level * 0.24,
      r: 4
    });
    state.lastAlienShotAt = now;
  }
}

function pointInRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

function drawBackground() {
  const g = ctx.createLinearGradient(0, 0, state.width, state.height);
  g.addColorStop(0, "#041628");
  g.addColorStop(0.6, "#0c2f3f");
  g.addColorStop(1, "#1b2142");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, state.width, state.height);

  ctx.globalAlpha = 0.28;
  for (let i = 0; i < 70; i += 1) {
    const x = (i * 137) % state.width;
    const y = (i * 91) % state.height;
    ctx.fillStyle = "#d4f6ff";
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;
}

function drawPlayer() {
  const p = state.player;
  ctx.save();
  ctx.translate(p.x, p.y);

  ctx.fillStyle = "#8fffb6";
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(20, 10);
  ctx.lineTo(-20, 10);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#fff5d6";
  ctx.fillRect(-4, -2, 8, 10);
  ctx.restore();
}

function drawAliens(now) {
  const blink = Math.floor(now / 400) % 2 === 0;
  for (const alien of state.aliens) {
    if (!alien.alive) {
      continue;
    }
    ctx.fillStyle = blink ? "#ffd166" : "#ffb703";
    ctx.fillRect(alien.x, alien.y, alien.w, alien.h);
    ctx.fillStyle = "#2b2d42";
    ctx.fillRect(alien.x + 5, alien.y + 5, 4, 4);
    ctx.fillRect(alien.x + alien.w - 9, alien.y + 5, 4, 4);
  }
}

function drawBullets() {
  ctx.fillStyle = "#ffffff";
  for (const b of state.bullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#ff6b6b";
  for (const b of state.alienBullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function tick(now) {
  const dt = Math.min(2.2, (now - state.lastFrameAt) / 16.6667);
  state.lastFrameAt = now;

  if (!state.isGameOver) {
    movePlayer(dt);
    updateAliens(dt, now);
    updateBullets(dt);
  }

  drawBackground();
  drawAliens(now);
  drawPlayer();
  drawBullets();

  requestAnimationFrame(tick);
}

window.addEventListener("keydown", (event) => {
  keys.add(event.key);

  if (event.key === " " || event.code === "Space") {
    event.preventDefault();
    shoot();
  }

  if (event.key === "Enter" && state.isGameOver) {
    resetGame();
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key);
});

function bindTouchButton(buttonId, keyName, shouldShoot = false) {
  const button = document.getElementById(buttonId);
  if (!button) {
    return;
  }

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    keys.add(keyName);
    if (shouldShoot) {
      shoot();
    }
  });

  button.addEventListener("pointerup", (event) => {
    event.preventDefault();
    keys.delete(keyName);
  });

  button.addEventListener("pointerleave", () => {
    keys.delete(keyName);
  });
}

bindTouchButton("leftBtn", "ArrowLeft");
bindTouchButton("rightBtn", "ArrowRight");
bindTouchButton("fireBtn", "Space", true);

resetGame();
requestAnimationFrame(tick);
