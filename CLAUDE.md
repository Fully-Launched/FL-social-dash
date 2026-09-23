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
| `calendar-planner` | scheduling | `clients/<slug>/calendar.md` — was written for the old config.json dashboards; needs repointing at Supabase |
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
they don't duplicate their content. Each client's folder links live in
`social_drive_folder_links` in Supabase, edited from the operator
dashboard's All Clients → Edit.

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
  clients/<slug>/
    brain.md                 output of client-brain — positioning, ICP,
                              voice, pillars/formats/perspectives, facts
    sources/                 raw material: call transcripts, voice memo
                              transcripts, DMs, objections — mined, not paraphrased
    research/                dated research-sweep outputs (packaging only)
    concepts/                concept-engine output, one file per cycle
  dashboards/
    template/                 client portal + editor templates, and the shared
                               shell.css/shell.js/auth.js that build.py inlines
                               into every page
    operator/                 the operator dashboard template + news.json /
                               agency-resources.json (agency-wide, not per-client)
    dist/                     BUILD OUTPUT ONLY, gitignored — what build.py
                               writes and what Vercel deploys. Never hand-edited.
  supabase/
    migrations/                001 (tables + RLS), 002 (overview/body columns),
                               003 (write path: action functions, audit log,
                               active-editor RLS)
    config.example.js          template for supabase/config.js (gitignored —
                               the real Supabase URL/anon key, local dev only)
