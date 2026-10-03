"use strict";

const jwt = require("jsonwebtoken");
const config = require("../config");

/**
 * Two roles share one token shape: { role: 'visitor' | 'admin', sub }.
 * Visitor tokens prove someone entered the correct access code. Admin
 * tokens prove someone logged in with the creator's username/password.
 * Content routes accept either; admin routes require role === 'admin'.
 */

function signVisitorToken() {
  return jwt.sign({ role: "visitor" }, config.jwtSecret, {
    expiresIn: config.jwtVisitorExpiry,
  });
}

function signAdminToken(adminId, username) {
  return jwt.sign({ role: "admin", sub: adminId, username }, config.jwtSecret, {
    expiresIn: config.jwtAdminExpiry,
  });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (err) {
    return null;
  }
}

module.exports = { signVisitorToken, signAdminToken, verifyToken };
