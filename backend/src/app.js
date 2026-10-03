"use strict";

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const compression = require("compression");

const config = require("./config");
const { requireAnyAuth } = require("./middleware/auth");
const { ensureCsrfCookie } = require("./middleware/csrf");
const { generalApiLimiter } = require("./middleware/rateLimit");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth.routes");
const contentRoutes = require("./routes/content.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();

if (config.trustProxy) app.set("trust proxy", 1);

// ---- security headers ---------------------------------------------------
// Script execution is locked to same-origin files only — this app never
// needs an inline <script> or eval, so there's no reason to weaken that.
// Inline style *attributes* remain in a few places inherited from the
// original single-file design (template strings that set `style="..."`
// directly); CSP has no nonce mechanism for style attributes, only a
// blanket allow, so style-src keeps 'unsafe-inline' while script-src
// stays strict. See docs/SECURITY.md for the full reasoning.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        mediaSrc: ["'self'"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: config.isProd ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

if (config.corsOrigins.length) {
  app.use(cors({ origin: config.corsOrigins, credentials: true }));
}

app.use(compression());
app.use(morgan(config.isProd ? "combined" : "dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use(ensureCsrfCookie);
app.use("/api", generalApiLimiter);

// ---- API routes -----------------------------------------------------------
// Order matters here: Express matches app.use() prefixes in registration
// order, and /api is a prefix of every other /api/* path below it. The
// more specific mounts (auth, admin, the public health check) must be
// registered first, or requests to them would first hit contentRoutes'
// blanket auth requirement and never reach their real handler.
app.get("/api/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", contentRoutes);

// ---- uploaded media -------------------------------------------------------
// Filenames are random UUIDs, but we still gate the folder behind the
// same visitor/admin session as the content itself — these are personal
// photos and recordings, not public assets.
app.use(
  "/uploads",
  requireAnyAuth,
  express.static(config.uploadsDir, {
    maxAge: "7d",
    setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff"),
  })
);

// ---- static frontend --------------------------------------------------
// "/admin" must resolve with a trailing slash before serving the file,
// or the browser resolves admin/index.html's relative asset paths
// (admin.css, admin.js) against "/admin" as if "admin" were a filename,
// producing the wrong URL (/admin.css instead of /admin/admin.css).
// Redirecting first, then letting express.static's own directory-index
// handling serve frontend/admin/index.html for "/admin/", keeps every
// relative path in that file resolving the way it looks like it should.
// Express's default (non-strict) routing treats "/admin" and "/admin/"
// as the same route pattern, so this must check the exact path — or
// the redirect target would match this same handler again and loop.
app.get("/admin", (req, res, next) => {
  if (req.path === "/admin/") return next();
  res.redirect(301, "/admin/");
});
app.use(
  express.static(config.frontendDir, {
    index: "index.html",
    setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff"),
  })
);

app.use("/api", notFoundHandler);
app.use(errorHandler);

module.exports = app;
