"use strict";
/* ---------- APP: VIDEOS ----------
   Two playback modes share one control bar:
   - "sim": the original canvas-animated "recovered tape" with a
     procedural scene and tape-hiss noise. This is the default, so the
     app looks complete with zero uploads.
   - "real": an actual uploaded <video>, once the admin attaches one.
   `player` below is the seam — the transport buttons call it the same
   way regardless of which mode is active. */
const VP = { sel: 0, t: 0, playing: false, mode: "sim", raf: null, last: 0, hiss: null, hgain: null };
const vbuf = document.createElement("canvas");
vbuf.width = 160;
vbuf.height = 90;

function ensureHiss() {
  if (VP.hiss) return;
  const a = ac(),
    len = a.sampleRate * 1,
    buf = a.createBuffer(1, len, a.sampleRate),
    d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.25;
  VP.hiss = a.createBufferSource();
  VP.hiss.buffer = buf;
  VP.hiss.loop = true;
  VP.hgain = a.createGain();
  VP.hgain.gain.value = 0.02;
  VP.hiss.connect(VP.hgain);
  VP.hgain.connect(a.destination);
}
function recScene(g, t, type) {
  const W = 160,
    H = 90,
    R = rng(7);
  if (type === "road") {
    const sky = ["#1c1b3d", "#5c2f5e", "#c65f6b", "#f0a05a"];
    for (let y = 0; y < H; y++) (g.fillStyle = sky[Math.min(3, (y / 16) | 0)]), g.fillRect(0, y, W, 1);
    g.fillStyle = "#ffd98a";
    g.fillRect(112, 18, 14, 14);
    g.fillRect(109, 21, 20, 8);
    g.fillRect(115, 15, 8, 20);
    g.fillStyle = "#241f38";
    g.fillRect(0, 58, W, 32);
    for (let x = 0; x < W; x += 8) g.fillRect(x, 54 + (x % 16 ? 0 : 2), 8, 4);
    g.fillStyle = "#3d3a4d";
    g.beginPath();
    g.moveTo(60, 60);
    g.lineTo(100, 60);
    g.lineTo(146, 90);
    g.lineTo(14, 90);
    g.fill();
    g.fillStyle = "#ffd98a";
    for (let i = 0; i < 8; i++) {
      const y = 62 + ((t * 30 + i * 11) % 30),
        k = (y - 60) / 30;
      g.fillRect(79 - k * 2, y, 2 + k * 4, 2 + k * 2);
    }
    g.fillStyle = "#8fa0c5";
    for (let i = 0; i < 10; i++) {
      const y = 62 + ((t * 30 + i * 9) % 28);
      g.fillRect(52 - ((y - 60) / 30) * 30, y, 2, 3);
      g.fillRect(108, y, 2, 3);
    }
  } else {
    g.fillStyle = "#0e0916";
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 24; i++) {
      g.fillStyle = "#e8ecf5";
      g.fillRect((i * 67) % W, (i * 31) % 40, 1, 1);
    }
    for (let i = 0; i < 12; i++) {
      const on = Math.sin(t * 3 + i) > 0;
      g.fillStyle = on ? ["#f0c060", "#ff9ecb", "#6fd3d8"][i % 3] : "#332433";
      g.fillRect(6 + i * 13, 10 + (i % 2) * 3, 3, 3);
      g.fillStyle = "#5c3a6b";
      g.fillRect(7 + i * 13, 12, 1, 4);
    }
    g.fillStyle = "#140d1c";
    g.fillRect(0, 56, W, 34);
    g.fillStyle = "#5c3a2a";
    g.fillRect(48, 48, 64, 10);
    g.fillStyle = "#f2d8b8";
    g.fillRect(56, 40, 48, 9);
    g.fillStyle = "#ff9ecb";
    g.fillRect(56, 40, 48, 2);
    g.fillStyle = "#fff";
    for (let i = 0; i < 4; i++) g.fillRect(60 + i * 11, 43, 2, 2);
    for (let i = 0; i < 3; i++) {
      const fx = 66 + i * 14,
        flick = Math.sin(t * 9 + i * 2) > 0 ? 0 : 1;
      g.fillStyle = "#f0c060";
      g.fillRect(fx, 34, 2, 7);
      g.fillStyle = flick ? "#ff5f5f" : "#ffd98a";
      g.fillRect(fx - 1, 31 - flick, 4, 3);
    }
    const conf = ["#ff9ecb", "#6fd3d8", "#f0c060", "#47d97f"];
    for (let i = 0; i < 30; i++) {
      const y = (t * (8 + (i % 5)) + i * 37) % H;
      g.fillStyle = conf[i % 4];
      g.fillRect((i * 53 + ((t * 10) | 0)) % W, y, 2, 2);
    }
  }
}
function drawVideo() {
  const cv = $("#vid-canvas");
  if (!cv) return;
  const g = cv.getContext("2d"),
    v = VIDEOS[VP.sel];
  recScene(vbuf.getContext("2d"), VP.t, v.art);
  g.imageSmoothingEnabled = false;
  g.clearRect(0, 0, cv.width, cv.height);
  g.drawImage(vbuf, 0, 0, cv.width, cv.height);
  if (Math.random() < 0.04) {
    const y = (Math.random() * cv.height) | 0;
    g.drawImage(cv, 0, y, cv.width, 2, Math.random() * 8 - 4, y, cv.width, 2);
  }
  const st = $("#vid-stamp");
  if (st) {
    const total = VP.t | 0,
      mm = String((total / 60) | 0).padStart(2, "0"),
      ss = String(total % 60).padStart(2, "0");
    st.textContent = "PLAY ▶ 07.03.1988  " + mm + ":" + ss;
  }
  const pr = $("#vid-prog");
  if (pr) pr.value = VP.t;
}
function vidLoop(now) {
  if (!VP.playing) return;
  if (!document.getElementById("vid-canvas")) {
    VP.playing = false;
    return;
  }
  const dt = (now - VP.last) / 1000;
  VP.last = now;
  const v = VIDEOS[VP.sel];
  VP.t += dt;
  if (VP.t >= v.dur) VP.t = 0;
  drawVideo();
  VP.raf = requestAnimationFrame(vidLoop);
}

