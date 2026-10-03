"use strict";
/* ---------- procedural pixel-art generator ----------
   This is the default look for every memory/photo/video/track: a small
   deterministic scene generated from a palette + seed. If an item has
   real uploaded media, the app shows that instead (see apps/*.js) — this
   generator is what renders when it doesn't, so the experience still
   looks complete on day one, before any photo has been uploaded. */

const PAL = {
  sunset: { sky: ["#2b1b3d", "#71365c", "#c65f6b", "#f0a05a"], sun: "#ffd98a", cloud: "#f6d7c9", land: "#3a2340" },
  night: { sky: ["#0a1024", "#141d3a", "#1d2b4d"], sun: "#e8ecf5", cloud: "#8fa0c5", land: "#0a0f1e", stars: true },
  rain: { sky: ["#232c38", "#2f3c4c", "#3d4f61"], sun: "#9fb2c5", cloud: "#6d8093", land: "#1a222c", rain: true },
  beach: { sky: ["#1d5f74", "#3a95a5", "#7cc4c9"], sun: "#fff0b8", cloud: "#e6f4ef", land: "#c9b078", sea: true },
  snow: { sky: ["#6f7f95", "#93a4b8", "#c3d0dd"], sun: "#f4f8fc", cloud: "#eef3f8", land: "#dfe7ee", snow: true },
  clouds: { sky: ["#131f36", "#1c2b45", "#2a3d5f"], sun: "#e8ecf5", cloud: "#cfd9ec", land: "#131f36", stars: true },
  city: { sky: ["#0d0a1c", "#191430", "#241d42"], sun: "#d8dcf0", cloud: "#4a4470", land: "#0b0817", city: true, stars: true },
  desert: { sky: ["#7a4a3a", "#b5714a", "#e0a05f"], sun: "#ffe6a8", cloud: "#f2cfa8", land: "#8a5a3a" },
  road: { sky: ["#1c1b3d", "#5c2f5e", "#c65f6b", "#f0a05a"], sun: "#ffd98a", cloud: "#e8b9c8", land: "#241f38", road: true },
  glitch: { sky: ["#07130b", "#0a1f12"], sun: "#47d97f", cloud: "#2e8f56", land: "#050b07", glitch: true },
  hearts: { sky: ["#1a0f1e", "#33152e", "#5c2340"], sun: "#ff9ecb", cloud: "#c56b9a", land: "#1a0f1e", hearts: true, stars: true },
  eyes: { sky: ["#040604", "#07130b"], sun: "#47d97f", cloud: "#123322", land: "#030503", eyes: true },
  party: { sky: ["#140d1c", "#241430"], sun: "#ffd98a", cloud: "#5c3a6b", land: "#0e0916", party: true, stars: true },
};

