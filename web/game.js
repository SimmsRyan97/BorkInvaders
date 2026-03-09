const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const appShell = document.querySelector(".app-shell");
const hud = document.querySelector(".hud");
const help = document.querySelector(".help");
const controls = document.querySelector(".controls");

const BASE_WIDTH = canvas.width;
const BASE_HEIGHT = canvas.height;
const CANVAS_ASPECT = BASE_WIDTH / BASE_HEIGHT;

const scoreLabel = document.getElementById("scoreLabel");
const livesLabel = document.getElementById("livesLabel");
const levelLabel = document.getElementById("levelLabel");
const overlay = document.getElementById("overlay");

const keys = new Set();

const imagePaths = {
  splash: "../data/Splash.png",
  controls: "../data/Controls.png",
  inGame: "../data/inGame.png",
  player: "../data/Defender.gif",
  alienA: "../data/Ship.png",
  alienB: "../data/Ship2.png",
  playerBullet: "../data/bork.png",
  alienBullet: "../data/Reddit_Logo.png",
  lifeIcon: "../data/heart.png",
  yee: "../data/Yee.png"
};

const audioPaths = {
  shoot: "../data/shoot.wav",
  hit: "../data/hit.wav",
  death: "../data/death.wav",
  yee: "../data/yee.wav"
};

const inGameMusicPaths = [
  "../data/all_star.wav",
  "../data/heyye.wav",
  "../data/mask_off.wav",
  "../data/numa_numa.wav",
  "../data/rick_roll.wav",
  "../data/vitas.wav",
  "../data/shooting_stars.wav"
];

const assets = {
  images: {},
  sounds: {},
  musicTracks: [],
  currentMusic: null,
  currentTrackIndex: -1,
  failedImages: new Set(),
  failedSounds: new Set(),
  audioEnabled: false
};

const state = {
  width: canvas.width,
  height: canvas.height,
  screen: "loading", // loading | menu | controls | playing | paused | levelclear | gameover
  score: 0,
  lives: 3,
  level: 1,
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
  aliens: [],
  yeee: {
    active: false,
    x: -120,
    y: 42,
    w: 50,
    h: 50,
    speedX: 0,
    cooldown: 420
  },
  extraLife: {
    active: false,
    x: -120,
    y: -50,
    w: 42,
    h: 42,
    speedY: 0,
    cooldown: 600
  }
};

function loadImageAsset(path) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ ok: true, img });
    img.onerror = () => resolve({ ok: false, img: null });
    img.src = path;
  });
}

function loadAudioAsset(path, loop = false) {
  return new Promise((resolve) => {
    const audio = new Audio(path);
    audio.loop = loop;
    audio.preload = "auto";
    let settled = false;

    const done = (ok) => {
      if (settled) {
        return;
      }
      settled = true;
      audio.removeEventListener("canplaythrough", onReady);
      audio.removeEventListener("canplay", onReady);
      audio.removeEventListener("loadeddata", onReady);
      audio.removeEventListener("error", onError);
      resolve({ ok, audio: ok ? audio : null });
    };

    const onReady = () => done(true);
    const onError = () => done(false);

    audio.addEventListener("canplaythrough", onReady, { once: true });
    audio.addEventListener("canplay", onReady, { once: true });
    audio.addEventListener("loadeddata", onReady, { once: true });
    audio.addEventListener("error", onError, { once: true });
    audio.load();

    // Do not block game boot forever if a browser never fires canplay events pre-gesture.
    setTimeout(() => {
      done(false);
    }, 2000);
  });
}

async function preloadAssets() {
  for (const [key, path] of Object.entries(imagePaths)) {
    const result = await loadImageAsset(path);
    if (result.ok) {
      assets.images[key] = result.img;
    } else {
      assets.failedImages.add(key);
    }
  }

  for (const [key, path] of Object.entries(audioPaths)) {
    const result = await loadAudioAsset(path, false);
    if (result.ok) {
      assets.sounds[key] = result.audio;
    } else {
      assets.failedSounds.add(key);
    }
  }

  for (let i = 0; i < inGameMusicPaths.length; i += 1) {
    const result = await loadAudioAsset(inGameMusicPaths[i], false);
    if (result.ok) {
      assets.musicTracks.push(result.audio);
    } else {
      assets.failedSounds.add(`music-${i}`);
    }
  }
}

