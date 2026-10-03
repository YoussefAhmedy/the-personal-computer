"use strict";

const config = require("../config");
const multer = require("multer");

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  if (err && err.type === "upload_rejected") {
    return res.status(400).json({ error: err.message });
  }
  if (err && err.type === "entity.too.large") {
    return res.status(413).json({ error: "Request body too large." });
  }
  if (err && err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Malformed request body." });
  }

  // Never leak stack traces or internal details to the client — log the
  // full error server-side and return a generic message.
  // eslint-disable-next-line no-console
  console.error("[error]", err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: status === 500 ? "Something went wrong on our end." : err.message,
    ...(config.isProd ? {} : { stack: err.stack }),
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: "Not found." });
}

module.exports = { errorHandler, notFoundHandler };
