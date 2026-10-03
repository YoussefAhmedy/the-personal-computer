"use strict";
/* ---------- APP: MUSIC ----------
   Same real/generated split as Videos: a track with an uploaded audio
   file plays through a real <audio> element; one without falls back to
   the original oscillator-synthesized chiptune built from its note
   data. Both modes drive the same playlist UI, album art, and the
   (purely decorative, audio-reactive-looking) equalizer. */
let MP = { idx: -1, playing: false, timers: [], total: 0, startAt: 0, mode: "sim" };
let audioEl = null;

function tone(f, dur) {
  if (!soundOn) return;
  try {
    const a = ac(),
      o = a.createOscillator(),
      v = a.createGain();
    o.type = "square";
    o.frequency.value = f;
    v.gain.setValueAtTime(0.06, a.currentTime);
    v.gain.setTargetAtTime(0.0001, a.currentTime + dur, 0.04);
    o.connect(v);
    v.connect(musicGain);
    o.start();
    o.stop(a.currentTime + dur + 0.1);
  } catch (e) {
    /* ignore */
  }
}
function stopChiptune() {
  MP.timers.forEach(clearTimeout);
  MP.timers = [];
}
function startChiptune(tr) {
  stopChiptune();
  let acc = 0;
  MP.total = tr.notes.reduce((a, n) => a + n[1], 0) * STEP * 1000;
  MP.startAt = performance.now();
  tr.notes.forEach(([f, d]) => {
    if (f) MP.timers.push(setTimeout(() => tone(f, d * STEP), acc));
    acc += d * STEP * 1000;
  });
  MP.timers.push(
    setTimeout(() => {
      if (MP.playing && MP.mode === "sim") playTrack((MP.idx + 1) % TRACKS.length);
    }, acc + 400)
  );
}
function ensureAudioEl() {
  if (audioEl) return audioEl;
  audioEl = document.createElement("audio");
  audioEl.addEventListener("ended", () => {
    if (MP.playing) playTrack((MP.idx + 1) % TRACKS.length);
  });
  document.body.appendChild(audioEl);
  return audioEl;
}

