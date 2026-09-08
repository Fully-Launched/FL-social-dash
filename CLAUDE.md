# Fully Social OS

A content operating system for running social media for founder-led brands.
Built for an agency of one to scale past one — by turning the repeatable parts
of the process into skills, while keeping the parts that require judgment
manual and human.

This file used to be split across `CLAUDE.md` (operating doctrine) and
`SYSTEM-BLUEPRINT.md` (business model + build-vs-blueprint gap analysis).
They're merged here, in four parts:

- **Build Spec** — what the business does, the principles that govern every
  skill, the two-system business model, the skill pipeline, and the Drive
  structure. Slow-changing; this is what to build toward.
- **Architecture Reference** — how the system is actually built right now:
  repo layout, auth, the dashboards, the build/deploy pipeline. Changes
  whenever the architecture does.
- **Current State** — a snapshot: what's live, what's deleted, what maps to
  the blueprint and what doesn't yet. Fast-changing; trust this over any
  other section if they disagree.
- **Roadmap / Not Yet Built** — the phased end-state for the full client
  lifecycle, documented ahead of being built, so the next several build
  steps have a known destination instead of getting decided one at a time.

## What the business does

Clients hire the agency to run their social media end to end: analyze their
ideal customer, find their positioning, generate content concepts and scripts,
direct filming, hand footage to editors with instructions, review cuts, and
post. Performance data feeds back in so the next cycle is smarter than the
last.

---

# Build Spec

## Core principles — do not violate these

1. **Substance comes from the client's own words** — sales calls, objections,
   DMs, voice notes. Research (`research-sweep`) determines packaging only:
   format, hook shape, structure. Never invert this. It's why most agency
   content sounds identical — it's written from the outside in instead of the
   inside out.

   **The client is not the customer.** Tait's client is the business he
   does social media for; that business's customers are a different person
   he has essentially no direct channel to. So "the client's own words"
   splits into two things that must stay tagged apart: what the client says
   about *themselves* (their voice, their story — `voice-doc`), and what the
   client says *about their customer* (`customer-data-doc`, tagged
   `[founder's account]` — this is the normal case, not a fallback).
   Industry research and AI-inferred predictions about a client's customer
   do belong in the Customer Data document — Tait wants that generative
   step — but only in a clearly separate "unconfirmed" section, never mixed
   into the confirmed material above it, and never treated as real until
   Tait reviews and edits it. This is the one deliberate, bounded exception
   to "never invent" in the whole system — see `customer-data-doc`.

