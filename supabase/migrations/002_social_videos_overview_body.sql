-- Adds the two fields config.json's video shape has that 001's social_videos
-- didn't: `overview` (a one/two-sentence blurb for the card) and `body` (the
-- script/talking points) — 001 only had `concept`/`filming_instructions`,
-- which don't cleanly hold both. Needed before the client portal can read
-- videos live instead of from config.json. Safe to re-run.
alter table social_videos add column if not exists overview text;
alter table social_videos add column if not exists body text;
