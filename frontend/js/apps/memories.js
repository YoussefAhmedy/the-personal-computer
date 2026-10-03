"use strict";
/* ---------- APP: MEMORIES — Timeline ---------- */
let memCat = "all";
const MEM_CATS = () => {
  const cats = new Set();
  MEMORIES.forEach(m => {
    if (m.tags && m.tags.length) cats.add(m.tags[0]);
  });
  return ["all", ...cats];
};

function renderMemories() {
  const list = wins["MEMORIES"]?.el.querySelector(".memlist");
  if (!list) return;
  list.innerHTML = MEMORIES.map((m, i) => {
    const cat = (m.tags && m.tags[0]) || "general";
    return `<div class="memcard${m.secret ? " secretcard" : ""}" data-i="${i}" data-c="${cat}">
      ${mediaOrArtHTML(m.media, m.art, i + 1, m.title)}
      <div class="mem-info">
        <div class="mid">${esc(m.id)} · ${esc(cat).toUpperCase()} / ${esc(m.date)}</div>
        <div class="mt">${esc(m.title)}</div>
        <div class="mcap"${isRtlText(m.caption) ? ' dir="rtl"' : ''}>${esc(m.caption)}</div>
      </div></div>`;
  }).join("");
  activateArt(list);
  if (!MEMORIES.length) list.innerHTML = `<div class="wempty">nothing filed under this category yet.</div>`;
  list.querySelectorAll(".memcard").forEach(el => el.addEventListener("click", () => memDetail(+el.dataset.i)));
  filterMemories();
}

function filterMemories() {
  const list = wins["MEMORIES"]?.el.querySelector(".memlist");
  if (!list) return;
  let vis = 0;
  list.querySelectorAll(".memcard").forEach(el => {
    const show = memCat === "all" || el.dataset.c === memCat;
    el.style.display = show ? "flex" : "none";
    if (show) vis++;
  });
  let empty = list.querySelector(".wempty-cat");
  if (!vis) {
    if (!empty) {
      empty = document.createElement("div");
      empty.className = "wempty wempty-cat";
      empty.textContent = "nothing filed under this category yet.";
      list.appendChild(empty);
    }
    empty.style.display = "block";
  } else if (empty) {
    empty.style.display = "none";
  }
}

function memDetail(i) {
  const m = MEMORIES[i];
  const isUpdate = modal.classList.contains("open");
  const html = `<div class="titlebar"><span class="tb-btns"><button data-a="close" aria-label="Close"></button><button data-a="min" aria-label="Minimize"></button><button data-a="max" aria-label="Zoom"></button></span>
    <span class="tb-title">${esc(m.id)}</span><span class="tb-spacer"></span></div>
    <div class="wbody" style="overflow:auto"><div class="mphoto"><div class="shot">${mediaOrArtHTML(m.media, m.art, i + 1, m.title)}</div>
    <div class="mmeta"><div class="fid">${esc(m.id)}</div><div class="ft">${esc(m.title)}</div>
    <div class="fd"${isRtlText(m.caption) ? ' dir="rtl"' : ""}>${esc(m.caption) || "no description."}</div>
    <div class="ftags">DATE: ${esc(m.date)}<br>CATEGORY: ${esc(((m.tags && m.tags[0]) || "").toUpperCase())}<br>FORMAT: ${m.media ? "UPLOADED" : "PIXEL/96x72"}</div></div></div>
    <div class="mfoot"><button class="pbtn" id="mem-prev">◀ Prev</button><span style="font-size:12px;color:var(--ink-tertiary)">do you remember this?</span>
    <span><button class="pbtn" id="mem-next">Next ▶</button> <button class="pbtn" id="mem-close" style="background:var(--tl-close);color:#fff">Close</button></span></div></div>`;
  
  if (isUpdate) {
    modalwin.innerHTML = html;
  } else {
    openModal(html);
  }
  activateArt(modalwin);
  sfx.open();
  mark("mem" + i);
  $("#mem-close").onclick = closeModal;
  $("#mem-prev").onclick = () => memDetail((i - 1 + MEMORIES.length) % MEMORIES.length);
  $("#mem-next").onclick = () => memDetail((i + 1) % MEMORIES.length);
}

APP.MEMORIES = () => {
  if (!MEMORIES.length) {
    openWindow("MEMORIES", "MEMORIES", `<div class="wempty">no memories filed yet.</div>`, {});
    return;
  }
  const cats = MEM_CATS();
  openWindow(
    "MEMORIES",
    "MEMORIES",
    `<div class="memwrap"><div class="memnav">${cats.map(c => `<div class="cat${c === "all" ? " on" : ""}" data-c="${c}">${c[0].toUpperCase() + c.slice(1)}</div>`).join("")}</div>
    <div class="memlist"></div></div>`,
    { pctW: 0.58, pctH: 0.75, status: "ITEMS: " + MEMORIES.length, status2: "TIMELINE VIEW" }
  );
  renderMemories();
  const win = wins["MEMORIES"].el;
  win.querySelectorAll(".cat").forEach(b => b.onclick = () => {
    if (memCat === b.dataset.c) return; // Prevent re-triggering active
    sfx.click();
    memCat = b.dataset.c;
    win.querySelectorAll(".cat").forEach(x => x.classList.toggle("on", x === b));
    filterMemories();
  });
};
