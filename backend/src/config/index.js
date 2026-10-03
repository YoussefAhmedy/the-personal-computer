"use strict";

const path = require("path");
const crypto = require("crypto");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

/**
 * Central config module.
 *
 * Reads everything from environment variables so no secret ever lives in
 * source code. Where a secret is missing, we fail fast in production but
 * fall back to a generated value in development so the app is still easy
 * to try out locally — with a loud warning so it's never mistaken for a
 * real setup.
 */

const NODE_ENV = process.env.NODE_ENV || "development";
const isProd = NODE_ENV === "production";

function warn(msg) {
  // eslint-disable-next-line no-console
  console.warn(`\x1b[33m[config] ${msg}\x1b[0m`);
}

function fail(msg) {
  // eslint-disable-next-line no-console
  console.error(`\x1b[31m[config] ${msg}\x1b[0m`);
  process.exit(1);
}

function getOrGenerate(envVar, { label, devOnly = true } = {}) {
  const value = process.env[envVar];
  if (value && value.trim()) return value.trim();

  if (isProd) {
    fail(
      `${envVar} is not set. Refusing to start in production without it. ` +
        `Set it in your .env file (see .env.example).`
    );
  }
  const generated = crypto.randomBytes(32).toString("hex");
  warn(
    `${envVar} is not set — generating a temporary ${label || "value"} for this run only. ` +
      `Sessions will be invalidated on restart. Set ${envVar} in backend/.env before deploying.`
  );
  return generated;
}

const config = {
  env: NODE_ENV,
  isProd,
  port: parseInt(process.env.PORT, 10) || 3000,

  // Trust the first proxy hop (needed for correct secure-cookie / rate-limit
  // behaviour behind a reverse proxy like nginx or a PaaS load balancer).
  trustProxy: process.env.TRUST_PROXY === "true",

  jwtSecret: getOrGenerate("JWT_SECRET", { label: "JWT signing secret" }),
  jwtVisitorExpiry: process.env.JWT_VISITOR_EXPIRY || "30d",
  jwtAdminExpiry: process.env.JWT_ADMIN_EXPIRY || "12h",

  cookieSecure: process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === "true"
    : isProd,
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,

  corsOrigins: (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  dbPath:
    process.env.DB_PATH || path.join(__dirname, "..", "..", "data", "app.db"),

  uploadsDir:
    process.env.UPLOADS_DIR || path.join(__dirname, "..", "..", "uploads"),
  maxImageSizeMb: parseInt(process.env.MAX_IMAGE_SIZE_MB, 10) || 15,
  maxVideoSizeMb: parseInt(process.env.MAX_VIDEO_SIZE_MB, 10) || 150,
  maxAudioSizeMb: parseInt(process.env.MAX_AUDIO_SIZE_MB, 10) || 40,

  // Seed-time defaults — only used the first time `npm run seed` runs.
  seed: {
    sitePasscode: process.env.SITE_PASSCODE || "welcome",
    adminUsername: process.env.ADMIN_USERNAME || "admin",
    adminPassword: process.env.ADMIN_PASSWORD || "changeme123",
  },

  frontendDir: path.join(__dirname, "..", "..", "..", "frontend"),
};

if (isProd && config.seed.adminPassword === "changeme123") {
  warn(
    "ADMIN_PASSWORD is still the default placeholder. Change it in backend/.env " +
      "and re-run `npm run seed:reset` before sharing this site with anyone."
  );
}

module.exports = config;
