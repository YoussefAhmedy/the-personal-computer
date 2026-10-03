"use strict";
/* ============================================================
   ADMIN CONSOLE
   A schema-driven CRUD UI: each content type is described once
   in RESOURCES below (which DB-facing fields it has, what kind
   of input each needs), and the table/form code in part 2 reads
   that schema rather than repeating six near-identical UIs.
   ============================================================ */
const $ = (s, sc) => (sc || document).querySelector(s);
const $$ = (s, sc) => [...(sc || document).querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const ART_TYPES = ["sunset", "night", "rain", "beach", "snow", "clouds", "city", "desert", "road", "glitch", "hearts", "eyes", "party"];
const VIDEO_ART_TYPES = ["road", "party"];

const RESOURCES = {
  memories: {
    label: "Memories",
    columns: [
      { api: "id", label: "ID" },
      { api: "title", label: "Title" },
      { api: "date", label: "Date" },
      { api: "secret", label: "Secret", bool: true },
    ],
    fields: [
      { db: "title", api: "title", label: "Title", type: "text", required: true, maxlength: 120 },
      { db: "date_label", api: "date", label: "Date label", type: "text", placeholder: "e.g. SUMMER / 2024", maxlength: 60 },
      { db: "caption", api: "caption", label: "Caption", type: "textarea", maxlength: 2000 },
      { db: "tags", api: "tags", label: "Tags (comma separated)", type: "tags" },
      { db: "is_secret", api: "secret", label: "Hidden / secret item", type: "checkbox" },
      { db: "art_type", api: "art", label: "Art style (shown when no photo is uploaded)", type: "select", options: ART_TYPES, default: "clouds" },
      { db: "media_url", api: "media", label: "Photo (optional — overrides the art style above)", type: "upload", uploadKind: "image" },
      { db: "sort_order", api: "sortOrder", label: "Sort order", type: "number", default: 0 },
    ],
  },
  photos: {
    label: "Photos",
    columns: [
      { api: "id", label: "ID" },
      { api: "title", label: "Title" },
      { api: "cat", label: "Category" },
      { api: "date", label: "Date" },
    ],
    fields: [
      { db: "title", api: "title", label: "Title", type: "text", required: true, maxlength: 120 },
      { db: "date_label", api: "date", label: "Date label", type: "text", maxlength: 60 },
      { db: "description", api: "desc", label: "Description", type: "textarea", maxlength: 2000 },
      { db: "category", api: "cat", label: "Category", type: "text", placeholder: "trips / special / funny / hidden", maxlength: 40, default: "trips" },
      { db: "art_type", api: "art", label: "Art style (shown when no photo is uploaded)", type: "select", options: ART_TYPES, default: "clouds" },
      { db: "media_url", api: "media", label: "Photo (optional — overrides the art style above)", type: "upload", uploadKind: "image" },
      { db: "sort_order", api: "sortOrder", label: "Sort order", type: "number", default: 0 },
    ],
  },
  notes: {
    label: "Notes",
    columns: [
      { api: "id", label: "ID" },
      { api: "title", label: "Title" },
      { api: "date", label: "Date" },
    ],
    fields: [
      { db: "title", api: "title", label: "Title", type: "text", required: true, maxlength: 120 },
      { db: "date_label", api: "date", label: "Date label", type: "text", maxlength: 60 },
      { db: "body", api: "body", label: "Body", type: "textarea", maxlength: 5000, rows: 8 },
      { db: "is_rtl", api: "rtl", label: "Right-to-left script (Arabic etc.)", type: "checkbox" },
      { db: "sort_order", api: "sortOrder", label: "Sort order", type: "number", default: 0 },
    ],
  },
  videos: {
    label: "Videos",
    columns: [
      { api: "id", label: "ID" },
      { api: "title", label: "Title" },
      { api: "dur", label: "Duration (s)" },
    ],
    fields: [
      { db: "title", api: "title", label: "Title", type: "text", required: true, maxlength: 120 },
      { db: "file_label", api: "file", label: "File label", type: "text", placeholder: "e.g. ROADTRIP_1998.REC", maxlength: 80 },
      { db: "duration_seconds", api: "dur", label: "Duration in seconds (used by the simulated tape)", type: "number", default: 20 },
      { db: "art_type", api: "art", label: "Simulated scene (used when no video is uploaded)", type: "select", options: VIDEO_ART_TYPES, default: "road" },
      { db: "media_url", api: "media", label: "Video file (optional — overrides the simulation)", type: "upload", uploadKind: "video" },
      { db: "sort_order", api: "sortOrder", label: "Sort order", type: "number", default: 0 },
    ],
  },
  tracks: {
    label: "Music Tracks",
    columns: [
      { api: "id", label: "ID" },
      { api: "title", label: "Title" },
      { api: "artist", label: "Artist" },
    ],
    fields: [
      { db: "title", api: "title", label: "Title", type: "text", required: true, maxlength: 120 },
      { db: "artist", api: "artist", label: "Artist", type: "text", maxlength: 80 },
      { db: "art_type", api: "art", label: "Album art style", type: "select", options: ART_TYPES, default: "hearts" },
      { db: "media_url", api: "media", label: "Audio file (optional — overrides the chiptune below)", type: "upload", uploadKind: "audio" },
      { db: "notes", api: "notes", label: "Chiptune notes — JSON array of [frequencyHz, durationBeats] (advanced, used only without an audio file)", type: "json", rows: 4 },
      { db: "sort_order", api: "sortOrder", label: "Sort order", type: "number", default: 0 },
    ],
  },
  messages: {
    label: "Messages",
    columns: [
      { api: "id", label: "ID" },
      { api: "subject", label: "Subject" },
      { api: "from", label: "From" },
    ],
    fields: [
      { db: "subject", api: "subject", label: "Subject", type: "text", required: true, maxlength: 150 },
      { db: "from_label", api: "from", label: "From", type: "text", maxlength: 60 },
      { db: "body", api: "body", label: "Body", type: "textarea", maxlength: 5000, rows: 8 },
      { db: "is_rtl", api: "rtl", label: "Right-to-left script (Arabic etc.)", type: "checkbox" },
      { db: "sort_order", api: "sortOrder", label: "Sort order", type: "number", default: 0 },
    ],
  },
};

function toast(msg, isErr) {
  const t = document.createElement("div");
  t.className = "a-toast" + (isErr ? " err" : "");
  t.textContent = msg;
  $("#a-toasts").appendChild(t);
  setTimeout(() => t.remove(), 4200);
}

/* ---------- auth / boot ---------- */
let currentUser = null;

async function boot() {
  try {
    const me = await Api.me();
    if (me.authenticated && me.role === "admin") {
      currentUser = me.username;
      showShell();
      return;
    }
  } catch (e) {
    /* fall through to login */
  }
  showLogin();
}

function showLogin() {
  $("#login-screen").style.display = "flex";
  $("#app-shell").classList.remove("on");
  setTimeout(() => $("#login-username").focus(), 30);
}
function showShell() {
  $("#login-screen").style.display = "none";
  $("#app-shell").classList.add("on");
  $("#whoami").textContent = "logged in as " + currentUser;
  goto("overview");
}

$("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $("#login-submit");
  const username = $("#login-username").value.trim();
  const password = $("#login-password").value;
  $("#login-err").textContent = "";
  btn.disabled = true;
  btn.textContent = "CHECKING...";
  try {
    const res = await Api.adminLogin(username, password);
    currentUser = res.username;
    $("#login-password").value = "";
    showShell();
  } catch (err) {
    $("#login-err").textContent = err.message || "Login failed.";
  } finally {
    btn.disabled = false;
    btn.textContent = "LOG IN";
  }
});

