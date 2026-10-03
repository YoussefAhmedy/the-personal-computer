"use strict";
/* ---------- sound engine ---------- */
let AC = null,
  soundOn = true,
  musicGain = null;

function ac() {
  if (!AC) {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    musicGain = AC.createGain();
    musicGain.gain.value = 0.8;
    musicGain.connect(AC.destination);
  }
  if (AC.state === "suspended") AC.resume();
  return AC;
}

function beep(f = 880, d = 0.05, type = "square", g = 0.035) {
  if (!soundOn) return;
  try {
    const a = ac(),
      o = a.createOscillator(),
      v = a.createGain();
    o.type = type;
    o.frequency.value = f;
    v.gain.setValueAtTime(g, a.currentTime);
    v.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + d);
    o.connect(v);
    v.connect(a.destination);
    o.start();
    o.stop(a.currentTime + d + 0.02);
  } catch (e) {
    /* audio can legitimately be unavailable (autoplay policy, etc.) */
  }
}

const sfx = {
  click: () => beep(1300, 0.03, "square", 0.03),
  open: () => {
    beep(620, 0.05);
    setTimeout(() => beep(930, 0.07), 70);
  },
  close: () => beep(430, 0.06, "square", 0.035),
  deny: () => {
    beep(220, 0.09, "sawtooth", 0.04);
    setTimeout(() => beep(180, 0.12, "sawtooth", 0.04), 90);
  },
  power: () => beep(75, 0.3, "sawtooth", 0.05),
  boot: () => {
    [523, 659, 784].forEach((f, i) => setTimeout(() => beep(f, 0.12, "triangle", 0.045), i * 130));
  },
  secret: () => {
    [880, 1108, 1318, 1760].forEach((f, i) => setTimeout(() => beep(f, 0.1, "square", 0.03), i * 90));
  },
  type: () => beep(1900, 0.006, "square", 0.012),
};

document.addEventListener(
  "pointerdown",
  () => {
    try {
      ac();
    } catch (e) {
      /* ignore */
    }
  },
  { once: true }
);

/* ---------- background CRT noise (full-viewport grain) ---------- */
const nz = $("#noise"),
  nctx = nz.getContext("2d");
function sizeNoise() {
  nz.width = Math.ceil(innerWidth / 3);
  nz.height = Math.ceil(innerHeight / 3);
}
sizeNoise();
addEventListener("resize", sizeNoise);
setInterval(() => {
  if (reduced) return;
  const w = nz.width,
    h = nz.height,
    d = nctx.createImageData(w, h),
    p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    if (Math.random() < 0.5) {
      const v = (Math.random() * 255) | 0;
      p[i] = p[i + 1] = p[i + 2] = v;
      p[i + 3] = 9;
    }
  }
  nctx.putImageData(d, 0, 0);
}, 110);

/* ---------- screen static (monitor, pre-boot) ---------- */
const sst = $("#screen-static"),
  sctx = sst.getContext("2d");
let sstTimer = null;
function startScreenStatic() {
  sst.width = 110;
  sst.height = 84;
  sstTimer = setInterval(() => {
    const d = sctx.createImageData(110, 84),
      p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      const v = Math.random();
      p[i] = 90 * v;
      p[i + 1] = 230 * v;
      p[i + 2] = 130 * v;
      p[i + 3] = v < 0.5 ? 40 : 0;
    }
    sctx.putImageData(d, 0, 0);
  }, 70);
}
function stopScreenStatic() {
  clearInterval(sstTimer);
  sstTimer = null;
}
