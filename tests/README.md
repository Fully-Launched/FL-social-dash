# Tests

Nothing here touches the real Supabase project. Every test builds a fresh
in-memory Postgres (PGlite), runs the real migrations in
`supabase/migrations/` against it, and signs in as each role, so the
access rules and action functions are the real ones.

Setup, once: `cd tests && npm install`. Then `npm test` (rebuild the
dashboards first with `python3 dashboards/build.py` if templates changed).

| File | What it checks |
|---|---|
| `db.test.mjs` | Database rules: approval gates, no direct client/editor writes, inactive editors locked out, audit log. |
| `parity.test.mjs` | The buttons each page shows (`VIDEO_ACTIONS` in `shell.js`) match what the database allows, for every status and client type. |
| `operator-approve.test.mjs` | The operator's "Approve for client" buttons: only after gate 1 for concepts, move the video on, logged as the operator. |
| `operator-portal.test.mjs` | The operator in a client portal: every client button works for them, the Edit form saves, concierge clients get only their steps, all logged as the operator. |
| `operator-editor.test.mjs` | The operator in the editor portal: links from the operator dashboard, opens on one editor's work, clicks Finished for any editor (including themself), logged as the operator. |
| `flow.test.mjs 1\|2\|3` | The full flow for 30 posts, clicking the real built pages in a headless browser: bulk add → approve → client approves/films → editor finishes → owner approves → client approves → posted. Run 2 adds client rejections and change requests; run 3 adds owner revisions and a bad finished-video link. |
| `harness.mjs` | Shared setup for the flow test. |

`serve_local.py` serves `dashboards/dist` on http://localhost:5173 with the
same redirects as `vercel.json`, using your local (gitignored)
`supabase/config.js`: `python3 tests/serve_local.py`.