$("#logout-btn").addEventListener("click", async () => {
  try {
    await Api.adminLogout();
  } catch (e) {
    /* ignore */
  }
  currentUser = null;
  showLogin();
});

/* ---------- navigation ---------- */
const SECTIONS = ["overview", ...Object.keys(RESOURCES), "secret", "site", "account"];
function goto(section) {
  if (!SECTIONS.includes(section)) section = "overview";
  $$(".navitem").forEach((n) => n.classList.toggle("on", n.dataset.section === section));
  const main = $("#main");
  main.innerHTML = '<div class="loading-row">loading…</div>';
  const renderers = {
    overview: renderOverview,
    secret: renderSecretSection,
    site: renderSiteSection,
    account: renderAccountSection,
  };
  (renderers[section] || (() => renderResourceSection(section))).call(null);
}
function buildSidebar() {
  const nav = $("#sidebar");
  nav.innerHTML = `<div class="grp-label">System</div>
    <button class="navitem" data-section="overview">▣ Overview</button>
    <div class="grp-label">Content</div>
    ${Object.entries(RESOURCES).map(([k, r]) => `<button class="navitem" data-section="${k}">${r.label}<span class="cnt" data-cnt="${k}"></span></button>`).join("")}
    <button class="navitem" data-section="secret">Secret File</button>
    <div class="grp-label">Configuration</div>
    <button class="navitem" data-section="site">Site Settings</button>
    <button class="navitem" data-section="account">Your Account</button>`;
  nav.querySelectorAll(".navitem").forEach((b) => (b.onclick = () => goto(b.dataset.section)));
}
async function refreshCounts() {
  try {
    const counts = await Api.adminOverview();
    Object.entries(counts).forEach(([k, v]) => {
      const el = $(`[data-cnt="${k}"]`);
      if (el) el.textContent = v;
    });
  } catch (e) {
    /* non-fatal */
  }
}