```

The thirteen skills are not in this repo (`.claude/skills/` doesn't exist
here) — where they live is an open question. `calendar-planner` in
particular was written to update the old per-client `config.json` files,
which no longer exist; it needs repointing at Supabase or retiring.

## Data: social_videos is the single source of truth

Every client, video, editor, and Drive link lives in Supabase (same
project as fully-launched-crm; every table here is prefixed `social_`).
Nothing about a client or video is stored in git, in the built pages, or in
a browser's localStorage. There is no status report or copy-paste relay.

Who can write what (`supabase/migrations/003_social_videos_write_path.sql`):

- **Operators** — full direct read/write on every `social_` table. Gate 1
  (approve a concept) goes through `social_operator_approve_concept` so it's
  stamped with who approved it.
- **Clients** — no direct writes. Only `social_client_video_action(video,
  action, note)`, which checks the move against the transition table in 003:
  approve_concept, request_concept_changes (clears gate 1 — the concept goes
  back to the owner), reject, mark_filmed, mark_ready_to_edit (self-serve
  only), approve_final, request_revisions.
- **Editors** — no direct writes. Only `social_editor_mark_delivered`.
  Every editor policy requires `social_editors.active` — a deactivated
  editor sees nothing. (Revoke their session in Supabase Auth too.)

`VIDEO_ACTIONS` in `dashboards/template/shell.js` mirrors the transition
table to decide which buttons to show — keep the two in step. The database
is what actually enforces it.

`social_status_audit_log` records every status change and gate-1
approval/reset (action, note, who, role, when), whichever path it came
through. Operators can read it.

## Auth

All three dashboards sit behind Supabase Auth (email + password), backed by
three role tables — `social_operators`, `social_editors`,
`social_client_users` — all RLS-protected. Nothing renders until
`dashboards/template/auth.js`'s gate resolves who's signed in and the
page's own `resolveAccess()` passes. Client-portal access is decided by RLS:
the page fetches the `social_clients` row for the URL's slug, and a client
login only gets its own row back.

**Before creating any client or editor login:** the CRM's tables in the
same project allow any authenticated user (see the note at the end of
001). A client or editor login would be able to read and write the CRM,
including financials, until the CRM's policies check team membership. That
fix belongs in the fully-launched-crm repo and is not done yet.

Password reset calls `resetPasswordForEmail` with no `redirectTo`, and no
page handles setting a new password — reset links land on the project's
Site URL. Not fixed yet.

## Dashboards

Three shared, static pages. They contain no client data — everything is
fetched after login.

### Operator dashboard — `/` → `/operator/dashboard.html`

Nav: **Dashboard** (overdue, waiting-on-me counts, clients low on content)
→ **All Clients** (add/edit clients, status, plan window, Drive links) →
**Content Review** (in pipeline order: concepts awaiting gate 1, with
"Approve all"; ready for an editor, with an editor picker; edits awaiting
gate 2; plus waiting-on-client and with-editor for visibility) →
**Schedule** (every video with inline date editing, "+ New video",
"📋 Bulk add concepts") → **Content Calendar** (🎥 film and 📣 post dates,
month navigation) → **Ready to Post** (caption with copy button, "Mark
posted").

Click any video for its record; "Edit" opens the full form — title,
platforms, status, dates, editor, overview, hook, script, filming
instructions, caption, note, and the editor brief. Entering a post date
suggests due-to-edit 7 days earlier; it never overwrites a typed date.

**Bulk add** is how a month of content gets in: plan it with Claude, click
"Copy the prompt to give Claude", paste Claude's JSON back. Every concept
lands as `concept_pending`, invisible to the client until approved.

Competitor Tracker, Analytics, and News Consolidator are off the nav —
future builds, to be rebuilt against Supabase (the old config.json versions
are in git history).

### Client portal — `/clients/<slug>`

One shared file; the slug comes from the URL (`vercel.json` also rewrites
the older `/clients/<slug>/portal.html`). The client sees: what's waiting
on them, concepts to approve (with filming instructions), what to film with
a "Drop footage here" link to their Drive footage folder, what's in
progress, finished edits for final approval, and a calendar of film and
post dates. Every button calls `social_client_video_action`. Concierge
clients only see the final-approval side. An operator opening a portal sees
exactly what the client sees, minus the client's buttons, plus a banner.
Analytics is off the nav until there's live data. News only shows when
`news.json` has items for that client.

### Editor dashboard — `/editor/dashboard.html`

An editor sees only videos assigned to them at `with_editor` or later
(RLS): the brief, the footage / deliver / brand-voice links, a due-date
calendar, "Mark delivered", and a history of what they've delivered. An
operator sees every editor's queue with a filter.

## Adding a client

Operator dashboard → All Clients → "+ New client" (name, slug,
self-serve/concierge, plan window). The portal is live immediately. Once
the real Drive folder exists (created by hand — this repo never creates
Drive folders), add its links with "Edit". Giving the client a login
means creating their Supabase Auth user and a `social_client_users` row —
blocked on the CRM fix above.

## Build & deploy

`python3 dashboards/build.py` inlines `shell.css`/`shell.js`/`auth.js`
into each template and writes `dashboards/dist/` (gitignored). Only
agency-wide content (`news.json`, `agency-resources.json`) is baked in —
never client data, because `dist/` is served publicly and the login gate
only runs in the browser. Rebuild after changing templates or those two
JSON files; adding clients or videos never needs a rebuild.

`vercel.json`: `buildCommand` runs `build.py`, then writes
`dashboards/dist/supabase/config.js` from the `SUPABASE_URL` /
`SUPABASE_ANON_KEY` environment variables (the anon key is public by design
— access control is RLS). `outputDirectory` is `dashboards/dist`, so
`clients/<slug>/` source material is never served.

Migrations are applied by hand in the Supabase SQL editor, in order. Each
is safe to re-run.

---

# Current State

Fast-changing — a snapshot, not a promise. Trust this section over Build
Spec or Architecture Reference if they ever disagree.

As of 2026-09-23:

- **Clients:** `grad-gig` (Grad Gig) and `test-fully-launched` (Fully
  Launched), both self-serve, both in Supabase. Fully Launched's old
  fabricated test videos were deleted rather than migrated; it starts
  empty. `clients/test-fully-launched/README.md` still describes it as a
  fake test client.
- **Migration 003** must be run in Supabase before the rebuilt dashboards
  work — the client and editor buttons call its functions.
- **No client or editor logins exist yet**, pending the CRM RLS fix.

## Blueprint vs. built

| Blueprint concept | Current state |
|---|---|
| Customer Data / taste document / voice / interview questions | ✅ Skills — `customer-data-doc`, `positioning-doc`, `voice-doc`, `interview-questions-doc` (not in this repo). |
| AI-assisted content calendar | ✅ Plan with Claude, then "Bulk add concepts" on the operator dashboard. |
| Concept approval: owner (gate 1), then client approve / rewrite / reject | ✅ Live in Supabase, enforced by RLS + functions. |
| Filming instructions per video, client sees what to film | ✅ `filming_instructions`, shown on the client's concept and to-film cards. |
| Footage upload per content card | 🧩 One shared Footage Uploads Drive folder per client, deep-linked from each to-film card. Not per-video upload. |
| Editor dashboard (brief, footage, brand voice, deliver) | ✅ Live, scoped per editor by RLS. |
| Owner review (gate 2), client review (gate 3) | ✅ Live. |
| 7-day edit-to-post rule | ✅ As a suggestion when entering a post date; always editable. |
| Posting database with caption | ✅ Ready to Post, with copy-caption. Posting stays manual (principle 6). |
| Analytics / monthly performance loop | ❌ Not built — off the client nav. |
| Competitors + Poppy on the client portal | ❌ Not built. |

## Backlog

1. CRM RLS fix (fully-launched-crm repo) — blocks all client/editor logins.
2. Password reset: `redirectTo` + a set-new-password page.
3. Repoint or retire `calendar-planner`; find where the skills live.
4. Analytics (manual entry first), then the monthly performance loop tied
   to pillar/format/perspective.
5. Competitors + Poppy access on the client portal.
6. Run the intake pipeline against real Grad Gig material for the first time.

---

# Roadmap / Not Yet Built

| Phase | Description | Status |
|---|---|---|
| 0 | Client creation — operator adds a client, gets a working (empty) portal instantly | ✅ Live |
| 1 | Onboarding survey — platform access (delegated, never passwords), brand voice, initial ideas, existing assets | ❌ Not built |
| 2 | Survey data lands on the client's row in Supabase | ❌ Not built |
| 3 | Operator generates content ideas, AI-assisted | 🧩 Claude + Bulk add; not in-app |
| 4 | Operator schedules content and writes filming instructions | ✅ Live |
| 5 | Client films and uploads (self-serve) or Tait films (concierge) | ✅ Status live; upload is a Drive deep link |
| 6 | Editor edits and submits for review | ✅ Live |
| 7 | Operator approves or sends back for revisions | ✅ Live |
| 8 | Client reviews, approves or requests edits | ✅ Live |
| 9 | Final content exported and posted manually | ✅ Live (posting stays manual by design) |

## Future Considerations — not committed, from a shelved alternative spec

Pulled from `FL-CRM-Social-Dash-Spec.md` (a planning doc for a different
architecture — one merged Next.js app combining the CRM and this social
dashboard under a single login — not pursued) before it's deleted. These
are ideas worth keeping on file, not plans; nothing here is scheduled
against any phase above.

1. ~~`status_audit_log` table~~ — built as `social_status_audit_log`
   in migration 003.
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
