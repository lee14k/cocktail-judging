# Cocktail competition judging

A prototype for running a national cocktail competition online: contestants
enter through a form embedded on the competition website, twelve judges review
entries on their phones, and an admin watches the leaderboard and controls
when judging is open.

One Node service serves everything, so it deploys to Railway as a single app.

| Route    | Who          | What                                                                 |
| -------- | ------------ | -------------------------------------------------------------------- |
| `/judge` | Judges       | Sign in with a code, browse entries, save favorites, submit a shortlist |
| `/admin` | Organizers   | Leaderboard, judging open/close, entries by region, judge management  |
| `/enter` | Contestants  | Standalone entry form                                                 |
| `/embed` | Your website | The same form, light theme, designed to sit inside an iframe          |

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:5173. Sign in to `/admin` with `ADMIN-2026` and press
**Load demo** in Settings to get 18 fictional entries with some judging
activity already recorded. Judge codes are `JUDGE-01` through `JUDGE-12`
(visible in the admin Judges tab).

`npm test` bundles the client and drives the judge, admin, and entry-form
flows against a real server instance in jsdom.

## Deploy to Railway

1. Push this folder to a Git repo and create a Railway service from it.
   `railway.json` already sets the build (`npm ci && npm run build`) and start
   (`npm start`) commands, plus a health check at `/api/health`.
2. Add a **Volume** to the service and mount it at `/data`.
3. Set these environment variables:

   | Variable        | Value                                                     |
   | --------------- | --------------------------------------------------------- |
   | `DATA_DIR`      | `/data` (the volume mount path, so entries survive deploys) |
   | `ADMIN_CODE`    | Something private. The default `ADMIN-2026` is for testing only. |
   | `EMBED_ORIGINS` | Optional. Comma-separated origins allowed to iframe `/embed`, e.g. `https://yourcompetition.com`. Blank allows any site. |

4. Generate a domain. Judges use `https://your-app.up.railway.app/judge`.

Judges can add the site to their phone's home screen; it opens straight to the
judging screen with an app icon.

## Embedding the entry form

The admin Settings tab has a copy-ready snippet, but it comes down to:

```html
<iframe src="https://your-app.up.railway.app/embed" style="width:100%;min-height:900px;border:0"></iframe>
```

The form posts its height to the parent page (`{ type: 'entry-form-height', height }`)
so the iframe can grow instead of scrolling; the snippet includes the few
lines that listen for it.

If you end up building the form in another tool, `POST /api/entries` accepts
JSON with `drinkName`, `ingredients` (array), `method`, `inspiration`,
`region`, `entrantName`, `bar`, `city`, `email`, and `photo` (a base64 data
URL, JPEG/PNG/WebP, under 8 MB).

## How the brief maps to the code

**Judges see photo, name, ingredients, region, and nothing about the entrant.**
The judge API (`GET /api/judge/board`) projects each entry through
`judgeView()` in `server/store.js` before it leaves the server, so entrant
name, bar, city, and email are never in the judge's browser. The entry form
warns contestants not to put their name in the free-text fields judges do see.

**Unlimited favorites, then a limited shortlist with explicit confirmation.**
Favorites are the heart on each card. Switching to the Favorites view reveals
an "Add to shortlist" button on each card, and the rail pinned to the bottom of
the screen shows one slot per allowed pick. Submitting opens a confirmation
step that states how many entries are being sent through and that the
shortlist locks afterward. The server enforces all of it: shortlist must be a
subset of favorites, within the limit, and nothing changes after submission
or while judging is closed.

**Admin.** Leaderboard ranks entries by how many submitted judges shortlisted
them (favorites break ties), with an option to include in-progress picks.
Entries per region, judge progress, open/close judging, open/close entries,
shortlist limit, region list, and per-judge reopen/clear/rename are all in
`/admin`.

**Mobile.** Everything is laid out for a phone first. Touch targets are 44 px
or larger, the sheet-style detail view slides up from the bottom, and the
safe-area insets are respected for home-screen use.

## Project layout

```
server/index.js   Express API + static hosting of the built client
server/store.js   JSON-file persistence, photo storage, leaderboard math
server/seed.js    Demo entries and the SVG glass illustrations they use
src/judge/        Judge board, entry cards, detail sheet, shortlist rail + sheet
src/admin/        Leaderboard, entries, judges, settings
src/enter/        Contestant form, standalone and embedded
src/components/   Sheet, Field, Toast, sign-in gate, mark
src/index.css     Design tokens (dark "bottle" theme, light "paper" theme for the embed)
test/             jsdom end-to-end test (npm test)
```

## Before this runs a real competition

This is a prototype. The shortcuts worth replacing, roughly in order:

- **Storage is a JSON file on a volume.** Fine for one Railway instance and a
  few hundred entries. Swap `server/store.js` for Postgres (Railway provides
  one) before scaling out or if you need concurrent writes from multiple
  instances. The API surface in `server/index.js` doesn't need to change.
- **Photos live on the volume** under `DATA_DIR/uploads`. Move them to S3 or
  Cloudflare R2 if the volume gets large or you want a CDN in front of them.
- **Auth is a shared code per judge.** Sessions are stored server-side and
  sign-in attempts are throttled, but codes can be shared. Magic links or SSO
  would be the next step.
- **No email.** Contestants see an on-screen confirmation; nothing is sent.