/* ---------- overview ---------- */
async function renderOverview() {
  const main = $("#main");
  let counts = {};
  try {
    counts = await Api.adminOverview();
  } catch (e) {
    main.innerHTML = `<div class="loading-row">Couldn't load the overview: ${esc(e.message)}</div>`;
    return;
  }
  main.innerHTML = `<div class="pagehead"><h2>OVERVIEW</h2><span class="desc">what's currently filed on this machine</span></div>
    <div class="cards">${Object.entries(RESOURCES)
      .map(([k, r]) => `<div class="card" data-go="${k}"><div class="n">${counts[k] ?? "—"}</div><div class="l">${r.label}</div></div>`)
      .join("")}</div>
    <p style="font-family:var(--term);font-size:16px;color:var(--ink-dim);max-width:560px;line-height:1.6">
      Edit any of these from the sidebar. Everything here is what the visitor-facing machine reads from —
      changes show up next time they load the site (or on their next visit if they're already in).
    </p>`;
  main.querySelectorAll("[data-go]").forEach((c) => (c.onclick = () => goto(c.dataset.go)));
  refreshCounts();
}

/* ---------- generic resource table ---------- */
async function renderResourceSection(key) {
  const schema = RESOURCES[key];
  const main = $("#main");
  main.innerHTML = `<div class="pagehead"><h2>${esc(schema.label.toUpperCase())}</h2><span class="spacer"></span><button class="btn primary" id="add-new">+ ADD NEW</button></div>
    <div class="tbl-wrap"><table><thead><tr>${schema.columns.map((c) => `<th>${esc(c.label)}</th>`).join("")}<th></th></tr></thead>
    <tbody id="tbl-body"><tr class="emptyrow"><td colspan="${schema.columns.length + 1}">loading…</td></tr></tbody></table></div>`;
  $("#add-new").onclick = () => openForm(key, null);

  let rows = [];
  try {
    rows = await Api.adminList(key);
  } catch (e) {
    $("#tbl-body").innerHTML = `<tr class="emptyrow"><td colspan="${schema.columns.length + 1}">Couldn't load: ${esc(e.message)}</td></tr>`;
    return;
  }
  renderTableRows(key, rows);
}
function cellValue(col, row) {
  const v = row[col.api];
  if (col.bool) return v ? "yes" : "";
  if (Array.isArray(v)) return v.map((t) => `<span class="tag">${esc(t)}</span>`).join(" ");
  const s = esc(v ?? "");
  return s.length > 70 ? `<span class="trunc" title="${s}">${s}</span>` : s;
}
function renderTableRows(key, rows) {
  const schema = RESOURCES[key];
  const body = $("#tbl-body");
  if (!rows.length) {
    body.innerHTML = `<tr class="emptyrow"><td colspan="${schema.columns.length + 1}">nothing filed yet — add the first one.</td></tr>`;
    return;
  }
  body.innerHTML = rows
    .map(
      (r) => `<tr data-rowid="${r.rowId}">${schema.columns.map((c) => `<td>${cellValue(c, r)}</td>`).join("")}
    <td class="actions"><button class="btn small" data-edit="${r.rowId}">EDIT</button> <button class="btn small danger" data-del="${r.rowId}">DELETE</button></td></tr>`
    )
    .join("");
  body.querySelectorAll("[data-edit]").forEach(
    (b) =>
      (b.onclick = () => {
        const row = rows.find((r) => String(r.rowId) === b.dataset.edit);
        openForm(key, row);
      })
  );
  body.querySelectorAll("[data-del]").forEach(
    (b) =>
      (b.onclick = async () => {
        const row = rows.find((r) => String(r.rowId) === b.dataset.del);
        if (!confirm(`Delete "${row.title || row.subject || row.id}"? This can't be undone.`)) return;
        try {
          await Api.adminDelete(key, row.rowId);
          toast("Deleted.");
          renderResourceSection(key);
          refreshCounts();
        } catch (e) {
          toast(e.message || "Delete failed.", true);
        }
      })
  );
}

