# Fully Social OS

See `SYSTEM-BLUEPRINT.md` for the full business model this repo is built to
run — two client systems (self-serve and concierge), the full pipeline from
intake to monthly performance review, and a live gap analysis against what's
actually built. Read it alongside this file, not instead of it: this file is
the operating doctrine for skills working in this repo day to day; the
blueprint is the end-state vision and the backlog for getting there.

A content operating system for running social media for founder-led brands.
Built for an agency of one to scale past one — by turning the repeatable parts
of the process into skills, while keeping the parts that require judgment
manual and human.

## What the business does

Clients hire the agency to run their social media end to end: analyze their
ideal customer, find their positioning, generate content concepts and scripts,
direct filming, hand footage to editors with instructions, review cuts, and
post. Performance data feeds back in so the next cycle is smarter than the
last.

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

## Repo map

```
fully-social-os/
  CLAUDE.md                  this file
  templates/                 shared doctrine — the V.I.D. method, document
                              formats every skill writes into
  .claude/skills/            the thirteen skills (see below)
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
    template/                the static HTML dashboard shells (client
                              portal + operator view) — client-agnostic
    clients/<slug>/           one config + one rendered portal per client;
                              adding a client is adding a folder here, not
                              rebuilding the template
    operator/                 aggregates every client's config into one
                              operator view
```

## Adding a client

Adding a second client is a config change: run `client-brain` to produce
`clients/<slug>/brain.md`, create their Drive folder (below), add a
`dashboards/clients/<slug>/config.json` with the real folder links, and the
operator dashboard picks it up. The HTML/JS in `dashboards/template/` never
changes per client.

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

The dashboards link out to these folders (deep links, not in-page upload —
see `dashboards/template/README.md`); they don't duplicate their content.
Folder links for each client live in `dashboards/clients/<slug>/config.json`
under `driveFolders` — `assets` there points at the whole `05 Assets` folder,
not its individual contents.

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

## Dashboards

No backend. Static HTML, self-contained, opened locally. Two views:

- **Client portal** (`dashboards/clients/<slug>/portal.html`) — the videos a
  client needs to film, each with its hook and filming direction. Mark
  filmed / ready to edit / reject. Footage itself goes to a Google Drive
  folder linked from the page, never through the page.
- **Operator dashboard** (`dashboards/operator/dashboard.html`) — every
  client, every video, what's overdue, what's waiting on approval, what's
  with the editor.

Status doesn't sync automatically. Each portal can generate a plain-text
status report the client copies out; the operator dashboard has a paste-in
box that parses that report back into its view. See
`templates/status-report-format.md` for the exact format both sides agree on.
This stays copy-paste until there's a real reason to host it.

## Poppy AI

`v2.getpoppy.ai` is a manual research aid, not an integration. When
`research-sweep` runs, checking Poppy AI for outlier formats in the client's
niche is one input a human can bring back and paste in — same as checking a
competitor's page by hand. Nothing in this repo calls it, scrapes it, or
polls it. That would violate principle 5.