function startAudioIfNeeded() {
  if (assets.audioEnabled) {
    return;
  }

  assets.audioEnabled = true;
  if (state.screen === "playing") {
    playMusic();
  }
}

function playMusic() {
  if (!assets.audioEnabled) {
    return;
  }

  if (assets.musicTracks.length === 0) {
    return;
  }

  let nextIndex = Math.floor(Math.random() * assets.musicTracks.length);
  if (assets.musicTracks.length > 1 && nextIndex === assets.currentTrackIndex) {
    nextIndex = (nextIndex + 1) % assets.musicTracks.length;
  }

  assets.currentTrackIndex = nextIndex;
  assets.currentMusic = assets.musicTracks[nextIndex];
  assets.currentMusic.currentTime = 0;
  assets.currentMusic.volume = 0.28;
  assets.currentMusic.onended = () => {
    if (state.screen === "playing") {
      playMusic();
    }
  };

  assets.currentMusic.play().catch(() => {
    assets.audioEnabled = false;
  });
}

function resumeMusic() {
  if (!assets.audioEnabled || !assets.currentMusic) {
    return;
  }

  assets.currentMusic.play().catch(() => {
    assets.audioEnabled = false;
  });
}

function stopMusic(resetTrack = false) {
  if (!assets.currentMusic) {
    return;
  }

  assets.currentMusic.pause();
  if (resetTrack) {
    assets.currentMusic.currentTime = 0;
    assets.currentMusic = null;
  }
}

function setCanvasDisplaySize() {
  const shellPadding = 12;
  const hudHeight = hud ? hud.offsetHeight : 0;
  const helpHeight = help ? help.offsetHeight : 0;
  const controlsVisible = controls && window.getComputedStyle(controls).display !== "none";
  const controlsHeight = controlsVisible && controls ? controls.offsetHeight : 0;
  const verticalSafety = document.fullscreenElement ? 24 : 56;
  const availableWidth = Math.max(280, window.innerWidth - shellPadding);
  const availableHeight = Math.max(160, window.innerHeight - hudHeight - helpHeight - controlsHeight - verticalSafety);

  let width = availableWidth;
  let height = width / CANVAS_ASPECT;

  if (height > availableHeight) {
    height = availableHeight;
    width = height * CANVAS_ASPECT;
  }

  canvas.style.width = `${Math.floor(width)}px`;
  canvas.style.height = `${Math.floor(height)}px`;
}

async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      if (appShell && appShell.requestFullscreen) {
        await appShell.requestFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } else {
      await document.exitFullscreen();
    }
  } catch (_) {
    // Ignore fullscreen failures from unsupported browsers or denied permissions.
  }
}

function playSound(name, volume = 0.55) {
  if (!assets.audioEnabled) {
    return;
  }

  const source = assets.sounds[name];
  if (!source) {
    return;
  }

  const clip = source.cloneNode();
  clip.volume = volume;
  clip.play().catch(() => {});
}

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

function resetRun() {
  state.score = 0;
  state.lives = 3;
  state.level = 1;
  state.alienDirection = 1;
  state.player.x = state.width / 2;
  state.bullets = [];
  state.alienBullets = [];
  state.aliens = makeAliens(state.level);
  state.canShoot = true;
  state.lastAlienShotAt = performance.now();

  state.yeee.active = false;
  state.yeee.x = -120;
  state.yeee.speedX = 0;
  state.yeee.cooldown = 420;

  state.extraLife.active = false;
  state.extraLife.x = -120;
  state.extraLife.y = -50;
  state.extraLife.speedY = 0;
  state.extraLife.cooldown = 600;

  updateHud();
}

function startGame() {
  resetRun();
  state.screen = "playing";
  overlay.textContent = "";
  stopMusic(true);
  playMusic();
}

function nextLevel() {
  state.level += 1;
  state.alienDirection = 1;
  state.bullets = [];
  state.alienBullets = [];
  state.aliens = makeAliens(state.level);

  state.yeee.active = false;
  state.yeee.x = -120;
  state.yeee.speedX = 0;

  state.extraLife.active = false;
  state.extraLife.x = -120;
  state.extraLife.y = -50;
  state.extraLife.speedY = 0;
  state.extraLife.cooldown = Math.max(260, 540 - state.level * 20);

  state.screen = "levelclear";
  overlay.textContent = `Level ${state.level - 1} Complete - Press Enter to Start Level ${state.level}`;
  stopMusic();
  updateHud();
}

