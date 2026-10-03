"use strict";

const rateLimit = require("express-rate-limit");

// The visitor gate is a short shared passcode — the single most
// brute-forceable thing in this app — so it gets the strictest limit.
const visitorLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please wait a few minutes and try again." },
});

// The admin account is a real username/password; still throttled hard
// since it guards write access to everything.
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please wait a few minutes and try again." },
});

// A gentler ceiling across the whole API so no single client can hammer
// the server, without getting in the way of normal browsing.
const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
});

// Uploads are heavier and rarer than normal API calls; keep them from
// being used to exhaust disk space or CPU.
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many uploads. Please wait a few minutes and try again." },
});

module.exports = {
  visitorLoginLimiter,
  adminLoginLimiter,
  generalApiLimiter,
  uploadLimiter,
};