/* ---------- form panel (create / edit) ---------- */
function previewTag(kind, url) {
  if (kind === "image") return `<img class="upload-preview" src="${esc(url)}" alt="">`;
  if (kind === "video") return `<video class="upload-preview" src="${esc(url)}" muted></video>`;
  return `<audio class="upload-preview" style="width:160px;height:32px" src="${esc(url)}" controls></audio>`;
}
function buildField(f, record) {
  const val = record ? record[f.api] : undefined;
  const id = "f_" + f.db;
  if (f.type === "textarea") {
    return `<div class="field"><label for="${id}">${esc(f.label)}</label>
      <textarea id="${id}" name="${f.db}" rows="${f.rows || 4}" maxlength="${f.maxlength || 5000}">${esc(val ?? "")}</textarea></div>`;
  }
  if (f.type === "checkbox") {
    return `<div class="field"><div class="checkbox-row"><input type="checkbox" id="${id}" name="${f.db}" ${val ? "checked" : ""}><label for="${id}" style="margin:0;text-transform:none">${esc(f.label)}</label></div></div>`;
  }
  if (f.type === "select") {
    return `<div class="field"><label for="${id}">${esc(f.label)}</label><select id="${id}" name="${f.db}">
      ${f.options.map((o) => `<option value="${o}" ${(val || f.default) === o ? "selected" : ""}>${o}</option>`).join("")}</select></div>`;
  }
  if (f.type === "tags") {
    return `<div class="field"><label for="${id}">${esc(f.label)}</label>
      <input type="text" id="${id}" name="${f.db}" value="${esc((val || []).join(", "))}" placeholder="trip, cozy, night"></div>`;
  }
  if (f.type === "json") {
    return `<div class="field"><label for="${id}">${esc(f.label)}</label>
      <textarea id="${id}" name="${f.db}" rows="${f.rows || 4}" style="font-size:12.5px">${esc(JSON.stringify(val ?? []))}</textarea>
      <div class="hint">Leave as-is unless you're comfortable editing raw note data.</div></div>`;
  }
  if (f.type === "number") {
    return `<div class="field"><label for="${id}">${esc(f.label)}</label>
      <input type="number" id="${id}" name="${f.db}" value="${val ?? f.default ?? 0}"></div>`;
  }
  if (f.type === "upload") {
    const hasMedia = !!val;
    return `<div class="field"><label>${esc(f.label)}</label>
      <input type="hidden" name="${f.db}" id="${id}" value="${esc(val || "")}">
      <div id="${id}_preview">${hasMedia ? previewTag(f.uploadKind, val) : '<span class="hint">no file uploaded — using generated art</span>'}</div>
      <div class="upload-row">
        <input type="file" id="${id}_file" data-kind="${f.uploadKind}" data-target="${id}" accept="${f.uploadKind}/*">
        ${hasMedia ? `<button type="button" class="btn small" data-clear="${id}">REMOVE</button>` : ""}
      </div>
      <div class="upload-status" id="${id}_status"></div></div>`;
  }
  // text (default)
  return `<div class="field"><label for="${id}">${esc(f.label)}</label>
    <input type="text" id="${id}" name="${f.db}" value="${esc(val ?? "")}" placeholder="${esc(f.placeholder || "")}" maxlength="${f.maxlength || 200}" ${f.required ? "required" : ""}></div>`;
}
function wireUploadInputs(schema) {
  schema.fields
    .filter((f) => f.type === "upload")
    .forEach((f) => {
      const id = "f_" + f.db;
      const fileInput = $("#" + id + "_file");
      if (!fileInput) return;
      fileInput.addEventListener("change", async () => {
        const file = fileInput.files[0];
        if (!file) return;
        const status = $("#" + id + "_status");
        status.textContent = "uploading…";
        status.className = "upload-status";
        fileInput.disabled = true;
        try {
          const res = await Api.adminUpload(f.uploadKind, file);
          $("#" + id).value = res.url;
          $("#" + id + "_preview").innerHTML = previewTag(f.uploadKind, res.url);
          status.textContent = "uploaded ✓";
          status.className = "upload-status ok";
        } catch (e) {
          status.textContent = e.message || "upload failed";
          status.className = "upload-status err";
        } finally {
          fileInput.disabled = false;
          fileInput.value = "";
        }
      });
    });
  $$("[data-clear]").forEach(
    (b) =>
      (b.onclick = () => {
        const id = b.dataset.clear;
        $("#" + id).value = "";
        $("#" + id + "_preview").innerHTML = '<span class="hint">no file uploaded — using generated art</span>';
        b.remove();
      })
  );
}
function readFormData(schema) {
  const data = {};
  schema.fields.forEach((f) => {
    const el = $("#f_" + f.db);
    if (!el) return;
    if (f.type === "checkbox") data[f.db] = el.checked;
    else if (f.type === "number") data[f.db] = el.value === "" ? f.default ?? 0 : Number(el.value);
    else if (f.type === "tags")
      data[f.db] = el.value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    else if (f.type === "json") {
      try {
        data[f.db] = JSON.parse(el.value || "[]");
      } catch (e) {
        throw new Error(`"${f.label}" isn't valid JSON.`);
      }
    } else data[f.db] = el.value;
  });
  return data;
}
let currentFormResource = null,
  currentFormRowId = null;
