"use strict";
/* ---------- API client ----------
   Shared by both the main experience and the admin console. Handles
   reading the CSRF cookie the server issues on every response and
   attaching it as a header on any request that changes data, per the
   double-submit-cookie pattern the backend expects (see
   backend/src/middleware/csrf.js). */

function getCookie(name) {
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : "";
}

class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function apiFetch(path, { method = "GET", body, isForm = false } = {}) {
  const headers = {};
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";
  if (method !== "GET") headers["X-CSRF-Token"] = getCookie("pc_csrf");

  const res = await fetch(path, {
    method,
    headers,
    credentials: "same-origin",
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    throw new ApiError((data && data.error) || `Request failed (${res.status})`, res.status, data && data.details);
  }
  return data;
}

const Api = {
  // -- visitor / shared auth --
  login: (passcode) => apiFetch("/api/auth/login", { method: "POST", body: { passcode } }),
  logout: () => apiFetch("/api/auth/logout", { method: "POST" }),
  me: () => apiFetch("/api/auth/me"),

  // -- content (visitor or admin session) --
  bundle: () => apiFetch("/api/bundle"),
  secret: () => apiFetch("/api/secret"),

  // -- admin auth --
  adminLogin: (username, password) =>
    apiFetch("/api/auth/admin/login", { method: "POST", body: { username, password } }),
  adminLogout: () => apiFetch("/api/auth/admin/logout", { method: "POST" }),

  // -- admin CRUD (resource is one of: memories photos notes videos tracks messages) --
  adminList: (resource) => apiFetch(`/api/admin/${resource}`),
  adminCreate: (resource, data) => apiFetch(`/api/admin/${resource}`, { method: "POST", body: data }),
  adminUpdate: (resource, id, data) => apiFetch(`/api/admin/${resource}/${id}`, { method: "PUT", body: data }),
  adminDelete: (resource, id) => apiFetch(`/api/admin/${resource}/${id}`, { method: "DELETE" }),

  adminOverview: () => apiFetch("/api/admin/overview"),
  adminGetSecret: () => apiFetch("/api/admin/secret"),
  adminUpdateSecret: (data) => apiFetch("/api/admin/secret", { method: "PUT", body: data }),
  adminGetSite: () => apiFetch("/api/admin/site"),
  adminUpdateSite: (data) => apiFetch("/api/admin/site", { method: "PUT", body: data }),
  adminChangePasscode: (newPasscode) =>
    apiFetch("/api/admin/site/passcode", { method: "PUT", body: { newPasscode } }),
  adminChangePassword: (currentPassword, newPassword) =>
    apiFetch("/api/admin/account/password", { method: "PUT", body: { currentPassword, newPassword } }),

  adminUpload: (kind, file) => {
    const form = new FormData();
    form.append("file", file);
    return apiFetch(`/api/admin/upload/${kind}`, { method: "POST", body: form, isForm: true });
  },
};
