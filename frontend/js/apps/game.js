"use strict";
/* ============================================================
   PIXEL QUEST — original mini-game
   Responsive canvas with integer scaling for pixel-art
   ============================================================ */

const GAME = {
  // Base resolution (pixel-art canvas)
  BASE_W: 320,
  BASE_H: 180,
  // State
  running: false,
  winEl: null,
  cv: null,
  ctx: null,
  raf: null,
  prevT: 0,
  // Player
  px: 32, py: 120, pvx: 0, pvy: 0,
  onGround: false,
  facingR: true,
  // World
  camera: 0,
  stars: [],
  starsCollected: 0,
  totalStars: 12,
  giftReached: false,
  giftX: 0,
  showWin: false,
  started: false,
};

const PW = 10, PH = 14, GRAV = 650, JUMP = -260, SPD = 140;
const C_SKY = ["#0f0c29","#16133a","#1c1b4d"];

// Level — platforms [x,y,w]
function generateLevel() {
  const plats = [
    [0,160,200],[180,140,60],[260,125,50],[340,110,60],[420,130,80],[530,100,50],
    [610,120,60],[700,90,70],[800,110,50],[880,135,80],[990,100,60],
    [1080,115,70],[1170,95,50],[1280,130,100],[1400,110,80],[1520,120,120],
  ];
  GAME.stars = [];
  GAME.starsCollected = 0;
  GAME.totalStars = 12;
  for (let i = 0; i < GAME.totalStars; i++) {
    const p = plats[1 + i];
    if (p) GAME.stars.push({ x: p[0] + p[2]/2, y: p[1] - 18, alive: true });
  }
  GAME.giftX = 1560;
  return plats;
}
const PLATS = generateLevel();

// Input
const keys = {};
addEventListener("keydown", e => { keys[e.code] = true; });
addEventListener("keyup", e => { keys[e.code] = false; });

function gameReset() {
  GAME.px = 32; GAME.py = 120; GAME.pvx = 0; GAME.pvy = 0;
  GAME.camera = 0; GAME.starsCollected = 0; GAME.giftReached = false; GAME.showWin = false;
  GAME.stars.forEach(s => s.alive = true);
}

function gameUpdate(dt) {
  if (!GAME.started || GAME.showWin) return;
  const p = GAME;
  // Input
  let ax = 0;
  if (keys["ArrowLeft"] || keys["KeyA"]) ax = -1;
  if (keys["ArrowRight"] || keys["KeyD"]) ax = 1;
  if ((keys["ArrowUp"] || keys["KeyW"] || keys["Space"]) && p.onGround) {
    p.pvy = JUMP; p.onGround = false; sfx.click();
  }
  const currentSpeed = (keys["ShiftLeft"] || keys["ShiftRight"]) ? SPD * 1.5 : SPD;
  p.pvx = ax * currentSpeed;
  if (ax > 0) p.facingR = true;
  if (ax < 0) p.facingR = false;
  p.pvy += GRAV * dt;
  p.px += p.pvx * dt;
  p.py += p.pvy * dt;
  p.onGround = false;
  // Collisions
  for (const [bx, by, bw] of PLATS) {
    if (p.px + PW > bx && p.px < bx + bw && p.py + PH > by && p.py + PH < by + 10 && p.pvy >= 0) {
      p.py = by - PH; p.pvy = 0; p.onGround = true;
    }
  }
  // Stars
  p.stars.forEach(s => {
    if (s.alive && Math.abs(p.px + PW/2 - s.x) < 12 && Math.abs(p.py + PH/2 - s.y) < 12) {
      s.alive = false; p.starsCollected++;
      beep(880 + p.starsCollected * 80, 0.08, "triangle", 0.04);
    }
  });
  // Gift
  if (p.starsCollected >= p.totalStars && Math.abs(p.px - p.giftX) < 20 && Math.abs(p.py - 95) < 30) {
    p.giftReached = true;
  }
  // Fall
  if (p.py > 240) { p.px = 32; p.py = 120; p.pvy = 0; p.camera = 0; }
  // Camera
  const targetCam = Math.max(0, p.px - GAME.BASE_W * 0.35);
  p.camera += (targetCam - p.camera) * 0.08;
}