function openForm(key, record) {
  const schema = RESOURCES[key];
  currentFormResource = key;
  currentFormRowId = record ? record.rowId : null;
  $("#fp-title").textContent = (record ? "EDIT " : "NEW ") + schema.label.toUpperCase().replace(/S$/, "");
  $("#fp-body").innerHTML = schema.fields.map((f) => buildField(f, record)).join("");
  wireUploadInputs(schema);
  $("#overlay").classList.add("on");
  $("#formpanel").classList.add("on");
  setTimeout(() => $("#fp-body input,#fp-body textarea")[0]?.focus(), 60);
}
function closeForm() {
  $("#overlay").classList.remove("on");
  $("#formpanel").classList.remove("on");
}
$("#overlay").addEventListener("click", closeForm);
$("#fp-cancel").addEventListener("click", closeForm);
$("#fp-close-x").addEventListener("click", closeForm);
$("#fp-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const key = currentFormResource,
    schema = RESOURCES[key];
  let data;
  try {
    data = readFormData(schema);
  } catch (err) {
    toast(err.message, true);
    return;
  }
  const btn = $("#fp-save");
  btn.disabled = true;
  btn.textContent = "SAVING…";
  try {
    if (currentFormRowId) await Api.adminUpdate(key, currentFormRowId, data);
    else await Api.adminCreate(key, data);
    toast("Saved.");
    closeForm();
    renderResourceSection(key);
    refreshCounts();
  } catch (err) {
    const detail = err.details && err.details.length ? ": " + err.details.map((d) => d.message).join("; ") : "";
    toast((err.message || "Save failed.") + detail, true);
  } finally {
    btn.disabled = false;
    btn.textContent = "SAVE";
  }
});

/* ---------- secret file ---------- */
async function renderSecretSection() {
  const main = $("#main");
  let secret = { title: "", body: "" };
  try {
    secret = await Api.adminGetSecret();
  } catch (e) {
    /* use defaults */
  }
  main.innerHTML = `<div class="pagehead"><h2>SECRET FILE</h2><span class="desc">the hidden easter-egg content, unlocked by the blinking dot near the taskbar</span></div>
    <div class="settings-grid"><div class="settings-card">
    <div class="field"><label for="sec-title">Title</label><input id="sec-title" maxlength="150" value="${esc(secret.title)}"></div>
    <div class="field"><label for="sec-body">Body</label><textarea id="sec-body" rows="8" maxlength="5000">${esc(secret.body)}</textarea></div>
    <button class="btn primary" id="sec-save">SAVE</button></div></div>`;
  $("#sec-save").onclick = async () => {
    try {
      await Api.adminUpdateSecret({ title: $("#sec-title").value, body: $("#sec-body").value });
      toast("Secret file updated.");
    } catch (e) {
      toast(e.message || "Save failed.", true);
    }
  };
}

