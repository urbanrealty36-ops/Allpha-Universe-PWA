-- Phase 07 — Agent Memory & Knowledge
-- Canonical migration for the memory/knowledge foundation.
-- Embedding dimensions remain provider/model controlled; no model-specific
-- dimension is hardcoded in the database.
create table if not exists public.agent_memory_embeddings (
  memory_id uuid primary key references public.agent_memory(id) on delete cascade,
  embedding extensions.vector,
  model text,
  dimensions integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (dimensions is null or dimensions > 0)
);

create table if not exists public.agent_memory_access_events (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.agent_memory(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  owner_user_id uuid not null references public.users(id) on delete cascade,
  access_type text not null check (access_type in ('retrieve','review','export')),
  purpose text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.knowledge_access_events (
  id uuid primary key default gen_random_uuid(),
  knowledge_item_id uuid not null references public.knowledge_items(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete cascade,
  owner_user_id uuid not null references public.users(id) on delete cascade,
  access_type text not null check (access_type in ('retrieve','review','export')),
  purpose text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.agent_memory add column if not exists retention_policy jsonb not null default '{}'::jsonb;
alter table public.agent_memory add column if not exists consent_basis text;
alter table public.agent_memory add column if not exists last_accessed_at timestamptz;
alter table public.agent_memory add column if not exists reviewed_at timestamptz;
alter table public.knowledge_items add column if not exists retention_policy jsonb not null default '{}'::jsonb;
alter table public.knowledge_items add column if not exists status text not null default 'active';
alter table public.knowledge_items drop constraint if exists knowledge_items_status_check;
alter table public.knowledge_items add constraint knowledge_items_status_check check (status in ('active','archived','deleted'));
alter table public.knowledge_items add column if not exists deleted_at timestamptz;
alter table public.knowledge_chunks add column if not exists source_locator jsonb not null default '{}'::jsonb;

create index if not exists agent_memory_embeddings_memory_id_idx on public.agent_memory_embeddings(memory_id);
create index if not exists agent_memory_access_events_memory_idx on public.agent_memory_access_events(memory_id,created_at desc);
create index if not exists agent_memory_access_events_agent_idx on public.agent_memory_access_events(agent_id,created_at desc);
create index if not exists agent_memory_access_events_owner_idx on public.agent_memory_access_events(owner_user_id,created_at desc);
create index if not exists knowledge_access_events_item_idx on public.knowledge_access_events(knowledge_item_id,created_at desc);
create index if not exists knowledge_access_events_agent_idx on public.knowledge_access_events(agent_id,created_at desc);
create index if not exists knowledge_access_events_owner_idx on public.knowledge_access_events(owner_user_id,created_at desc);
create index if not exists knowledge_items_agent_status_idx on public.knowledge_items(agent_id,status,updated_at desc);
create index if not exists knowledge_chunks_item_idx on public.knowledge_chunks(knowledge_item_id,chunk_index);

alter table public.agent_memory enable row level security;
alter table public.knowledge_items enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.agent_memory_embeddings enable row level security;
alter table public.agent_memory_access_events enable row level security;
alter table public.knowledge_access_events enable row level security;

revoke all on table public.agent_memory_embeddings,public.agent_memory_access_events,public.knowledge_access_events from anon,authenticated;
grant select,insert,update,delete on public.agent_memory_embeddings to authenticated;
grant select on public.agent_memory_access_events,public.knowledge_access_events to authenticated;

drop policy if exists agent_memory_owner_all on public.agent_memory;
create policy agent_memory_owner_all on public.agent_memory for all to authenticated
using(owner_user_id=(select auth.uid()))
with check(owner_user_id=(select auth.uid()) and exists(select 1 from public.agents a where a.id=agent_id and a.owner_user_id=(select auth.uid())));

drop policy if exists knowledge_items_owner_all on public.knowledge_items;
create policy knowledge_items_owner_all on public.knowledge_items for all to authenticated
using(owner_user_id=(select auth.uid()))
with check(owner_user_id=(select auth.uid()) and (agent_id is null or exists(select 1 from public.agents a where a.id=agent_id and a.owner_user_id=(select auth.uid()))));

drop policy if exists knowledge_chunks_owner_all on public.knowledge_chunks;
create policy knowledge_chunks_owner_all on public.knowledge_chunks for all to authenticated
using(exists(select 1 from public.knowledge_items k where k.id=knowledge_item_id and k.owner_user_id=(select auth.uid())))
with check(exists(select 1 from public.knowledge_items k where k.id=knowledge_item_id and k.owner_user_id=(select auth.uid())));

drop policy if exists memory_embeddings_owner_all on public.agent_memory_embeddings;
create policy memory_embeddings_owner_all on public.agent_memory_embeddings for all to authenticated
using(exists(select 1 from public.agent_memory m where m.id=memory_id and m.owner_user_id=(select auth.uid())))
with check(exists(select 1 from public.agent_memory m where m.id=memory_id and m.owner_user_id=(select auth.uid())));

drop policy if exists memory_access_owner_select on public.agent_memory_access_events;
create policy memory_access_owner_select on public.agent_memory_access_events for select to authenticated
using(owner_user_id=(select auth.uid()));

drop policy if exists knowledge_access_owner_select on public.knowledge_access_events;
create policy knowledge_access_owner_select on public.knowledge_access_events for select to authenticated
using(owner_user_id=(select auth.uid()));


create or replace function public.create_agent_memory(p_agent_id uuid,p_memory_type text,p_content text,p_metadata jsonb default '{}'::jsonb,p_sensitivity text default null,p_source_type text default null,p_source_id uuid default null,p_expires_at timestamptz default null,p_consent_basis text default null)
returns jsonb language plpgsql security invoker set search_path=''
as $ declare v_id uuid; begin
if (select auth.uid()) is null then raise exception using errcode='42501',message='Authentication required'; end if;
if p_content is null or length(btrim(p_content))=0 then raise exception using errcode='22023',message='Memory content is required'; end if;
if not exists(select 1 from public.agents a where a.id=p_agent_id and a.owner_user_id=(select auth.uid())) then raise exception using errcode='42501',message='Agent ownership denied'; end if;
insert into public.agent_memory(agent_id,owner_user_id,memory_type,content,metadata,status,sensitivity,source_type,source_id,expires_at,consent_basis)
values(p_agent_id,(select auth.uid()),btrim(p_memory_type),p_content,p_metadata,'active',p_sensitivity,p_source_type,p_source_id,p_expires_at,p_consent_basis) returning id into v_id;
return jsonb_build_object('memory_id',v_id); end; $;

create or replace function public.create_knowledge_item(p_agent_id uuid,p_title text,p_content text,p_source_uri text default null,p_provenance jsonb default '{}'::jsonb,p_visibility public.visibility_level default 'private',p_retention_policy jsonb default '{}'::jsonb)
returns jsonb language plpgsql security invoker set search_path=''
as $ declare v_id uuid; begin
if (select auth.uid()) is null then raise exception using errcode='42501',message='Authentication required'; end if;
if p_content is null or length(btrim(p_content))=0 then raise exception using errcode='22023',message='Knowledge content is required'; end if;
if p_agent_id is not null and not exists(select 1 from public.agents a where a.id=p_agent_id and a.owner_user_id=(select auth.uid())) then raise exception using errcode='42501',message='Agent ownership denied'; end if;
insert into public.knowledge_items(owner_user_id,agent_id,title,content,source_uri,provenance,visibility,retention_policy,status)
values((select auth.uid()),p_agent_id,nullif(btrim(p_title),''),p_content,p_source_uri,p_provenance,p_visibility,p_retention_policy,'active') returning id into v_id;
return jsonb_build_object('knowledge_item_id',v_id); end; $;

create or replace function public.review_agent_memory(p_memory_id uuid)
returns jsonb language plpgsql security invoker set search_path=''
as $ begin
update public.agent_memory set reviewed_at=timezone('utc',now()),last_accessed_at=timezone('utc',now()),updated_at=timezone('utc',now())
where id=p_memory_id and owner_user_id=(select auth.uid()) and deleted_at is null;
if not found then raise exception using errcode='42501',message='Memory not found or access denied'; end if;
return jsonb_build_object('memory_id',p_memory_id,'status','reviewed'); end; $;

create or replace function public.delete_agent_memory(p_memory_id uuid)
returns jsonb language plpgsql security invoker set search_path=''
as $ begin
update public.agent_memory set status='deleted',deleted_at=timezone('utc',now()),updated_at=timezone('utc',now())
where id=p_memory_id and owner_user_id=(select auth.uid()) and deleted_at is null;
if not found then raise exception using errcode='42501',message='Memory not found or access denied'; end if;
return jsonb_build_object('memory_id',p_memory_id,'status','deleted'); end; $;

create or replace function public.delete_knowledge_item(p_knowledge_item_id uuid)
returns jsonb language plpgsql security invoker set search_path=''
as $ begin
update public.knowledge_items set status='deleted',deleted_at=timezone('utc',now()),updated_at=timezone('utc',now())
where id=p_knowledge_item_id and owner_user_id=(select auth.uid()) and status<>'deleted';
if not found then raise exception using errcode='42501',message='Knowledge item not found or access denied'; end if;
return jsonb_build_object('knowledge_item_id',p_knowledge_item_id,'status','deleted'); end; $;

revoke execute on function public.create_agent_memory(uuid,text,text,jsonb,text,text,uuid,timestamptz,text) from public,anon;
revoke execute on function public.create_knowledge_item(uuid,text,text,text,jsonb,public.visibility_level,jsonb) from public,anon;
revoke execute on function public.review_agent_memory(uuid) from public,anon;
revoke execute on function public.delete_agent_memory(uuid) from public,anon;
revoke execute on function public.delete_knowledge_item(uuid) from public,anon;
grant execute on function public.create_agent_memory(uuid,text,text,jsonb,text,text,uuid,timestamptz,text) to authenticated;
grant execute on function public.create_knowledge_item(uuid,text,text,text,jsonb,public.visibility_level,jsonb) to authenticated;
grant execute on function public.review_agent_memory(uuid) to authenticated;
grant execute on function public.delete_agent_memory(uuid) to authenticated;
grant execute on function public.delete_knowledge_item(uuid) to authenticated;
