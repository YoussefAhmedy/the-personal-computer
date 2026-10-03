"use strict";
/* ---------- APP: ABOUT ---------- */
APP.ABOUT = () => {
  openWindow(
    "ABOUT",
    "ABOUT",
    `<div class="aboutwrap"><b style="font-family:var(--px);font-size:10px;letter-spacing:.1em">THE PERSONAL COMPUTER</b><br><br>
  This machine belongs to: <b>${esc(USER)}</b><br>
  Manufactured: somewhere between a memory and a dream<br>
  Condition: full of someone<br><br>
  <pre>OS ......... MEMORY/OS v2.11
CPU ........ HEART-88 @ forever MHz
RAM ........ 640K (should be enough)
DRIVE ...... 1 floppy disk of feelings
STATUS ..... USER ONLINE ●</pre><br>
  <span style="color:var(--ink-tertiary);font-size:12px">TIP — double-click icons to open them. drag windows by their title bars. press ESC to close. right-click for options. something tiny blinks near the dock...</span></div>`,
    { pctW: 0.42, pctH: 0.62, status: "SYSTEM INFO", status2: "ALL SYSTEMS NOSTALGIC" }
  );
};

/* ---------- SECRET ---------- */
let secretFound = false;
$("#hiddendot").addEventListener("click", () => {
  if (secretFound) { openSecret(); return; }
  secretFound = true;
  sfx.secret();
  toast("⚠ HIDDEN FILE UNLOCKED: /SECRET");
  const fw = wins["FILES"];
  if (fw && curFolder !== "root") { curFolder = "SECRET"; renderFiles(); }
  openSecret();
});
function openSecret() {
  if (!secretFound) secretFound = true;
  mark("secret");
  openWindow(
    "SECRET",
    "DO NOT OPEN",
    `<div class="secretwrap"><h3>▓▒░ YOU FOUND SOMETHING ░▒▓</h3>
  ${(SECRET_MESSAGE.body || "").split("\n").map(l => (l ? `<div>${esc(l)}</div>` : "<div>&nbsp;</div>")).join("")}
  <div class="glitchline">// the machine has been waiting.</div>
  <button class="pbtn pink" id="run-final">▶ RUN FINAL SEQUENCE</button></div>`,
    { pctW: 0.42, pctH: 0.55, status: "CLASSIFICATION: EYES ONLY", status2: "TRACE: NONE" }
  );
  wins["SECRET"].el.querySelector("#run-final").onclick = () => {
    sfx.secret();
    if (APP.GAME) { closeWindow("SECRET"); APP.GAME(); }
    else startFinale();
  };
}
