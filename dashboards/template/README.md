# Dashboards

Three static pages, built by `python3 dashboards/build.py` into
`dashboards/dist/` (gitignored — what Vercel deploys). All three read and
write Supabase directly after login; they contain no client data
themselves. See CLAUDE.md → Architecture Reference for the full picture.

| Page | Template | URL | Who |
|---|---|---|---|
| Operator dashboard | `dashboards/operator/dashboard.template.html` | `/` → `/operator/dashboard.html` | `social_operators` |
| Client portal | `client-portal.template.html` | `/clients/<slug>` | that client's `social_client_users` login, or any operator |
| Editor dashboard | `editor-dashboard.template.html` | `/editor/dashboard.html` | active `social_editors`, or any operator |

Shared code, inlined into every page by `build.py`:

- `auth.js` — the login gate. Nothing renders until the page's own
  `resolveAccess()` says this login may see it.
- `shell.js` — helpers, and the video data layer: `videoFromRow` /
  `videoFieldsToRow` (the one mapping between `social_videos` columns and
  the camelCase shape pages use), `VIDEO_ACTIONS` / `videoActionsFor` /
  `runVideoAction` (which status changes each role may make — mirrors the
  transition table in `supabase/migrations/003_social_videos_write_path.sql`,
  which is what actually enforces it), the shared video modal, and the
  month calendar.
- `shell.css` — the dark theme, including a `--status-<status>` color per
  status.

## Video statuses, in order

`concept_pending` → `to_film` → `filmed` → `ready_to_edit` → `with_editor`
→ `in_review` → `client_review` → `ready_to_post` → `posted`, plus
`rejected`.

- `concept_pending` has two states: waiting on the owner (gate 1 —
  `concept_approved_at` is null, and RLS hides it from the client) and
  waiting on the client (approved).
- Concierge clients skip the client's concept/filming steps; the operator
  moves those videos along directly.
- `in_review` is gate 2 (owner approves the edit); `client_review` is
  gate 3 (client's final sign-off).

## Dates

Every date is a plain local `YYYY-MM-DD` and always hand-editable. The
7-day edit-before-post gap is only ever a suggestion, filled in when a post
date is entered and due-to-edit is still empty.
