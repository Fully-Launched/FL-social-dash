-- Fully Social OS — the client journey, version 2. Safe to re-run.
--
-- 1. Who films each video (social_videos.filmed_by):
--      'client' — the client films it. Their card offers "Suggest changes"
--                 or, once filmed, "Video has been filmed" (submit_footage).
--                 No separate "approve idea" step.
--      'us'     — Tait films it, or it comes from footage the client already
--                 handed over. The client approves the idea (or suggests
--                 changes) and never uploads anything for it.
--    Defaults from the client's client_system (self-serve → client,
--    concierge → us), backfilled for existing videos, and filled in by a
--    trigger whenever a page saves it blank — so it's never null.
--
-- 2. The 7 + 7 rule: when the client submits footage, the edit is due 7
--    days later and the post goes out 14 days later — or on the planned
--    post date, if that's later (so a month planned ahead keeps its
--    spacing when the client films early).
--
-- 3. Final approval can carry the client's edits to the caption and
--    on-screen caption.
--
-- 4. Client contact details (social_clients.contact_name/phone/email), and
--    social_claim_client_invite(): the first time a login whose confirmed
--    email matches a client's contact_email opens the portal, it's linked
--    to that client (a social_client_users row). Operators and editors are
--    never linked this way.
--
-- Transition table (replaces 003's for client actions; keep in step with
-- VIDEO_ACTIONS in dashboards/template/shell.js):
--
--   action                   from                            to              filmed_by  note
--   approve_concept          concept_pending                 to_film         us         —
--   request_concept_changes  concept_pending                 concept_pending any        required; clears gate 1
--   submit_footage           concept_pending/to_film/filmed  ready_to_edit   client     — ; sets dates (2)
--   mark_filmed              to_film                         filmed          client     — (older pages)
--   mark_ready_to_edit       filmed                          ready_to_edit   client     — (older pages)
--   reject                   concept_pending/to_film         rejected        any        required (no page shows it)
--   approve_final            client_review                   ready_to_post   any        — ; optional caption edits (3)
--   request_revisions        client_review                   with_editor     any        required

-- ── 1. filmed_by ────────────────────────────────────────────────────────
alter table social_videos add column if not exists filmed_by text;
do $$ begin
  alter table social_videos add constraint social_videos_filmed_by_check check (filmed_by in ('client', 'us'));
exception when duplicate_object then null; end $$;

update social_videos v
  set filmed_by = case c.client_system when 'concierge' then 'us' else 'client' end
  from social_clients c
  where c.id = v.client_id and v.filmed_by is null;

create or replace function social_videos_default_filmed_by()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.filmed_by is null then
    select case client_system when 'concierge' then 'us' else 'client' end
      into new.filmed_by from social_clients where id = new.client_id;
  end if;
  return new;
end;
$$;

drop trigger if exists social_videos_default_filmed_by on social_videos;
create trigger social_videos_default_filmed_by
  before insert or update of filmed_by on social_videos
  for each row
  execute function social_videos_default_filmed_by();

-- ── 4. client contact details ───────────────────────────────────────────
alter table social_clients add column if not exists contact_name text;
alter table social_clients add column if not exists contact_phone text;
alter table social_clients add column if not exists contact_email text;
create unique index if not exists social_clients_contact_email_idx
  on social_clients (lower(contact_email)) where contact_email is not null;

-- ── client actions ──────────────────────────────────────────────────────
drop function if exists social_client_video_action(uuid, text, text);

create or replace function social_client_video_action(
  p_video_id uuid, p_action text, p_note text default null,
  p_caption text default null, p_on_screen_caption text default null)
returns social_videos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid := social_current_client_id();
  v_video social_videos;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_from text[];
  v_to text;
  v_needs_note boolean := false;
  v_filmed_by text := null;   -- null = either
