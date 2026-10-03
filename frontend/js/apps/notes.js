"use strict";
/* ---------- APP: NOTES — Notebook style ---------- */
let noteTimer = null;
function showNote(i) {
  const n = NOTES[i], win = wins["NOTES"];
  if (!win) return;
  win.el.querySelectorAll(".nitem").forEach((x, j) => x.classList.toggle("on", j === i));
  const body = win.el.querySelector(".notebody");
  body.innerHTML = `<div class="ntitle">${esc(n.title)}</div><div class="ndate">${esc(n.date)}</div><div class="ntext" dir="${n.rtl ? "rtl" : "ltr"}"></div>`;
  const t = body.querySelector(".ntext");
  clearInterval(noteTimer);
  mark("note" + i);
  if (reduced) { t.textContent = n.body; return; }
  t.classList.add("typing");
  let k = 0;
  noteTimer = setInterval(() => {
    if (k >= n.body.length) { clearInterval(noteTimer); t.classList.remove("typing"); return; }
    t.textContent += n.body[k++];
    if (soundOn && k % 3 === 0) sfx.type();
  }, 22);
}
APP.NOTES = () => {
  if (!NOTES.length) {
    openWindow("NOTES", "NOTES", `<div class="wempty">no notes filed yet.</div>`, {});
    return;
  }
  openWindow(
    "NOTES",
    "NOTES",
    `<div class="noteswrap"><div class="noteside">${NOTES.map((n, i) => `<div class="nitem" data-i="${i}">${esc(n.id)}<br><span style="opacity:.5;font-size:10px">${esc(n.title).slice(0, 18)}</span></div>`).join("")}</div>
   <div class="notebody"><div class="ntitle">select a note</div><div class="ndate">—</div><div class="ntext" style="color:var(--ink-tertiary)">nothing loaded.</div></div></div>`,
    { pctW: 0.50, pctH: 0.65, status: "EDITOR: READ-ONLY", status2: "AUTOSAVE: ON" }
  );
  const win = wins["NOTES"].el;
  win.querySelectorAll(".nitem").forEach(el => el.onclick = () => {
    sfx.click();
    showNote(+el.dataset.i);
  });
  showNote(0);
};
