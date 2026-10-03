"use strict";

const express = require("express");
const { body } = require("express-validator");
const ctrl = require("../controllers/auth.controller");
const validate = require("../middleware/validate");
const { attachAuthIfPresent } = require("../middleware/auth");
const { visitorLoginLimiter, adminLoginLimiter } = require("../middleware/rateLimit");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// Login endpoints are exempt from CSRF (there's no session yet to steal)
// but are protected instead by strict rate limiting below.
router.post(
  "/login",
  visitorLoginLimiter,
  body("passcode").isString().trim().isLength({ min: 1, max: 200 }),
  validate,
  asyncHandler(ctrl.visitorLogin)
);

router.post(
  "/admin/login",
  adminLoginLimiter,
  body("username").isString().trim().isLength({ min: 1, max: 100 }),
  body("password").isString().isLength({ min: 1, max: 200 }),
  validate,
  asyncHandler(ctrl.adminLogin)
);

router.get("/me", attachAuthIfPresent, ctrl.me);
router.post("/logout", ctrl.visitorLogout);
router.post("/admin/logout", ctrl.adminLogout);

module.exports = router;
