"use strict";

const express = require("express");
const { body, param } = require("express-validator");
const ctrl = require("../controllers/admin.controller");
const validate = require("../middleware/validate");
const { requireAdmin } = require("../middleware/auth");
const { verifyCsrf } = require("../middleware/csrf");
const { uploadLimiter } = require("../middleware/rateLimit");
const { createUploader } = require("../middleware/upload");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

const ART_TYPES = [
  "sunset", "night", "rain", "beach", "snow", "clouds",
  "city", "desert", "road", "glitch", "hearts", "eyes", "party",
];

// A media_url either came from our own /uploads/ response, or is empty
// (meaning "use the generated pixel art instead"). Never let it become
// an open door to arbitrary external URLs.
const mediaUrlRule = body("media_url")
  .optional({ nullable: true, checkFalsy: true })
  .isString()
  .matches(/^\/uploads\/(images|videos|audio)\/[a-zA-Z0-9-]+\.[a-z0-9]+$/)
  .withMessage("media_url must point to a file uploaded through this app.");

const sortOrderRule = body("sort_order").optional().isInt({ min: -100000, max: 100000 }).toInt();
const idParamRule = param("id").isInt().toInt();

// Every route below requires an admin session, and every state-changing
// method also requires a matching CSRF token.
router.use(requireAdmin);
router.use((req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    return verifyCsrf(req, res, next);
  }
  next();
});

router.get("/overview", asyncHandler(ctrl.overview));

// ---- memories -------------------------------------------------------------
router.get("/memories", asyncHandler(ctrl.memories.list));
router.get("/memories/:id", idParamRule, validate, asyncHandler(ctrl.memories.getOne));
router.post(
  "/memories",
  body("title").isString().trim().isLength({ min: 1, max: 120 }),
  body("date_label").optional().isString().trim().isLength({ max: 60 }),
  body("caption").optional().isString().trim().isLength({ max: 2000 }),
  body("tags").optional().isArray({ max: 20 }),
  body("tags.*").isString().trim().isLength({ max: 40 }),
  body("is_secret").optional().isBoolean().toBoolean(),
  body("art_type").optional().isIn(ART_TYPES),
  mediaUrlRule,
  sortOrderRule,
  validate,
  asyncHandler(ctrl.memories.create)
);
router.put(
  "/memories/:id",
  idParamRule,
  body("title").optional().isString().trim().isLength({ min: 1, max: 120 }),
  body("date_label").optional().isString().trim().isLength({ max: 60 }),
  body("caption").optional().isString().trim().isLength({ max: 2000 }),
  body("tags").optional().isArray({ max: 20 }),
  body("tags.*").isString().trim().isLength({ max: 40 }),
  body("is_secret").optional().isBoolean().toBoolean(),
  body("art_type").optional().isIn(ART_TYPES),
  mediaUrlRule,
  sortOrderRule,
  validate,
  asyncHandler(ctrl.memories.update)
);
router.delete("/memories/:id", idParamRule, validate, asyncHandler(ctrl.memories.remove));

// ---- photos -----------------------------------------------------------
router.get("/photos", asyncHandler(ctrl.photos.list));
router.get("/photos/:id", idParamRule, validate, asyncHandler(ctrl.photos.getOne));
router.post(
  "/photos",
  body("title").isString().trim().isLength({ min: 1, max: 120 }),
  body("date_label").optional().isString().trim().isLength({ max: 60 }),
  body("description").optional().isString().trim().isLength({ max: 2000 }),
  body("category").optional().isString().trim().isLength({ min: 1, max: 40 }),
  body("art_type").optional().isIn(ART_TYPES),
  mediaUrlRule,
  sortOrderRule,
  validate,
  asyncHandler(ctrl.photos.create)
);
router.put(
  "/photos/:id",
  idParamRule,
  body("title").optional().isString().trim().isLength({ min: 1, max: 120 }),
  body("date_label").optional().isString().trim().isLength({ max: 60 }),
  body("description").optional().isString().trim().isLength({ max: 2000 }),
  body("category").optional().isString().trim().isLength({ min: 1, max: 40 }),
  body("art_type").optional().isIn(ART_TYPES),
  mediaUrlRule,
  sortOrderRule,
  validate,
  asyncHandler(ctrl.photos.update)
);
router.delete("/photos/:id", idParamRule, validate, asyncHandler(ctrl.photos.remove));

// ---- notes ------------------------------------------------------------
router.get("/notes", asyncHandler(ctrl.notes.list));
router.get("/notes/:id", idParamRule, validate, asyncHandler(ctrl.notes.getOne));
router.post(
  "/notes",
  body("title").isString().trim().isLength({ min: 1, max: 120 }),
  body("date_label").optional().isString().trim().isLength({ max: 60 }),
  body("body").optional().isString().isLength({ max: 5000 }),
  body("is_rtl").optional().isBoolean().toBoolean(),
  sortOrderRule,
  validate,
  asyncHandler(ctrl.notes.create)
);
router.put(
  "/notes/:id",
  idParamRule,
  body("title").optional().isString().trim().isLength({ min: 1, max: 120 }),
  body("date_label").optional().isString().trim().isLength({ max: 60 }),
  body("body").optional().isString().isLength({ max: 5000 }),
  body("is_rtl").optional().isBoolean().toBoolean(),
  sortOrderRule,
  validate,
  asyncHandler(ctrl.notes.update)
);
router.delete("/notes/:id", idParamRule, validate, asyncHandler(ctrl.notes.remove));

