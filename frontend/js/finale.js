"use strict";
/* ---------- FINALE ---------- */
const finale = $("#finale"),
  heartsCv = $("#hearts");
let heartsRAF = null;
function startHearts() {
  heartsCv.width = innerWidth;
  heartsCv.height = innerHeight;
  const g = heartsCv.getContext("2d");
  const ps = [];
  for (let i = 0; i < 70; i++)
    ps.push({
      x: Math.random() * heartsCv.width,
      y: Math.random() * heartsCv.height,
      s: 2 + Math.random() * 4,
      v: 0.3 + Math.random() * 1.1,
      c: ["#ff9ecb", "#6fd3d8", "#f4f0e6", "#47d97f", "#f0c060"][(Math.random() * 5) | 0],
      h: Math.random() < 0.5,
    });
  cancelAnimationFrame(heartsRAF);
  (function loop() {
    g.clearRect(0, 0, heartsCv.width, heartsCv.height);
    ps.forEach(p => {
      p.y -= p.v;
      if (p.y < -12) { p.y = heartsCv.height + 10; p.x = Math.random() * heartsCv.width; }
      g.fillStyle = p.c;
      if (p.h) {
        g.fillRect(p.x, p.y, p.s, p.s);
        g.fillRect(p.x + p.s + 1, p.y, p.s, p.s);
        g.fillRect(p.x, p.y + p.s, p.s * 2 + 1, p.s);
        g.fillRect(p.x + 1, p.y + p.s * 2, p.s * 2 - 1, p.s);
      } else g.fillRect(p.x, p.y, p.s, p.s);
    });
    heartsRAF = requestAnimationFrame(loop);
  })();
}
async function typeTerm(el, text) {
  for (let i = 0; i <= text.length; i++) {
    el.textContent = text.slice(0, i) + "▮";
    if (soundOn && i % 2 === 0) sfx.type();
    await sleep(reduced ? 2 : 16);
  }
  el.textContent = text + "\n";
}
async function startFinale() {
  closeAllWindows();
  closeModal();
  if (typeof VP !== "undefined" && VP.playing) player.pause();
  if (typeof MP !== "undefined") stopTrack(true);
  sfx.power();
  desktop.style.transition = "filter .9s, opacity .9s";
  desktop.style.filter = "brightness(.12) saturate(.6)";
  desktop.style.opacity = "0.3";
  await sleep(950);
  desktop.style.display = "none";
  desktop.style.filter = "";
  desktop.style.opacity = "";
  desktop.style.transition = "";
  finale.classList.add("on");
  const term = $("#final-term");
  term.style.display = "block";
  term.textContent = "";
  $("#final-card").style.display = "none";
  await sleep(500);
  for (const line of FINALE_TERM) {
    await typeTerm(term, line + "");
    await sleep(220);
  }
  await sleep(500);
  sfx.boot();
  const big = $("#final-card .big");
  term.style.display = "none";
  $("#final-card").style.display = "flex";
  big.innerHTML = esc(FINALE_HEADING).split(" ").join("<br>");
  big.style.animation = "finalpop .5s steps(6)";
  const fm = $("#final-msg");
  fm.textContent = FINAL_MESSAGE;
  fm.dir = isRtlText(FINAL_MESSAGE) ? "rtl" : "ltr";
  [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => beep(f, 0.35, "triangle", 0.05), i * 180));
  startHearts();
}
$("#btn-replay").onclick = () => location.reload();
$("#btn-explore").onclick = () => {
  cancelAnimationFrame(heartsRAF);
  finale.classList.remove("on");
  desktop.style.display = "block";
  desktop.classList.add("on");
  toast("welcome back to the machine.");
};