2. **Every concept is built on V.I.D.** — see `templates/vid-method.md`.
   Visual hook (stop scroll in 2s), Identity (viewer thinks "this is for
   me"), Drive action (one clear ask). Identity is the pillar everyone skips
   and it's what gets content screenshotted. Nobody screenshots a tip.
   Content performs when someone sees themselves in a real story, not when
   it hands over value — see `templates/story-over-value.md` for the doctrine
   this pillar actually runs on, and what it means for what's worth
   extracting from a client in the first place.

3. **Two gates stay human.** The agency owner approves every concept before
   the client sees it, and every edit before delivery. Skills draft toward
   these gates — they never skip past them. That judgment is the product.

4. **Never invent client facts.** If a skill needs a number, a story, or a
   credential that isn't in `clients/<name>/brain.md` or the mined source
   files under `clients/<name>/sources/`, it stops and asks rather than
   guessing or generalizing.

5. **Research runs on demand, not on a schedule.** `research-sweep` is
   invoked when a cycle needs it. No always-on scraping, no background
   monitoring jobs, no scheduled pulls from research tools (including Poppy
   AI — see below).

6. **Posting is manual.** A human with the login posts. Nothing in this repo
   publishes to a platform, schedules a post via an API, or automates
   publishing in any way.

## The business model — two systems, one pipeline

Recorded 2026-08-21, from Tait's own walkthrough. If anything elsewhere in
this file, a skill, or a dashboard ever seems to disagree with this section,
this section wins — fix the other one.

**System 1 — self-serve.** For a business or personal-brand client who
understands social media well enough to drive their own portal: approve
concepts, film their own footage, upload it, give final sign-off.

**System 2 — concierge.** For a client who doesn't want to touch a portal —
"someone like my dad." Older, less online, just wants to be interviewed.
Tait does the filming himself, in person, by asking the client questions.
Everything downstream (editing, review, posting, performance) is the same
pipeline as System 1 — only the front end (how footage gets made) differs.

Both systems produce the same core documents and run through the same
approval gates.

### System 1 — Self-serve

1. **Get the client interested**, then run intake: a call, or a voice memo,
   to extract their customer profile, their voice, and their authentic
   solutions to the problems their business solves.

2. **AI organizes — it does not create.** Every input (call transcripts,
   LinkedIn posts, voice memos, answers to the authenticity questions) gets
   organized into documents. Zero AI-generated content at this stage: no
   rewriting, no changing their words or voice. Organization only. Same
   rule as principle 1, stated even more strictly for this stage.

3. **The documents this stage produces** (all live in the client's Assets
   folder):
   - **Customer Data** — ideal hooks, customer dreams, customer problems /
     typical pain points, typical fears, practical goals.
   - **Three Pillars / Three Formats / Three Unique Perspectives** — the
     "taste document." The single most important document for the client —
     this is where their personal brand (or business brand) voice actually
     comes from. Applies to businesses too, not just individuals.
   - **Unique Perspectives Overview** — a fuller write-up of the three
     perspectives, not just the three one-liners: their unique view on
     things, expanded. This is what content creation draws from most.

4. **Poppy AI setup, per client** — build a competitor list, and use Poppy's
   chat to surface roughly the ten best-performing formats in the client's
   niche, then chat with it to generate content ideas from those formats.
   Manual, per-client, on demand — see Poppy AI below.

5. **Client gets added to their portal.** The portal contains:
   - The Assets folder (all documents from step 3, plus Customer Data)
   - Ability to approve posts
   - Analytics
   - The competitor list
   - Poppy AI access
   - Filming instructions, for clients filming their own content

6. **AI-assisted content calendar** — once the client is briefed, build the
   month's content calendar using the authentic material pulled in step 2.

7. **Client reviews the calendar.** Each card on the calendar shows what to
   film and the instructions for it. The client can **approve**, ask for a
   **rewrite**, or **reject** it outright — this is the first client gate.

8. **Client films, then uploads footage directly to that same content
   card** — not a general dump folder, the specific card for that piece of
   content. (Current build uses one shared Footage Uploads folder per
   client, deep-linked, not per-card upload — see Current State.)

9. **Editor dashboard** (a view distinct from the operator dashboard) shows
   each editor the videos assigned to them, with:
   - Editing instructions and expectations, per video
   - A link to download the footage the client uploaded
   - The client's Assets folder
   - The client's brand voice / brand guidelines doc, so edits stay unique
     to that client

10. **Editor edits, uploads the cut to a "finished" database.**

11. **Owner review (gate 2).** Tait opens each finished video and either
    requests revisions or approves it.

12. **Client review (gate 3) — the client's own portal.** Once Tait
    approves, the client sees the finished video in their portal and gives
    final sign-off before it can be posted. This is a *second*, distinct
    client approval — separate from step 7's concept approval.

13. **Needs-to-be-posted database.** Approved content lands here with a post
    date.

14. **The 7-day rule.** The edit-due date is always 7 days before the post
    date — enough runway for revisions between owner review and posting.

15. **Posting database** — includes how to post, where (platform), and the
    caption. Someone with the login posts manually (principle 6 — this
    never becomes automated).

16. **Monthly performance loop.** After 30 days, a research agent reviews
    everything posted in that window and writes a document on what
    performed best and *why* — specifically which pillars, which formats,
    and which perspectives worked. That document becomes an input to the
    next month's cycle (step 6 onward).

### System 2 — Concierge (interview-led)

1. Extract the client's three pillars / three formats / three unique
   perspectives — same document as System 1, step 3. Voice doesn't need
   separate extraction here; it comes through naturally in the filmed
   interview itself.

2. **AI generates a custom interview question set** for this specific
   client — questions built to draw out their unique perspective and their
   read on their typical customers' concerns. Personalized per client, not
   a fixed generic list.

3. **Tait films the client by asking them these questions directly.** This
   interview *is* the raw footage — there's no separate "client films their
   own content" step in this system.

4. **Poppy Board** — a reference board of the best-performing / outlier
   content in this client's niche, used to guide how the editor should cut
   the interview footage.

5. **Editor dashboard**, same as System 1 step 9, plus: for each video, the
   Poppy Board reference ("here's what this should look like") alongside
   the instructions and due date.

6. Editor edits, uploads to the finished database.

7. **Owner review (gate 2)** — approve or give suggestions, same as System 1
   step 11.

8. **Client review (gate 3)** — client reviews the finished video in their
   portal, same as System 1 step 12.

9. **Needs-to-be-posted database**, same 7-day edit-to-post rule as System 1.

10. **Posting database** — same shape as System 1.

11. **Monthly performance loop** — same as System 1 step 16: what worked,
    what didn't, broken down by pillar/format/perspective, feeding the next
    round.

## The thirteen skills

| Skill | Stage | Produces |
|---|---|---|
| `client-brain` | intake | `clients/<slug>/brain.md` |
| `transcript-mine` | intake | saves the raw source + mines Stories, in `clients/<slug>/sources/` |
| `voice-doc` | intake, ongoing | `clients/<slug>/sources/voice.md` — cumulative voice record + distilled Voice Profile |
| `customer-data-doc` | intake, ongoing | `clients/<slug>/sources/customer-data.md` — verbatim pains/dreams/fears/goals/objections/hook candidates |
| `positioning-doc` | intake, ongoing | `clients/<slug>/sources/positioning.md` — candidate pillars/formats/perspectives + content idea bank |
| `interview-questions-doc` | intake, concierge only | `clients/<slug>/sources/interview-questions.md` — personalized on-camera questions built to draw out stories |
| `research-sweep` | on demand | dated file in `clients/<slug>/research/` |
| `concept-engine` | planning | `clients/<slug>/concepts/<cycle>.md` (gate 1: owner approval) |
| `script-writer` | production | script attached to an approved concept |
| `filming-brief` | production | plain-language filming instructions for the client |
| `editor-brief` | post-production | handoff instructions + Drive link for the editor |
| `calendar-planner` | scheduling | `clients/<slug>/calendar.md`, feeds the dashboards |
| `performance-review` | feedback | performance notes folded back into the next `concept-engine` run |

`voice-doc`, `customer-data-doc`, `positioning-doc`, and
`interview-questions-doc` share `templates/anti-slop-checklist.md` —
inviolable rules, a taste pass, and a refusal template for when the
material can't answer what's needed. The first three organize and extract;
they never draft content. `interview-questions-doc` is the one exception —
it authors questions, not extracted material — but every question still has
to trace to something real in that client's own `voice.md` or
`customer-data.md`. `script-writer` and `concept-engine` load `voice-doc`'s
Voice Profile before writing anything.

## Client Drive structure

Every client gets one folder inside the shared **Fully Social OS** Drive
folder, with five fixed subfolders — this is the template, don't improvise a
different shape per client:

```
Fully Social OS/
  General/
    Assets/                    — shared mockup/template docs, not client-specific
      Ideal Customer Profile — Template   — duplicate this per client, then fill it
  <Client Name>/
    01 Footage Uploads   — client drops raw footage here; editor pulls from here
    02 Final Edits       — editor delivers cuts here for owner approval
    03 Brand Voice       — Google Doc mirror of brain.md's founder/voice/do-don't
    04 Hooks             — good hooks for this client, for reuse/reference
    05 Assets/           — this client's filled-in research and idea documents
      Ideal Customer Profile   — Google Doc, mirrors brain.md's Ideal Customer
                                  section, built from the General/Assets template
      Transcripts/              — voice memo / call transcripts, one file per source
      Content Ideas             — concept-engine output, longer-form idea bank
```

`brain.md` in the repo is the source of truth for Brand Voice and the Ideal
Customer Profile — the Drive docs are a synced mirror for people who live in
Drive, not a second source. Update the repo, then re-sync the Drive doc;
don't edit the Drive doc directly and let it drift.

The dashboards link out to these folders (deep links, not in-page upload);
they don't duplicate their content. See Architecture Reference below for
where a client's folder links actually live now (it's no longer only
`config.json`).

