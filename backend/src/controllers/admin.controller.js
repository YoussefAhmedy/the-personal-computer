"use strict";

const bcrypt = require("bcryptjs");
const { db } = require("../db");
const content = require("./content.controller");

// ---- generic CRUD engine ---------------------------------------------
// Every content table (memories, photos, notes, videos, tracks,
// messages) follows the same shape: an auto id, a cosmetic ext_id label
// like "MEMORY_003", a sort_order, and a handful of typed columns. This
// factory keeps the six resources from being six near-identical copies
// of the same list/create/update/delete logic.

function nextExtId(table, prefix) {
  const rows = db.prepare(`SELECT ext_id FROM ${table}`).all();
  let max = 0;
  for (const r of rows) {
    const match = /_(\d+)$/.exec(r.ext_id || "");
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  return `${prefix}_${String(max + 1).padStart(3, "0")}`;
}

/**
 * @param {string} table - SQL table name
 * @param {string} prefix - ext_id prefix, e.g. "MEMORY"
 * @param {(row: object) => object} toApi - DB row -> API JSON shape
 * @param {(body: object, isCreate: boolean) => object} fromBody - validated
 *        req.body -> { column: value } to persist. Only include keys that
 *        should be written (partial updates omit untouched columns).
 */
function makeCrud(table, prefix, toApi, fromBody) {
  function list(req, res) {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY sort_order, id`).all();
    res.json(rows.map(toApi));
  }

  function getOne(req, res) {
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: "Not found." });
    res.json(toApi(row));
  }

  function create(req, res) {
    const data = fromBody(req.body, true);
    if (!data.ext_id) data.ext_id = nextExtId(table, prefix);

    const cols = Object.keys(data);
    const placeholders = cols.map(() => "?").join(", ");
    const stmt = db.prepare(
      `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`
    );
    const info = stmt.run(...cols.map((c) => data[c]));
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(info.lastInsertRowid);
    res.status(201).json(toApi(row));
  }

  function update(req, res) {
    const existing = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: "Not found." });

    const data = fromBody(req.body, false);
    data.updated_at = new Date().toISOString();
    const cols = Object.keys(data);
    if (!cols.length) return res.json(toApi(existing));

    const setClause = cols.map((c) => `${c} = ?`).join(", ");
    db.prepare(`UPDATE ${table} SET ${setClause} WHERE id = ?`).run(
      ...cols.map((c) => data[c]),
      req.params.id
    );
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    res.json(toApi(row));
  }

  function remove(req, res) {
    const info = db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: "Not found." });
    res.status(204).end();
  }

  return { list, getOne, create, update, remove };
}

// ---- per-resource field mapping ---------------------------------------
// Converts already-validated request bodies into DB columns. Anything
// not present in the body is simply omitted, so PUT requests can send a
// partial patch.

function pick(body, keys) {
  const out = {};
  for (const k of keys) {
    if (body[k] !== undefined) out[k] = body[k];
  }
  return out;
}

const memories = makeCrud("memories", "MEMORY", content.mapMemory, (body) => {
  const data = pick(body, ["date_label", "title", "caption", "art_type", "media_url", "sort_order", "ext_id"]);
  if (body.tags !== undefined) data.tags = JSON.stringify(body.tags);
  if (body.is_secret !== undefined) data.is_secret = body.is_secret ? 1 : 0;
  return data;
});

const photos = makeCrud("photos", "PHOTO", content.mapPhoto, (body) =>
  pick(body, ["date_label", "title", "description", "category", "art_type", "media_url", "sort_order", "ext_id"])
);

const notes = makeCrud("notes", "NOTE", content.mapNote, (body) => {
  const data = pick(body, ["title", "date_label", "body", "sort_order", "ext_id"]);
  if (body.is_rtl !== undefined) data.is_rtl = body.is_rtl ? 1 : 0;
  return data;
});

const videos = makeCrud("videos", "VIDEO", content.mapVideo, (body) =>
  pick(body, ["file_label", "title", "duration_seconds", "art_type", "media_url", "sort_order", "ext_id"])
);

const tracks = makeCrud("tracks", "TRACK", content.mapTrack, (body) => {
  const data = pick(body, ["title", "artist", "art_type", "media_url", "sort_order", "ext_id"]);
  if (body.notes !== undefined) data.notes_json = JSON.stringify(body.notes);
  return data;
});

const messages = makeCrud("messages", "MSG", content.mapMessage, (body) => {
  const data = pick(body, ["from_label", "subject", "body", "sort_order", "ext_id"]);
  if (body.is_rtl !== undefined) data.is_rtl = body.is_rtl ? 1 : 0;
  return data;
});

// ---- singleton resources: secret message + site settings ---------------

function getSecret(req, res) {
  const row = db.prepare("SELECT title, body FROM secret_message WHERE id = 1").get();
  res.json(row);
}

function updateSecret(req, res) {
  const { title, body } = req.body;
  const data = {};
  if (title !== undefined) data.title = title;
  if (body !== undefined) data.body = body;
  const cols = Object.keys(data);
  if (cols.length) {
    db.prepare(`UPDATE secret_message SET ${cols.map((c) => `${c} = ?`).join(", ")} WHERE id = 1`).run(
      ...cols.map((c) => data[c])
    );
  }
  res.json(db.prepare("SELECT title, body FROM secret_message WHERE id = 1").get());
}

function getSite(req, res) {
  const row = db
    .prepare("SELECT user_name, finale_heading, final_message, updated_at FROM site_config WHERE id = 1")
    .get();
  res.json(row);
}

function updateSite(req, res) {
  const { user_name, finale_heading, final_message } = req.body;
  const data = { updated_at: new Date().toISOString() };
  if (user_name !== undefined) data.user_name = user_name;
  if (finale_heading !== undefined) data.finale_heading = finale_heading;
  if (final_message !== undefined) data.final_message = final_message;
  const cols = Object.keys(data);
  db.prepare(`UPDATE site_config SET ${cols.map((c) => `${c} = ?`).join(", ")} WHERE id = 1`).run(
    ...cols.map((c) => data[c])
  );
  res.json(db.prepare("SELECT user_name, finale_heading, final_message FROM site_config WHERE id = 1").get());
}

function changePasscode(req, res) {
  const { newPasscode } = req.body;
  const hash = bcrypt.hashSync(String(newPasscode), 12);
  db.prepare("UPDATE site_config SET passcode_hash = ?, updated_at = ? WHERE id = 1").run(
    hash,
    new Date().toISOString()
  );
  res.json({ ok: true });
}

function changeAdminPassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const admin = db.prepare("SELECT id, password_hash FROM admin_users WHERE id = ?").get(req.auth.sub);
  if (!admin || !bcrypt.compareSync(String(currentPassword), admin.password_hash)) {
    return res.status(401).json({ error: "Current password is incorrect." });
  }
  const hash = bcrypt.hashSync(String(newPassword), 12);
  db.prepare("UPDATE admin_users SET password_hash = ? WHERE id = ?").run(hash, admin.id);
  res.json({ ok: true });
}

function overview(req, res) {
  const count = (table) => db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
  res.json({
    memories: count("memories"),
    photos: count("photos"),
    notes: count("notes"),
    videos: count("videos"),
    tracks: count("tracks"),
    messages: count("messages"),
  });
}

module.exports = {
  memories,
  photos,
  notes,
  videos,
  tracks,
  messages,
  getSecret,
  updateSecret,
  getSite,
  updateSite,
  changePasscode,
  changeAdminPassword,
  overview,
};
