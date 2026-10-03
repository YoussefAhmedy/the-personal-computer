"use strict";
/* ============================================================
   WINDOW MANAGER — macOS-inspired desktop shell
   ============================================================ */

/* ---------- toast ---------- */
function toast(msg, ms = 3200, isErr = false) {
  const t = document.createElement("div");
  t.className = "toast" + (isErr ? " err" : "");
  t.textContent = msg;
  $("#toasts").appendChild(t);
  setTimeout(() => t.remove(), ms);
}

let explored = new Set(), gameSpawned = false;
function mark(x) {
  explored.add(x);
  if (!gameSpawned && explored.size >= 6) { gameSpawned = true; spawnGame(); }
}
function spawnGame() {
  const ic = document.getElementById("icon-GAME");
  if (ic) ic.classList.add("spawn");
  sfx.secret();
  toast("A new program appeared on the desktop");
  addDockApp("GAME");
}

/* ---------- ANIMATION SYSTEM ---------- */
const Anim = {
  openWin(el) {
    el.classList.remove("closing","minimizing","restoring","settled");
    el.classList.add("opening");
    el.addEventListener("animationend", () => {
      el.classList.remove("opening");
      el.classList.add("settled");
    }, { once: true });
  },
  closeWin(el, cb) {
    el.classList.remove("opening","settled","restoring");
    el.classList.add("closing");
    el.addEventListener("animationend", () => cb(), { once: true });
    setTimeout(cb, 300); // fallback
  },
  minimizeWin(el, cb) {
    el.classList.remove("opening","settled","restoring");
    el.classList.add("minimizing");
    el.addEventListener("animationend", () => cb(), { once: true });
    setTimeout(cb, 450);
  },
  restoreWin(el) {
    el.classList.remove("closing","minimizing","opening");
    el.classList.add("restoring");
    el.addEventListener("animationend", () => {
      el.classList.remove("restoring");
      el.classList.add("settled");
    }, { once: true });
  },
};

/* ---------- WINDOW MANAGER ---------- */
const winlayer = $("#winlayer");
let zTop = 10, cascade = 0;
const wins = {};

function focusWin(id) {
  const w = wins[id];
  if (!w || w.min) return;
  Object.values(wins).forEach(ww => { if (ww.el) ww.el.classList.add("inactive"); });
  w.el.classList.remove("inactive");
  w.el.style.zIndex = ++zTop;
  activeAppName = w.title;
  updateMenuBarAppName();
  updateDockState();
}

/* Compute responsive window dimensions */
function calcWinSize(opts = {}) {
  const vw = innerWidth, vh = innerHeight;
  const mbh = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--menubar-h')) || 28;
  const dh = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--dock-h')) || 56;
  const avail_h = vh - mbh - dh - 24;
  const avail_w = vw - 24;

  const pctW = opts.pctW || 0.52;
  const pctH = opts.pctH || 0.72;

  let w, h;
  if (opts.w) {
    w = Math.min(opts.w, avail_w * 0.92);
  } else {
    w = Math.round(Math.min(avail_w * 0.92, Math.max(320, avail_w * pctW)));
  }
  if (opts.h) {
    h = Math.min(opts.h, avail_h * 0.92);
  } else {
    h = Math.round(Math.min(avail_h * 0.92, Math.max(220, avail_h * pctH)));
  }

  // Center with cascade
  const cx = Math.max(12, (avail_w - w) / 2 + 12 + cascade * 22);
  const cy = Math.max(mbh + 8, (avail_h - h) / 2 + mbh + 8 + cascade * 18);
  cascade = (cascade + 1) % 6;

  return { w, h, x: cx, y: cy };
}