begin
  if v_client_id is null then
    raise exception 'Only a client login can do this.' using errcode = '42501';
  end if;

  -- Same visibility rule as "client users read own visible videos" (001):
  -- an idea that's back with the owner doesn't exist for the client.
  select * into v_video from social_videos
    where id = p_video_id
      and client_id = v_client_id
      and (status <> 'concept_pending' or concept_approved_at is not null)
    for update;
  if not found then
    raise exception 'Video not found.' using errcode = 'P0002';
  end if;

  case p_action
    when 'approve_concept'         then v_from := array['concept_pending'];                     v_to := 'to_film';         v_filmed_by := 'us';
    when 'request_concept_changes' then v_from := array['concept_pending'];                     v_to := 'concept_pending'; v_needs_note := true;
    when 'submit_footage'          then v_from := array['concept_pending','to_film','filmed'];  v_to := 'ready_to_edit';   v_filmed_by := 'client';
    when 'mark_filmed'             then v_from := array['to_film'];                             v_to := 'filmed';          v_filmed_by := 'client';
    when 'mark_ready_to_edit'      then v_from := array['filmed'];                              v_to := 'ready_to_edit';   v_filmed_by := 'client';
    when 'reject'                  then v_from := array['concept_pending','to_film'];           v_to := 'rejected';        v_needs_note := true;
    when 'approve_final'           then v_from := array['client_review'];                       v_to := 'ready_to_post';
    when 'request_revisions'       then v_from := array['client_review'];                       v_to := 'with_editor';     v_needs_note := true;
    else raise exception 'Unknown action "%".', p_action using errcode = '22023';
  end case;

  if not (v_video.status = any (v_from)) then
    raise exception 'Can''t % a video that''s currently %.', replace(p_action, '_', ' '), v_video.status using errcode = '22023';
  end if;
  if v_needs_note and v_note is null then
    raise exception 'A note is required for this.' using errcode = '22023';
  end if;
  if v_filmed_by is not null and v_video.filmed_by is distinct from v_filmed_by then
    raise exception 'This step isn''t part of how this video gets filmed.' using errcode = '22023';
  end if;

  perform set_config('social.action', p_action, true);
  perform set_config('social.note', coalesce(v_note, ''), true);

  update social_videos set
    status = v_to,
    note = coalesce(v_note, note),
    -- Suggestions send the idea back to the owner: it has to be sent
    -- again before the client sees the rewrite.
    concept_approved_by = case when p_action = 'request_concept_changes' then null else concept_approved_by end,
    concept_approved_at = case when p_action = 'request_concept_changes' then null else concept_approved_at end,
    -- (2) the 7 + 7 rule
    due_to_edit = case when p_action = 'submit_footage' then current_date + 7 else due_to_edit end,
    post_date = case when p_action = 'submit_footage' then greatest(coalesce(post_date, current_date + 14), current_date + 14) else post_date end,
    -- (3) caption edits at final approval (blank = unchanged)
    caption = case when p_action = 'approve_final' then coalesce(nullif(btrim(coalesce(p_caption, '')), ''), caption) else caption end,
    on_screen_caption = case when p_action = 'approve_final' then coalesce(nullif(btrim(coalesce(p_on_screen_caption, '')), ''), on_screen_caption) else on_screen_caption end
  where id = p_video_id
  returning * into v_video;

  return v_video;
end;
$$;

revoke all on function social_client_video_action(uuid, text, text, text, text) from public, anon;
grant execute on function social_client_video_action(uuid, text, text, text, text) to authenticated;

-- ── 4. claim an invite ──────────────────────────────────────────────────
create or replace function social_claim_client_invite()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_client social_clients;
begin
  if v_uid is null then return null; end if;
  if exists (select 1 from social_client_users where id = v_uid) then
    return (select client_id from social_client_users where id = v_uid);
  end if;
  if exists (select 1 from social_operators where id = v_uid)
     or exists (select 1 from social_editors where id = v_uid) then
    return null;
  end if;
  -- Only a confirmed email: proves the person controls that inbox.
  select email into v_email from auth.users where id = v_uid and email_confirmed_at is not null;
  if v_email is null then return null; end if;
  select * into v_client from social_clients
    where lower(contact_email) = lower(v_email) and status = 'active';
  if not found then return null; end if;
  insert into social_client_users (id, client_id, name, email)
    values (v_uid, v_client.id, v_client.contact_name, v_email)
    on conflict do nothing;
  return v_client.id;
end;
$$;

revoke all on function social_claim_client_invite() from public, anon;
grant execute on function social_claim_client_invite() to authenticated;
