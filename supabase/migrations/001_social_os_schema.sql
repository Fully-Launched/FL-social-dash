-- Fully Social OS — initial backend schema
-- Runs in the SAME Supabase project as fully-launched-crm. Every table here
-- is prefixed `social_` specifically so it can never collide with, or be
-- confused with, the CRM's own tables (clients/team_members/projects/
-- transactions/leads/contacts) — this migration does not touch any of those.
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS
-- throughout, same convention as the CRM's schema.sql.
--
-- Three separate login populations share this one Supabase Auth pool:
--   operator  — Tait (and any future FL staff running the agency side)
--   editor    — contract/staff editors, scoped to their assigned videos
--   client    — Tait's actual clients, scoped to exactly one social_clients row
-- None of these three is "trust everyone who's authenticated" the way the
-- CRM's tables do — see the READ-BEFORE-RUNNING note at the bottom of this
-- file, because that CRM assumption is no longer safe once client/editor
-- logins exist in this same auth.users pool.

-- ── helper: shared updated_at trigger fn ────────────────────────────────
-- Identical to the CRM's own set_updated_at() (supabase/schema.sql in
-- fully-launched-crm). Re-declaring it here with the same body is
-- idempotent and keeps this migration runnable on its own; it does not
-- change behavior for the CRM's tables that already use it.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ── social_operators ─────────────────────────────────────────────────────
-- Full-access agency-side logins. Bootstrapped by inserting the first row
-- directly in the SQL editor (service role bypasses RLS) after the
-- matching person has signed up in Supabase Auth — there is no self-serve
-- signup path into this table.
create table if not exists social_operators (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table social_operators enable row level security;

-- ── social_editors ───────────────────────────────────────────────────────
create table if not exists social_editors (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table social_editors enable row level security;

-- ── social_clients ───────────────────────────────────────────────────────
create table if not exists social_clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  client_system text not null check (client_system in ('self-serve', 'concierge')),
  status text not null default 'active' check (status in ('active', 'paused', 'offboarded')),
  plan_window_start date,
  plan_window_end date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table social_clients enable row level security;

drop trigger if exists social_clients_set_updated_at on social_clients;
create trigger social_clients_set_updated_at
  before update on social_clients
  for each row
  execute function set_updated_at();

-- ── social_client_users ──────────────────────────────────────────────────
-- Maps one login to exactly one client (PK = auth.users.id, so a login can
-- never map to more than one row here). This is the population Tait's
-- actual clients log in as — separate from the CRM's team_members and from
-- social_editors.
create table if not exists social_client_users (
  id uuid primary key references auth.users(id) on delete cascade,
  client_id uuid not null references social_clients(id) on delete cascade,
  name text,
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table social_client_users enable row level security;

create index if not exists social_client_users_client_id_idx on social_client_users(client_id);

-- ── social_videos ────────────────────────────────────────────────────────
-- One row per piece of content, from concept through posted. Folds
-- "concepts" into this table rather than a separate one: the concept and
-- the finished video are the same real-world thing moving through one
-- pipeline, and the current dashboards already model it that way
-- (status starts at concept_pending).
--
-- Two distinct approval gates, tracked two different ways on purpose:
--   Gate 1 — owner approves the concept before the client ever sees it.
--     `status` alone can't carry this: 'concept_pending' has to mean both
--     "not yet client-visible" and "client-visible, awaiting their call,"
--     which is exactly the ambiguity flagged during schema review. So this
--     gate gets its own columns (concept_approved_by/at) and RLS enforces
--     it directly — a client_user literally cannot SELECT or UPDATE a row
--     where status = 'concept_pending' and concept_approved_at is null.
--   Gate 2 — owner approves the finished edit (in_review -> client_review).
--   Gate 3 — client approves the finished edit (client_review -> ready_to_post).
--     Gates 2 and 3 are NOT ambiguous the way gate 1 is — each is a single,
--     unrepeated status transition — so they're tracked purely via `status`
--     rather than duplicating more approver/timestamp columns for them.
create table if not exists social_videos (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references social_clients(id) on delete cascade,

  title text,
  concept text,
  hook text,
  filming_instructions text,
  caption text,
  platform text[] not null default '{}',
  note text,

  status text not null default 'concept_pending' check (status in (
    'concept_pending', 'to_film', 'filmed', 'ready_to_edit', 'rejected',
    'with_editor', 'in_review', 'client_review', 'ready_to_post', 'posted'
  )),

  -- gate 1 — see table comment above
  concept_approved_by uuid references social_operators(id),
  concept_approved_at timestamptz,

  editor_id uuid references social_editors(id),
  -- structured editor brief (storyBeats/mustKeep/captionsStyle/musicVibe/
  -- ctaOverlay/platformSpecs today) — kept as jsonb rather than six more
  -- columns since it's already shaped as one nested object end to end.
  editor_brief jsonb not null default '{}'::jsonb,

  due_to_film date,
  due_to_edit date,
  post_date date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table social_videos enable row level security;

drop trigger if exists social_videos_set_updated_at on social_videos;
create trigger social_videos_set_updated_at
  before update on social_videos
  for each row
  execute function set_updated_at();

create index if not exists social_videos_client_id_idx on social_videos(client_id);
create index if not exists social_videos_editor_id_idx on social_videos(editor_id);
create index if not exists social_videos_status_idx on social_videos(status);

comment on column social_videos.concept_approved_at is
  'Gate 1 (owner approves concept before client sees it). Null = still in the owner''s queue even if status has already been set to concept_pending; RLS blocks client_users from this row until it is set.';

-- ── social_drive_folder_links ────────────────────────────────────────────
-- One row per client. Deep links only — per CLAUDE.md, this repo never
-- touches Drive directly. Includes the three extra links already present
-- in the live dashboards/clients/*/config.json files (root, customer_data,
-- content_ideas) alongside the five named in the schema request, so no
-- real data already in those config.json files is lost when this gets
-- migrated in.
create table if not exists social_drive_folder_links (
  client_id uuid primary key references social_clients(id) on delete cascade,
  root text,
  footage_uploads text,
  final_edits text,
  brand_voice text,
  hooks text,
  assets text,
  customer_data text,
  content_ideas text,
  updated_at timestamptz not null default now()
);

alter table social_drive_folder_links enable row level security;

drop trigger if exists social_drive_folder_links_set_updated_at on social_drive_folder_links;
create trigger social_drive_folder_links_set_updated_at
  before update on social_drive_folder_links
  for each row
  execute function set_updated_at();

-- ── role-check helpers ───────────────────────────────────────────────────
-- security definer + fixed search_path: lets policies below check role
-- membership without those checks themselves being subject to the RLS
-- they're used inside (which would otherwise recurse).
create or replace function social_is_operator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from social_operators where id = auth.uid());
$$;

create or replace function social_current_editor_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from social_editors where id = auth.uid();
$$;

create or replace function social_current_client_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select client_id from social_client_users where id = auth.uid();
$$;

-- ── RLS: social_operators ────────────────────────────────────────────────
drop policy if exists "operators manage operator roster" on social_operators;
create policy "operators manage operator roster" on social_operators
  for all
  to authenticated
  using (social_is_operator())
  with check (social_is_operator());

-- ── RLS: social_editors ──────────────────────────────────────────────────
drop policy if exists "operators manage editor roster" on social_editors;
create policy "operators manage editor roster" on social_editors
  for all
  to authenticated
  using (social_is_operator())
  with check (social_is_operator());

drop policy if exists "editors read own row" on social_editors;
create policy "editors read own row" on social_editors
  for select
  to authenticated
  using (id = auth.uid());

-- ── RLS: social_clients ──────────────────────────────────────────────────
drop policy if exists "operators manage clients" on social_clients;
create policy "operators manage clients" on social_clients
  for all
  to authenticated
  using (social_is_operator())
  with check (social_is_operator());

drop policy if exists "editors read assigned clients" on social_clients;
create policy "editors read assigned clients" on social_clients
  for select
  to authenticated
  using (
    exists (
      select 1 from social_videos v
      where v.client_id = social_clients.id
        and v.editor_id = auth.uid()
    )
  );

drop policy if exists "client users read own client" on social_clients;
create policy "client users read own client" on social_clients
  for select
  to authenticated
  using (id = social_current_client_id());

-- ── RLS: social_client_users ─────────────────────────────────────────────
drop policy if exists "operators manage client logins" on social_client_users;
create policy "operators manage client logins" on social_client_users
  for all
  to authenticated
  using (social_is_operator())
  with check (social_is_operator());

drop policy if exists "client users read own login row" on social_client_users;
create policy "client users read own login row" on social_client_users
  for select
  to authenticated
  using (id = auth.uid());

-- ── RLS: social_drive_folder_links ───────────────────────────────────────
drop policy if exists "operators manage drive links" on social_drive_folder_links;
create policy "operators manage drive links" on social_drive_folder_links
  for all
  to authenticated
  using (social_is_operator())
  with check (social_is_operator());

drop policy if exists "editors read assigned client drive links" on social_drive_folder_links;
create policy "editors read assigned client drive links" on social_drive_folder_links
  for select
  to authenticated
  using (
    exists (
      select 1 from social_videos v
      where v.client_id = social_drive_folder_links.client_id
        and v.editor_id = auth.uid()
    )
  );

drop policy if exists "client users read own drive links" on social_drive_folder_links;
create policy "client users read own drive links" on social_drive_folder_links
  for select
  to authenticated
  using (client_id = social_current_client_id());

-- ── RLS: social_videos ───────────────────────────────────────────────────
drop policy if exists "operators manage videos" on social_videos;
create policy "operators manage videos" on social_videos
  for all
  to authenticated
  using (social_is_operator())
  with check (social_is_operator());

-- Editors: only videos assigned to them, and only once they've actually
-- reached the editor (status with_editor or later) — an editor should not
-- see a video that's merely earmarked for them while it's still concept
-- or filming stage.
drop policy if exists "editors read assigned videos" on social_videos;
create policy "editors read assigned videos" on social_videos
  for select
  to authenticated
  using (
    editor_id = auth.uid()
    and status in ('with_editor', 'in_review', 'client_review', 'ready_to_post', 'posted')
  );

-- Editors can update a video only while it's actually sitting with them —
-- e.g. to mark it delivered (with_editor -> in_review). They cannot use
-- this to reassign, reclaim, or jump a video across other clients/editors.
drop policy if exists "editors update videos with them" on social_videos;
create policy "editors update videos with them" on social_videos
  for update
  to authenticated
  using (editor_id = auth.uid() and status = 'with_editor')
  with check (editor_id = auth.uid());

-- Client users: their own client's videos, and gate 1 enforced here too —
-- not just hidden in the UI. A concept the owner hasn't approved yet does
-- not exist as far as this policy is concerned.
drop policy if exists "client users read own visible videos" on social_videos;
create policy "client users read own visible videos" on social_videos
  for select
  to authenticated
  using (
    client_id = social_current_client_id()
    and (status <> 'concept_pending' or concept_approved_at is not null)
  );

drop policy if exists "client users update own visible videos" on social_videos;
create policy "client users update own visible videos" on social_videos
  for update
  to authenticated
  using (
    client_id = social_current_client_id()
    and (status <> 'concept_pending' or concept_approved_at is not null)
  )
  with check (client_id = social_current_client_id());

-- ═══════════════════════════════════════════════════════════════════════
-- READ BEFORE RUNNING — shared-project security note, not code to run.
--
-- The CRM's own tables (team_members, projects, project_tasks,
-- transactions, leads, contacts) use `to authenticated using (true)` —
-- "any authenticated user is trusted staff." That assumption was true when
-- the only Supabase Auth users in this project were FL team members. It
-- stops being true the moment the first social_client_users or
-- social_editors row is created: a client or a contract editor logging
-- into their portal is now also "authenticated," and under the CRM's
-- current policies would be able to read and write every CRM table,
-- including transactions (financials) and every other client's project
-- data — not just their own.
--
-- Every policy in *this* file checks actual role membership
-- (social_is_operator() / editor assignment / social_current_client_id())
-- rather than bare `authenticated`, specifically because of this. But
-- nothing in this migration touches the CRM's tables or policies, per
-- instructions — so that exposure on the CRM side is real and outstanding
-- once client/editor logins exist, until the CRM's policies are tightened
-- to check team_members membership the same way the transactions table
-- already does (admin-only pattern in migrations/002).
-- ═══════════════════════════════════════════════════════════════════════
