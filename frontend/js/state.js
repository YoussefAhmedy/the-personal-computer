"use strict";
/* ---------- personal content ----------
   These used to be the hardcoded ✎ EDIT ZONE constants. Now they start
   empty and are filled in by loadContent() during boot, right after the
   access code is accepted — everything downstream (window manager, each
   app) reads from these same names exactly as it did before, so almost
   none of that code needed to change. */

let USER = "";
let FINALE_HEADING = "HAPPY BIRTHDAY";
let FINAL_MESSAGE = "";
let MEMORIES = [];
let PHOTOS = [];
let NOTES = [];
let VIDEOS = [];
let TRACKS = [];
let MESSAGES = [];
let SECRET_MESSAGE = { title: "", body: "" };

// Chiptune note durations are stored as "beats"; this is seconds-per-beat.
const STEP = 0.17;

// Generic system chatter — not personal, so it stays static here rather
// than round-tripping through the database.
const BOOT_LINES_PRE = [
  ["PERSONAL COMPUTER  BIOS v2.11", "dim"],
  ["--------------------------------", "dim"],
  ["MEMORY CHECK ........ 640K OK", ""],
  ["DISPLAY ............. OK", ""],
  ["AUDIO ............... OK", ""],
  ["USER ARCHIVE ........ FOUND", ""],
  ["PERSONAL FILES ...... FOUND", ""],
  ["PHOTO DATABASE ...... FOUND", ""],
  ["MEMORIES ............ FOUND", ""],
  ["", ""],
];
const BOOT_LINES_POST = [
  ["LOADING PERSONAL ENVIRONMENT...", "dim"],
  ["ACCESS GRANTED", ""],
  ["", ""],
  ["WELCOME.", ""],
];
const FINALE_TERM = [
  "> SPECIAL EVENT DETECTED...",
  "> SCANNING PERSONAL ARCHIVE... 100%",
  "> TODAY IS NOT A NORMAL DAY.",
  "",
  "> INCOMING SYSTEM MESSAGE:",
];

let contentLoaded = false;

/** Fetches every content collection in one round trip and fills the
 * module-level arrays above. Safe to call more than once (e.g. a
 * returning visitor who skips the passcode prompt still calls this). */
async function loadContent() {
  const data = await Api.bundle();
  USER = data.site.user || "GUEST";
  FINALE_HEADING = data.site.finaleHeading || "HAPPY BIRTHDAY";
  FINAL_MESSAGE = data.site.finalMessage || "";
  MEMORIES = data.memories || [];
  PHOTOS = data.photos || [];
  NOTES = data.notes || [];
  VIDEOS = data.videos || [];
  TRACKS = data.tracks || [];
  MESSAGES = data.messages || [];
  SECRET_MESSAGE = data.secret || { title: "", body: "" };
  contentLoaded = true;
  return data;
}