function drawArt(cv, type, seed = 1) {
  if (!cv) return;
  const W = 96,
    H = 72;
  cv.width = W;
  cv.height = H;
  const g = cv.getContext("2d"),
    R = rng(seed * 7919 + 13),
    P = PAL[type] || PAL.clouds;
  const bands = P.sky.length;
  for (let y = 0; y < H; y++) {
    g.fillStyle = P.sky[Math.min(bands - 1, Math.floor(y / (H / bands)))];
    g.fillRect(0, y, W, 1);
  }
  if (P.stars)
    for (let i = 0; i < 40; i++) {
      g.fillStyle = R() < 0.5 ? "#e8ecf5" : "#9fb2c5";
      if (R() < 0.6) g.fillRect((R() * W) | 0, (R() * H * 0.6) | 0, 1, 1);
    }
  if (P.glitch) {
    for (let i = 0; i < 260; i++) {
      g.fillStyle = ["#47d97f", "#2e8f56", "#0a1f12", "#6fd3d8"][(R() * 4) | 0];
      g.fillRect((R() * W) | 0, (R() * H) | 0, 2 + ((R() * 4) | 0), 1 + ((R() * 3) | 0));
    }
    for (let i = 0; i < 6; i++) {
      g.fillStyle = "rgba(111,211,216,.25)";
      g.fillRect(0, (R() * H) | 0, W, 1);
    }
    return cv;
  }
  if (P.eyes) {
    g.fillStyle = "#47d97f";
    const ex = W / 2;
    g.fillRect(ex - 18, H / 2 - 8, 14, 14);
    g.fillRect(ex + 5, H / 2 - 8, 14, 14);
    g.fillStyle = "#040604";
    g.fillRect(ex - 14, H / 2 - 4, 6, 6);
    g.fillRect(ex + 9, H / 2 - 4, 6, 6);
    g.fillStyle = "#2e8f56";
    g.fillRect(ex - 20, H / 2 + 10, 40, 2);
    return cv;
  }
  g.fillStyle = P.sun;
  const sx = W * (0.2 + R() * 0.6),
    sy = H * (P.sea ? 0.22 : 0.3);
  g.fillRect(sx - 6, sy - 6, 12, 12);
  g.fillRect(sx - 8, sy - 3, 16, 6);
  g.fillRect(sx - 3, sy - 8, 6, 16);
  g.fillStyle = P.cloud;
  const nC = 3 + ((R() * 3) | 0);
  for (let c = 0; c < nC; c++) {
    const cx = R() * W,
      cy = H * (0.1 + R() * 0.35),
      cw = 18 + R() * 26,
      ch = 8 + R() * 10;
    for (let y = 0; y < ch; y++)
      for (let x = 0; x < cw; x++) {
        const dx = (x - cw / 2) / (cw / 2),
          dy = (y - ch / 2) / (ch / 2),
          d = dx * dx + dy * dy;
        if (d < 1 && R() < (1 - d) * 0.85) g.fillRect((cx + x - cw / 2) | 0, (cy + y - ch / 2) | 0, 1, 1);
      }
  }
  g.fillStyle = P.land;
  if (P.sea) {
    g.fillRect(0, H * 0.62, W, H * 0.2);
    g.fillStyle = "#e6f4ef";
    for (let i = 0; i < 30; i++) g.fillRect((R() * W) | 0, (H * (0.63 + R() * 0.17)) | 0, 3, 1);
    g.fillStyle = P.land;
    g.fillRect(0, H * 0.82, W, H * 0.18);
  } else if (P.city) {
    g.fillStyle = P.land;
    for (let x = 0; x < W; ) {
      const bw = 6 + R() * 10,
        bh = 14 + R() * 30;
      g.fillRect(x, H - bh, bw, bh);
      g.fillStyle = ["#f0c060", "#6fd3d8", "#ff9ecb"][(R() * 3) | 0];
      for (let wy = H - bh + 3; wy < H - 3; wy += 5)
        for (let wx = x + 2; wx < x + bw - 2; wx += 4) if (R() < 0.4) g.fillRect(wx, wy, 2, 2);
      g.fillStyle = P.land;
      x += bw + 2 + ((R() * 4) | 0);
    }
  } else if (P.road) {
    g.fillStyle = P.land;
    g.fillRect(0, H * 0.66, W, H * 0.34);
    g.fillStyle = "#3d3a4d";
    g.beginPath();
    g.moveTo(W * 0.38, H * 0.66);
    g.lineTo(W * 0.62, H * 0.66);
    g.lineTo(W * 0.9, H);
    g.lineTo(W * 0.1, H);
    g.fill();
    g.fillStyle = "#ffd98a";
    for (let i = 0; i < 6; i++) {
      const t = i / 6,
        y = H * 0.68 + t * H * 0.3,
        wpx = 1 + t * 3;
      g.fillRect(W / 2 - wpx / 2, y, wpx, 3 + t * 3);
    }
    g.fillStyle = P.land;
  } else if (P.party) {
    g.fillStyle = P.land;
    g.fillRect(0, H * 0.75, W, H * 0.25);
    g.fillStyle = "#5c3a2a";
    g.fillRect(W * 0.3, H * 0.6, W * 0.4, H * 0.16);
    g.fillStyle = "#f2d8b8";
    g.fillRect(W * 0.36, H * 0.5, W * 0.28, H * 0.11);
    g.fillStyle = "#ff9ecb";
    g.fillRect(W * 0.36, H * 0.5, W * 0.28, 2);
    for (let i = 0; i < 3; i++) {
      g.fillStyle = "#fff";
      g.fillRect(60 + i * 11, 43, 2, 2);
    }
    for (let i = 0; i < 3; i++) {
      const fx = 66 + i * 14,
        flick = Math.sin(seed * 9 + i * 2) > 0 ? 0 : 1;
      g.fillStyle = "#f0c060";
      g.fillRect(fx, 34, 2, 7);
      g.fillStyle = flick ? "#ff5f5f" : "#ffd98a";
      g.fillRect(fx - 1, 31 - flick, 4, 3);
    }
    const conf = ["#ff9ecb", "#6fd3d8", "#f0c060", "#47d97f"];
    for (let i = 0; i < 30; i++) {
      const y = (seed * (8 + (i % 5)) + i * 37) % H;
      g.fillStyle = conf[i % 4];
      g.fillRect((i * 53) % W, y, 2, 2);
    }
  } else {
    const hy = H * (0.66 + R() * 0.12);
    g.fillRect(0, hy | 0, W, H);
    g.fillStyle = P.land;
    for (let x = 0; x < W; x += 4) if (R() < 0.4) g.fillRect(x, (hy | 0) - 2 - ((R() * 4) | 0), 4, 3);
  }
  if (P.rain) {
    g.fillStyle = "rgba(180,205,225,.5)";
    for (let i = 0; i < 120; i++) {
      const x = (R() * W) | 0,
        y = (R() * H) | 0;
      g.fillRect(x, y, 1, 3);
    }
  }
  if (P.snow) {
    g.fillStyle = "#f4f8fc";
    for (let i = 0; i < 90; i++) g.fillRect((R() * W) | 0, (R() * H) | 0, 1, 1);
  }
  if (P.hearts) {
    g.fillStyle = "#ff9ecb";
    for (let i = 0; i < 8; i++) {
      const x = (R() * W) | 0,
        y = (R() * H * 0.7) | 0;
      g.fillRect(x, y, 2, 2);
      g.fillRect(x + 4, y, 2, 2);
      g.fillRect(x, y + 2, 6, 2);
      g.fillRect(x + 1, y + 4, 4, 1);
      g.fillRect(x + 2, y + 5, 2, 1);
    }
  }
  return cv;
}