/* ---- unified transport: the control bar talks to this, not to the
   canvas/video internals directly ---- */
const player = {
  play() {
    const v = VIDEOS[VP.sel];
    VP.playing = true;
    if (VP.mode === "real") {
      $("#vid-real")?.play().catch(() => {});
    } else {
      VP.last = performance.now();
      cancelAnimationFrame(VP.raf);
      VP.raf = requestAnimationFrame(vidLoop);
      try {
        ensureHiss();
        VP.hgain.gain.value = (+($("#vid-vol")?.value ?? 30) / 100) * 0.08;
        if (VP.hiss.context.state === "suspended") VP.hiss.context.resume();
        VP.hiss.start();
      } catch (e) {
        /* ignore */
      }
    }
    sfx.open();
    const btn = $("#vid-play");
    if (btn) btn.textContent = "⏸";
    const r = $("#vid-rec");
    if (r) r.style.display = "flex";
  },
  pause() {
    VP.playing = false;
    if (VP.mode === "real") $("#vid-real")?.pause();
    else {
      cancelAnimationFrame(VP.raf);
      try {
        VP.hiss.stop();
        VP.hiss = null;
      } catch (e) {
        /* ignore */
      }
    }
    sfx.click();
    const btn = $("#vid-play");
    if (btn) btn.textContent = "▶";
    const r = $("#vid-rec");
    if (r) r.style.display = "none";
  },
  toggle() {
    VP.playing ? this.pause() : this.play();
  },
  stop() {
    if (VP.playing) this.pause();
    VP.t = 0;
    if (VP.mode === "real") {
      const el = $("#vid-real");
      if (el) el.currentTime = 0;
    } else drawVideo();
  },
  seekBy(delta) {
    const v = VIDEOS[VP.sel];
    const dur = VP.mode === "real" ? $("#vid-real")?.duration || v.dur : v.dur;
    VP.t = Math.max(0, Math.min(dur, VP.t + delta));
    if (VP.mode === "real") {
      const el = $("#vid-real");
      if (el) el.currentTime = VP.t;
    } else drawVideo();
  },
  seekTo(val) {
    VP.t = +val;
    if (VP.mode === "real") {
      const el = $("#vid-real");
      if (el) el.currentTime = VP.t;
    } else drawVideo();
  },
  setVolume(pct) {
    if (VP.mode === "real") {
      const el = $("#vid-real");
      if (el) el.volume = pct / 100;
    } else if (VP.hgain) VP.hgain.gain.value = (pct / 100) * 0.08;
  },
  fullscreen() {
    const el = VP.mode === "real" ? $("#vid-real") : $(".vidscreen");
    el?.requestFullscreen?.();
  },
};

function screenHTML(v) {
  if (v.media) {
    return `<div class="vidscreen"><video id="vid-real" src="${esc(v.media)}" playsinline></video>
      <div class="stamp" id="vid-stamp">07.03.1988</div><div class="scanin"></div></div>`;
  }
  return `<div class="vidscreen"><canvas id="vid-canvas" width="480" height="270"></canvas>
    <div class="rec" id="vid-rec" style="display:none"><i></i>REC</div><div class="stamp" id="vid-stamp"></div><div class="scanin"></div></div>`;
}

