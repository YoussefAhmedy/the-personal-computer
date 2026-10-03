# Architecture

## Overview

One Express server does three jobs: it's a JSON API, it serves the two static frontends (the machine and the admin console), and it serves uploaded media — all from one process, one port, so there's nothing to coordinate between separate deployments.

```
                    ┌─────────────────────────────────────┐
                    │              Express                  │
                    │                                       │
  GET /  ──────────▶│  static: frontend/index.html + assets │
  GET /admin/ ─────▶│  static: frontend/admin/ + assets     │
  GET /uploads/* ──▶│  static: backend/uploads/ (gated)     │
                    │                                       │
  /api/auth/*   ───▶│  auth.routes → auth.controller        │
  /api/*        ───▶│  content.routes → content.controller  │──▶ SQLite (app.db)
  /api/admin/*  ───▶│  admin.routes → admin.controller       │
                    └─────────────────────────────────────┘
```

## Request flow: a visitor

1. `GET /` returns `frontend/index.html`. No auth required yet — the boot animation and BIOS text aren't sensitive.
2. The boot sequence types out the (static, non-personal) BIOS lines, then calls `GET /api/auth/me` to check for an existing valid session — a returning visitor skips straight past the prompt.
3. If not already authenticated, the page shows "ENTER ACCESS CODE:" inline in the terminal log and waits for a submit.
4. `POST /api/auth/login {passcode}` checks it against the bcrypt hash in `site_config`, and on success sets the `pc_visitor_token` cookie (JWT, `httpOnly`, 30-day expiry).
5. The frontend calls `GET /api/bundle`, which returns every content collection (memories, photos, notes, videos, tracks, messages, secret, site config) in one response — this is what used to be the hardcoded arrays at the top of the original file.
6. The desktop renders from that response. Opening an app (Memories, Photos, etc.) never makes another network call — everything needed was already in the bundle.

## Request flow: the admin

1. `GET /admin` (no trailing slash) 301-redirects to `/admin/` — necessary so the page's relative asset paths (`admin.css`, `admin.js`) resolve against the right base URL. `/admin/` then serves `frontend/admin/index.html`.
2. The console calls `GET /api/auth/me`; without an admin session, it shows the login form.
3. `POST /api/auth/admin/login {username, password}` checks against `admin_users`, and on success sets a *separate* cookie, `pc_admin_token` — deliberately a different cookie name from the visitor session, so being logged in as both at once (e.g. testing the site in one tab while editing it in another) never has one session clobber the other.
4. Every subsequent admin action (`GET/POST/PUT/DELETE /api/admin/*`) requires that cookie, checked strictly (a visitor-only session isn't enough).
5. Content edits go through a generic CRUD layer (`admin.controller.js`'s `makeCrud` factory) shared by all six content tables, since they're structurally identical (an auto ID, a cosmetic label, a sort order, and a handful of typed columns) — this is most of why adding a seventh content type later would be a small change, not a new subsystem.

## Data model

SQLite, one file (`backend/data/app.db`), seven tables:

| Table | Holds |
|---|---|
| `site_config` | Single row: recipient's name, finale heading, final message, access-code hash |
| `admin_users` | Admin login(s) — a table rather than a single row so a second admin could be added later |
| `memories`, `photos`, `notes`, `videos`, `tracks`, `messages` | The content collections, each with a cosmetic `ext_id` (e.g. `MEMORY_003`, shown in the UI) separate from its real numeric primary key |
| `secret_message` | Single row: the hidden easter-egg content |

Every content row optionally carries a `media_url` pointing at an uploaded file; when null, the frontend falls back to procedurally generating placeholder art/animation from the row's `art_type` (or, for tracks, synthesizing the chiptune from `notes_json`). This is why the site looks complete before a single photo is uploaded, and why uploading one is additive rather than required.

The API never returns raw database rows — `content.controller.js`'s `map*` functions translate each row into the shape the frontend already expects (camelCase, parsed JSON arrays, booleans instead of `0`/`1`). Every mapped record carries both `id` (the cosmetic ext_id, all the visitor-facing UI ever uses) and `rowId` (the real numeric key, which only the admin console uses, to build correct `/api/admin/<resource>/<rowId>` requests).

## Frontend structure

The original was one 998-line HTML file with several sequential inline `<script>` blocks sharing a global scope (window-manager state, the content arrays, helper functions). This version keeps that same *sharing model* — plain `<script src="...">` tags loaded in sequence, not ES modules — but splits it into focused files:

```
utils.js → audio.js → pixelart.js → api.js → state.js → windows.js
  → apps/{about,memories,photos,notes,messages,files,videos,music}.js
  → finale.js → boot.js
```

Load order matters for *when a name becomes callable*, not for whether code parses — every file just defines functions and constants; nothing actually executes app logic until a user clicks something, by which point every script has finished loading. `state.js`'s content arrays (`MEMORIES`, `PHOTOS`, etc.) start empty and are filled in by `loadContent()` once the access code is accepted; every app file reads from those same array names exactly as the original did, so the rendering logic for each app needed almost no changes — the only real additions are the optional real-media branches in `videos.js` and `music.js` (real `<video>`/`<audio>` when `media` is set, the original canvas/Web-Audio simulation when it isn't).

## Why SQLite, why one process

Both choices are about matching the deployment: this runs at the scale of one small site for one recipient, self-hosted by one person who isn't necessarily running a database server. SQLite is a single file, needs no separate service, and is trivial to back up (copy `app.db`). One Express process serving API + both frontends avoids CORS configuration entirely for the common case and means there's exactly one thing to deploy, one port to open, one process to keep running.
