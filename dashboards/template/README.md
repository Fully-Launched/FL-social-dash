# Dashboard template

Three static, self-contained HTML files, built once and shared across every
client. `build.py` writes all generated output to `dashboards/dist/`
(gitignored — `python3 dashboards/build.py` regenerates it, and it's what
Vercel deploys, per `vercel.json` at the repo root) — `client-portal.html`
lands at `dist/clients/<slug>/portal.html`, `operator-dashboard.html` at
`dist/operator/dashboard.html`, `editor-dashboard.html` at
`dist/editor/dashboard.html`. Nothing outside `dist/` is ever written by
the build, and `dist/` itself holds nothing but that output — the
templates and source `config.json` files it reads stay where they are,
described below.

- `client-portal.html` — one per client, reads that client's `config.json`
  and `news.json`. For a `self-serve` client: shows concepts awaiting the
  client's approval, videos to film, and in-progress status. For every
  client, `self-serve` or `concierge`: a calendar of what's due, finished
  edits awaiting the client's final review (gate 3), analytics, and a
  niche-filtered News Consolidator. Generates a copy-paste status report
  (`templates/status-report-format.md`).
- `operator-dashboard.html` — reads every client's `config.json`, renders
  one screen: overdue, waiting on the owner's approval (both the concept
  gate and the edit gate), waiting on the client, with an editor, which
  clients are running low on scheduled content. Has a paste-in box that
  ingests a status report and updates its local view. A client filter bar
  sits above every page in the sidebar's `<main>` — "All clients" (the
  original aggregate view) or one specific client, which filters every
  page (Calendar, Schedule, Content Review, Ready to Post, Competitor
  Tracker, Analytics, News) down to just them and surfaces a "🔧 Add / edit
  videos for `<client>`" button. That button is the answer to "add a video
  for this client" — it opens their own portal (see Auth below), since
  this dashboard itself is a read-only-ish overview and has no way to edit
  a different page's data in place.
- `editor-dashboard.html` — one shared file, not per-client. Reads every
  client's `config.json` and shows every video currently `with_editor`, as
  both a list and a due-date calendar: the editing brief, a link to the
  footage, a link to that client's brand voice doc, and the due-to-edit
  date. Marking a video delivered moves it to `in_review`.

None of the three talk to a server for their content data — `config.json`
(git) plus each browser's own `localStorage` overrides remain the source
of truth, relayed between the operator and everyone else via the
copy-paste status report. All three *do* talk to Supabase for one thing
only: who's allowed to open them — see Auth below.

## Auth

All three dashboards sit behind a real login (`dashboards/template/auth.js`,
inlined by `build.py` the same way as `shell.js`/`shell.css`), backed by
Supabase Auth and the three role tables in
`supabase/migrations/001_social_os_schema.sql`. Nothing renders — no page
content, no data — until the gate resolves who's signed in:

- **Operator dashboard** — only a `social_operators` login gets in.
- **Editor dashboard** — an active `social_editors` login, or any
  `social_operators` login.
- **Client portal** — either a `social_client_users` login whose
  `client_id` resolves to *this* portal's own client (checked via a
  `social_clients` lookup, so one client's login can't open another
  client's portal by guessing the URL), or any `social_operators` login —
  which is what makes a logged-in operator "operator mode" inside a
  client's portal: `IS_OPERATOR` is set from the real login's role, not a
  URL flag. There is no other way in, and no unauthenticated fallback.

Signing in once carries across all three dashboards as long as they're
served from the same origin (e.g. one local `python3 -m http.server` at
the repo root) — the Supabase session lives in that origin's own
`localStorage`. Opened as separate `file://` pages instead, each may need
its own sign-in, since browsers don't reliably share `localStorage` across
different `file://` paths.