function openWindow(id, title, content, opts = {}) {
  if (wins[id]) {
    const w = wins[id];
    if (w.min) {
      w.min = false;
      w.el.style.display = "flex";
      Anim.restoreWin(w.el);
      focusWin(id);
    } else {
      focusWin(id);
    }
    return w;
  }
  const el = document.createElement("div");
  el.className = "window";
  el.dataset.id = id;
  const sz = calcWinSize(opts);
  el.style.width = sz.w + "px";
  el.style.height = sz.h + "px";

  if (isTouch) {
    const mbh = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--menubar-h')) || 28;
    el.style.left = "2%";
    el.style.top = (mbh + 4) + "px";
    el.style.width = "96%";
    el.style.height = `calc(100% - ${mbh}px - var(--taskbar-h) - 8px)`;
  } else {
    el.style.left = sz.x + "px";
    el.style.top = sz.y + "px";
  }

  const displayTitle = title.replace(/^\/[A-Z]+\//, '').replace(/\.EXE$/, '');
  el.innerHTML = `<div class="titlebar">
    <span class="tb-btns"><button data-a="close" title="Close" aria-label="Close"></button><button data-a="min" title="Minimize" aria-label="Minimize"></button><button data-a="max" title="Zoom" aria-label="Zoom"></button></span>
    <span class="tb-title">${esc(displayTitle)}</span><span class="tb-spacer"></span></div>
    <div class="wbody">${content}</div>${opts.status ? `<div class="statusbar"><span>${opts.status}</span><span>${opts.status2 || ""}</span></div>` : ""}`;

  winlayer.appendChild(el);
  wins[id] = { el, min: false, title: displayTitle, origSize: sz };
  addDockApp(id);

  // Bounce dock icon
  const dockItem = dockContainer.querySelector(`[data-app="${id}"]`);
  if (dockItem) { dockItem.classList.add("bouncing"); setTimeout(() => dockItem.classList.remove("bouncing"), 600); }

  Anim.openWin(el);
  focusWin(id);
  sfx.open();

  el.addEventListener("pointerdown", (e) => { if (!e.target.closest(".tb-btns")) focusWin(id); });

  // Traffic lights
  el.querySelector("[data-a=close]").onclick = () => closeWindow(id);
  el.querySelector("[data-a=min]").onclick = () => minimizeWindow(id);
  el.querySelector("[data-a=max]").onclick = () => toggleMaximize(id);

  // Dragging
  setupDrag(el, id);

  if (opts.onopen) opts.onopen(el);
  return wins[id];
}

function closeWindow(id) {
  const w = wins[id];
  if (!w) return;
  sfx.close();
  
  // Clean up resources on close
  if (id === "VIDEOS" && typeof player !== "undefined" && player.stop) player.stop();
  if (id === "MUSIC" && typeof stopTrack !== "undefined") stopTrack(true);
  if (id === "GAME" && typeof GAME !== "undefined") {
    GAME.running = false;
    if (GAME.raf) cancelAnimationFrame(GAME.raf);
  }
  if (id === "NOTES" && typeof noteTimer !== "undefined") {
    clearInterval(noteTimer);
  }

  Anim.closeWin(w.el, () => {
    w.el.remove();
    delete wins[id];
    updateDockState();
    updateMenuBarAppName();
  });
}

function minimizeWindow(id) {
  const w = wins[id];
  if (!w) return;
  w.min = true;
  Anim.minimizeWin(w.el, () => {
    w.el.style.display = "none";
    w.el.classList.remove("minimizing");
    updateDockState();
    updateMenuBarAppName();
  });
}

function toggleMaximize(id) {
  const w = wins[id];
  if (!w) return;
  w.el.classList.toggle("maximized");
}

function setupDrag(el, id) {
  const tb = el.querySelector(".titlebar");
  tb.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button") || el.classList.contains("maximized") || isTouch) return;
    const r = el.getBoundingClientRect();
    const lx = e.clientX - r.left, ly = e.clientY - r.top;
    el.style.width = r.width + "px";
    el.style.height = r.height + "px";
    document.body.classList.add("grabbing");
    const mv = (ev) => {
      let x = ev.clientX - lx, y = ev.clientY - ly;
      x = Math.max(-r.width + 80, Math.min(innerWidth - 60, x));
      y = Math.max(0, Math.min(innerHeight - 40, y));
      el.style.left = x + "px";
      el.style.top = y + "px";
    };
    const up = () => {
      document.body.classList.remove("grabbing");
      removeEventListener("pointermove", mv);
      removeEventListener("pointerup", up);
    };
    addEventListener("pointermove", mv);
    addEventListener("pointerup", up);
  });
  // Double-click title bar to maximize
  tb.addEventListener("dblclick", (e) => {
    if (e.target.closest("button")) return;
    toggleMaximize(id);
  });
}

addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  // Close context menu first
  if (closeCtxMenu()) return;
  if (modal.classList.contains("open")) { closeModal(); return; }
  const top = [...$$("#winlayer .window")].sort((a, b) => (+b.style.zIndex || 0) - (+a.style.zIndex || 0))[0];
  if (top && top.dataset.id) closeWindow(top.dataset.id);
});
function closeAllWindows() { Object.keys(wins).forEach(closeWindow); }

/* ---------- CONTEXT MENU ---------- */
let activeCtxMenu = null;

// Global listener for closing context menu on outside click
document.addEventListener("pointerdown", (e) => {
  if (activeCtxMenu && !activeCtxMenu.contains(e.target)) closeCtxMenu();
});

function showCtxMenu(x, y, items) {
  closeCtxMenu();
  const m = document.createElement("div");
  m.className = "ctx-menu";
  items.forEach(it => {
    if (it === "---") {
      m.innerHTML += '<div class="ctx-sep"></div>';
    } else {
      const d = document.createElement("div");
      d.className = "ctx-item" + (it.disabled ? " disabled" : "");
      d.textContent = it.label;
      d.onclick = () => { closeCtxMenu(); if (it.action) it.action(); };
      m.appendChild(d);
    }
  });
  // Position — keep in viewport
  document.body.appendChild(m);
  const rect = m.getBoundingClientRect();
  if (x + rect.width > innerWidth) x = innerWidth - rect.width - 8;
  if (y + rect.height > innerHeight) y = innerHeight - rect.height - 8;
  m.style.left = Math.max(4, x) + "px";
  m.style.top = Math.max(4, y) + "px";
  
  // Defer setting activeCtxMenu slightly so the current pointerdown doesn't immediately close it
  setTimeout(() => { activeCtxMenu = m; }, 10);
}

function closeCtxMenu() {
  if (!activeCtxMenu) return false;
  activeCtxMenu.remove();
  activeCtxMenu = null;
  return true;
}

/* ---------- MENU BAR ---------- */
let activeAppName = "Finder";
function updateMenuBarAppName() {
  const appEl = document.querySelector("#menubar .mb-app-name");
  if (!appEl) return;
  // Find topmost non-minimized window
  const topWin = Object.values(wins)
    .filter(w => !w.min && w.el?.parentNode)
    .sort((a, b) => (+b.el.style.zIndex || 0) - (+a.el.style.zIndex || 0))[0];
  activeAppName = topWin ? topWin.title : "Finder";
  appEl.textContent = activeAppName;
}

/* ---------- DOCK ---------- */
const DOCK_APPS = ["FILES","MEMORIES","PHOTOS","NOTES","VIDEOS","MUSIC","MESSAGES","ABOUT","GAME"];
const dockContainer = document.createElement("div");
dockContainer.id = "dock-apps";
dockContainer.style.cssText = "display:flex;align-items:center;gap:2px;";

function buildDock() {
  const taskbar = $("#taskbar");
  dockContainer.innerHTML = "";
  DOCK_APPS.forEach(name => dockContainer.appendChild(createDockItem(name)));
  taskbar.insertBefore(dockContainer, taskbar.firstChild);
}

function createDockItem(name) {
  const item = document.createElement("div");
  item.className = "dock-item";
  item.dataset.app = name;
  const svgStr = ICONS[name]?.svg?.replace(/width="40" height="40"/g, 'width="28" height="28"') || '';
  item.innerHTML = `${svgStr}<span class="dock-label">${name[0]+name.slice(1).toLowerCase()}</span><span class="dock-dot"></span>`;
  item.onclick = () => {
    sfx.click();
    if (wins[name]) {
      const w = wins[name];
      if (w.min) { w.min = false; w.el.style.display = "flex"; Anim.restoreWin(w.el); focusWin(name); }
      else if (+w.el.style.zIndex === zTop) minimizeWindow(name);
      else focusWin(name);
    } else {
      openApp(name);
    }
  };
  // Context menu on dock items
  item.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    const isOpen = !!wins[name];
    showCtxMenu(e.clientX, e.clientY, [
      { label: "Open", action: () => launchApp(name) },
      "---",
      { label: isOpen ? "Close" : "Close", disabled: !isOpen, action: () => closeWindow(name) },
    ]);
  });
  return item;
}

