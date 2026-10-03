# THE PERSONAL COMPUTER

A retro "1988 personal computer" you boot up, log into, and explore — memories, photos, notes, a video player, a music player, messages, and a hidden file, all building up to a final message. It started as a single self-contained HTML page; this version is the same experience rebuilt as a full-stack app: a real backend, a database, an access-code gate, and an admin console so you can update everything (including uploading real photos, videos, and audio) without touching code.

## What's here

- **The experience** (`frontend/index.html`) — the machine itself. Same retro CRT aesthetic, boot sequence, desktop, windows, chiptune player, and finale as the original — now loading its content from a real API instead of hardcoded arrays.
- **A backend** (`backend/`) — Node.js + Express + SQLite. Serves the content, handles login, and stores everything.
- **An admin console** (`frontend/admin/`) — a "setup utility"-styled dashboard where you edit every memory, photo, note, video, track, and message, upload real media, and change the access code — all from a browser, no code editing required.
- **Security** — an access-code gate in front of the whole site, hashed passwords, rate-limited logins, CSRF protection, validated file uploads, and the rest of what a real deployment needs. See [`docs/SECURITY.md`](docs/SECURITY.md) for the full picture.

## Quick start

You need [Node.js](https://nodejs.org) 18 or later.

```bash
cd backend
npm install
npm run seed      # creates the database and loads the original content
npm start
```

Then open **http://localhost:3000**. The machine boots exactly like the original, then asks for an access code — the default is `welcome` (see [Configuration](#configuration) to change it).

The admin console is at **http://localhost:3000/admin** — default login is `admin` / `changeme123`.

**Change both of those before you send this to anyone.** See the next section.

## Configuration

Everything personal lives in `backend/.env` (already created with working defaults) — see `backend/.env.example` for what every value does. The two you should change first:

```bash
SITE_PASSCODE=welcome        # what your recipient types to get in
ADMIN_PASSWORD=changeme123   # your own login to /admin
```

After changing either one, re-run the seed script with the reset flag so the change takes effect:

```bash
npm run seed:reset
```

⚠️ `seed:reset` wipes and rebuilds the database from the content built into `src/db/seed.js` — only run it *before* you've customized anything in the admin console, or as a deliberate "start over." Regular `npm run seed` (no flag) does nothing if a database already exists, so it's always safe to run.

## Customizing the content

Two ways to do this, and you can mix both:

1. **The admin console** (`/admin`) — add, edit, delete, and reorder memories, photos, notes, videos, tracks, and messages; upload real photos/videos/audio; edit the recipient's name and the final message; change the access code. This is the intended way once you're past initial setup.
2. **Edit the seed data directly** — open `backend/src/db/seed.js`, change the `MEMORIES` / `PHOTOS` / `NOTES` / `VIDEOS` / `TRACKS` / `MESSAGES` / `SECRET` arrays at the top (same shape as the original file's ✎ EDIT ZONE), then run `npm run seed:reset`. Good for a big first pass before you've opened the admin console at all.

### Real photos, videos, and music

Every memory/photo/video/track has a generated pixel-art placeholder by default — the site looks complete with zero uploads, same as the original. From the admin console, each of these has an optional upload field; add a real photo/video/audio file there and it replaces the generated placeholder automatically. Remove it and the placeholder comes back. Nothing else changes.

## Running it permanently (Docker)

```bash
docker compose up --build
```

This builds the backend, serves the frontend from the same container, and persists the database and uploads in Docker volumes so they survive rebuilds. Configuration still comes from `backend/.env`. See the comments in `docker-compose.yml` for a note on HTTPS and cookies if you're deploying somewhere other than your own machine.

Without Docker, `npm start` in `backend/` works anywhere Node.js runs — a small VPS, a Raspberry Pi, etc. Put a reverse proxy (Caddy, nginx) in front for a real domain and HTTPS.

## Project structure

```
the-personal-computer/
├── backend/
│   ├── server.js              entry point
│   ├── src/
│   │   ├── app.js             Express app + security middleware
│   │   ├── config/            environment/config loading
│   │   ├── db/                SQLite connection, schema, seed data
│   │   ├── middleware/        auth, CSRF, rate limiting, uploads, validation
│   │   ├── routes/            /api/auth, /api (content), /api/admin
│   │   ├── controllers/       route handlers
│   │   └── utils/             JWT helpers, file-signature checking
│   ├── data/                  app.db lives here (created by seeding)
│   └── uploads/                uploaded photos/videos/audio
├── frontend/
│   ├── index.html             the machine
│   ├── css/                   base styles, boot screen, desktop, apps, finale
│   ├── js/                    utils, audio, pixel-art generator, API client,
│   │                          window manager, one file per app, boot sequence
│   └── admin/                 the setup-utility admin console
├── docs/
│   ├── ARCHITECTURE.md        how the pieces fit together, request flow
│   └── SECURITY.md            what's protected, how, and why
└── docker-compose.yml
```

## How the pieces talk to each other

Visiting `/` loads the machine; it boots, asks for the access code, and once accepted, fetches everything (`GET /api/bundle`) in one call before showing the desktop. The admin console at `/admin` is a separate login (a real username/password, not the shared access code) with its own session, and talks to `/api/admin/*` for every content change. Both the visitor session and the admin session are independent — you can be logged into the machine as a visitor in one tab and into the admin console in another without either interfering with the other. Full details in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## A note on what's preserved

The redesign's goal was to extend this, not replace it: the boot sequence, the window manager, the pixel-art generator, the chiptune engine, the desktop metaphor, and the bilingual (EN/AR) content support are all the same code and behavior as the original, just reorganized into a real project structure and now backed by a database instead of hardcoded arrays. If you compare closely, the biggest visible addition is the "ENTER ACCESS CODE" prompt worked into the boot sequence — which used to be purely cosmetic BIOS-style text and now does something real.
