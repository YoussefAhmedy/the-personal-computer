"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const config = require("../config");
const { detectFileType, matchesKind } = require("../utils/fileSignature");

const KIND_CONFIG = {
  image: {
    folder: "images",
    maxSizeMb: config.maxImageSizeMb,
    looseMimePrefix: "image/",
  },
  video: {
    folder: "videos",
    maxSizeMb: config.maxVideoSizeMb,
    looseMimePrefix: "video/",
  },
  audio: {
    folder: "audio",
    maxSizeMb: config.maxAudioSizeMb,
    looseMimePrefix: "audio/",
  },
};

/**
 * Builds an upload-handling middleware pair for one media kind.
 *
 * Step 1 (multer): a cheap first-pass filter on the claimed MIME type,
 * plus a size cap, so obviously-wrong uploads never touch the disk.
 * Step 2 (verifyUpload, applied after multer in the route): the real
 * check — read the bytes actually written to disk and confirm they
 * match a known signature for this media kind, regardless of what the
 * browser claimed. Anything that fails is deleted immediately.
 */
function createUploader(kind) {
  const kindCfg = KIND_CONFIG[kind];
  if (!kindCfg) throw new Error(`Unknown upload kind: ${kind}`);

  const destDir = path.join(config.uploadsDir, kindCfg.folder);
  fs.mkdirSync(destDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, destDir),
    filename: (req, file, cb) => {
      // Random name: never trust or reuse the client-supplied filename
      // (avoids path traversal and collisions; the original name is
      // never something a visitor needed to see anyway).
      cb(null, `${crypto.randomUUID()}.tmp`);
    },
  });

  const multerMiddleware = multer({
    storage,
    limits: { fileSize: kindCfg.maxSizeMb * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype || !file.mimetype.startsWith(kindCfg.looseMimePrefix)) {
        return cb(
          Object.assign(new Error(`File must be a${kind === "audio" ? "n" : ""} ${kind} file.`), {
            type: "upload_rejected",
          })
        );
      }
      cb(null, true);
    },
  }).single("file");

  function verifyUpload(req, res, next) {
    if (!req.file) {
      return res.status(400).json({ error: "No file was uploaded." });
    }
    const filePath = req.file.path;

    fs.open(filePath, "r", (openErr, fd) => {
      if (openErr) return next(openErr);
      const buffer = Buffer.alloc(16);
      fs.read(fd, buffer, 0, 16, 0, (readErr, bytesRead) => {
        fs.close(fd, () => {});
        if (readErr) return next(readErr);

        const detected = detectFileType(buffer.subarray(0, bytesRead));
        if (!matchesKind(detected, kind)) {
          fs.unlink(filePath, () => {});
          return res.status(400).json({
            error: `The uploaded file's contents don't look like a valid ${kind} file.`,
          });
        }

        // Now that we know the real type, give the file its real
        // extension instead of the placeholder ".tmp" name.
        const finalName = filePath.replace(/\.tmp$/, `.${detected.ext}`);
        fs.rename(filePath, finalName, (renameErr) => {
          if (renameErr) return next(renameErr);
          req.uploadedFile = {
            url: `/uploads/${kindCfg.folder}/${path.basename(finalName)}`,
            mime: detected.mime,
            size: req.file.size,
          };
          next();
        });
      });
    });
  }

  return [multerMiddleware, verifyUpload];
}

module.exports = { createUploader };