/* ---------- site settings ---------- */
async function renderSiteSection() {
  const main = $("#main");
  let site = { user_name: "", finale_heading: "", final_message: "" };
  try {
    site = await Api.adminGetSite();
  } catch (e) {
    /* use defaults */
  }
  main.innerHTML = `<div class="pagehead"><h2>SITE SETTINGS</h2></div>
    <div class="settings-grid">
    <div class="settings-card"><h3>The basics</h3><div class="desc">what shows up around the machine and in the finale.</div>
      <div class="field"><label for="s-user">Recipient's name</label><input id="s-user" maxlength="60" value="${esc(site.user_name)}"></div>
      <div class="field"><label for="s-heading">Finale heading</label><input id="s-heading" maxlength="80" value="${esc(site.finale_heading)}">
        <div class="hint">e.g. "HAPPY BIRTHDAY" or "HAPPY ANNIVERSARY" — shown huge at the very end.</div></div>
      <div class="field"><label for="s-msg">Final message</label><textarea id="s-msg" rows="8" maxlength="3000">${esc(site.final_message)}</textarea></div>
      <button class="btn primary" id="s-save">SAVE</button></div>

    <div class="settings-card"><h3>Access code</h3><div class="desc">what the visitor types to get in. Changing this signs out anyone currently in (their old code stops working next time they're asked).</div>
      <div class="field"><label for="s-pass1">New access code</label><input id="s-pass1" type="text" maxlength="200"></div>
      <div class="field"><label for="s-pass2">Confirm new access code</label><input id="s-pass2" type="text" maxlength="200"></div>
      <button class="btn" id="s-pass-save">CHANGE ACCESS CODE</button></div>
    </div>`;
  $("#s-save").onclick = async () => {
    try {
      await Api.adminUpdateSite({
        user_name: $("#s-user").value,
        finale_heading: $("#s-heading").value,
        final_message: $("#s-msg").value,
      });
      toast("Site settings saved.");
    } catch (e) {
      toast(e.message || "Save failed.", true);
    }
  };
  $("#s-pass-save").onclick = async () => {
    const a = $("#s-pass1").value,
      b = $("#s-pass2").value;
    if (!a || a.length < 4) return toast("Access code should be at least 4 characters.", true);
    if (a !== b) return toast("The two codes don't match.", true);
    if (!confirm("Change the access code? Do this only if you've shared the new one with your recipient.")) return;
    try {
      await Api.adminChangePasscode(a);
      toast("Access code updated.");
      $("#s-pass1").value = "";
      $("#s-pass2").value = "";
    } catch (e) {
      toast(e.message || "Save failed.", true);
    }
  };
}

/* ---------- account ---------- */
function renderAccountSection() {
  const main = $("#main");
  main.innerHTML = `<div class="pagehead"><h2>YOUR ACCOUNT</h2></div>
    <div class="settings-grid"><div class="settings-card"><h3>Change password</h3>
      <div class="field"><label for="a-cur">Current password</label><input id="a-cur" type="password"></div>
      <div class="field"><label for="a-new1">New password (min. 8 characters)</label><input id="a-new1" type="password"></div>
      <div class="field"><label for="a-new2">Confirm new password</label><input id="a-new2" type="password"></div>
      <button class="btn primary" id="a-save">CHANGE PASSWORD</button></div></div>`;
  $("#a-save").onclick = async () => {
    const cur = $("#a-cur").value,
      n1 = $("#a-new1").value,
      n2 = $("#a-new2").value;
    if (n1.length < 8) return toast("New password should be at least 8 characters.", true);
    if (n1 !== n2) return toast("The two new passwords don't match.", true);
    try {
      await Api.adminChangePassword(cur, n1);
      toast("Password changed.");
      $("#a-cur").value = $("#a-new1").value = $("#a-new2").value = "";
    } catch (e) {
      toast(e.message || "Change failed.", true);
    }
  };
}

buildSidebar();
boot();