## Poppy AI

`v2.getpoppy.ai` is a manual research aid, not an integration. When
`research-sweep` runs, checking Poppy AI for outlier formats in the client's
niche is one input a human can bring back and paste in — same as checking a
competitor's page by hand. Nothing in this repo calls it, scrapes it, or
polls it. That would violate principle 5.

---

# Architecture Reference

Describes how the system is actually built. If this disagrees with Build
Spec above, Build Spec is the target and this is the gap — see Current
State for what's tracked as not-yet-built.

## Repo map

```
fully-social-os/
  CLAUDE.md                  this file
  vercel.json                 build command, output directory, redirects/rewrites
  templates/                 shared doctrine — the V.I.D. method, document
                              formats every skill writes into
  .claude/skills/            the thirteen skills (see Build Spec)
  clients/<slug>/
    brain.md                 output of client-brain — positioning, ICP,
                              voice, pillars/formats/perspectives, facts
    sources/                 raw material: call transcripts, voice memo
                              transcripts, DMs, objections — mined, not paraphrased
    research/                dated research-sweep outputs (packaging only)
    concepts/                concept-engine output, one file per cycle,
                              gated by owner approval before scripting
    calendar.md               scheduled videos for the active plan window
    status/                  pasted-in status reports from the client portal
  dashboards/
    template/                 the dashboard templates (client portal, editor)
                               + shared shell.css/shell.js/auth.js — build.py
                               inlines these into every generated page
    clients/<slug>/config.json   per-client source data: display name, plan
                               window, drive folder links, videos, concepts,
                               competitors, analytics — see "What's live vs.
                               git-driven" below for which of this a client's
                               portal actually reads anymore
    operator/                 the operator dashboard template + news.json /
                               agency-resources.json (agency-wide, not per-client)
    dist/                     BUILD OUTPUT ONLY, gitignored — what build.py
                               writes and what Vercel actually deploys.
                               Never hand-edited.
  supabase/
    migrations/                001_social_os_schema.sql (tables + RLS),
                               002_social_videos_overview_body.sql
    config.example.js          template for supabase/config.js (gitignored —
                               the real Supabase URL/anon key, local dev only)
```

