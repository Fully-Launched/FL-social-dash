# Fully Social OS — System Blueprint

Recorded 2026-08-21, from Tait's own walkthrough of the full business model.
This is the source record — if anything in `CLAUDE.md`, a skill, or a
dashboard ever seems to disagree with this, this file wins; fix the other
one. Two systems, for two kinds of client.

## Why two systems

**System 1 — self-serve.** For a business or personal-brand client who
understands social media well enough to drive their own portal: approve
concepts, film their own footage, upload it, give final sign-off.

**System 2 — concierge.** For a client who doesn't want to touch a portal —
"someone like my dad." Older, less online, just wants to be interviewed.
Tait does the filming himself, in person, by asking the client questions.
Everything downstream (editing, review, posting, performance) is the same
pipeline as System 1 — only the front end (how footage gets made) differs.

Both systems produce the same core documents and run through the same
approval gates and databases described below.

---

## System 1 — Self-serve

1. **Get the client interested**, then run intake: a call, or a voice memo,
   to extract their customer profile, their voice, and their authentic
   solutions to the problems their business solves.

2. **AI organizes — it does not create.** Every input (call transcripts,
   LinkedIn posts, voice memos, answers to the authenticity questions) gets
   organized into documents. Zero AI-generated content at this stage: no
   rewriting, no changing their words or voice. Organization only. This is
   the same rule as `CLAUDE.md` principle 1, stated even more strictly for
   this stage specifically.

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
     things, expanded. This is what content creation draws from most, inside
     the three-pillars/three-formats/three-perspectives frame.

4. **Poppy AI setup, per client** — build a competitor list, and use Poppy's
   chat to surface roughly the ten best-performing formats in the client's
   niche, then chat with it to generate content ideas from those formats.
   Manual, per-client, on demand — see `CLAUDE.md`'s note on Poppy AI.

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
   client, deep-linked, not per-card upload — see Gaps below.)

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
    caption. Someone with the login posts manually (`CLAUDE.md` principle 6
    — this never becomes automated).

16. **Monthly performance loop.** After 30 days, a research
    agent reviews everything posted in that window and writes a document on
    what performed best and *why* — specifically which pillars, which
    formats, and which perspectives worked. That document becomes an input
    to the next month's cycle (step 6 onward).

---

## System 2 — Concierge (interview-led)

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

---

## How this maps to what's actually built

