"use strict";
/* ---------- APP: FILES — Finder ---------- */
let curFolder = "root";
const FILE_FOLDERS = () => [
  { id: "root", label: "My Computer", icon: "💻" },
  { id: "Memories", label: "Memories", icon: "📁" },
  { id: "Photos", label: "Photos", icon: "📁" },
  { id: "Notes", label: "Notes", icon: "📁" },
  { id: "Videos", label: "Videos", icon: "📁" },
  { id: "Music", label: "Music", icon: "📁" },
  { id: "Messages", label: "Messages", icon: "📁" },
  { id: "SECRET", label: "Secret", icon: "🔒" },
];

function renderFiles() {
  const win = wins["FILES"];
  if (!win) return;
  const body = win.el.querySelector(".file-body");
  const path = win.el.querySelector(".filepath");
  const sideItems = win.el.querySelectorAll(".sidebar-item");
  sideItems.forEach(el => el.classList.toggle("active", el.dataset.f === curFolder));

  if (curFolder === "root") {
    path.textContent = "C:\\";
    const folders = FILE_FOLDERS().slice(1);
    body.innerHTML = `<div class="fgrid">${folders.map(f =>
      `<div class="fitem${f.id === "SECRET" ? " locked" : ""}" data-f="${f.id}">
        <svg width="42" height="36" viewBox="0 0 16 14" shape-rendering="crispEdges">
          <path d="M1 2h5l1 2h8v8H1z" fill="${f.id==='SECRET'?'#8fa0c5':'#6366f1'}"/>
          <rect x="2" y="5" width="12" height="5" fill="${f.id==='SECRET'?'#b0bcc8':'#818cf8'}"/>
        </svg><div class="fn">/${f.label.toUpperCase()}</div></div>`
    ).join("")}</div>`;
  } else if (curFolder === "SECRET") {
    path.textContent = "C:\\SECRET\\";
    if (typeof secretFound !== "undefined" && secretFound) {
      body.innerHTML = `<div class="fgrid"><div class="fitem" data-action="secret">
        <svg width="42" height="36" viewBox="0 0 16 14" shape-rendering="crispEdges">
          <rect x="2" y="1" width="12" height="12" fill="#ff9ecb" rx="1"/>
          <rect x="5" y="4" width="6" height="1" fill="#fff"/>
          <rect x="5" y="6" width="6" height="1" fill="#fff"/>
        </svg><div class="fn">SECRET.TXT</div></div></div>`;
    } else {
      body.innerHTML = `<div class="wempty">🔒 this folder is locked.</div>`;
    }
  } else {
    path.textContent = `C:\\${curFolder.toUpperCase()}\\`;
    const items = {
      Memories: MEMORIES, Photos: PHOTOS, Notes: NOTES,
      Videos: VIDEOS, Music: TRACKS, Messages: MESSAGES
    }[curFolder] || [];
    body.innerHTML = items.length ? `<div class="fgrid">${items.map((it, i) =>
      `<div class="fitem" data-action="${curFolder}" data-i="${i}">
        <svg width="42" height="36" viewBox="0 0 16 14" shape-rendering="crispEdges">
          <rect x="2" y="1" width="12" height="12" fill="#e0ddd6" rx="1"/>
          <rect x="4" y="4" width="8" height="1" fill="#6f6754"/>
          <rect x="4" y="6" width="6" height="1" fill="#6f6754"/>
        </svg><div class="fn">${esc(it.id || it.title || ("FILE_" + (i+1)))}</div></div>`
    ).join("")}</div>` : `<div class="wempty">this folder is empty.</div>`;
  }

  body.querySelectorAll(".fitem").forEach(el => {
    el.addEventListener("dblclick", () => {
      if (el.dataset.f) {
        if (el.dataset.f === "SECRET" && !(typeof secretFound !== "undefined" && secretFound)) {
          sfx.deny(); return;
        }
        sfx.click(); curFolder = el.dataset.f; renderFiles();
      } else if (el.dataset.action === "secret") {
        openSecret();
      } else if (el.dataset.action) {
        sfx.click();
        const appName = el.dataset.action.toUpperCase();
        if (APP[appName]) APP[appName]();
      }
    });
  });
}

APP.FILES = () => {
  curFolder = "root";
  const folders = FILE_FOLDERS();
  openWindow(
    "FILES",
    "MY COMPUTER",
    `<div class="filewrap"><div style="display:flex;flex:1;min-height:0">
      <div class="file-sidebar">
        <div class="sidebar-section">Favorites</div>
        ${folders.slice(0,1).map(f => `<div class="sidebar-item active" data-f="${f.id}"><span>${f.icon}</span> ${f.label}</div>`).join("")}
        <div class="sidebar-section">Folders</div>
        ${folders.slice(1).map(f => `<div class="sidebar-item" data-f="${f.id}"><span>${f.icon}</span> ${f.label}</div>`).join("")}
      </div>
      <div style="flex:1;display:flex;flex-direction:column;min-width:0">
        <div class="file-toolbar">
          <button class="nav-btn" id="file-back" aria-label="Back">◀</button>
          <button class="nav-btn" id="file-fwd" aria-label="Forward">▶</button>
          <div class="filepath">C:\\</div>
        </div>
        <div class="file-body"></div>
      </div>
    </div></div>`,
    { pctW: 0.58, pctH: 0.72, status: "DRIVE C:", status2: "FLOPPY A: EMPTY" }
  );
  const win = wins["FILES"].el;
  win.querySelectorAll(".sidebar-item").forEach(el => el.onclick = () => {
    if (el.dataset.f === "SECRET" && !(typeof secretFound !== "undefined" && secretFound)) { sfx.deny(); return; }
    sfx.click(); curFolder = el.dataset.f; renderFiles();
  });
  win.querySelector("#file-back").onclick = () => { if (curFolder !== "root") { sfx.click(); curFolder = "root"; renderFiles(); } };
  renderFiles();
};