function updateHud() {
  scoreLabel.textContent = `Score: ${state.score}`;
  livesLabel.textContent = `Lives: ${state.lives}`;
  levelLabel.textContent = `Level: ${state.level}`;
}

function shoot() {
  if (state.screen !== "playing" || !state.canShoot) {
    return;
  }

  state.canShoot = false;
  state.bullets.push({
    x: state.player.x,
    y: state.player.y - 12,
    vy: -9,
    r: 4
  });
  playSound("shoot", 0.5);

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

    let removed = false;
    for (const alien of state.aliens) {
      if (!alien.alive) {
        continue;
      }
      if (pointInRect(b.x, b.y, alien)) {
        alien.alive = false;
        state.bullets.splice(i, 1);
        state.score += alien.value;
        playSound("hit", 0.45);
        updateHud();
        removed = true;
        break;
      }
    }

    if (removed) {
      continue;
    }

    if (state.yeee.active && circleIntersectsRect(b.x, b.y, b.r, state.yeee)) {
      state.bullets.splice(i, 1);
      state.score += 100;
      state.yeee.active = false;
      state.yeee.x = -120;
      state.yeee.speedX = 0;
      updateHud();
      continue;
    }

  }

  for (let i = state.alienBullets.length - 1; i >= 0; i -= 1) {
    const b = state.alienBullets[i];
    b.y += b.vy * dt;
    if (b.y > state.height + 12) {
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
      playSound("death", 0.35);
      updateHud();
      if (state.lives <= 0) {
        state.screen = "gameover";
        overlay.textContent = "Game Over - Enter: Restart, M: Menu";
        stopMusic();
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
        state.screen = "gameover";
        overlay.textContent = "Game Over - Enter: Restart, M: Menu";
        stopMusic();
      }
    }
  }

  const alive = state.aliens.filter((alien) => alien.alive);
  if (alive.length === 0 && state.screen === "playing") {
    nextLevel();
    return;
  }

  if (now - state.lastAlienShotAt >= state.alienShotEveryMs && alive.length > 0) {
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

function updateBonusObjects(dt) {
  if (state.yeee.active) {
    state.yeee.x += state.yeee.speedX * dt;
    if (state.yeee.x > state.width + 60) {
      state.yeee.active = false;
      state.yeee.x = -120;
      state.yeee.speedX = 0;
    }
  } else {
    if (state.yeee.cooldown > 0) {
      state.yeee.cooldown -= 1;
    } else if (Math.random() < 0.006) {
      state.yeee.active = true;
      state.yeee.x = -50;
      state.yeee.y = 42;
      state.yeee.speedX = 3.0 + state.level * 0.12;
      state.yeee.cooldown = 560;
      playSound("yee", 0.45);
    }
  }

  if (state.extraLife.active) {
    state.extraLife.y += state.extraLife.speedY * dt;
    if (state.extraLife.y > state.height + state.extraLife.h) {
      state.extraLife.active = false;
      state.extraLife.x = -120;
      state.extraLife.speedY = 0;
    }
  } else {
    if (state.extraLife.cooldown > 0) {
      state.extraLife.cooldown -= 1;
    } else if (Math.random() < 0.004) {
      state.extraLife.active = true;
      state.extraLife.x = Math.floor(50 + Math.random() * (state.width - 100));
      state.extraLife.y = -42;
      state.extraLife.speedY = 1.8;
      state.extraLife.cooldown = 760;
    }
  }
}

function pointInRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

function rectIntersectsRect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function circleIntersectsRect(cx, cy, radius, rect) {
  const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return (dx * dx + dy * dy) <= radius * radius;
}

function drawFallbackBackground() {
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

function drawImageScaled(img) {
  if (img) {
    ctx.drawImage(img, 0, 0, state.width, state.height);
  } else {
    drawFallbackBackground();
  }
}

function drawMenu() {
  drawImageScaled(assets.images.splash);
}

function drawControlsScreen() {
  drawImageScaled(assets.images.controls);
}

function isInsideRect(x, y, rect) {
  return x >= rect.x1 && x <= rect.x2 && y >= rect.y1 && y <= rect.y2;
}

function getMenuStartRect() {
  return {
    x1: state.width - state.width / 1.55,
    x2: state.width - state.width / 2.65,
    y1: state.height - state.height / 2.75,
    y2: state.height - state.height / 6.2
  };
}

function getMenuControlsRect() {
  return {
    x1: state.width - state.width / 3,
    x2: state.width - state.width / 12.5,
    y1: state.height - state.height / 2.75,
    y2: state.height - state.height / 6.2
  };
}

function getBackRect() {
  return {
    x1: state.width - state.width / 6.2,
    x2: state.width - state.width / 60,
    y1: state.height - state.height / 6.8,
    y2: state.height - state.height / 38
  };
}

function getCanvasPoint(event) {
  const bounds = canvas.getBoundingClientRect();
  const scaleX = canvas.width / bounds.width;
  const scaleY = canvas.height / bounds.height;

  return {
    x: (event.clientX - bounds.left) * scaleX,
    y: (event.clientY - bounds.top) * scaleY
  };
}

function handleCanvasClick(event) {
  const point = getCanvasPoint(event);

  if (state.screen === "menu") {
    if (isInsideRect(point.x, point.y, getMenuStartRect())) {
      startAudioIfNeeded();
      startGame();
      return;
    }

    if (isInsideRect(point.x, point.y, getMenuControlsRect())) {
      state.screen = "controls";
      return;
    }
  }

  if (state.screen === "controls") {
    if (isInsideRect(point.x, point.y, getBackRect())) {
      state.screen = "menu";
      return;
    }
  }
}

function drawBackground() {
  drawImageScaled(assets.images.inGame);
}

function drawPlayer() {
  const p = state.player;
  const sprite = assets.images.player;
  if (sprite) {
    ctx.drawImage(sprite, p.x - 24, p.y - 22, 50, 45);
    return;
  }

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
  const spriteA = assets.images.alienA;
  const spriteB = assets.images.alienB;

  for (const alien of state.aliens) {
    if (!alien.alive) {
      continue;
    }

    if (spriteA && spriteB) {
      const sprite = blink ? spriteA : spriteB;
      ctx.drawImage(sprite, alien.x - 6, alien.y - 8, 42, 42);
    } else {
      ctx.fillStyle = blink ? "#ffd166" : "#ffb703";
      ctx.fillRect(alien.x, alien.y, alien.w, alien.h);
      ctx.fillStyle = "#2b2d42";
      ctx.fillRect(alien.x + 5, alien.y + 5, 4, 4);
      ctx.fillRect(alien.x + alien.w - 9, alien.y + 5, 4, 4);
    }
  }
}

function drawBullets() {
  const playerBulletSprite = assets.images.playerBullet;
  const alienBulletSprite = assets.images.alienBullet;

  ctx.fillStyle = "#ffffff";
  for (const b of state.bullets) {
    if (playerBulletSprite) {
      ctx.drawImage(playerBulletSprite, b.x - 22, b.y - 10, 34, 16);
    } else {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = "#ff6b6b";
  for (const b of state.alienBullets) {
    if (alienBulletSprite) {
      ctx.drawImage(alienBulletSprite, b.x - 12, b.y - 10, 24, 24);
    } else {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawBonusObjects() {
  if (state.yeee.active) {
    const yeeSprite = assets.images.yee;
    if (yeeSprite) {
      ctx.drawImage(yeeSprite, state.yeee.x, state.yeee.y, state.yeee.w, state.yeee.h);
    } else {
      ctx.fillStyle = "#8be9fd";
      ctx.fillRect(state.yeee.x, state.yeee.y, state.yeee.w, state.yeee.h);
    }
  }

  if (state.extraLife.active) {
    const lifeSprite = assets.images.lifeIcon;
    if (lifeSprite) {
      ctx.drawImage(lifeSprite, state.extraLife.x, state.extraLife.y, state.extraLife.w, state.extraLife.h);
    } else {
      ctx.fillStyle = "#80ed99";
      ctx.fillRect(state.extraLife.x, state.extraLife.y, state.extraLife.w, state.extraLife.h);
    }
  }
}

function checkHeartPickup() {
  if (!state.extraLife.active) {
    return;
  }

  const playerRect = {
    x: state.player.x - state.player.w / 2,
    y: state.player.y - state.player.h / 2,
    w: state.player.w,
    h: state.player.h
  };

  const heartRect = {
    x: state.extraLife.x,
    y: state.extraLife.y,
    w: state.extraLife.w,
    h: state.extraLife.h
  };

  if (rectIntersectsRect(playerRect, heartRect)) {
    state.lives += 1;
    state.extraLife.active = false;
    state.extraLife.x = -120;
    state.extraLife.speedY = 0;
    state.extraLife.cooldown = 700;
    updateHud();
  }
}

function drawGameScene(now) {
  drawBackground();
  drawAliens(now);
  drawBonusObjects();
  drawPlayer();
  drawBullets();
}

function tick(now) {
  const dt = Math.min(2.2, (now - state.lastFrameAt) / 16.6667);
  state.lastFrameAt = now;

  if (state.screen === "menu") {
    drawMenu();
    requestAnimationFrame(tick);
    return;
  }

  if (state.screen === "controls") {
    drawControlsScreen();
    requestAnimationFrame(tick);
    return;
  }

  if (state.screen === "playing") {
    movePlayer(dt);
    updateAliens(dt, now);
    updateBullets(dt);
    updateBonusObjects(dt);
    checkHeartPickup();
  }

  if (state.screen === "paused" || state.screen === "levelclear" || state.screen === "gameover" || state.screen === "playing") {
    drawGameScene(now);
  }

  if (state.screen === "paused") {
    overlay.textContent = "PAUSED - Press P to Resume or M for Menu";
  } else if (state.screen === "levelclear") {
    overlay.textContent = `Level ${state.level - 1} Complete - Press Enter to Start Level ${state.level}`;
  } else if (state.screen === "playing") {
    overlay.textContent = "";
  }

  requestAnimationFrame(tick);
}

window.addEventListener("keydown", (event) => {
  startAudioIfNeeded();
  keys.add(event.key);

  if ((event.key === "f" || event.key === "F") && (state.screen === "menu" || state.screen === "playing")) {
    event.preventDefault();
    toggleFullscreen();
    return;
  }

  if (state.screen === "menu") {
    if (event.key === "Enter") {
      startGame();
      return;
    }
    if (event.key === "c" || event.key === "C") {
      state.screen = "controls";
      return;
    }
  }

  if (state.screen === "controls") {
    if (event.key === "Escape" || event.key === "b" || event.key === "B") {
      state.screen = "menu";
      return;
    }
  }

  if (state.screen === "playing") {
    if (event.key === "p" || event.key === "P") {
      state.screen = "paused";
      stopMusic();
      return;
    }

    if (event.key === " " || event.code === "Space") {
      event.preventDefault();
      shoot();
      return;
    }
  }

  if (state.screen === "paused") {
    if (event.key === "p" || event.key === "P") {
      state.screen = "playing";
      resumeMusic();
      return;
    }

    if (event.key === "m" || event.key === "M") {
      state.screen = "menu";
      overlay.textContent = "";
      stopMusic(true);
      return;
    }
  }

  if (state.screen === "levelclear") {
    if (event.key === "Enter") {
      state.screen = "playing";
      overlay.textContent = "";
      playMusic();
      return;
    }

    if (event.key === "m" || event.key === "M") {
      state.screen = "menu";
      overlay.textContent = "";
      stopMusic(true);
      return;
    }
  }

  if (state.screen === "gameover") {
    if (event.key === "Enter") {
      startGame();
      return;
    }

    if (event.key === "m" || event.key === "M") {
      state.screen = "menu";
      overlay.textContent = "";
      stopMusic(true);
      return;
    }
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key);
});

window.addEventListener("pointerdown", () => {
  startAudioIfNeeded();
}, { once: true });

function bindTouchButton(buttonId, keyName, shouldShoot = false) {
  const button = document.getElementById(buttonId);
  if (!button) {
    return;
  }

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    startAudioIfNeeded();

    if (state.screen === "menu" && shouldShoot) {
      startGame();
      return;
    }

    if (state.screen !== "playing") {
      return;
    }

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
canvas.addEventListener("click", handleCanvasClick);

overlay.textContent = "Loading Bork assets...";

preloadAssets().then(() => {
  overlay.textContent = "";
  state.screen = "menu";
  updateHud();
  setCanvasDisplaySize();
  requestAnimationFrame(tick);
});

window.addEventListener("resize", setCanvasDisplaySize);
document.addEventListener("fullscreenchange", setCanvasDisplaySize);
