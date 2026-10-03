"use strict";
/* ---------- tiny DOM helpers ---------- */
const $ = (s, scope) => (scope || document).querySelector(s);
const $$ = (s, scope) => [...(scope || document).querySelectorAll(s)];
const isTouch = matchMedia("(pointer:coarse)").matches;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const isRtlText = (s) => /[\u0600-\u06FF]/.test(String(s || ""));

/* ---------- seeded rng (deterministic pixel art per item) ---------- */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
