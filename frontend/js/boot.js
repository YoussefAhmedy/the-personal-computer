"use strict";
/* ---------- zoom / boot / access-code flow ---------- */
const monitor = $("#monitor"),
  outside = $("#outside"),
  boot = $("#boot"),
  bootlog = $("#bootlog"),
  desktop = $("#desktop"),
  passgate = $("#passgate"),
  passForm = $("#pass-form"),
  passInput = $("#pass-input"),
  passHint = $("#pass-hint");

let entered = false;
function enter() {
  if (entered) return;
  entered = true;
  sfx.power();
  monitor.classList.remove("awake");
  const scr = $("#screen").getBoundingClientRect();
  const scale = Math.max(innerWidth / scr.width, innerHeight / scr.height) * 1.35;
  monitor.style.transformOrigin = `${scr.left + scr.width / 2 - monitor.getBoundingClientRect().left}px ${scr.top + scr.height / 2 - monitor.getBoundingClientRect().top}px`;
  $("#screen-glow").style.opacity = 1;
  startScreenStatic();
  nz.style.opacity = 0.15;
  monitor.classList.add("zooming");
  monitor.style.transform = `scale(${scale})`;
  setTimeout(() => { $("#blackout").classList.add("on"); }, 1600);
  setTimeout(() => {
    stopScreenStatic();
    outside.style.display = "none";
    nz.style.opacity = 0.02;
    runBoot();
  }, 2000);
}
monitor.addEventListener("pointerenter", () => {
  if (entered) return;
  monitor.classList.add("awake");
  startScreenStatic();
  sst.style.opacity = 0.5;
});
monitor.addEventListener("pointerleave", () => {
  if (entered) return;
  monitor.classList.remove("awake");
  sst.style.opacity = 0;
  stopScreenStatic();
});
monitor.addEventListener("click", enter);
addEventListener("keydown", (e) => {
  if (!entered && e.key === "Enter") enter();
});

async function typeLine(text, cls) {
  const span = document.createElement("span");
  if (cls) span.className = cls;
  bootlog.appendChild(span);
  const cur = document.createElement("span");
  cur.className = "cursor";
  bootlog.appendChild(cur);
  for (const ch of text) {
    span.textContent += ch;
    if (soundOn && Math.random() < 0.3) sfx.type();
    await sleep(reduced ? 1 : 6 + Math.random() * 10);
  }
  cur.remove();
  bootlog.appendChild(document.createTextNode("\n"));
}

function runPasscodeGate() {
  return new Promise((resolve) => {
    passgate.classList.add("on");
    passHint.classList.remove("hide");
    passHint.textContent = "this machine is locked. enter the code you were given.";
    passInput.value = "";
    passInput.disabled = false;
    setTimeout(() => passInput.focus(), 50);

    let busy = false;
    async function submit(e) {
      e.preventDefault();
      if (busy) return;
      const val = passInput.value;
      if (!val) return;
      busy = true;
      passInput.disabled = true;
      try {
        await Api.login(val);
        sfx.boot();
        passgate.classList.remove("on");
        passForm.removeEventListener("submit", submit);
        resolve(true);
      } catch (err) {
        sfx.deny();
        passgate.classList.add("shake");
        setTimeout(() => passgate.classList.remove("shake"), 320);
        passInput.value = "";
        passInput.disabled = false;
        passHint.textContent = err.message || "ACCESS DENIED — incorrect code. Try again.";
        passInput.focus();
        busy = false;
      }
    }
    passForm.addEventListener("submit", submit);
  });
}

async function runBoot() {
  boot.style.display = "block";
  $("#blackout").classList.remove("on");
  sfx.boot();
  await sleep(300);
  for (const [t, c] of BOOT_LINES_PRE) await typeLine(t, c);

  let already = false;
  // Removed API check to rely on memory: forces prompt on every refresh/restart.

  if (!already) {
    await typeLine("ENTER ACCESS CODE:", "");
    await runPasscodeGate();
  }

  await sleep(150);
  for (const [t, c] of BOOT_LINES_POST) {
    await typeLine(t, c);
    if (t.startsWith("LOADING PERSONAL ENVIRONMENT")) {
      try { await loadContent(); } catch (e) {
        await typeLine("ERROR: could not reach the archive.", "err");
        await typeLine("Check your connection and refresh the page.", "err");
        return;
      }
    }
  }
  await sleep(300);
  boot.style.display = "none";
  showDesktop();
}

function showDesktop() {
  applyUserToUI();
  buildDesktopIcons();
  buildDock();
  desktop.style.display = "block";
  initWallpaper();
  requestAnimationFrame(() => desktop.classList.add("on"));
  updateMenuBarAppName();
  updateClock();
}
