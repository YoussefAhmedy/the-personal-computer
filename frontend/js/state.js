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
  const data = {
    site: {
      user: "GUEST",
      finaleHeading: "HAPPY BIRTHDAY",
      finalMessage: "I built this little world\njust so you could open it\nand find a piece of our memories\ninside.\n\nEvery photo. Every note. Every little moment.\nAll of it belongs here.\n\n— made for you, with love"
    },
    memories: [
      { ext_id: "MEMORY_001", date_label: "SUMMER / 2024", title: "The Long Drive", caption: "One of those days I wish I could replay forever.", tags: ["trip", "road"], art_type: "road", is_secret: false },
      { ext_id: "MEMORY_002", date_label: "RAIN / 2023", title: "Window Rain", caption: "فاكر اليوم ده؟\nI still remember every little detail.", tags: ["cozy", "rain"], art_type: "rain", is_secret: false },
      { ext_id: "MEMORY_003", date_label: "MIDNIGHT / 2024", title: "Rooftop Talks", caption: "We stayed up until the sky turned pink and neither of us wanted to go home.", tags: ["night"], art_type: "night", is_secret: false },
      { ext_id: "MEMORY_004", date_label: "SPRING / 2025", title: "First Snow", caption: "You laughed so hard the cold didn't matter.", tags: ["winter"], art_type: "snow", is_secret: false },
      { ext_id: "MEMORY_005", date_label: "FOREVER / ???", title: ". . .", caption: "", tags: ["hidden"], art_type: "glitch", is_secret: true },
    ],
    photos: [
      { ext_id: "PHOTO_001", date_label: "06.2024", title: "Golden Hour", description: "Do you remember this?", category: "trips", art_type: "sunset" },
      { ext_id: "PHOTO_002", date_label: "03.2023", title: "Cloud Sea", description: "The sky looked fake that day.", category: "trips", art_type: "clouds" },
      { ext_id: "PHOTO_003", date_label: "11.2024", title: "City Lights", description: "We got completely lost. Worth it.", category: "special", art_type: "city" },
      { ext_id: "PHOTO_004", date_label: "08.2023", title: "Shoreline", description: "مية مية", category: "trips", art_type: "beach" },
      { ext_id: "PHOTO_005", date_label: "01.2025", title: "White Noise", description: "Everything was quiet.", category: "special", art_type: "snow" },
      { ext_id: "PHOTO_006", date_label: "09.2023", title: "Static Bloom", description: "An accident. My favorite one.", category: "funny", art_type: "glitch" },
      { ext_id: "PHOTO_007", date_label: "05.2024", title: "Dune Song", description: "Hot, endless, perfect.", category: "trips", art_type: "desert" },
      { ext_id: "PHOTO_008", date_label: "??.????", title: "do not open", description: "", category: "hidden", art_type: "eyes" },
    ],
    notes: [
      { ext_id: "NOTE_001", title: "a small idea", date_label: "SOME NIGHT, LATE", body: "To you,\n\nI wanted to make something that feels a little different...\n\nNot just another birthday page,\nbut a tiny world that belongs to you.", is_rtl: false },
      { ext_id: "NOTE_002", title: "ليكي", date_label: "ليلة متأخرة", body: "كنت عايز أعمل حاجة مختلفة السنة دي،\nحاجة لما تفتحيها تحسي إنك دخلتي عالم صغير معمول مخصوص ليكي.", is_rtl: true },
      { ext_id: "NOTE_003", title: "reasons", date_label: "TUESDAY", body: "Reason no. 47:\nyou turn boring Tuesdays into stories we retell for years.\n\nReason no. 48:\nstill counting.", is_rtl: false },
      { ext_id: "NOTE_004", title: "keep this safe", date_label: "DO NOT READ UNTIL YOUR BIRTHDAY", body: "One day we'll be old and we'll find this machine again,\nand we'll laugh at how small we thought forever was.", is_rtl: false },
    ],
    videos: [
      { ext_id: "VIDEO_001", file_label: "ROADTRIP_1998.REC", title: "roadtrip (recovered tape)", duration_seconds: 26, art_type: "road" },
      { ext_id: "VIDEO_002", file_label: "BIRTHDAY_EVE.REC", title: "the night before", duration_seconds: 22, art_type: "party" },
    ],
    tracks: [
      { ext_id: "TRACK_001", title: "our song", artist: "UNKNOWN ARTIST", art_type: "hearts", notes: [[523,1],[659,1],[784,1],[880,2],[784,1],[659,1],[587,1],[659,2],[0,1],[523,1],[659,1],[784,1],[1047,2],[880,1],[784,1],[698,1],[659,2]] },
      { ext_id: "TRACK_002", title: "midnight drive", artist: "UNKNOWN ARTIST", art_type: "night", notes: [[392,2],[440,1],[523,2],[587,1],[659,3],[0,1],[587,1],[523,1],[440,2],[392,1],[330,3],[0,2]] },
      { ext_id: "TRACK_003", title: "pink cassette", artist: "UNKNOWN ARTIST", art_type: "sunset", notes: [[659,1],[587,1],[523,1],[587,1],[659,2],[659,2],[587,2],[587,2],[659,2],[659,2],[523,1],[587,1],[659,3]] },
    ],
    messages: [
      { ext_id: "MSG_001", from_label: "YOU", subject: "Happy Birthday", body: "Another year,\nanother memory,\nanother reason to be grateful that you're here.", is_rtl: false },
      { ext_id: "MSG_002", from_label: "SYSTEM", subject: "untitled draft", body: "كل سنة وإنتِ أجمل جزء في الحكاية.", is_rtl: true },
      { ext_id: "MSG_003", from_label: "YOU", subject: "a promise", body: "I promise to keep collecting moments like this one —\nthe small, ordinary, perfect ones.", is_rtl: false },
      { ext_id: "MSG_004", from_label: "???", subject: "you weren't supposed to see this", body: "fine. you win.\ngo look at the last photo.\nthen come find me at the end.", is_rtl: false },
    ],
    secret: {
      title: "/SECRET/DO_NOT_OPEN.TXT",
      body: "You found something you weren't supposed to find.\n\nOf course you did. You always do.\n\nThis machine has been keeping something for you —\na message at the very end of everything.\n\nWhen you're ready, press the button."
    }
  };

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