function stopTrack(reset) {
  MP.playing = false;
  stopChiptune();
  if (audioEl) {
    audioEl.pause();
    audioEl.currentTime = 0;
  }
  const b = $("#m-play");
  if (b) b.textContent = "▶";
  if (reset) MP.idx = -1;
}
function playTrack(i) {
  if (!wins["MUSIC"]) {
    APP.MUSIC();
    setTimeout(() => playTrack(i), 120);
    return;
  }
  stopTrack();
  MP.idx = i;
  MP.playing = true;
  const tr = TRACKS[i];
  MP.mode = tr.media ? "real" : "sim";

  if (MP.mode === "real") {
    const el = ensureAudioEl();
    el.src = tr.media;
    el.volume = +($("#m-vol")?.value ?? 80) / 100;
    el.currentTime = 0;
    el.play().catch(() => {});
  } else {
    startChiptune(tr);
  }

  const win = wins["MUSIC"].el,
    alb = win.querySelector("#m-album");
  if (alb) {
    const c = alb.querySelector("canvas") || alb.appendChild(document.createElement("canvas"));
    drawArt(c, tr.art, i + 5);
  }
  win.querySelector("#m-title").textContent = tr.title;
  win.querySelector("#m-artist").textContent = tr.artist;
  win.querySelector("#m-no").textContent = String(i + 1).padStart(2, "0") + " / " + String(TRACKS.length).padStart(2, "0");
  win.querySelectorAll(".plitem").forEach((x, j) => x.classList.toggle("on", j === i));
  const b = win.querySelector("#m-play");
  if (b) b.textContent = "⏸";
  sfx.open();
  mark("trk" + i);
}
function pauseTrack() {
  stopTrack(false);
}
APP.MUSIC = () => {
  if (!TRACKS.length) {
    openWindow("MUSIC", "MUSIC", `<div class="wempty">no tracks filed yet.</div>`, {});
    return;
  }
  openWindow(
    "MUSIC",
    "MUSIC",
    `<div style="padding:14px 14px 0"><div class="musicwrap" style="padding:0">
    <div class="album" id="m-album"><canvas></canvas></div>
    <div class="trackinfo"><div class="tt" id="m-title">—</div><div class="ta" id="m-artist">—</div>
    <div class="tno" id="m-no">-- / --</div>
    <div class="eq"><canvas id="m-eq"></canvas></div>
    <div class="progress"><div class="fill" id="m-fill"></div></div>
    <div class="mctrl"><button class="pbtn" id="m-prev" aria-label="previous">⏮</button><button class="pbtn" id="m-play" aria-label="play">▶</button><button class="pbtn" id="m-stop" aria-label="stop">⏹</button><button class="pbtn" id="m-next" aria-label="next">⏭</button>
    <label style="font-family:var(--term);font-size:13px;color:var(--ink-tertiary);margin-left:auto">VOL <input type="range" id="m-vol" min="0" max="100" value="80" style="width:80px;accent-color:var(--accent)"></label></div></div></div>
   <div class="playlist">${TRACKS.map((t, i) => `<div class="plitem" data-i="${i}"><span class="no">${String(i + 1).padStart(2, "0")}</span>${esc(t.id)} — ${esc(t.title)}<span class="du">${t.media ? "audio" : (t.notes.reduce((a, n) => a + n[1], 0) * STEP).toFixed(1) + "s"}</span></div>`).join("")}</div></div>`,
    { pctW: 0.48, pctH: 0.72, status: "OUTPUT: 8-BIT / MONO", status2: "BUFFER: 64KB" }
  );
  const win = wins["MUSIC"].el;
  win.querySelectorAll(".plitem").forEach((el) => (el.onclick = () => {
    sfx.click();
    playTrack(+el.dataset.i);
  }));
  win.querySelector("#m-play").onclick = () => {
    if (MP.playing) pauseTrack();
    else if (MP.idx >= 0) {
      MP.playing = true;
      if (MP.mode === "real" && audioEl) audioEl.play().catch(() => {});
      else startChiptune(TRACKS[MP.idx]);
      win.querySelector("#m-play").textContent = "⏸";
    } else playTrack(0);
  };
  win.querySelector("#m-stop").onclick = () => {
    stopTrack(true);
    const w2 = wins["MUSIC"];
    if (w2) {
      w2.el.querySelector("#m-title").textContent = "—";
      w2.el.querySelector("#m-fill").style.width = "0%";
    }
  };
  win.querySelector("#m-prev").onclick = () => playTrack(((MP.idx < 0 ? 0 : MP.idx) - 1 + TRACKS.length) % TRACKS.length);
  win.querySelector("#m-next").onclick = () => playTrack(((MP.idx < 0 ? -1 : MP.idx) + 1) % TRACKS.length);
  win.querySelector("#m-vol").oninput = (e) => {
    const pct = e.target.value / 100;
    if (audioEl) audioEl.volume = pct;
    if (musicGain) musicGain.gain.value = pct;
  };
  const eq = win.querySelector("#m-eq");
  eq.width = 240;
  eq.height = 40;
  setInterval(() => {
    if (!wins["MUSIC"]) return;
    const g = eq.getContext("2d");
    g.clearRect(0, 0, 240, 40);
    for (let i = 0; i < 24; i++) {
      const h = MP.playing ? 6 + Math.abs(Math.sin(performance.now() / 180 + i * 0.6)) * 14 + Math.random() * 8 : 3;
      g.fillStyle = MP.playing ? "#47d97f" : "#2e5e46";
      g.fillRect(i * 10 + 2, 40 - h, 7, h);
    }
    const f = win.querySelector("#m-fill");
    if (f && MP.playing) {
      if (MP.mode === "real" && audioEl && audioEl.duration) {
        f.style.width = Math.min(100, (audioEl.currentTime / audioEl.duration) * 100) + "%";
      } else if (MP.mode === "sim" && MP.total) {
        f.style.width = Math.min(100, ((performance.now() - MP.startAt) / MP.total) * 100) + "%";
      }
    }
  }, 110);
  drawArt(win.querySelector("#m-album canvas"), "clouds", 9);
  if (MP.idx < 0) playTrack(0);
};