function addDockApp(name) {
  if (dockContainer.querySelector(`[data-app="${name}"]`)) { updateDockState(); return; }
  if (!dockContainer.querySelector('.dock-sep')) {
    const sep = document.createElement("div"); sep.className = "dock-sep"; dockContainer.appendChild(sep);
  }
  dockContainer.appendChild(createDockItem(name));
  updateDockState();
}

function updateDockState() {
  dockContainer.querySelectorAll(".dock-item").forEach(item => {
    const name = item.dataset.app;
    const w = wins[name];
    if (w) {
      item.classList.add("active");
      if (!w.min) item.classList.toggle("focused", +w.el.style.zIndex === zTop);
      else item.classList.remove("focused");
    } else {
      item.classList.remove("active","focused");
    }
  });
}

/* ---------- DESKTOP ICONS ---------- */
const ICONS = {
  MEMORIES:{c:"#f0a05a",svg:`<svg width="40" height="40" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="1" y="2" width="14" height="12" rx="2" fill="#f0a05a"/><rect x="3" y="4" width="10" height="8" fill="#1c2b45"/><rect x="4" y="7" width="3" height="3" fill="#ffd98a"/><rect x="5" y="6" width="5" height="1" fill="#8fa0c5"/><rect x="9" y="8" width="2" height="2" fill="#47d97f"/></svg>`},
  PHOTOS:{c:"#6fd3d8",svg:`<svg width="40" height="40" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="2" y="2" width="12" height="12" rx="2" fill="#e9e2cc"/><rect x="4" y="4" width="8" height="7" fill="#1c2b45"/><rect x="5" y="6" width="2" height="2" fill="#ffd98a"/><rect x="6" y="8" width="4" height="1" fill="#6fd3d8"/><rect x="4" y="11" width="8" height="1" fill="#8fa0c5"/></svg>`},
  NOTES:{c:"#f4f0e6",svg:`<svg width="40" height="40" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="3" y="1" width="10" height="14" rx="1" fill="#f4f0e6"/><rect x="5" y="4" width="6" height="1" fill="#2b2620"/><rect x="5" y="6" width="6" height="1" fill="#6f6754"/><rect x="5" y="8" width="6" height="1" fill="#6f6754"/><rect x="5" y="10" width="4" height="1" fill="#6f6754"/></svg>`},
  VIDEOS:{c:"#ff9ecb",svg:`<svg width="40" height="40" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="1" y="3" width="14" height="10" rx="2" fill="#2b2620"/><rect x="3" y="5" width="7" height="6" fill="#1c2b45"/><rect x="5" y="6" width="2" height="2" fill="#ff9ecb"/><polygon points="11,6 14,5 14,11 11,10" fill="#6fd3d8"/></svg>`},
  MUSIC:{c:"#47d97f",svg:`<svg width="40" height="40" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="1" y="3" width="14" height="10" rx="2" fill="#2b2620"/><circle cx="5" cy="10" r="2" fill="#47d97f"/><rect x="6" y="4" width="1" height="6" fill="#47d97f"/><rect x="10" y="5" width="1" height="5" fill="#6fd3d8"/><rect x="10" y="5" width="3" height="1" fill="#6fd3d8"/></svg>`},
  MESSAGES:{c:"#f0c060",svg:`<svg width="40" height="40" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="1" y="4" width="14" height="9" rx="1" fill="#f0c060"/><polygon points="1,4 8,10 15,4" fill="#2b2620"/><rect x="3" y="6" width="10" height="5" fill="#f0c060"/></svg>`},
  FILES:{c:"#cfc6ae",svg:`<svg width="40" height="40" viewBox="0 0 16 16" shape-rendering="crispEdges"><path d="M1 4h5l1 2h8v8H1z" fill="#6366f1"/><rect x="2" y="7" width="12" height="5" fill="#818cf8"/></svg>`},
  ABOUT:{c:"#8fa0c5",svg:`<svg width="40" height="40" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="2" y="2" width="12" height="12" rx="2" fill="#1c2b45"/><rect x="7" y="4" width="2" height="5" fill="#e8ecf5"/><rect x="7" y="10" width="2" height="2" fill="#e8ecf5"/></svg>`},
  FINAL:{c:"#ff9ecb",svg:`<svg width="40" height="40" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="2" y="2" width="12" height="12" rx="2" fill="#2b0f1e" stroke="#ff9ecb"/><rect x="4" y="4" width="3" height="3" fill="#ff9ecb"/><rect x="9" y="4" width="3" height="3" fill="#ff9ecb"/><rect x="4" y="9" width="8" height="2" fill="#ff9ecb"/></svg>`},
  GAME:{c:"#47d97f",svg:`<svg width="40" height="40" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="2" y="4" width="12" height="8" rx="2" fill="#1c2b45"/><rect x="4" y="6" width="2" height="4" fill="#47d97f"/><rect x="3" y="7" width="4" height="2" fill="#47d97f"/><circle cx="11" cy="7" r="1" fill="#ff9ecb"/><circle cx="13" cy="9" r="1" fill="#6fd3d8"/></svg>`},
};
const DESKTOP_ICONS = ["MEMORIES","PHOTOS","NOTES","VIDEOS","MUSIC","MESSAGES","FILES","ABOUT"];
const iconBox = $("#icons");
const APP = {};

