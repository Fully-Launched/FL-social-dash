-- Fully Social OS — social_videos becomes the single source of truth.
-- Safe to re-run: CREATE OR REPLACE / IF NOT EXISTS / DROP ... IF EXISTS
-- throughout, same convention as 001.
--
-- What this changes:
--   1. Clients and editors lose every direct UPDATE on social_videos. Their
--      only write path is the two security-definer functions below, which
--      check who's calling, the video's current status, and whether the
--      requested move is allowed — so the three approval gates are enforced
--      by the database, not just by which buttons a page happens to render.
--      Operators keep full direct access ("operators manage videos", 001).
--   2. Every editor-facing policy now requires social_editors.active = true.
--      An offboarded editor's login can no longer read videos, clients, or
--      drive links (it can still read its own social_editors row, so the
--      editor dashboard can say "deactivated" instead of failing oddly).
--      This does NOT end a session that's already open — revoke it in
--      Supabase Auth when offboarding someone.
--   3. Gate 1 (owner approves a concept before the client sees it) gets its
--      own operator function, social_operator_approve_concept, which sets
--      concept_approved_by/at.
--   4. social_status_audit_log records every status change and every gate-1
--      approval/reset, whichever path it came through (function or an
--      operator's direct update), via a trigger on social_videos.
--
-- Transition table — keep in step with VIDEO_ACTIONS in
-- dashboards/template/shell.js, which decides which buttons to show:
--
--   role      action                   from             to              note
--   client    approve_concept          concept_pending  to_film         —
--   client    request_concept_changes  concept_pending  concept_pending required; also clears gate 1, so the
--                                                                        concept goes back to the owner's queue
--   client    reject                   concept_pending  rejected        required
--                                      or to_film
--   client    mark_filmed              to_film          filmed          —
--   client    mark_ready_to_edit       filmed           ready_to_edit   —
--   client    approve_final            client_review    ready_to_post   —
--   client    request_revisions        client_review    with_editor     required
--   editor    mark_delivered           with_editor      in_review       —
--   operator  approve_concept (gate 1) concept_pending  concept_pending — (sets concept_approved_by/at)
--
-- Every client action above except approve_final/request_revisions is
-- self-serve only — concierge clients never approve concepts or film.

-- ── editor helper: active editors only ──────────────────────────────────
-- Same signature as 001's version; the only change is `and active`, so a
-- deactivated editor resolves to null and every `editor_id = ...` check
-- below fails for them.
create or replace function social_current_editor_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from social_editors where id = auth.uid() and active;
$$;

-- Which of the three login populations the caller is, for the audit log.
-- Null when there's no auth context (SQL editor / service role).
create or replace function social_current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when social_is_operator() then 'operator'
    when exists (select 1 from social_editors where id = auth.uid()) then 'editor'
    when social_current_client_id() is not null then 'client'
    else null
  end;
$$;

-- ── RLS: editor policies now go through the active-only helper ──────────
drop policy if exists "editors read assigned clients" on social_clients;
create policy "editors read assigned clients" on social_clients
  for select
  to authenticated
  using (
    exists (
      select 1 from social_videos v
      where v.client_id = social_clients.id
        and v.editor_id = social_current_editor_id()
    )
  );

drop policy if exists "editors read assigned client drive links" on social_drive_folder_links;
create policy "editors read assigned client drive links" on social_drive_folder_links
  for select
  to authenticated
  using (
    exists (
      select 1 from social_videos v
      where v.client_id = social_drive_folder_links.client_id
        and v.editor_id = social_current_editor_id()
    )
  );

drop policy if exists "editors read assigned videos" on social_videos;
create policy "editors read assigned videos" on social_videos
  for select
  to authenticated
  using (
    editor_id = social_current_editor_id()
    and status in ('with_editor', 'in_review', 'client_review', 'ready_to_post', 'posted')
  );

-- ── RLS: no direct writes for clients or editors ────────────────────────
drop policy if exists "editors update videos with them" on social_videos;
drop policy if exists "client users update own visible videos" on social_videos;

-- ── social_status_audit_log ─────────────────────────────────────────────
-- Append-only. Written only by the trigger below (runs as the table
-- owner, so no insert policy exists or is needed); operators can read it.
-- video_id cascades on delete — deleting a video deletes its history too.
create table if not exists social_status_audit_log (
  id bigint generated always as identity primary key,
  video_id uuid not null references social_videos(id) on delete cascade,
  client_id uuid not null references social_clients(id) on delete cascade,
  action text not null,          -- a transition-table action, or 'created' / 'direct_update'
  from_status text,              -- null on 'created'
  to_status text not null,
  note text,                     -- the note passed with this action, if any
  changed_by uuid,               -- auth.uid(); null from the SQL editor
  changed_by_role text,          -- operator / editor / client; null from the SQL editor
  changed_at timestamptz not null default now()
);

create index if not exists social_status_audit_log_video_id_idx on social_status_audit_log(video_id, changed_at);

alter table social_status_audit_log enable row level security;

drop policy if exists "operators read audit log" on social_status_audit_log;
create policy "operators read audit log" on social_status_audit_log
  for select
  to authenticated
  using (social_is_operator());

-- The action functions below tag their own writes with a transaction-local
-- setting (social.action / social.note) so the trigger can log what was
-- actually done ("request_concept_changes"), not just the raw column diff.
-- A write without that tag is an operator's direct update.
create or replace function social_log_video_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action text := nullif(current_setting('social.action', true), '');
  v_note   text := nullif(current_setting('social.note', true), '');
begin
  insert into social_status_audit_log
    (video_id, client_id, action, from_status, to_status, note, changed_by, changed_by_role)
  values (
    new.id,
    new.client_id,
    case when tg_op = 'INSERT' then 'created' else coalesce(v_action, 'direct_update') end,
    case when tg_op = 'INSERT' then null else old.status end,
    new.status,
    v_note,
    auth.uid(),
    social_current_role()
  );
  return new;
end;
$$;

drop trigger if exists social_videos_log_insert on social_videos;
create trigger social_videos_log_insert
  after insert on social_videos
  for each row
  execute function social_log_video_status();

drop trigger if exists social_videos_log_status on social_videos;
create trigger social_videos_log_status
  after update on social_videos
  for each row
  when (old.status is distinct from new.status
        or old.concept_approved_at is distinct from new.concept_approved_at)
  execute function social_log_video_status();

-- ── client actions ──────────────────────────────────────────────────────
create or replace function social_client_video_action(p_video_id uuid, p_action text, p_note text default null)
returns social_videos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid := social_current_client_id();
  v_video social_videos;
  v_system text;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_from text[];
  v_to text;
  v_needs_note boolean := false;
  v_self_serve_only boolean := true;
begin
  if v_client_id is null then
    raise exception 'Only a client login can do this.' using errcode = '42501';
  end if;

  -- Same visibility rule as "client users read own visible videos" (001):
  -- a concept the owner hasn't approved yet doesn't exist for the client.
  select * into v_video from social_videos
    where id = p_video_id
      and client_id = v_client_id
      and (status <> 'concept_pending' or concept_approved_at is not null)
    for update;
  if not found then
    raise exception 'Video not found.' using errcode = 'P0002';
  end if;

  case p_action
    when 'approve_concept'         then v_from := array['concept_pending'];            v_to := 'to_film';
    when 'request_concept_changes' then v_from := array['concept_pending'];            v_to := 'concept_pending'; v_needs_note := true;
    when 'reject'                  then v_from := array['concept_pending','to_film'];  v_to := 'rejected';        v_needs_note := true;
    when 'mark_filmed'             then v_from := array['to_film'];                    v_to := 'filmed';
    when 'mark_ready_to_edit'      then v_from := array['filmed'];                     v_to := 'ready_to_edit';
    when 'approve_final'           then v_from := array['client_review'];              v_to := 'ready_to_post';   v_self_serve_only := false;
    when 'request_revisions'       then v_from := array['client_review'];              v_to := 'with_editor';     v_needs_note := true; v_self_serve_only := false;
    else raise exception 'Unknown action "%".', p_action using errcode = '22023';
  end case;

  if not (v_video.status = any (v_from)) then
    raise exception 'Can''t % a video that''s currently %.', replace(p_action, '_', ' '), v_video.status using errcode = '22023';
  end if;
  if v_needs_note and v_note is null then
    raise exception 'A note is required for this.' using errcode = '22023';
  end if;
  if v_self_serve_only then
    select client_system into v_system from social_clients where id = v_client_id;
    if v_system is distinct from 'self-serve' then
      raise exception 'This step isn''t part of the concierge process.' using errcode = '22023';
    end if;
  end if;

  perform set_config('social.action', p_action, true);
  perform set_config('social.note', coalesce(v_note, ''), true);

  update social_videos set
    status = v_to,
    note = coalesce(v_note, note),
    -- Asking for changes sends the concept back to the owner: gate 1 has
    -- to be passed again before the client sees the rewrite.
    concept_approved_by = case when p_action = 'request_concept_changes' then null else concept_approved_by end,
    concept_approved_at = case when p_action = 'request_concept_changes' then null else concept_approved_at end
  where id = p_video_id
  returning * into v_video;

  return v_video;
end;
$$;

-- ── editor actions ──────────────────────────────────────────────────────
create or replace function social_editor_mark_delivered(p_video_id uuid)
returns social_videos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_editor_id uuid := social_current_editor_id();
  v_video social_videos;
begin
  if v_editor_id is null then
    raise exception 'Only an active editor login can do this.' using errcode = '42501';
  end if;

  select * into v_video from social_videos
    where id = p_video_id and editor_id = v_editor_id
    for update;
  if not found then
    raise exception 'Video not found.' using errcode = 'P0002';
  end if;
  if v_video.status <> 'with_editor' then
    raise exception 'Can''t mark delivered a video that''s currently %.', v_video.status using errcode = '22023';
  end if;

  perform set_config('social.action', 'mark_delivered', true);
  perform set_config('social.note', '', true);

  update social_videos set status = 'in_review'
  where id = p_video_id
  returning * into v_video;

  return v_video;
end;
$$;

-- ── operator: gate 1 ────────────────────────────────────────────────────
-- Operators could set these columns directly (they have full access); this
-- exists so the approval is one call, always stamped with who approved it,
-- and logged as 'approve_concept' rather than 'direct_update'.
create or replace function social_operator_approve_concept(p_video_id uuid)
returns social_videos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_video social_videos;
begin
  if not social_is_operator() then
    raise exception 'Only an operator login can do this.' using errcode = '42501';
  end if;

  select * into v_video from social_videos where id = p_video_id for update;
  if not found then
    raise exception 'Video not found.' using errcode = 'P0002';
  end if;
  if v_video.status <> 'concept_pending' then
    raise exception 'Only a pending concept can be approved (this one is %).', v_video.status using errcode = '22023';
  end if;
  if v_video.concept_approved_at is not null then
    raise exception 'This concept is already approved.' using errcode = '22023';
  end if;

  perform set_config('social.action', 'approve_concept', true);
  perform set_config('social.note', '', true);

  update social_videos set concept_approved_by = auth.uid(), concept_approved_at = now()
  where id = p_video_id
  returning * into v_video;

  return v_video;
end;
$$;

-- ── function grants ─────────────────────────────────────────────────────
-- Supabase grants EXECUTE to anon by default; only signed-in users need
-- these, and each one re-checks the caller's role itself anyway.
revoke all on function social_client_video_action(uuid, text, text) from public, anon;
revoke all on function social_editor_mark_delivered(uuid) from public, anon;
revoke all on function social_operator_approve_concept(uuid) from public, anon;
revoke all on function social_log_video_status() from public, anon, authenticated;
grant execute on function social_client_video_action(uuid, text, text) to authenticated;
grant execute on function social_editor_mark_delivered(uuid) to authenticated;
grant execute on function social_operator_approve_concept(uuid) to authenticated;