| Blueprint concept | Current state |
|---|---|
| Customer Data doc (pain/dreams/fears/practical goals) | ✅ Built as its own skill — `customer-data-doc`, source-tagged, includes hook candidates directly (resolves the earlier "reconcile ideal hooks" gap: candidates live here, `04 Hooks` stays the polished/used-hooks folder). |
| Three Pillars/Formats/Perspectives ("taste document") | ✅ Built as its own skill — `positioning-doc`. Standalone document at last, not a brain.md subsection — `brain.md` now just points to it. Surfaces candidates only; Tait still picks the final three of each. |
| Voice (calls, voice memos, writing samples → a usable voice reference) | ✅ Built as its own skill — `voice-doc`. Not in the original blueprint table at all; added 2026-08-24 after Tait specified the 3-document system directly. Cumulative raw log plus a distilled Voice Profile that `script-writer`/`concept-engine` load before writing. |
| Unique Perspectives Overview (expanded) | Folded into `positioning-doc`'s perspective candidates rather than built as a separate fourth document — Tait's final count was 3 documents, not 4. |
| Poppy AI (competitor list + format chat) | 🧩 Partial — Competitor Tracker page exists (manual entry), Poppy AI itself is referenced as a manual, on-demand tool in `CLAUDE.md` and `research-sweep`, not embedded. |
| Client portal: approve posts, analytics, competitors, Poppy, assets, filming instructions | ✅ Client portal has Dashboard/My Videos/Calendar/Analytics. Competitors + Poppy access are on the **operator** dashboard only right now, not the client portal — blueprint wants the client to see competitors too. |
| Content calendar with per-card approve/rewrite/reject | 🧩 Partial — My Videos has approve-shaped actions (mark filmed/ready to edit/reject) but that's *after* filming, not a pre-filming concept approval on the calendar itself. The calendar view is read-only right now. |
| Footage upload per content card | ❌ Not built — current build uses one shared Footage Uploads Drive folder per client (deep link), not per-video upload. Deliberate v1 simplification, noted when we scoped it. |
| Editor dashboard | ✅ Built — `dashboards/editor/dashboard.html`, shared across clients. Shows each `with_editor` video's full brief, footage/deliver/brand-voice links, an editor filter, "mark delivered," and its own status-report generator. Poppy Board reference (System 2) isn't wired in — no Poppy integration exists yet, per the manual-tool posture in `CLAUDE.md`. |
| Client review (gate 3, after owner approval, before posting) | ✅ Built — `client_review` status added between `in_review` and `ready_to_post`. Client portal shows it as "Final review," operator dashboard shows it read-only under "Waiting on the client," and the concept gate (`concept_pending`/`to_film`) correctly only appears for `clientSystem: "self-serve"` clients — concierge clients skip straight to the film/edit stages. |
| 7-day edit-to-post rule | ✅ Built, as a default rather than an enforced rule — Tait wants every date hand-editable, always. `dueToFilm`/`dueToEdit`/`postDate` are directly editable per video on the operator dashboard's new Schedule page; the 7-day gap is only ever `calendar-planner`'s starting suggestion when a video is first scheduled, never something that overwrites a date already set by hand. |
| Caption field on a video/post | ✅ Built — `caption` on every video, shown on both the client portal and, via `editorBrief`, considered by the editor. |
| Monthly performance tied to pillar/format/perspective | 🧩 Partial — unchanged, still only V.I.D.-based. |
| Personalized interview questions per client (System 2) | ✅ Built — `interview-questions-doc`, drawn from that client's `voice.md` and `customer-data.md`, prioritized to draw out a personal story over surfacing a pain point efficiently (see `story-over-value.md`). Concierge clients only, per Tait's scoping. |
| Story-over-value as an explicit doctrine | ✅ Added 2026-08-24, not in the original blueprint — Tait's own articulation that content performs through recognition, not value delivery. `templates/story-over-value.md`, cross-linked from `vid-method.md`'s Identity section. |
| Authenticity Questions (voice-memo prompt sent to any client) | ✅ Built — `templates/authenticity-questions.md`, supersedes the earlier `personal-brand-pulse.md` (same artifact, expanded from 12 to 18 questions and reframed from Tait's own monthly check-in to a general per-client voice-gathering tool). |

## Backlog, roughly in priority order

1. Surface competitors + Poppy AI access on the client portal, not just
   operator.
2. Tie `performance-review`'s output to pillar/format/perspective, not just
   V.I.D. lines — now that `positioning-doc` actually names them, this is
   unblocked whenever it's worth doing.
3. Footage upload per content card, and real in-page Drive upload/download
   — both explicitly deferred v1 simplifications, not oversights.
4. Run the whole intake pipeline (`transcript-mine` → `voice-doc` →
   `customer-data-doc` → `positioning-doc` → `interview-questions-doc` for
   concierge) against real Grad Gig material for the first time —
   everything so far is built and internally consistent, not yet proven
   against a live client's actual calls.

Done as of 2026-08-21: the three-gate review pipeline (concept → edit →
client final review), the editor dashboard, `clientSystem` branching
(self-serve vs. concierge), `caption`, and `dueToEdit`. Done as of
2026-08-24: `voice-doc`, `customer-data-doc`, `positioning-doc`,
`interview-questions-doc` — four client-document skills, built directly
from Tait's spec plus a reference skill he was given, sharing
`templates/anti-slop-checklist.md`; plus `story-over-value.md` (the
doctrine behind Identity) and `authenticity-questions.md` (supersedes
`personal-brand-pulse.md`). This table is the map for deciding what to
build next, not a full changelog — see git history for the detail.
