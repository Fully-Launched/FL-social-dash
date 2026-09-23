-- Fully Social OS — a link to each video's finished cut.
-- Safe to re-run.
--
-- The editor pastes the Drive link to the finished edit when marking a
-- video delivered, so the owner (gate 2) and the client (gate 3) can watch
-- that exact video instead of hunting through the shared Final Edits
-- folder. Operators can also set or fix it directly (full access).

alter table social_videos add column if not exists final_cut_url text;

-- Replaces 003's one-argument version. The link is optional here so an
-- older page can still call it; the editor dashboard always asks for it.
drop function if exists social_editor_mark_delivered(uuid);

create or replace function social_editor_mark_delivered(p_video_id uuid, p_final_cut_url text default null)
returns social_videos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_editor_id uuid := social_current_editor_id();
  v_video social_videos;
  v_url text := nullif(btrim(coalesce(p_final_cut_url, '')), '');
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
  if v_url is not null and v_url !~* '^https?://' then
    raise exception 'The finished-cut link must start with http:// or https://.' using errcode = '22023';
  end if;

  perform set_config('social.action', 'mark_delivered', true);
  perform set_config('social.note', '', true);

  update social_videos set
    status = 'in_review',
    final_cut_url = coalesce(v_url, final_cut_url)
  where id = p_video_id
  returning * into v_video;

  return v_video;
end;
$$;

revoke all on function social_editor_mark_delivered(uuid, text) from public, anon;
grant execute on function social_editor_mark_delivered(uuid, text) to authenticated;
