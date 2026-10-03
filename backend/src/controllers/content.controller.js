"use strict";

const { db } = require("../db");

// ---- row -> API shape mappers -------------------------------------------
// Field names here match what the frontend already expects (camelCase,
// booleans instead of 0/1, parsed JSON), so the app code barely has to
// change from working directly off arrays to working off a fetch result.
//
// Every shape also carries `rowId` (the numeric primary key) alongside
// the cosmetic `id` (ext_id, e.g. "MEMORY_001"). The visitor-facing app
// only ever displays `id`; the admin console needs `rowId` to build
// PUT/DELETE /api/admin/<resource>/:id requests, since ext_id is just a
// display label, not what the database is keyed on.

function mapMemory(r) {
  return {
    rowId: r.id,
    id: r.ext_id,
    date: r.date_label,
    title: r.title,
    caption: r.caption,
    tags: JSON.parse(r.tags || "[]"),
    secret: !!r.is_secret,
    art: r.art_type,
    media: r.media_url || null,
    sortOrder: r.sort_order,
  };
}

function mapPhoto(r) {
  return {
    rowId: r.id,
    id: r.ext_id,
    date: r.date_label,
    title: r.title,
    desc: r.description,
    cat: r.category,
    art: r.art_type,
    media: r.media_url || null,
    sortOrder: r.sort_order,
  };
}

function mapNote(r) {
  return {
    rowId: r.id,
    id: r.ext_id,
    title: r.title,
    date: r.date_label,
    body: r.body,
    rtl: !!r.is_rtl,
    sortOrder: r.sort_order,
  };
}

function mapVideo(r) {
  return {
    rowId: r.id,
    id: r.ext_id,
    file: r.file_label,
    title: r.title,
    dur: r.duration_seconds,
    art: r.art_type,
    media: r.media_url || null,
    sortOrder: r.sort_order,
  };
}

function mapTrack(r) {
  return {
    rowId: r.id,
    id: r.ext_id,
    title: r.title,
    artist: r.artist,
    art: r.art_type,
    notes: JSON.parse(r.notes_json || "[]"),
    media: r.media_url || null,
    sortOrder: r.sort_order,
  };
}

function mapMessage(r) {
  return {
    rowId: r.id,
    id: r.ext_id,
    from: r.from_label,
    subject: r.subject,
    body: r.body,
    rtl: !!r.is_rtl,
    sortOrder: r.sort_order,
  };
}

// ---- handlers -------------------------------------------------------------

function getSite(req, res) {
  const row = db
    .prepare("SELECT user_name, finale_heading, final_message FROM site_config WHERE id = 1")
    .get();
  res.json({
    user: row.user_name,
    finaleHeading: row.finale_heading,
    finalMessage: row.final_message,
  });
}

function getMemories(req, res) {
  const rows = db.prepare("SELECT * FROM memories ORDER BY sort_order, id").all();
  res.json(rows.map(mapMemory));
}

function getPhotos(req, res) {
  const rows = db.prepare("SELECT * FROM photos ORDER BY sort_order, id").all();
  res.json(rows.map(mapPhoto));
}

function getNotes(req, res) {
  const rows = db.prepare("SELECT * FROM notes ORDER BY sort_order, id").all();
  res.json(rows.map(mapNote));
}

function getVideos(req, res) {
  const rows = db.prepare("SELECT * FROM videos ORDER BY sort_order, id").all();
  res.json(rows.map(mapVideo));
}

function getTracks(req, res) {
  const rows = db.prepare("SELECT * FROM tracks ORDER BY sort_order, id").all();
  res.json(rows.map(mapTrack));
}

function getMessages(req, res) {
  const rows = db.prepare("SELECT * FROM messages ORDER BY sort_order, id").all();
  res.json(rows.map(mapMessage));
}

function getSecret(req, res) {
  const row = db.prepare("SELECT title, body FROM secret_message WHERE id = 1").get();
  res.json(row || { title: "", body: "" });
}

/** One combined call so the boot sequence can fetch everything at once. */
function getBundle(req, res) {
  const site = db
    .prepare("SELECT user_name, finale_heading, final_message FROM site_config WHERE id = 1")
    .get();
  const memories = db.prepare("SELECT * FROM memories ORDER BY sort_order, id").all();
  const photos = db.prepare("SELECT * FROM photos ORDER BY sort_order, id").all();
  const notes = db.prepare("SELECT * FROM notes ORDER BY sort_order, id").all();
  const videos = db.prepare("SELECT * FROM videos ORDER BY sort_order, id").all();
  const tracks = db.prepare("SELECT * FROM tracks ORDER BY sort_order, id").all();
  const messages = db.prepare("SELECT * FROM messages ORDER BY sort_order, id").all();
  const secret = db.prepare("SELECT title, body FROM secret_message WHERE id = 1").get();

  res.json({
    site: {
      user: site.user_name,
      finaleHeading: site.finale_heading,
      finalMessage: site.final_message,
    },
    memories: memories.map(mapMemory),
    photos: photos.map(mapPhoto),
    notes: notes.map(mapNote),
    videos: videos.map(mapVideo),
    tracks: tracks.map(mapTrack),
    messages: messages.map(mapMessage),
    secret: secret || { title: "", body: "" },
  });
}

module.exports = {
  getSite,
  getMemories,
  getPhotos,
  getNotes,
  getVideos,
  getTracks,
  getMessages,
  getSecret,
  getBundle,
  // exported for reuse by the admin controller
  mapMemory,
  mapPhoto,
  mapNote,
  mapVideo,
  mapTrack,
  mapMessage,
};
