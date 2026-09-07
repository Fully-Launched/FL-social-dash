# Status report format (client portal ↔ operator dashboard)

No backend, so status moves as plain text the client copies out of their
portal and the operator pastes into theirs. Both dashboards' parsers key off
this exact shape — keep it stable, or update both parsers together.

```
FULLY SOCIAL OS STATUS REPORT
Client: <client slug>
Generated: <ISO date> <HH:MM>
---
<video id> | <STATUS> | <optional note>
<video id> | <STATUS> | <optional note>
...
```

- `<video id>` matches the `id` field in that client's `dashboards/clients/<slug>/config.json`.
- `<STATUS>` is one of: `FILMED`, `READY_TO_EDIT`, `REJECTED`.
- `<optional note>` is free text — required for `REJECTED` (the reason),
  optional otherwise.
- Lines for videos with no status change since the last report are omitted;
  the report is a diff, not a full dump.

## Client portal side

The "Generate status report" button walks every video whose local state
(`localStorage`) differs from its last-known-synced state and emits one line
per change, in this format, into a text box the client copies.

## Operator dashboard side

The paste-in box splits on newlines, validates each line against the header
shape and the known video IDs for that client, and on success updates that
video's status in the operator's local view. Malformed lines are shown, not
silently dropped, so a typo doesn't lose a status update.

## Why copy-paste and not a live sync

No backend yet, one client. This format is deliberately boring so that if/when
there's a real reason to host it (a server, a shared datastore), the same
report shape can be POSTed instead of pasted — the parsing logic doesn't
change, just how the text arrives.
