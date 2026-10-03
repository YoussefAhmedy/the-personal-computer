"use strict";
/* ---------- APP: MESSAGES — Envelope/letter reveal ---------- */
let msgSel = -1;
function showMsg(i) {
  const m = MESSAGES[i], win = wins["MESSAGES"];
  if (!win) return;
  msgSel = i;
  win.el.querySelectorAll(".msgitem").forEach((x, j) => x.classList.toggle("on", j === i));
  const body = win.el.querySelector(".msgbody");
  mark("msg" + i);

  body.innerHTML = `<div class="msg-special">
    <div class="msg-envelope" id="msg-env">
      <div class="msg-envelope-body">
        <div class="msg-envelope-flap"></div>
        <div class="msg-envelope-seal">♥</div>
      </div>
    </div>
    <div class="msg-hint">click the envelope</div>
    <div class="msg-letter" id="msg-letter">
      <div class="msg-letter-content">
        <div class="msg-from">${esc(m.from || m.from_label || "unknown sender")}</div>
        <div class="msg-subject">${esc(m.subject || m.title || "")}</div>
        <div class="msg-text"${isRtlText(m.body) ? ' dir="rtl"' : ''}>${esc(m.body)}</div>
      </div>
    </div>
  </div>`;
  
  const env = body.querySelector("#msg-env");
  const letter = body.querySelector("#msg-letter");
  
  // Add hover effect if any is needed (CSS handles transform mostly, but we can ensure it feels interactive)
  env.onmouseenter = () => { if (!env.classList.contains("opened")) env.style.transform = "translateY(-5px)"; };
  env.onmouseleave = () => { if (!env.classList.contains("opened")) env.style.transform = "none"; };
  
  env.onclick = () => {
    if (env.classList.contains("opened")) return;
    sfx.open();
    env.style.transform = "none";
    env.classList.add("opened");
    letter.classList.add("revealed");
    const hint = body.querySelector(".msg-hint");
    if (hint) hint.style.display = "none";
  };
}

APP.MESSAGES = () => {
  if (!MESSAGES.length) {
    openWindow("MESSAGES", "MESSAGES", `<div class="wempty">no messages filed yet.</div>`, {});
    return;
  }
  openWindow(
    "MESSAGES",
    "MESSAGES",
    `<div class="msgwrap"><div class="msgside">${MESSAGES.map((m, i) =>
      `<div class="msgitem" data-i="${i}"><b>${esc(m.id)}</b><div class="msub">${esc(m.subject || m.title)}</div></div>`
    ).join("")}</div><div class="msgbody"><div class="msg-special">
      <div class="msg-envelope"><div class="msg-envelope-body"><div class="msg-envelope-flap"></div><div class="msg-envelope-seal">♥</div></div></div>
      <div class="msg-hint">select a message to read</div>
    </div></div></div>`,
    { pctW: 0.55, pctH: 0.68, status: "INBOX: " + MESSAGES.length + " MESSAGES", status2: "ENCRYPTION: HEART-256" }
  );
  const win = wins["MESSAGES"].el;
  win.querySelectorAll(".msgitem").forEach(el => el.onclick = () => {
    sfx.click();
    showMsg(+el.dataset.i);
  });
  showMsg(0);
};
