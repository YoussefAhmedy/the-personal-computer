# Security

What's protected, how, and the reasoning behind each choice — so whoever maintains this later (including future you) knows what's deliberate versus what's a shortcut.

## Threat model

This is a small, personal, self-hosted site with two kinds of people who should ever reach it: the one recipient it was made for, and the person who built it (the admin). Everyone else should be kept out. It is **not** designed to resist a determined, resourced attacker (a nation-state, a targeted attack) — it's designed to stop the realistic risks for something like this: a shared link leaking, someone guessing a short code, or a casual attempt to poke at the API.

## Getting in

**Visitors** enter a single shared access code (set via `SITE_PASSCODE`, changeable from the admin console). It's stored as a bcrypt hash, never in plaintext, and checked with a constant-effort comparison. A correct code issues a signed, `httpOnly` session cookie good for 30 days — so the recipient doesn't have to re-enter it constantly, but a stolen link alone (without the code) doesn't get anyone in.

**Admins** log in separately with a real username and password (also bcrypt-hashed) at `/admin`, on a 12-hour session. This is a second, independent gate — a visitor session never grants admin access, and vice versa isn't assumed either (an admin session *is* accepted for viewing visitor content, since there's no reason to make yourself log in twice to see your own site).

Both login endpoints are rate-limited (10 attempts/15 min for the access code, 8/15 min for admin) specifically to blunt brute-forcing a short code. This is the single most important defense in the whole app, since the access code is short and shared by design.

## Sessions

Both session types are JWTs signed with `JWT_SECRET`, stored as `httpOnly`, `SameSite=Lax` cookies — never in `localStorage`, never readable by page JavaScript. `httpOnly` means a cross-site scripting bug elsewhere couldn't steal the session even if one existed; `SameSite=Lax` means the cookie isn't attached to most cross-site requests in the first place.

If `JWT_SECRET` isn't set, the app generates a random one at startup so it's still easy to try out locally, but logs a loud warning — every restart invalidates every session, which is a fine tradeoff for a demo and a bad one for anything real. Set it in `.env` before deploying.

## CSRF

Because sessions are cookies (not a token you'd manually attach), the browser will attach them to *any* request to your domain — including one triggered by a malicious page the recipient happens to have open. Every state-changing request (anything that isn't a GET) requires a second, matching token sent as a custom header (`X-CSRF-Token`), read from a separate, non-`httpOnly` cookie the server issues. A cross-site request can trigger the cookie-bearing request, but can't read that cookie to forge the matching header — so the two won't match. Login endpoints are the one exception (there's no session yet to protect), and rely on rate limiting instead.

## Uploads

The admin console accepts real photos, videos, and audio to replace the generated placeholders. Three layers here:

1. **A loose first-pass filter** on the claimed MIME type and a size cap, before anything touches disk.
2. **A real check on the actual bytes.** The browser-supplied content type and file extension are just labels the uploader's browser chose — nothing stops a request claiming to be a `.jpg` from containing something else entirely. After the upload lands, the server reads the file's first few bytes and checks them against the actual signature for JPEG/PNG/GIF/WebP/MP4/WebM/MP3/WAV/OGG. Anything that doesn't match what it claims to be is deleted immediately, before it's ever referenced by a database row.
3. **Randomized filenames.** Uploads are renamed to a random UUID on save — never the original filename — which avoids path-traversal tricks and means uploaded files aren't guessable or enumerable.

Uploaded files are served from `/uploads/*`, which sits behind the same visitor/admin session check as everything else — not public, even though the filenames are effectively unguessable on their own.

## Input validation

Every field the admin console can write is validated server-side (length limits, type checks, an allow-list for things like art-style names) regardless of what the form itself sends — the client-side form is a convenience, not the actual boundary. `media_url` specifically is restricted to paths this app's own upload endpoint returns (`/uploads/images/...` etc.) — it can never be pointed at an arbitrary external URL.

## The database

All queries go through parameterized statements (`better-sqlite3`'s prepared statements) — user input is always passed as a bound parameter, never concatenated into SQL text, so there's no SQL injection surface regardless of what ends up in a title or caption field.

## Transport and headers

`helmet` sets a locked-down set of security headers, including a Content-Security-Policy that only allows scripts from the app's own origin (`script-src 'self'`, no inline scripts, no `eval`) — this app never needed either, so there's no reason to allow them. Style attributes are the one exception (`style-src` allows `'unsafe-inline'`): a handful of inline `style="..."` attributes remain from the original single-file design's template strings, and CSP has no per-attribute nonce mechanism the way it does for `<script>` tags — only a blanket allow. Script injection is the more dangerous vector by far, so that's where the strictness is spent.

Cookies get the `Secure` flag (HTTPS-only) automatically whenever `NODE_ENV=production` (which Docker Compose sets by default) — meaning logins will silently fail if you deploy behind plain HTTP with no TLS in front. See the note in `docker-compose.yml` if that's your situation.

## What this doesn't do

Worth being honest about the edges:

- **Rate limiting is in-memory**, per server process. Fine at this scale (one small server, a handful of users); it resets on restart and wouldn't coordinate across multiple instances behind a load balancer. Not a concern unless this grows into something much bigger than it's designed for.
- **The "secret" easter-egg file** (the hidden blinking dot near the taskbar) is a UI-level surprise, not a real access boundary — it's unlocked by clicking it, not by any credential. Once someone's past the access code, they're a trusted visitor; the secret file is a delight, not a security feature.
- **No account lockout beyond rate limiting** — a determined attacker with a slow-enough attempt rate could stay under the rate limit indefinitely. For a personal project at this scale, the combination of a non-trivial access code plus rate limiting is a reasonable line to draw; if you want more, the codebase is small enough to extend (e.g., a persistent failed-attempt counter with an escalating lockout).
