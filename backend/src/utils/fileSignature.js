"use strict";

/**
 * A client can lie about a file's MIME type or rename anything to
 * "photo.jpg" — the browser-supplied Content-Type header and the file
 * extension are both just labels the uploader chose. To stop someone
 * from smuggling an executable or script in disguised as media, we
 * check the file's actual first bytes ("magic numbers") against known
 * signatures for the formats this app accepts, and reject anything that
 * doesn't match what it claims to be. This needs no extra dependency —
 * the signature list below covers every format the upload routes allow.
 */

const SIGNATURES = [
  { ext: "jpg", mime: "image/jpeg", check: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "png", mime: "image/png", check: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { ext: "gif", mime: "image/gif", check: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 },
  {
    ext: "webp",
    mime: "image/webp",
    check: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
  {
    // ISO base media file format container — covers .mp4 and .m4a alike;
    // the "ftyp" box marker sits at byte offset 4 in both.
    ext: "mp4",
    mime: "video/mp4",
    check: (b) => b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70,
  },
  {
    ext: "webm",
    mime: "video/webm",
    check: (b) => b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3,
  },
  {
    ext: "mp3",
    mime: "audio/mpeg",
    check: (b) =>
      (b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) || // "ID3" tag
      (b[0] === 0xff && (b[1] & 0xe0) === 0xe0), // MPEG frame sync
  },
  {
    ext: "wav",
    mime: "audio/wav",
    check: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x41 && b[10] === 0x56 && b[11] === 0x45,
  },
  {
    ext: "ogg",
    mime: "audio/ogg",
    check: (b) => b[0] === 0x4f && b[1] === 0x67 && b[2] === 0x67 && b[3] === 0x53,
  },
];

/**
 * @param {Buffer} buffer - first ~16 bytes of the uploaded file are enough
 * @returns {{ext: string, mime: string} | null}
 */
function detectFileType(buffer) {
  if (!buffer || buffer.length < 12) return null;
  const match = SIGNATURES.find((sig) => {
    try {
      return sig.check(buffer);
    } catch {
      return false;
    }
  });
  return match ? { ext: match.ext, mime: match.mime } : null;
}

const KIND_TO_EXTS = {
  image: ["jpg", "png", "gif", "webp"],
  video: ["mp4", "webm"],
  audio: ["mp3", "wav", "ogg"],
};

/**
 * Confirms the real, sniffed file type belongs to the expected category
 * (e.g. an "image" upload field really did receive an image).
 */
function matchesKind(detected, kind) {
  if (!detected) return false;
  const allowed = KIND_TO_EXTS[kind];
  return Array.isArray(allowed) && allowed.includes(detected.ext);
}

module.exports = { detectFileType, matchesKind, KIND_TO_EXTS };
