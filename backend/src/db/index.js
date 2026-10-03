"use strict";

const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const config = require("../config");

// Make sure the folder that will hold app.db exists before SQLite tries
// to create the file in it.
const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(config.dbPath);

// WAL mode gives better concurrent read/write behaviour for a small
// self-hosted app like this, with little downside.
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function init() {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  db.exec(schema);
}

module.exports = { db, init };