function selectVideo(i) {
  if (VP.playing) player.pause();
  VP.sel = i;
  VP.t = 0;
  VP.mode = VIDEOS[i].media ? "real" : "sim";
  const win = wins["VIDEOS"];
  if (!win) return;
  win.el.querySelectorAll(".viditem").forEach((x, j) => x.classList.toggle("on", j === i));
  const holder = win.el.querySelector("#vid-screen-holder");
  holder.innerHTML = screenHTML(VIDEOS[i]);
  const prog = win.el.querySelector("#vid-prog");
  if (prog) {
    prog.max = VIDEOS[i].dur;
    prog.value = 0;
  }
  const tm = win.el.querySelector("#vid-time");
  if (tm) tm.textContent = "00:00";

  if (VP.mode === "real") {
    const el = win.el.querySelector("#vid-real");
    if (el) el.currentTime = 0;
    el.volume = +(win.el.querySelector("#vid-vol")?.value ?? 30) / 100;
    el.addEventListener("loadedmetadata", () => {
      if (prog && isFinite(el.duration)) prog.max = el.duration;
    });
    el.addEventListener("timeupdate", () => {
      VP.t = el.currentTime;
      if (prog) prog.value = VP.t;
      const tm = win.el.querySelector("#vid-time");
      if (tm) {
        const s = VP.t | 0;
        tm.textContent = String((s / 60) | 0).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
      }
    });
    el.addEventListener("play", () => {
      VP.playing = true;
      const btn = win.el.querySelector("#vid-play");
      if (btn) btn.textContent = "⏸";
    });
    el.addEventListener("pause", () => {
      VP.playing = false;
      const btn = win.el.querySelector("#vid-play");
      if (btn) btn.textContent = "▶";
    });
    el.addEventListener("ended", () => {
      VP.t = 0;
    });
  } else {
    drawVideo();
  }
  mark("vid" + i);
}

APP.VIDEOS = () => {
  if (!VIDEOS.length) {
    openWindow("VIDEOS", "VIDEOS", `<div class="wempty">no recordings filed yet.</div>`, {});
    return;
  }
  openWindow(
    "VIDEOS",
    "VIDEOS",
    `<div class="vidwrap">
      <div class="vidmain">
        <div id="vid-screen-holder" style="flex:1;display:flex;flex-direction:column;min-height:0"></div>
        <div class="vidctrl"><button class="pbtn" id="vid-rw" aria-label="rewind">⏪</button><button class="pbtn" id="vid-play" aria-label="play">▶</button><button class="pbtn" id="vid-stop" aria-label="stop">⏹</button><button class="pbtn" id="vid-ff" aria-label="fast forward">⏩</button>
        <input type="range" id="vid-prog" min="0" max="26" step="0.1" value="0"><span id="vid-time" style="font-family:var(--term);font-size:13px;color:var(--ink-tertiary)">00:00</span>
        <label style="font-family:var(--term);font-size:13px;color:var(--ink-tertiary)">VOL <input type="range" id="vid-vol" min="0" max="100" value="30" style="width:70px;accent-color:var(--accent)"></label>
        <button class="pbtn" id="vid-fs" aria-label="fullscreen">⛶</button></div>
      </div>
      <div class="vidside">
        <div style="font-family:var(--sys);font-size:11px;font-weight:700;color:var(--ink-tertiary);margin-bottom:4px;">PLAYLIST</div>
        <div class="vidlist">${VIDEOS.map((v, i) => `<div class="viditem" data-i="${i}"><b>${esc(v.id)}</b> ${esc(v.title)}<span class="dur">${v.dur}s · ${esc(v.file)}</span></div>`).join("")}</div>
      </div>
    </div>`,
    { pctW: 0.65, pctH: 0.65, status: "TAPE DECK: READY", status2: "TRACKING: AUTO" }
  );
  const win = wins["VIDEOS"].el;
  win.querySelectorAll(".viditem").forEach((el) => (el.onclick = () => {
    sfx.click();
    selectVideo(+el.dataset.i);
  }));
  win.querySelector("#vid-play").onclick = () => player.toggle();
  win.querySelector("#vid-stop").onclick = () => player.stop();
  win.querySelector("#vid-rw").onclick = () => player.seekBy(-5);
  win.querySelector("#vid-ff").onclick = () => player.seekBy(5);
  win.querySelector("#vid-prog").oninput = (e) => player.seekTo(e.target.value);
  win.querySelector("#vid-vol").oninput = (e) => player.setVolume(+e.target.value);
  win.querySelector("#vid-fs").onclick = () => player.fullscreen();
  setInterval(() => {
    if (!VP.playing || VP.mode !== "sim") return;
    const v = VIDEOS[VP.sel],
      pr = win.querySelector("#vid-prog"),
      tm = win.querySelector("#vid-time");
    if (pr) {
      pr.max = v.dur;
      pr.value = VP.t;
    }
    if (tm) {
      const s = VP.t | 0;
      tm.textContent = String((s / 60) | 0).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
    }
  }, 200);
  selectVideo(0);
};