function gameDraw() {
  const g = GAME.ctx, W = GAME.BASE_W, H = GAME.BASE_H, cam = GAME.camera;
  // Sky
  for (let y = 0; y < H; y++) {
    g.fillStyle = C_SKY[Math.min(2, (y / (H/3)) | 0)];
    g.fillRect(0, y, W, 1);
  }
  // Parallax stars
  for (let i = 0; i < 30; i++) {
    g.fillStyle = i % 3 === 0 ? "#e8ecf5" : "#5c5a8a";
    g.fillRect(((i * 67 - cam * 0.1) % W + W) % W, (i * 29) % (H * 0.6), 1, 1);
  }
  // Platforms
  for (const [x, y, w] of PLATS) {
    const sx = x - cam;
    if (sx > W + 10 || sx + w < -10) continue;
    g.fillStyle = "#2a2560"; g.fillRect(sx, y, w, 5);
    g.fillStyle = "#3d3a70"; g.fillRect(sx, y, w, 2);
    g.fillStyle = "#1a1740"; g.fillRect(sx, y + 5, w, 3);
  }
  // Stars
  GAME.stars.forEach(s => {
    if (!s.alive) return;
    const sx = s.x - cam;
    if (sx < -10 || sx > W + 10) return;
    const bob = Math.sin(performance.now() / 400 + s.x) * 2;
    g.fillStyle = "#ffd98a"; g.fillRect(sx - 3, s.y + bob - 3, 6, 6);
    g.fillStyle = "#fff0b8"; g.fillRect(sx - 1, s.y + bob - 1, 2, 2);
  });
  // Gift
  if (GAME.starsCollected >= GAME.totalStars) {
    const gx = GAME.giftX - cam;
    const bob = Math.sin(performance.now() / 500) * 3;
    // Box
    g.fillStyle = "#ff9ecb"; g.fillRect(gx - 10, 100 + bob - 16, 20, 16);
    g.fillStyle = "#fff"; g.fillRect(gx - 1, 100 + bob - 16, 2, 16);
    // Lid
    g.fillStyle = "#c65f8a"; g.fillRect(gx - 12, 100 + bob - 20, 24, 4);
    // Ribbon
    g.fillStyle = "#fff"; g.fillRect(gx - 1, 100 + bob - 20, 2, 4);
  }
  // Player
  const px = GAME.px - cam, py = GAME.py;
  // Shadow
  g.fillStyle = "rgba(0,0,0,0.2)"; g.fillRect(px, py + PH, PW, 2);
  // Body
  g.fillStyle = "#6fd3d8"; g.fillRect(px + 1, py + 4, PW - 2, PH - 4);
  // Head
  g.fillStyle = "#ffd98a"; g.fillRect(px + 2, py, PW - 4, 5);
  // Eyes
  const ex = GAME.facingR ? px + 6 : px + 2;
  g.fillStyle = "#1a1a2e"; g.fillRect(ex, py + 1, 2, 2);
  // Feet (animation)
  const step = Math.sin(performance.now() / 100) > 0 && GAME.pvx !== 0;
  g.fillStyle = "#3d3a70";
  g.fillRect(px + 1, py + PH - 2, 3, 2);
  g.fillRect(px + PW - 4, py + PH - 2 + (step ? -1 : 0), 3, 2);
}

