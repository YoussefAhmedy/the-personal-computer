"use strict";
/* ---------- APP: PHOTOS ---------- */
let phCat = "all";
const PHOTO_CATS = ["all", "trips", "special", "funny", "hidden"];

function renderPhotos() {
  const g = $("#pgrid");
  if (!g) return;
  g.innerHTML = PHOTOS.map((p, i) =>
    phCat === "all" || p.cat === phCat
      ? `<div class="phitem" data-i="${i}">${mediaOrArtHTML(p.media, p.art, i + 11, p.title)}<div class="pl">${esc(p.id)} · ${esc(p.date)}</div></div>`
      : ""
  ).join("");
  activateArt(g);
  g.querySelectorAll(".phitem").forEach(el => el.addEventListener("click", () => photoDetail(+el.dataset.i)));
  if (!g.children.length) g.innerHTML = `<div class="wempty">nothing filed under this category yet.</div>`;
}
function photoDetail(i) {
  const p = PHOTOS[i];
  const isUpdate = modal.classList.contains("open");
  const html = `<div class="titlebar"><span class="tb-btns"><button data-a="close" aria-label="Close"></button><button data-a="min" aria-label="Minimize"></button><button data-a="max" aria-label="Zoom"></button></span>
    <span class="tb-title">${esc(p.id)}</span><span class="tb-spacer"></span></div>
   <div class="wbody" style="overflow:auto"><div class="mphoto"><div class="shot">${mediaOrArtHTML(p.media, p.art, i + 11, p.title)}</div>
    <div class="mmeta"><div class="fid">${esc(p.id)}</div><div class="ft">${esc(p.title)}</div>
    <div class="fd"${isRtlText(p.desc) ? ' dir="rtl"' : ""}>${esc(p.desc) || "no comment was left."}</div>
    <div class="ftags">DATE: ${esc(p.date)}<br>FOLDER: /${esc((p.cat || "").toUpperCase())}<br>FORMAT: ${p.media ? "UPLOADED PHOTO" : "PIXEL/96x72"}</div></div></div>
   <div class="mfoot"><button class="pbtn" id="p-prev">◀ Prev</button><span style="font-size:12px;color:var(--ink-tertiary)">do you remember this?</span>
   <span><button class="pbtn" id="p-next">Next ▶</button> <button class="pbtn" id="p-close" style="background:var(--tl-close);color:#fff">Close</button></span></div></div>`;
  
  if (isUpdate) {
    modalwin.innerHTML = html;
  } else {
    openModal(html);
  }
  activateArt(modalwin);
  sfx.open();
  mark("ph" + i);
  $("#p-close").onclick = closeModal;
  $("#p-prev").onclick = () => photoDetail((i - 1 + PHOTOS.length) % PHOTOS.length);
  $("#p-next").onclick = () => photoDetail((i + 1) % PHOTOS.length);
}
APP.PHOTOS = () => {
  if (!PHOTOS.length) {
    openWindow("PHOTOS", "PHOTOS", `<div class="wempty">no photos filed yet.</div>`, {});
    return;
  }
  openWindow(
    "PHOTOS",
    "PHOTOS",
    `<div class="photobar">${PHOTO_CATS.map(c => `<button class="pcat" data-c="${c}">${c[0].toUpperCase() + c.slice(1)}</button>`).join("")}<span style="margin-left:auto;font-size:11px;color:var(--ink-tertiary)">ARCHIVE VIEW: TILED</span></div>
   <div class="photogrid" id="pgrid"></div>`,
    { pctW: 0.55, pctH: 0.70, status: "STORAGE: 1.44MB FLOPPY", status2: "INDEXED" }
  );
  const win = wins["PHOTOS"].el;
  win.querySelectorAll(".pcat").forEach(b => {
    if (b.dataset.c === "all") b.classList.add("on");
    b.onclick = () => {
      sfx.click();
      phCat = b.dataset.c;
      win.querySelectorAll(".pcat").forEach(x => x.classList.toggle("on", x === b));
      renderPhotos();
    };
  });
  renderPhotos();
};