/* ---------- desktop wallpaper (independent starfield scene) ---------- */
const wall = $("#wall");
let twinkles = [];
function drawWall() {
  const w = (wall.width = Math.ceil(innerWidth / 3)),
    h = (wall.height = Math.ceil(innerHeight / 3)),
    g = wall.getContext("2d"),
    R = rng(42);
  const grd = g.createLinearGradient(0, 0, 0, h);
  grd.addColorStop(0, "#101b30");
  grd.addColorStop(0.6, "#1c2b45");
  grd.addColorStop(1, "#24365a");
  g.fillStyle = grd;
  g.fillRect(0, 0, w, h);
  twinkles = [];
  for (let i = 0; i < 70; i++) {
    g.fillStyle = R() < 0.5 ? "#e8ecf5" : "#8fa0c5";
    const x = (R() * w) | 0,
      y = (R() * h * 0.55) | 0;
    g.fillRect(x, y, 1, 1);
    if (R() < 0.12) twinkles.push({ x, y, p: R() * 6.28 });
  }
  g.fillStyle = "#e8ddc9";
  g.fillRect(w * 0.82, h * 0.12, 6, 6);
  g.fillRect(w * 0.8, h * 0.14, 10, 3);
  g.fillRect(w * 0.83, h * 0.1, 4, 2);
  const nC = 5 + ((R() * 3) | 0);
  for (let c = 0; c < nC; c++) {
    const cx = R() * w,
      cy = h * (0.15 + R() * 0.5),
      cw = w * (0.16 + R() * 0.22),
      ch = 8 + R() * 14;
    for (let y = 0; y < ch; y++)
      for (let x = 0; x < cw; x++) {
        const dx = (x - cw / 2) / (cw / 2),
          dy = (y - ch / 2) / (ch / 2),
          d = dx * dx + dy * dy;
        if (d < 1 && R() < (1 - d) * 0.8) {
          g.fillStyle = R() < 0.85 ? "#cfd9ec" : "#8fa0c5";
          g.fillRect((cx + x - cw / 2) | 0, (cy + y - ch / 2) | 0, 1, 1);
        }
      }
  }
  for (let y = h * 0.86; y < h; y++) {
    g.fillStyle = "#1a2942";
    g.fillRect(0, y, w, 1);
  }
}
setInterval(() => {
  if (!twinkles.length) return;
  const g = wall.getContext("2d");
  twinkles.forEach((t) => {
    t.p += 0.08;
    g.fillStyle = Math.sin(t.p) > 0 ? "#e8ecf5" : "#1c2942";
    g.fillRect(t.x, t.y, 1, 1);
  });
}, 280);

/* ---------- real media vs. generated art ----------
   Every memory/photo/video/track can optionally carry a real uploaded
   file (set from the admin console). When present, it's shown instead
   of the generated placeholder; when absent, the generator above fills
   in seamlessly. These two helpers are the seam between the two: build
   the right tag as a string, then, once it's in the DOM, paint any
   canvases that need it (an <img> needs no such step — the browser
   handles loading it on its own). */
function mediaOrArtHTML(media, art, seed, alt, extraAttrs = "") {
  if (media) {
    return `<img src="${esc(media)}" alt="${esc(alt || "")}" loading="lazy" ${extraAttrs}>`;
  }
  return `<canvas data-art="${esc(art)}" data-seed="${seed}" ${extraAttrs}></canvas>`;
}
function activateArt(scope) {
  $$("canvas[data-art]", scope).forEach((c) => drawArt(c, c.dataset.art, +c.dataset.seed));
}
