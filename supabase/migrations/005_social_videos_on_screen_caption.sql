-- Fully Social OS — the on-screen caption (text shown on the video
-- itself), added with the post caption when the owner approves an edit.
-- Safe to re-run.
--
-- A plain column: operators write it directly (full access, 001), and the
-- client and editor read it through their existing read policies.

alter table social_videos add column if not exists on_screen_caption text;
