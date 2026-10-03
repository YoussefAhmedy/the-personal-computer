"use strict";

const bcrypt = require("bcryptjs");
const { db, init } = require("./index");
const config = require("../config");

const RESET = process.argv.includes("--reset");

// ---------------------------------------------------------------------
// This is the same content that used to live in the "✎ EDIT ZONE" at the
// top of the original single-file version, now seeded into the database
// so it can be edited from the admin console instead of by hand-editing
// source code. Feel free to edit these values directly too, then run
// `npm run seed:reset` once, before you ever open the admin console.
// ---------------------------------------------------------------------

const SITE = {
  user_name: "GUEST",
  finale_heading: "HAPPY BIRTHDAY",
  final_message:
    "I built this little world\njust so you could open it\nand find a piece of our memories\ninside.\n\n" +
    "Every photo. Every note. Every little moment.\nAll of it belongs here.\n\n— made for you, with love",
};

const MEMORIES = [
  { ext_id: "MEMORY_001", date_label: "SUMMER / 2024", title: "The Long Drive", caption: "One of those days I wish I could replay forever.", tags: ["trip", "road"], art_type: "road", is_secret: false },
  { ext_id: "MEMORY_002", date_label: "RAIN / 2023", title: "Window Rain", caption: "فاكر اليوم ده؟\nI still remember every little detail.", tags: ["cozy", "rain"], art_type: "rain", is_secret: false },
  { ext_id: "MEMORY_003", date_label: "MIDNIGHT / 2024", title: "Rooftop Talks", caption: "We stayed up until the sky turned pink and neither of us wanted to go home.", tags: ["night"], art_type: "night", is_secret: false },
  { ext_id: "MEMORY_004", date_label: "SPRING / 2025", title: "First Snow", caption: "You laughed so hard the cold didn't matter.", tags: ["winter"], art_type: "snow", is_secret: false },
  { ext_id: "MEMORY_005", date_label: "FOREVER / ???", title: ". . .", caption: "", tags: ["hidden"], art_type: "glitch", is_secret: true },
];

const PHOTOS = [
  { ext_id: "PHOTO_001", date_label: "06.2024", title: "Golden Hour", description: "Do you remember this?", category: "trips", art_type: "sunset" },
  { ext_id: "PHOTO_002", date_label: "03.2023", title: "Cloud Sea", description: "The sky looked fake that day.", category: "trips", art_type: "clouds" },
  { ext_id: "PHOTO_003", date_label: "11.2024", title: "City Lights", description: "We got completely lost. Worth it.", category: "special", art_type: "city" },
  { ext_id: "PHOTO_004", date_label: "08.2023", title: "Shoreline", description: "مية مية", category: "trips", art_type: "beach" },
  { ext_id: "PHOTO_005", date_label: "01.2025", title: "White Noise", description: "Everything was quiet.", category: "special", art_type: "snow" },
  { ext_id: "PHOTO_006", date_label: "09.2023", title: "Static Bloom", description: "An accident. My favorite one.", category: "funny", art_type: "glitch" },
  { ext_id: "PHOTO_007", date_label: "05.2024", title: "Dune Song", description: "Hot, endless, perfect.", category: "trips", art_type: "desert" },
  { ext_id: "PHOTO_008", date_label: "??.????", title: "do not open", description: "", category: "hidden", art_type: "eyes" },
];

const NOTES = [
  { ext_id: "NOTE_001", title: "a small idea", date_label: "SOME NIGHT, LATE", body: "To you,\n\nI wanted to make something that feels a little different...\n\nNot just another birthday page,\nbut a tiny world that belongs to you.", is_rtl: false },
  { ext_id: "NOTE_002", title: "ليكي", date_label: "ليلة متأخرة", body: "كنت عايز أعمل حاجة مختلفة السنة دي،\nحاجة لما تفتحيها تحسي إنك دخلتي عالم صغير معمول مخصوص ليكي.", is_rtl: true },
  { ext_id: "NOTE_003", title: "reasons", date_label: "TUESDAY", body: "Reason no. 47:\nyou turn boring Tuesdays into stories we retell for years.\n\nReason no. 48:\nstill counting.", is_rtl: false },
  { ext_id: "NOTE_004", title: "keep this safe", date_label: "DO NOT READ UNTIL YOUR BIRTHDAY", body: "One day we'll be old and we'll find this machine again,\nand we'll laugh at how small we thought forever was.", is_rtl: false },
];

const VIDEOS = [
  { ext_id: "VIDEO_001", file_label: "ROADTRIP_1998.REC", title: "roadtrip (recovered tape)", duration_seconds: 26, art_type: "road" },
  { ext_id: "VIDEO_002", file_label: "BIRTHDAY_EVE.REC", title: "the night before", duration_seconds: 22, art_type: "party" },
];

const TRACKS = [
  { ext_id: "TRACK_001", title: "our song", artist: "UNKNOWN ARTIST", art_type: "hearts",
    notes: [[523,1],[659,1],[784,1],[880,2],[784,1],[659,1],[587,1],[659,2],[0,1],[523,1],[659,1],[784,1],[1047,2],[880,1],[784,1],[698,1],[659,2]] },
  { ext_id: "TRACK_002", title: "midnight drive", artist: "UNKNOWN ARTIST", art_type: "night",
    notes: [[392,2],[440,1],[523,2],[587,1],[659,3],[0,1],[587,1],[523,1],[440,2],[392,1],[330,3],[0,2]] },
  { ext_id: "TRACK_003", title: "pink cassette", artist: "UNKNOWN ARTIST", art_type: "sunset",
    notes: [[659,1],[587,1],[523,1],[587,1],[659,2],[659,2],[587,2],[587,2],[659,2],[659,2],[523,1],[587,1],[659,3]] },
];