**Quick actions** — the operator dashboard's client list, filtered to one
client, adds a "+ New video idea" composer and turns the Content Review /
Ready to Post queues' Approve / Request revisions / Mark posted buttons
into links that open that client's own portal with the action already
spelled out (`quickApprove`, `quickRevise` [+ `note`], `quickPost`, or
`quickAdd` [a whole new video's fields, JSON-stringified] — all read by
`runQuickActionIfAny()` in client-portal.template.html, and only run once
that page's own auth gate confirms an operator login). The portal applies
the action to its own `localStorage` the instant it loads, then cleans the
one-shot data out of its own hash so a later reload never replays it.
Falls back to the plain local-only buttons for any client with no
`portalUrl` on file. `editor-dashboard.html`'s "Mark delivered" does the
same thing, one action (`quickDeliver`), on top of its own always-on local
override.

## The video card

Every video is the same record wherever it appears — a client's calendar, the
operator's queues, the editor's queue. A compact card/chip shows title +
status; clicking it opens the same detail view everywhere (`openVideoModal`
in `shell.js`): overview, hook, body, filming direction, caption, dates, the
Drive links relevant to whoever's looking, and the editor brief if one
exists. Only the action buttons at the bottom change per audience — a
client sees approve/reject controls for their gates, an editor sees "mark
delivered," the operator sees approve/request-revisions for the edit gate.
This is the "Airtable, but every row is a video card" model: one shared
detail record, several list/calendar surfaces into it, never a different
copy of the data per view.

**One deliberate exception**: the client portal calls `openVideoModal` with
`hideEditorBrief: true`. Editing instructions (story beats, must-keep,
music, CTA, platform specs) are for the editor and the owner — the person
who filmed the footage never sees them, even though it's the same record
they're looking at. A revision request (`note`) still shows to everyone —
that's status, not instructions.

## The three review gates

The full pipeline (`CLAUDE.md`'s Build Spec section has the complete
version) has three human approval gates, not two. Two are the client's, one
is the owner's:

1. **Concept gate (client's)** — `self-serve` clients only. Before filming,
   the client sees the concept + filming instructions and approves,
   requests changes, or denies it. `concierge` clients skip this entirely —
   Tait films the interview himself, so there's no separate client-facing
   concept step.
2. **Edit gate (owner's)** — unchanged from before. Tait reviews the
   editor's cut and either approves it or sends it back with revisions.
3. **Final gate (client's)** — new. Once Tait approves, *every* client
   (both systems) does one more review of the finished video before it's
   allowed to post — approve, or request revisions.

## config.json schema

One file per client, at `dashboards/clients/<slug>/config.json`. This is a
generated mirror of `clients/<slug>/calendar.md` — `calendar-planner` keeps
both in sync; don't hand-edit one without the other.

```jsonc
{
  "client": "grad-gig",
  "displayName": "Grad Gig",
  "clientSystem": "self-serve",   // or "concierge" — see gate 1 above
  "portalUrl": "<the URL this client's portal.html is actually served from — powers the operator/editor dashboards' \"Live edit\"/quick-action deep links, see Auth above>",
  "planWindow": { "start": "2026-08-24", "end": "2026-09-18" },
  "driveFolders": {
    "root": "<link — the client's folder inside the Fully Social OS Drive folder>",
    "footageUploads": "<link — client drops raw footage here; editor pulls from here>",
    "finalEdits": "<link — editor delivers cuts here for owner approval>",
    "brandVoice": "<link — Google Doc mirror of brain.md's founder/voice/do-don't sections>",
    "hooks": "<link — good hooks for this client, for reuse/reference>",
    "assets": "<link — the client's whole 05 Assets folder, for the operator's quick-link chip>",
    "customerData": "<link — the Customer Data doc/folder specifically, surfaced in the client portal's Important Documents>",
    "contentIdeas": "<link — the Content Ideas doc/folder (also holds the 3 pillars/formats/perspectives), same page>"
  },
  "videos": [
    {
      "id": "grad-gig-w1-01",
      "title": "...",
      "platform": ["instagram", "tiktok"],
      "hook": "...",
      "overview": "... (one or two sentences — what this video is and why, for anyone glancing at the card)",
      "body": "... (the script or talking points — script-writer's output, restated for the card)",
      "filmingDirection": "... (full plain-language brief, or a link to the fuller brief in concepts/)",
      "caption": "... (the actual post caption — goes with the video into the posting database)",
      "dueToFilm": "2026-08-25",
      "dueToEdit": "2026-09-01",   // = postDate − 7 days, see the 7-day rule below
      "postDate": "2026-09-08",
      "status": "to_film",
      "note": null,                // reason for rejection, or the latest revision request
      "assignedEditor": null,      // editor's name, once assigned — drives editor-dashboard.html
      "editorBrief": {             // written by the editor-brief skill; powers editor-dashboard.html
        "storyBeats": null, "mustKeep": null, "captionsStyle": null,
        "musicVibe": null, "ctaOverlay": null, "platformSpecs": null
      }
    }
  ],
  "pendingConcepts": [
    {
      "id": "grad-gig-cyc1-04",
      "title": "...",
      "cycle": "clients/<slug>/concepts/<cycle>.md",
      "hook": "...", "identity": "...", "drive": "...",
      "status": "pending_approval"
    }
  ],
  "competitors": [
    {
      "name": "...", "tag": "direct",
      "platforms": ["instagram", "tiktok"],
      "followers": 12000, "engagementRate": 5.1,
      "postsPerWeek": 4.2, "growth30d": 3.3
    }
  ],
  "analytics": [
    {
      "date": "2026-08-01", "platform": "instagram",
      "impressions": 22000, "followers": 4800, "engagementRate": 3.1
    }
  ]
}
```

`pendingConcepts` is a *different, earlier* gate than the concept gate
above — this is the agency-internal one from `CLAUDE.md` principle 3 (Tait
approves a concept before the client ever sees it). Once that clears,
`filming-brief` writes the video into `videos` with `status:
"concept_pending"` (self-serve) so the client's gate-1 review can happen;
for `concierge` clients it's written straight in at `filmed` or later, since
gate 1 doesn't apply. `competitors` and `analytics` are **manually
entered** — see the note below on why this repo doesn't auto-sync either.
There's also `dashboards/operator/news.json` — manually curated, for the
News Consolidator page on both the operator dashboard (everything) and each
client portal (filtered). Each item is
`{ title, source, url, category, date, relevantClients }` —
`relevantClients` is an array of client slugs; omit it (or leave it empty)
for an item every client's portal can see, or list specific slugs to keep
something agency-only-relevant off client portals entirely by giving it a
slug that matches no real client. None of `pendingConcepts`, `competitors`,
`analytics`, or `news.json` are generated by a skill yet; edit them directly
until there's a reason to script it.

There's also `dashboards/operator/agency-resources.json` — a flat
`{ filmingGuide, editorPlaybook }` map of agency-wide (not per-client)
document links, feeding each client portal's and the editor dashboard's
Important Documents page. Add a key here for anything that's genuinely the
same link across every client or every editor; anything client-specific
(Customer Data, Voice, Content Ideas) comes from that client's own
`driveFolders` instead.

**"Needs content ideas"** on the operator Dashboard home is a computed
signal, not a stored field: a client is flagged if they have zero
`pendingConcepts` awaiting approval *and* fewer than 3 videos still at
`concept_pending`/`to_film`. It's a heuristic, not a promise — read it as
"worth checking," not as ground truth.

**Why manual, not live-synced:** `CLAUDE.md` principle 5 rules out
always-on scraping or scheduled pulls — an auto-refreshing Analytics or
Competitor Tracker page would need exactly that (platform API polling,
scheduled competitor scrapes). The pages are built to look and behave like a
live product; the data behind them is something a human pastes in
periodically, the same posture as `research-sweep` and `performance-review`.

## `status` values, in order

`concept_pending` → `to_film` → `filmed` → `ready_to_edit` → `with_editor` →
`in_review` → `client_review` → `ready_to_post` → `posted`, with `rejected`
reachable from `concept_pending`. `concept_pending`/`to_film` only apply to
`self-serve` clients — see the three gates above.

- `concept_pending` — gate 1, waiting on the client.
- `to_film` — client approved the concept, needs to film.
- `filmed` / `ready_to_edit` — client-reported filming progress.
- `with_editor` — editor actively cutting. `editor-dashboard.html` is where
  this happens.
- `in_review` — gate 2, waiting on the owner. A revision request here sends
  the video back to `with_editor` with `note` set to the revision ask —
  it does not mean starting over from `concept_pending`.
- `client_review` — gate 3, waiting on the client. A revision request here
  also sends it back to `with_editor` with `note` set.
- `ready_to_post` — every gate cleared, waiting for whoever holds the login.
- `posted` — done.
- `rejected` — the client denied the concept at gate 1.

## Dates are always hand-editable

`dueToFilm`, `dueToEdit`, and `postDate` are never computed or locked —
`operator-dashboard.html`'s **Schedule** page lets the owner edit any of the
three, per video, directly. `calendar-planner` suggests `dueToEdit` as 7
days before `postDate` only when a video is *first* scheduled; after that,
every date is whatever the owner sets it to, and nothing in this repo
recalculates or overwrites it. Schedule edits live in that browser's
`localStorage` until relayed back (a "Generate changes report" button
produces a plain diff to hand to `calendar-planner`) — same posture as
everything else that isn't `config.json` itself.

The client portal only ever writes status changes for gates it owns
(`concept_pending`→approve/changes/deny, the filming progress statuses, and
`client_review`→approve/revise) locally (in the client's own browser) and
expresses each change as a status report line — it never edits
`config.json` directly, since there's no backend to write it back to.
`calendar-planner` applies the pasted report to the real `config.json` after
the owner relays it. `editor-dashboard.html` follows the same pattern: it
writes its "mark delivered" action to its own `localStorage`, expressed as
the same kind of status-report line, applied the same way.

**Upload/download model (v1 — deep links, not in-page):** every Drive
reference above is a link, not an embed. `client-portal.html` puts a
prominent "Open footage folder" button next to each video;
uploading/downloading happens in Drive's own UI in a new tab.
`operator-dashboard.html` surfaces all six folder links per client as quick
access. This is deliberately the simple version — real in-page upload/
download via the Drive API, and per-video (not per-client) upload
locations, are a distinct, larger project and aren't in scope until there's
a specific reason the deep-link version isn't enough.

## Status quo right now

The real Drive structure exists for Grad Gig (`Fully Social OS/Grad Gig/`
with its five subfolders) — see `dashboards/clients/grad-gig/config.json`
for the live folder links. `videos` is still empty for Grad Gig: it
populates once `filming-brief` produces real videos to schedule. Building it
with placeholder videos would violate principle 4 (never invent client
facts), so the folder structure and schema are built ahead of the video
data on purpose. Two Drive-less test clients (`test-loop-coffee`,
self-serve; `test-grandpas-hardware`, concierge) carry fabricated data
across every status, clearly labeled, to prove both systems' UI paths work.