function launchApp(name) {
  if (wins[name]) {
    const w = wins[name];
    if (w.min) {
      w.min = false;
      w.el.style.display = "flex";
      Anim.restoreWin(w.el);
    }
    focusWin(name);
  } else {
    openApp(name);
  }
}

function openApp(name) {
  if (name === "GAME" && APP.GAME) { APP.GAME(); return; }
  APP[name] && APP[name]();
}

function buildDesktopIcons() {
  iconBox.innerHTML = "";
  [...DESKTOP_ICONS, "GAME"].forEach(name => {
    const d = document.createElement("div");
    d.className = "icon" + (name === "GAME" ? " final" : "");
    d.id = "icon-" + name;
    d.dataset.app = name;
    d.tabIndex = 0;
    d.setAttribute("role","button");
    d.innerHTML = `${ICONS[name].svg}<div class="lbl">${name[0]+name.slice(1).toLowerCase()}</div>`;
    d.addEventListener("click", () => {
      $$(".icon").forEach(i => i.classList.remove("sel"));
      d.classList.add("sel");
      sfx.click();
      if (isTouch) launchApp(name);
    });
    d.addEventListener("dblclick", () => launchApp(name));
    d.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); launchApp(name); } });
    // Right-click context menu
    d.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      $$(".icon").forEach(i => i.classList.remove("sel"));
      d.classList.add("sel");
      const isOpen = !!wins[name];
      showCtxMenu(e.clientX, e.clientY, [
        { label: "Open", action: () => launchApp(name) },
        "---",
        { label: isOpen ? "Quit " + name[0]+name.slice(1).toLowerCase() : "Quit", disabled: !isOpen, action: () => closeWindow(name) },
      ]);
    });
    iconBox.appendChild(d);
  });
}

/* Clock */
function updateClock() {
  const d = new Date();
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const h = d.getHours(), m = String(d.getMinutes()).padStart(2,"0");
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  const el = document.getElementById("clock");
  if (el) el.textContent = `${days[d.getDay()]} ${months[d.getMonth()]} ${d.getDate()}  ${h12}:${m} ${ampm}`;
}
updateClock();
setInterval(updateClock, 1000);

function applyUserToUI() {}
function buildStartMenu() {}

/* ---------- MODAL ---------- */
const modal = $("#modal"), modalwin = $("#modalwin");
function openModal(html) {
  modalwin.innerHTML = html;
  modal.classList.add("open");
  modalwin.style.zIndex = ++zTop;
  modalwin.classList.add("settled");
  const tb = modalwin.querySelector(".titlebar");
  if (tb) tb.querySelector("[data-a=close]").onclick = closeModal;
}
function closeModal() { modal.classList.remove("open"); }
modal.addEventListener("pointerdown", (e) => { if (e.target === modal) closeModal(); });

