"use strict";

const crypto = require("crypto");
const config = require("../config");

const CSRF_COOKIE = "pc_csrf";
const CSRF_HEADER = "x-csrf-token";

/**
 * Double-submit-cookie CSRF protection.
 *
 * Our auth cookies are httpOnly (so JS on a malicious page can't read the
 * session token), which already blocks most token theft, but a browser
 * will still happily attach cookies to a cross-site form POST. SameSite
 * on the auth cookies is the primary defence; this is a second, explicit
 * layer: the CSRF cookie is deliberately *not* httpOnly, so only
 * same-origin JS (which can read the page's own cookies) can copy its
 * value into the X-CSRF-Token header. A cross-site request can't read
 * the cookie to forge that header, so the two won't match.
 *
 * ensureCsrfCookie: issued on every response so the client always has a
 * fresh token to read, even before logging in.
 * verifyCsrf: required on state-changing requests.
 */

function ensureCsrfCookie(req, res, next) {
  if (!req.cookies[CSRF_COOKIE]) {
    const token = crypto.randomBytes(24).toString("hex");
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,
      secure: config.cookieSecure,
      sameSite: "lax",
      domain: config.cookieDomain,
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });
    req.cookies[CSRF_COOKIE] = token;
  }
  next();
}

function verifyCsrf(req, res, next) {
  const cookieToken = req.cookies[CSRF_COOKIE];
  const headerToken = req.get(CSRF_HEADER);
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: "Invalid or missing CSRF token." });
  }
  next();
}

module.exports = { ensureCsrfCookie, verifyCsrf, CSRF_COOKIE, CSRF_HEADER };