## Auth

All three dashboards (client portal, operator, editor) sit behind a real
login — Supabase Auth, backed by three role tables in
`supabase/migrations/001_social_os_schema.sql`, all RLS-protected:

- `social_operators` — Tait (and any future FL staff). Full access to
  everything, everywhere, by design.
- `social_editors` — contract/staff editors, scoped by `editor_id` to
  videos actually assigned to them, and only once a video reaches
  `with_editor` or later. `active = false` gates the editor dashboard's UI
  but is **not** enforced by RLS — an offboarded editor's login can still
  read/write anything RLS would otherwise let them touch if they query
  Supabase directly. Known gap, not yet closed.
- `social_client_users` — a client's own login, scoped to exactly one
  `client_id`. Not yet provisioned for any real client (see Current State).

Nothing renders — no page chrome, no data — until `dashboards/template/auth.js`'s
gate resolves who's signed in and a page-specific `resolveAccess()` check
passes. (An earlier version of this gate had a CSS specificity bug where
the app shell rendered behind the login screen regardless of auth state —
fixed; the `.hidden` utility class is `!important` now specifically so an
element's own more-specific display rule can't silently win over it again.)

Client-portal access is checked with a single query: fetch the
`social_clients` row matching the URL's slug, and let RLS decide whether it
comes back — a client_user's own row only resolves if the slug matches
their real `client_id` (enforced server-side, not by the page's own logic).
An operator login always resolves, for any client.

## Dashboards

Three views, all Supabase-auth-gated, all reachable from a Vercel
deployment (not "opened locally" as the primary path anymore, though local
serving from the repo root still works for dev):

### Client portal

`dashboards/dist/clients/portal.html` — **one shared, dynamic file now, not
one generated per client.** It reads the client's slug from its own URL
(`/clients/<slug>`, or the older `/clients/<slug>/portal.html` shape some
clients' `config.json` still has on file as `portalUrl` — `vercel.json`
rewrites both to this one file) and fetches that client from Supabase at
runtime. Adding a client is no longer a rebuild — see "Adding a client"
below.

**What's live vs. git-driven, for the client portal specifically:**
- **Live from Supabase:** the client record itself (name, plan window,
  `client_system`) from `social_clients`, and Drive folder links from
  `social_drive_folder_links`.
- **Still git-`config.json`-driven, not live:** the videos shown on the
  portal (My Videos, Content Calendar), analytics, and pending-concepts.
  `social_videos` exists as a table with full RLS already written and
  tested, but nothing in this dashboard queries it yet. See Roadmap.
- **Writes:** unchanged from the original design — every status change
  (approve/reject/mark filmed/etc.) still only writes to that browser's own
  `localStorage`, expressed as a copy-paste status report the client sends
  back, applied to the real `config.json` by `calendar-planner`. No live
  Supabase writes exist anywhere in this repo yet.

### Operator dashboard

`dashboards/dist/operator/dashboard.html` — one shared file, not
per-client, aggregating across every client. Current nav, top to bottom:

**Dashboard** → **All Clients** → **Content Calendar** → **Schedule** →
**Content Review** → **Ready to Post** → *(Sync)* **Apply status report**

- **All Clients** is its own tab (not on the Dashboard home page anymore) —
  a single list deduped by slug, merging `CLIENTS` (every
  `dashboards/clients/<slug>/config.json` checked into git — still what
  drives Content Calendar/Schedule/Content Review/Ready to Post) with
  `LIVE_CLIENTS` (every live `social_clients` row). Shows Drive-folder
  quick links when known, and either "Open portal" (built straight from the
  slug — every live client's URL is uniform now) or a "Not live yet" badge
  for a client that's only in git so far. Also hosts "+ New client," which
  inserts straight into `social_clients` — see "Adding a client" below.
- **Content Calendar, Schedule, Content Review, Ready to Post** are all
  still `config.json`-driven (via the baked-in `CLIENTS` array), not live —
  same status quo as before this round of changes.
- **Competitor Tracker, Analytics, and News Consolidator were removed from
  the nav** — not deleted. Their `<section>` markup lives in one
  `<!-- FUTURE BUILDS -->` HTML comment block right after `</main>` in
  `dashboards/operator/dashboard.template.html` (confirmed unreachable —
  their element ids don't exist anywhere outside that comment), and their
  render functions (`renderCompetitors`/`renderAnalytics`/`renderNews`)
  stay defined but uncalled from `renderAll()`, each marked with a comment
  pointing at exactly what to restore. Restoring one is copy-paste, not a
  rebuild from memory.

### Editor dashboard

`dashboards/dist/editor/dashboard.html` — one shared file, unchanged in
this round: still reads every client's `config.json`, shows every video
`with_editor` across every client, still writes to `localStorage` + its own
status-report generator.

## Adding a client — two different things now

- **Fast path (self-serve, no code, no redeploy):** operator dashboard →
  All Clients → "+ New client" → name/slug/client_system/plan dates. Inserts
  directly into `social_clients`. The client's portal is live and reachable
  the instant that insert succeeds. Drive folder links are a deliberate
  separate step (`social_drive_folder_links`, added directly in Supabase
  once the real Drive folder exists) — not required for the portal to work.
- **Full pipeline (real content, still git-driven):** run `client-brain` to
  produce `clients/<slug>/brain.md`, create the real Drive folder structure
  by hand (this repo never creates Drive folders itself), and add
  `dashboards/clients/<slug>/config.json` with the real folder links —
  `calendar-planner` and the rest of the skill pipeline still target this
  file. This is still required before Content Calendar/Schedule/Content
  Review/Ready to Post know the client exists, because those four pages
  haven't moved to live data yet (see Roadmap).

A client can be in one path, the other, or both — the "All Clients" list
shows exactly which.

## Build & deploy

`python3 dashboards/build.py` inlines `shell.css`/`shell.js`/`auth.js` into
each template and writes everything to `dashboards/dist/` (gitignored) —
the client portal once (shared), the operator and editor dashboards once
each, from every `dashboards/clients/*/config.json` it finds.

`vercel.json`: `buildCommand` runs `build.py`, then generates
`dashboards/dist/supabase/config.js` from the `SUPABASE_URL`/
`SUPABASE_ANON_KEY` environment variables (the anon key is safe client-side
— access control is RLS, not secrecy). `outputDirectory` is
`dashboards/dist` — nothing outside it is ever deployed, which is also why
`clients/<slug>/brain.md` and `sources/` (real, sensitive client material)
are never at risk of being served as static files. `redirects` sends `/` to
the operator dashboard. `rewrites` route both `/clients/<slug>` and
`/clients/<slug>/portal.html` to the one shared client-portal file.

---

# Current State

Fast-changing — a snapshot, not a promise. Trust this section over Build
Spec or Architecture Reference if they ever disagree.

## Live clients right now

| Client | `social_clients` row | `config.json` | Status |
|---|---|---|---|
| `grad-gig` | ✅ live | ✅ present, 0 videos | The one real client. No videos yet — correctly empty, not fabricated (principle 4). |
| `test-fully-launched` | ✅ live | ✅ present, 9 fabricated videos | Kept intentionally as a working demo/test portal to show Tait/external testers — not real. |
| `test-grandpas-hardware` | ❌ deleted | ❌ deleted | Concierge-path UI proof — done, removed. |
| `test-loop-coffee` | ❌ deleted | ❌ deleted | General dashboard-design proof — done, removed. |
| `andys-grocery` | ❌ deleted | never existed | Was only a test of the "+ New client" form itself. |

**Content Calendar, Schedule, Content Review, and Ready to Post are still
git-`config.json`-driven** — so as of this snapshot they show `grad-gig`
(real, empty) and `test-fully-launched` (9 fabricated videos), mixed
together with no in-app label distinguishing real from fabricated. Worth
knowing before showing any of those four pages to someone as if they
reflect real activity.

## Blueprint vs. built

| Blueprint concept | Current state |
|---|---|
| Customer Data doc (pain/dreams/fears/practical goals) | ✅ Built as its own skill — `customer-data-doc`, source-tagged, includes hook candidates directly. |
| Three Pillars/Formats/Perspectives ("taste document") | ✅ Built as its own skill — `positioning-doc`. Standalone document, not a `brain.md` subsection — `brain.md` now just points to it. Surfaces candidates only; Tait still picks the final three of each. |
| Voice (calls, voice memos, writing samples → a usable voice reference) | ✅ Built as its own skill — `voice-doc`. Cumulative raw log plus a distilled Voice Profile that `script-writer`/`concept-engine` load before writing. |
| Unique Perspectives Overview (expanded) | Folded into `positioning-doc`'s perspective candidates rather than a separate fourth document. |
| Poppy AI (competitor list + format chat) | 🧩 Partial — Competitor Tracker page exists (manual entry, currently parked — see Architecture Reference), Poppy AI itself is a manual, on-demand tool, not embedded. |
| Client portal: approve posts, analytics, competitors, Poppy, assets, filming instructions | 🧩 Partial — client portal has Dashboard/My Videos/Calendar/Analytics/Docs. Competitors + Poppy access are operator-only, not on the client portal — blueprint wants the client to see competitors too. |
| Content calendar with per-card approve/rewrite/reject | 🧩 Partial — My Videos has approve-shaped actions (mark filmed/ready to edit/reject) but that's *after* filming, not a pre-filming concept approval on the calendar itself. The calendar view is read-only. |
| Footage upload per content card | ❌ Not built — one shared Footage Uploads Drive folder per client (deep link), not per-video upload. Deliberate v1 simplification. |
| Editor dashboard | ✅ Built — shared across clients, shows each `with_editor` video's full brief, footage/deliver/brand-voice links, an editor filter, "mark delivered," its own status-report generator. Still `config.json`-driven, not live. |
| Client review (gate 3, after owner approval, before posting) | ✅ Built — `client_review` status between `in_review` and `ready_to_post`. Client portal shows it as "Final review," operator dashboard shows it read-only under "Waiting on the client." The concept gate (`concept_pending`/`to_film`) only appears for `client_system: "self-serve"` clients — concierge clients skip straight to film/edit. |
| 7-day edit-to-post rule | ✅ Built, as a default, not an enforced rule — every date is hand-editable on the operator dashboard's Schedule page; the 7-day gap is only ever `calendar-planner`'s starting suggestion. |
| Caption field on a video/post | ✅ Built — `caption` on every video, shown on the client portal and, via `editorBrief`, considered by the editor. |
| Monthly performance tied to pillar/format/perspective | 🧩 Partial — unchanged, still only V.I.D.-based. |
| Personalized interview questions per client (System 2) | ✅ Built — `interview-questions-doc`, drawn from that client's `voice.md`/`customer-data.md`. Concierge clients only. |
| Story-over-value as an explicit doctrine | ✅ Built — `templates/story-over-value.md`, cross-linked from `vid-method.md`'s Identity section. |
| Authenticity Questions (voice-memo prompt sent to any client) | ✅ Built — `templates/authenticity-questions.md`. |
| Real auth (who can open which dashboard, which client) | ✅ Built — see Architecture Reference's Auth section. Not in the original blueprint at all; added once dashboards moved off "no backend." |
| Client data + Drive links read live, not baked at build time | 🧩 Partial — `social_clients`/`social_drive_folder_links` are live; `social_videos` isn't queried anywhere yet. See Roadmap. |

## Backlog — content/skill-level gaps

Distinct from the Roadmap below: these are product gaps against the
blueprint, not the data-architecture progression.

1. Surface competitors + Poppy AI access on the client portal, not just
   operator.
2. Tie `performance-review`'s output to pillar/format/perspective, not just
   V.I.D. lines — `positioning-doc` names them now, so this is unblocked
   whenever it's worth doing.
3. Footage upload per content card, and real in-page Drive upload/download
   — both explicitly deferred v1 simplifications, not oversights.
4. Run the whole intake pipeline (`transcript-mine` → `voice-doc` →
   `customer-data-doc` → `positioning-doc` → `interview-questions-doc` for
   concierge) against real Grad Gig material for the first time —
   everything so far is built and internally consistent, not yet proven
   against a live client's actual calls.

---

# Roadmap / Not Yet Built

The target end state: the full client lifecycle running in-app, live in
Supabase end to end, not the current git-config/localStorage workaround.
Documented ahead of being built so each build step has a known destination.

| Phase | Description | Status |
|---|---|---|
| 0 | Client creation — operator adds a client, gets a working (empty) portal instantly | ✅ **Live** — the only phase actually built this way so far |
| 1 | Onboarding survey sent to new clients — platform handles (not passwords: delegated Business Manager / Creator account access per platform), brand voice/guidelines, initial content ideas, existing assets | ❌ Not built |
| 2 | Survey data lands directly on the client's row in Supabase | ❌ Not built |
| 3 | Operator (Tait) generates content ideas from that data, possibly AI-assisted | ❌ Not built |
| 4 | Operator schedules content and writes filming/content instructions for the client | ✅ **Live** — Content Calendar, Schedule, and "+ New video" all read/write `social_videos` directly now. Filming/content instructions specifically (`filming_instructions`, `hook`, `caption`, etc.) aren't in the creation form yet — title/platform/status/dates only — so still todo, but the record itself and the schedule are real. |
| 5 | Client uploads requested content (self-serve) or Tait/editor films directly (concierge), per `client_system` | 🧩 Workaround — Drive deep-links + client-portal status marking, not true in-app upload |
| 6 | Editor edits and submits for review | 🧩 Workaround — editor dashboard exists and works, but is `config.json`-driven, not live |
| 7 | Operator approves or sends back for revisions | 🧩 Workaround — operator dashboard's Content Review exists, `config.json`-driven |
| 8 | Client reviews, approves or requests further edits | 🧩 Workaround — client portal exists, writes to `localStorage` + status report, not live |
| 9 | Final high-quality content downloaded/exported for posting | 🧩 Workaround — Drive deep-link + "Ready to Post," posted manually (principle 6 — stays manual by design, this one isn't a gap) |

**`social_videos` is live now** — Content Calendar, Schedule, and "+ New
video" all read/write it directly, under the operator RLS policy. That was
the previous "next concrete build" note here; done.

**Next concrete build: the client portal's own video reads/writes going
live.** Only the operator side moved so far — the client portal still
reads its video list from `config.json` and writes every status change
(approve/reject/mark filmed/etc.) to `localStorage` + a status report, not
`social_videos`. Phases 5, 6, and 8 above all depend on a client-side live
record to act on, not just the operator's: a client filming their own
footage, an editor's delivered cut, and a client's own review gate all
need something real on the other end. This is also the point where the
gate-1 concept-approval columns (`concept_approved_by`/`concept_approved_at`)
start mattering — they only gate anything once a real client login can
read `social_videos` and hit that check.

## Future Considerations — not committed, from a shelved alternative spec

Pulled from `FL-CRM-Social-Dash-Spec.md` (a planning doc for a different
architecture — one merged Next.js app combining the CRM and this social
dashboard under a single login — not pursued) before it's deleted. These
are ideas worth keeping on file, not plans; nothing here is scheduled
against any phase above.

1. **`status_audit_log` table** — log every video status transition
   (`from_status`, `to_status`, `changed_by`, `changed_at`). Cheap to add,
   but only actually useful once writes are fully live in Supabase —
   today, most status changes (phases 6–8 above) still go through
   `localStorage` + the status report, so there'd be nothing real to log
   yet.
2. **Timestamped video comments** — a comment tied to a specific second
   within a video, not the video record as a whole. Relevant once there's
   a live operator/client review loop to attach it to (phases 7–8), not
   before.
3. **Onboarding trigger sequence** — on client activation, automatically
   request three specific things: media upload, a brand/info survey, and
   platform access. Same idea as Roadmap phase 1's onboarding survey
   above, just a sharper framing worth keeping — three concrete asks on
   day one, not one vague "onboarding survey."
4. **CRM + Social Dash merge, as an alternative architecture** — the
   shelved spec's core idea was one merged Next.js app, one login, for
   both the CRM and this dashboard. Not pursued; this repo continues as
   its own separate deployment, because the two-repo approach is working
   and already live. Noted as a real decision point to revisit later —
   not a direction anyone's committed to.