/* ---------- DYNAMIC WALLPAPER ---------- */
function initWallpaper() {
  const video = document.getElementById("wall-video");
  if (!video) return;
  video.play().catch(() => {
    // Autoplay blocked — fall back to canvas wallpaper
    video.style.display = "none";
    drawWall();
  });
  video.addEventListener("error", () => {
    video.style.display = "none";
    drawWall();
  });
  // Enforce infinite loop manually in case the loop attribute fails
  video.addEventListener("ended", () => {
    video.currentTime = 0;
    video.play().catch(()=>{});
  });
// Reduce motion: pause the video
  if (reduced) { video.pause(); video.style.display = "none"; drawWall(); }
}

/* ---------- INTERACTIVE MENU BAR ---------- */
let activeMenuBtn = null;
function handleMenuClick(btn, items) {
  if (activeCtxMenu && activeMenuBtn === btn) {
    closeCtxMenu();
    return;
  }
  sfx.click();
  const rect = btn.getBoundingClientRect();
  showCtxMenu(rect.left, rect.bottom + 4, items);
  activeMenuBtn = btn;
}

const origCloseCtxMenu = closeCtxMenu;
closeCtxMenu = function() {
  origCloseCtxMenu();
  activeMenuBtn = null;
};

function initMenuBar() {
  const appleBtn = document.querySelector(".mb-apple");
  const appNameBtn = document.querySelector(".mb-app-name");
  const fileBtn = document.evaluate("//span[contains(@class, 'mb-menu-item') and contains(text(), 'File')]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  const editBtn = document.evaluate("//span[contains(@class, 'mb-menu-item') and contains(text(), 'Edit')]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  const viewBtn = document.evaluate("//span[contains(@class, 'mb-menu-item') and contains(text(), 'View')]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

  if (appleBtn) {
    appleBtn.onclick = () => handleMenuClick(appleBtn, [
      { label: "About This PC", action: () => openApp("ABOUT") },
      "---",
      { label: "System Preferences...", disabled: true },
      { label: "Restart", action: () => location.reload() }
    ]);
  }
  
  if (appNameBtn) {
    appNameBtn.style.cursor = "pointer";
    appNameBtn.onclick = () => {
      const appTitle = appNameBtn.textContent || "Finder";
      handleMenuClick(appNameBtn, [
        { label: `About ${appTitle}`, disabled: true },
        "---",
        { label: `Preferences...`, disabled: true },
        "---",
        { label: `Quit ${appTitle}`, action: () => {
            if (appTitle === "Finder") return;
            // close highest window
            const top = [...$$("#winlayer .window")].sort((a, b) => (+b.style.zIndex || 0) - (+a.style.zIndex || 0))[0];
            if (top && top.dataset.id) closeWindow(top.dataset.id);
        }}
      ]);
    };
  }

  if (fileBtn) {
    fileBtn.onclick = () => handleMenuClick(fileBtn, [
      { label: "New Folder", action: () => toast("Folder created on desktop") },
      { label: "Open...", disabled: true },
      "---",
      { label: "Close Window", action: () => {
          const top = [...$$("#winlayer .window")].sort((a, b) => (+b.style.zIndex || 0) - (+a.style.zIndex || 0))[0];
          if (top && top.dataset.id) closeWindow(top.dataset.id);
      }}
    ]);
  }

  if (editBtn) {
    editBtn.onclick = () => handleMenuClick(editBtn, [
      { label: "Undo", disabled: true },
      { label: "Redo", disabled: true },
      "---",
      { label: "Cut", action: () => toast("Cut") },
      { label: "Copy", action: () => toast("Copied") },
      { label: "Paste", action: () => toast("Pasted") },
      { label: "Select All", action: () => toast("All selected") }
    ]);
  }

  if (viewBtn) {
    viewBtn.onclick = () => handleMenuClick(viewBtn, [
      { label: "Reload", action: () => location.reload() },
      { label: "Enter Fullscreen", action: () => {
          if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{});
          else document.exitFullscreen().catch(()=>{});
      }}
    ]);
  }
}

// Call on startup
setTimeout(initMenuBar, 500);
