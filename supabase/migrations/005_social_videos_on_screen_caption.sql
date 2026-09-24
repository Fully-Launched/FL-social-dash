-- Fully Social OS — two more text fields on a video. Safe to re-run.
--
-- on_screen_caption: text the poster adds on the video in the app (e.g.
--   Instagram's text tool) while posting — shown on Ready to Post with the
--   post caption. Not burned in by the editor.
-- outline: a bullet-point summary of the script, in order, for clients who
--   would rather talk through the points than read the script.
--
-- Plain columns: operators write them directly (full access, 001), and the
-- client and editor read them through their existing read policies.

alter table social_videos add column if not exists on_screen_caption text;
alter table social_videos add column if not exists outline text;
