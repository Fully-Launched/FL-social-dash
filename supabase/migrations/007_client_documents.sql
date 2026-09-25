-- Fully Social OS — each client's important documents (Google Drive
-- links), shown on the Documents page of their portal. Safe to re-run.
--
-- Operators manage them (Clients → Edit on the operator dashboard); a
-- client login reads only its own client's documents. Editors don't see
-- them (they get the brand guidelines link on each video instead).

create table if not exists social_client_documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references social_clients(id) on delete cascade,
  title text not null,
  url text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists social_client_documents_client_idx on social_client_documents(client_id, position);

alter table social_client_documents enable row level security;

drop policy if exists "operators manage client documents" on social_client_documents;
create policy "operators manage client documents" on social_client_documents
  for all
  to authenticated
  using (social_is_operator())
  with check (social_is_operator());

drop policy if exists "client users read own documents" on social_client_documents;
create policy "client users read own documents" on social_client_documents
  for select
  to authenticated
  using (client_id = social_current_client_id());
