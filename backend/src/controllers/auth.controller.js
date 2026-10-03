"use strict";

const bcrypt = require("bcryptjs");
const { db } = require("../db");
const config = require("../config");
const { signVisitorToken, signAdminToken } = require("../utils/jwt");
const { VISITOR_COOKIE, ADMIN_COOKIE } = require("../middleware/auth");

function cookieOpts(maxAgeMs) {
  return {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: "lax",
    domain: config.cookieDomain,
    maxAge: maxAgeMs,
    path: "/",
  };
}

const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30;
const TWELVE_HOURS = 1000 * 60 * 60 * 12;

function visitorLogin(req, res) {
  const { passcode } = req.body;
  const site = db.prepare("SELECT passcode_hash FROM site_config WHERE id = 1").get();

  if (!site || !passcode || !bcrypt.compareSync(String(passcode), site.passcode_hash)) {
    return res.status(401).json({ error: "ACCESS DENIED — incorrect code." });
  }

  const token = signVisitorToken();
  res.cookie(VISITOR_COOKIE, token, cookieOpts(THIRTY_DAYS));
  res.json({ ok: true, role: "visitor" });
}

function adminLogin(req, res) {
  const { username, password } = req.body;
  const admin = db
    .prepare("SELECT id, username, password_hash FROM admin_users WHERE username = ?")
    .get(String(username || "").trim());

  if (!admin || !bcrypt.compareSync(String(password || ""), admin.password_hash)) {
    return res.status(401).json({ error: "Incorrect username or password." });
  }

  const token = signAdminToken(admin.id, admin.username);
  res.cookie(ADMIN_COOKIE, token, cookieOpts(TWELVE_HOURS));
  res.json({ ok: true, role: "admin", username: admin.username });
}

function me(req, res) {
  if (!req.auth) return res.json({ authenticated: false });
  res.json({
    authenticated: true,
    role: req.auth.role,
    username: req.auth.username,
  });
}

function visitorLogout(req, res) {
  res.clearCookie(VISITOR_COOKIE, { path: "/" });
  res.json({ ok: true });
}

function adminLogout(req, res) {
  res.clearCookie(ADMIN_COOKIE, { path: "/" });
  res.json({ ok: true });
}

module.exports = { visitorLogin, adminLogin, me, visitorLogout, adminLogout };
