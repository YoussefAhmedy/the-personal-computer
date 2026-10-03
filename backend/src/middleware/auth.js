"use strict";

const { verifyToken } = require("../utils/jwt");

const VISITOR_COOKIE = "pc_visitor_token";
const ADMIN_COOKIE = "pc_admin_token";

function readRole(req) {
  // An admin is implicitly allowed to view the visitor-facing content too,
  // so we check the admin cookie first and fall back to the visitor one.
  const adminToken = req.cookies[ADMIN_COOKIE];
  if (adminToken) {
    const payload = verifyToken(adminToken);
    if (payload && payload.role === "admin") return payload;
  }
  const visitorToken = req.cookies[VISITOR_COOKIE];
  if (visitorToken) {
    const payload = verifyToken(visitorToken);
    if (payload && payload.role === "visitor") return payload;
  }
  return null;
}

/** Allows anyone holding a valid visitor OR admin session. */
function requireAnyAuth(req, res, next) {
  const auth = readRole(req);
  if (!auth) {
    return res.status(401).json({ error: "Not authenticated." });
  }
  req.auth = auth;
  next();
}

/** Allows only a valid admin session. */
function requireAdmin(req, res, next) {
  const adminToken = req.cookies[ADMIN_COOKIE];
  const payload = adminToken ? verifyToken(adminToken) : null;
  if (!payload || payload.role !== "admin") {
    return res.status(401).json({ error: "Admin authentication required." });
  }
  req.auth = payload;
  next();
}

/** Never blocks the request; just attaches req.auth if a session exists. */
function attachAuthIfPresent(req, res, next) {
  req.auth = readRole(req);
  next();
}

module.exports = {
  VISITOR_COOKIE,
  ADMIN_COOKIE,
  requireAnyAuth,
  requireAdmin,
  attachAuthIfPresent,
};
