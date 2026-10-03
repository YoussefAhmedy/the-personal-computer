"use strict";

const { validationResult } = require("express-validator");

// Runs after an array of express-validator checks; turns any failures
// into a single, clean 400 response instead of letting bad input reach
// a controller.
module.exports = function validate(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json({
      error: "Invalid input.",
      details: result.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};
