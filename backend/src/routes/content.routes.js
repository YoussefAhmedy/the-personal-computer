"use strict";

const express = require("express");
const ctrl = require("../controllers/content.controller");
const { requireAnyAuth } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// Every route here requires a valid visitor or admin session — this is
// the personal content itself, so it stays behind the access code.
router.use(requireAnyAuth);

router.get("/bundle", asyncHandler(ctrl.getBundle));
router.get("/site", asyncHandler(ctrl.getSite));
router.get("/memories", asyncHandler(ctrl.getMemories));
router.get("/photos", asyncHandler(ctrl.getPhotos));
router.get("/notes", asyncHandler(ctrl.getNotes));
router.get("/videos", asyncHandler(ctrl.getVideos));
router.get("/tracks", asyncHandler(ctrl.getTracks));
router.get("/messages", asyncHandler(ctrl.getMessages));
router.get("/secret", asyncHandler(ctrl.getSecret));

module.exports = router;