function gameLoop(t) {
  if (!GAME.running) return;
  const dt = Math.min(0.033, (t - GAME.prevT) / 1000);
  GAME.prevT = t;
  gameUpdate(dt);
  gameDraw();
  // HUD
  const g = GAME.ctx, W = GAME.BASE_W;
  g.fillStyle = "rgba(255,255,255,0.7)";
  g.font = "7px 'Press Start 2P'";
  g.textBaseline = "top";
  g.fillText(`★ ${GAME.starsCollected}/${GAME.totalStars}`, 6, 6);
  if (GAME.starsCollected >= GAME.totalStars && !GAME.giftReached) {
    g.fillText("→ FIND THE GIFT", W - 110, 6);
  }
  // Gift reached — show win overlay
  if (GAME.giftReached && !GAME.showWin) {
    GAME.showWin = true;
    GAME.running = false;
    sfx.secret();
    const winScreen = GAME.winEl.querySelector(".game-win-screen");
    if (winScreen) winScreen.classList.add("show");
  }
  GAME.raf = requestAnimationFrame(gameLoop);
}

function resizeGameCanvas() {
  if (!GAME.cv || !GAME.winEl) return;
  const container = GAME.cv.parentElement;
  if (!container) return;
  GAME.cv.width = GAME.BASE_W;
  GAME.cv.height = GAME.BASE_H;
  GAME.ctx = GAME.cv.getContext("2d");
  GAME.ctx.imageSmoothingEnabled = false;
}

APP.GAME = () => {
  const content = `<div class="game-container">
    <canvas id="game-canvas"></canvas>
    <div class="game-start-screen" id="game-start">
      <h2>PIXEL QUEST</h2>
      <p>Collect all ${GAME.totalStars} stars and find the gift</p>
      <p style="font-size:11px;color:rgba(255,255,255,0.35)">Arrow keys / WASD to move · Space to jump</p>
      <button class="pbtn" id="game-go">▶ START</button>
    </div>
    <div class="game-win-screen" id="game-win">
      <h2>★ YOU FOUND IT ★</h2>
      <canvas class="gift-box" id="gift-canvas" width="64" height="64"></canvas>
      <p style="color:rgba(255,255,255,0.5);font-size:13px">click the gift</p>
    </div>
  </div>`;

  openWindow("GAME", "Pixel Quest", content, {
    pctW: 0.65, pctH: 0.75,
    status: "CONTROLS: ARROW/WASD + SPACE", status2: `STARS: 0/${GAME.totalStars}`
  });

  const wEl = wins["GAME"].el;
  GAME.winEl = wEl;
  GAME.cv = wEl.querySelector("#game-canvas");
  resizeGameCanvas();
  gameReset();
  gameDraw();

  // Start button
  wEl.querySelector("#game-go").onclick = () => {
    wEl.querySelector("#game-start").style.display = "none";
    GAME.started = true;
    GAME.running = true;
    GAME.prevT = performance.now();
    gameLoop(GAME.prevT);
  };

  // Gift click → finale
  wEl.querySelector("#gift-canvas").onclick = () => {
    GAME.running = false;
    cancelAnimationFrame(GAME.raf);
    closeWindow("GAME");
    setTimeout(startFinale, 400);
  };

  // Draw gift on the win screen canvas
  const gc = wEl.querySelector("#gift-canvas");
  const gg = gc.getContext("2d");
  gg.imageSmoothingEnabled = false;
  gg.fillStyle = "#ff9ecb"; gg.fillRect(12, 24, 40, 28);
  gg.fillStyle = "#fff"; gg.fillRect(30, 24, 4, 28);
  gg.fillStyle = "#c65f8a"; gg.fillRect(8, 18, 48, 8);
  gg.fillStyle = "#fff"; gg.fillRect(30, 18, 4, 8);
  gc.style.imageRendering = "pixelated";

  // Resize handling
  const ro = new ResizeObserver(() => resizeGameCanvas());
  const container = wEl.querySelector(".game-container");
  if (container) ro.observe(container);
};

// Cleanup on window close
const origClose = closeWindow;
// Game cleanup handled by animation system — game stops when window removed