const MESSAGES = [
  { ext_id: "MSG_001", from_label: "YOU", subject: "Happy Birthday", body: "Another year,\nanother memory,\nanother reason to be grateful that you're here.", is_rtl: false },
  { ext_id: "MSG_002", from_label: "SYSTEM", subject: "untitled draft", body: "كل سنة وإنتِ أجمل جزء في الحكاية.", is_rtl: true },
  { ext_id: "MSG_003", from_label: "YOU", subject: "a promise", body: "I promise to keep collecting moments like this one —\nthe small, ordinary, perfect ones.", is_rtl: false },
  { ext_id: "MSG_004", from_label: "???", subject: "you weren't supposed to see this", body: "fine. you win.\ngo look at the last photo.\nthen come find me at the end.", is_rtl: false },
];

const SECRET = {
  title: "/SECRET/DO_NOT_OPEN.TXT",
  body:
    "You found something you weren't supposed to find.\n\nOf course you did. You always do.\n\n" +
    "This machine has been keeping something for you —\na message at the very end of everything.\n\n" +
    "When you're ready, press the button.",
};

function seed() {
  init();

  const already = db.prepare("SELECT id FROM site_config WHERE id = 1").get();
  if (already && !RESET) {
    console.log(
      "[seed] Database already has content. Nothing changed.\n" +
        "       Run `npm run seed:reset` if you really want to wipe it and start over\n" +
        "       (this will delete anything edited in the admin console)."
    );
    return;
  }

  const insertAll = db.transaction(() => {
    if (RESET) {
      for (const t of ["memories", "photos", "notes", "videos", "tracks", "messages"]) {
        db.prepare(`DELETE FROM ${t}`).run();
      }
      db.prepare("DELETE FROM site_config").run();
      db.prepare("DELETE FROM secret_message").run();
      db.prepare("DELETE FROM admin_users").run();
    }

    const passcodeHash = bcrypt.hashSync(config.seed.sitePasscode, 12);
    db.prepare(
      "INSERT INTO site_config (id, user_name, finale_heading, final_message, passcode_hash) VALUES (1, ?, ?, ?, ?)"
    ).run(SITE.user_name, SITE.finale_heading, SITE.final_message, passcodeHash);

    db.prepare("INSERT INTO secret_message (id, title, body) VALUES (1, ?, ?)").run(
      SECRET.title,
      SECRET.body
    );

    const adminHash = bcrypt.hashSync(config.seed.adminPassword, 12);
    db.prepare("INSERT INTO admin_users (username, password_hash) VALUES (?, ?)").run(
      config.seed.adminUsername,
      adminHash
    );

    const insMemory = db.prepare(
      "INSERT INTO memories (ext_id, date_label, title, caption, tags, is_secret, art_type, sort_order) VALUES (?,?,?,?,?,?,?,?)"
    );
    MEMORIES.forEach((m, i) =>
      insMemory.run(m.ext_id, m.date_label, m.title, m.caption, JSON.stringify(m.tags), m.is_secret ? 1 : 0, m.art_type, i)
    );

    const insPhoto = db.prepare(
      "INSERT INTO photos (ext_id, date_label, title, description, category, art_type, sort_order) VALUES (?,?,?,?,?,?,?)"
    );
    PHOTOS.forEach((p, i) =>
      insPhoto.run(p.ext_id, p.date_label, p.title, p.description, p.category, p.art_type, i)
    );

    const insNote = db.prepare(
      "INSERT INTO notes (ext_id, title, date_label, body, is_rtl, sort_order) VALUES (?,?,?,?,?,?)"
    );
    NOTES.forEach((n, i) => insNote.run(n.ext_id, n.title, n.date_label, n.body, n.is_rtl ? 1 : 0, i));

    const insVideo = db.prepare(
      "INSERT INTO videos (ext_id, file_label, title, duration_seconds, art_type, sort_order) VALUES (?,?,?,?,?,?)"
    );
    VIDEOS.forEach((v, i) =>
      insVideo.run(v.ext_id, v.file_label, v.title, v.duration_seconds, v.art_type, i)
    );

    const insTrack = db.prepare(
      "INSERT INTO tracks (ext_id, title, artist, art_type, notes_json, sort_order) VALUES (?,?,?,?,?,?)"
    );
    TRACKS.forEach((t, i) =>
      insTrack.run(t.ext_id, t.title, t.artist, t.art_type, JSON.stringify(t.notes), i)
    );

    const insMsg = db.prepare(
      "INSERT INTO messages (ext_id, from_label, subject, body, is_rtl, sort_order) VALUES (?,?,?,?,?,?)"
    );
    MESSAGES.forEach((m, i) =>
      insMsg.run(m.ext_id, m.from_label, m.subject, m.body, m.is_rtl ? 1 : 0, i)
    );
  });

  insertAll();

  console.log(`
[seed] Done. The database now has:
       ${MEMORIES.length} memories, ${PHOTOS.length} photos, ${NOTES.length} notes,
       ${VIDEOS.length} videos, ${TRACKS.length} tracks, ${MESSAGES.length} messages.

       Site access code : "${config.seed.sitePasscode}"
       Admin username    : "${config.seed.adminUsername}"
       Admin password    : "${config.seed.adminPassword}"

       These come from backend/.env (SITE_PASSCODE / ADMIN_USERNAME / ADMIN_PASSWORD).
       Change them there, then run "npm run seed:reset", before sending this to anyone.
`);
}

seed();