// ---- videos -----------------------------------------------------------
router.get("/videos", asyncHandler(ctrl.videos.list));
router.get("/videos/:id", idParamRule, validate, asyncHandler(ctrl.videos.getOne));
router.post(
  "/videos",
  body("title").isString().trim().isLength({ min: 1, max: 120 }),
  body("file_label").optional().isString().trim().isLength({ max: 80 }),
  body("duration_seconds").optional().isInt({ min: 1, max: 600 }).toInt(),
  body("art_type").optional().isIn(["road", "party"]),
  mediaUrlRule,
  sortOrderRule,
  validate,
  asyncHandler(ctrl.videos.create)
);
router.put(
  "/videos/:id",
  idParamRule,
  body("title").optional().isString().trim().isLength({ min: 1, max: 120 }),
  body("file_label").optional().isString().trim().isLength({ max: 80 }),
  body("duration_seconds").optional().isInt({ min: 1, max: 600 }).toInt(),
  body("art_type").optional().isIn(["road", "party"]),
  mediaUrlRule,
  sortOrderRule,
  validate,
  asyncHandler(ctrl.videos.update)
);
router.delete("/videos/:id", idParamRule, validate, asyncHandler(ctrl.videos.remove));

// ---- tracks -----------------------------------------------------------
const notesArrayRule = body("notes")
  .optional()
  .isArray({ max: 200 })
  .custom((arr) =>
    arr.every(
      (n) =>
        Array.isArray(n) &&
        n.length === 2 &&
        typeof n[0] === "number" &&
        typeof n[1] === "number" &&
        n[0] >= 0 &&
        n[0] <= 8000 &&
        n[1] >= 0 &&
        n[1] <= 20
    )
  )
  .withMessage("notes must be an array of [frequencyHz, durationBeats] pairs.");

router.get("/tracks", asyncHandler(ctrl.tracks.list));
router.get("/tracks/:id", idParamRule, validate, asyncHandler(ctrl.tracks.getOne));
router.post(
  "/tracks",
  body("title").isString().trim().isLength({ min: 1, max: 120 }),
  body("artist").optional().isString().trim().isLength({ max: 80 }),
  body("art_type").optional().isIn(ART_TYPES),
  notesArrayRule,
  mediaUrlRule,
  sortOrderRule,
  validate,
  asyncHandler(ctrl.tracks.create)
);
router.put(
  "/tracks/:id",
  idParamRule,
  body("title").optional().isString().trim().isLength({ min: 1, max: 120 }),
  body("artist").optional().isString().trim().isLength({ max: 80 }),
  body("art_type").optional().isIn(ART_TYPES),
  notesArrayRule,
  mediaUrlRule,
  sortOrderRule,
  validate,
  asyncHandler(ctrl.tracks.update)
);
router.delete("/tracks/:id", idParamRule, validate, asyncHandler(ctrl.tracks.remove));

// ---- messages ---------------------------------------------------------
router.get("/messages", asyncHandler(ctrl.messages.list));
router.get("/messages/:id", idParamRule, validate, asyncHandler(ctrl.messages.getOne));
router.post(
  "/messages",
  body("subject").isString().trim().isLength({ min: 1, max: 150 }),
  body("from_label").optional().isString().trim().isLength({ max: 60 }),
  body("body").optional().isString().isLength({ max: 5000 }),
  body("is_rtl").optional().isBoolean().toBoolean(),
  sortOrderRule,
  validate,
  asyncHandler(ctrl.messages.create)
);
router.put(
  "/messages/:id",
  idParamRule,
  body("subject").optional().isString().trim().isLength({ min: 1, max: 150 }),
  body("from_label").optional().isString().trim().isLength({ max: 60 }),
  body("body").optional().isString().isLength({ max: 5000 }),
  body("is_rtl").optional().isBoolean().toBoolean(),
  sortOrderRule,
  validate,
  asyncHandler(ctrl.messages.update)
);
router.delete("/messages/:id", idParamRule, validate, asyncHandler(ctrl.messages.remove));

// ---- secret + site singleton resources ---------------------------------
router.get("/secret", asyncHandler(ctrl.getSecret));
router.put(
  "/secret",
  body("title").optional().isString().trim().isLength({ max: 150 }),
  body("body").optional().isString().isLength({ max: 5000 }),
  validate,
  asyncHandler(ctrl.updateSecret)
);

router.get("/site", asyncHandler(ctrl.getSite));
router.put(
  "/site",
  body("user_name").optional().isString().trim().isLength({ min: 1, max: 60 }),
  body("finale_heading").optional().isString().trim().isLength({ min: 1, max: 80 }),
  body("final_message").optional().isString().isLength({ max: 3000 }),
  validate,
  asyncHandler(ctrl.updateSite)
);
router.put(
  "/site/passcode",
  body("newPasscode").isString().trim().isLength({ min: 4, max: 200 }),
  validate,
  asyncHandler(ctrl.changePasscode)
);

// ---- admin's own account -----------------------------------------------
router.put(
  "/account/password",
  body("currentPassword").isString().isLength({ min: 1, max: 200 }),
  body("newPassword").isString().isLength({ min: 8, max: 200 }),
  validate,
  asyncHandler(ctrl.changeAdminPassword)
);

// ---- uploads ------------------------------------------------------------
router.post("/upload/image", uploadLimiter, ...createUploader("image"), (req, res) =>
  res.status(201).json(req.uploadedFile)
);
router.post("/upload/video", uploadLimiter, ...createUploader("video"), (req, res) =>
  res.status(201).json(req.uploadedFile)
);
router.post("/upload/audio", uploadLimiter, ...createUploader("audio"), (req, res) =>
  res.status(201).json(req.uploadedFile)
);

module.exports = router;
