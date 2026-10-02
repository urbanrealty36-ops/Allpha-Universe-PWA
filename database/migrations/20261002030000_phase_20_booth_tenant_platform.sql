-- Phase 20 — Booth / Tenant Platform
-- Depends on Phase 19 Districts and the cross-domain Booth foundation.
alter table public.booths add column if not exists theme_key text;
alter table public.booths add column if not exists scene_config jsonb not null default '{}'::jsonb;
alter table public.booths add column if not exists catalog_config jsonb not null default '{}'::jsonb;
alter table public.booths add column if not exists live_entry_config jsonb not null default '{}'::jsonb;
alter table public.booths add column if not exists created_by_user_id uuid references public.users(id) on delete restrict;
alter table public.booths add column if not exists updated_at timestamptz not null default timezone('utc',now());

create table if not exists public.booth_activity_events (
 id uuid primary key default gen_random_uuid(),
 booth_id uuid not null references public.booths(id) on delete cascade,
 event_type text not null check (event_type in ('booth_created','booth_updated','booth_theme_selected','booth_asset_uploaded','booth_slot_bound','booth_submitted','booth_published','booth_suspended','booth_archived','booth_lease_requested','booth_lease_activated','booth_lease_expired','booth_live_entry_opened')),
 actor_type text check (actor_type in ('user','agent','organization','system')),
 actor_id uuid,
 payload jsonb not null default '{}'::jsonb,
 correlation_id uuid,
 occurred_at timestamptz not null default timezone('utc',now())
);

create index if not exists booths_district_status_idx on public.booths(district_id,status,updated_at desc);
create index if not exists booths_owner_idx on public.booths(owner_user_id,owner_organization_id,agent_id,status);
create index if not exists booths_district_zone_idx on public.booths(district_zone_id,status);
create index if not exists booth_leases_booth_status_idx on public.booth_leases(booth_id,status,starts_at desc);
create index if not exists booth_display_assets_booth_status_idx on public.booth_display_assets(booth_id,status,sort_order);
create index if not exists booth_display_slots_booth_idx on public.booth_display_slots(booth_id,slot_key);
create index if not exists booth_activity_events_booth_idx on public.booth_activity_events(booth_id,occurred_at desc);

alter table public.booths enable row level security;
alter table public.booth_leases enable row level security;
alter table public.booth_display_assets enable row level security;
alter table public.booth_display_slots enable row level security;
alter table public.booth_activity_events enable row level security;

create or replace function private.booth_owner(p_booth_id uuid) returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from public.booths b where b.id=p_booth_id and ((b.owner_user_id=auth.uid()) or (b.owner_organization_id is not null and exists(select 1 from public.organization_members m where m.organization_id=b.owner_organization_id and m.user_id=auth.uid())) or (b.agent_id is not null and exists(select 1 from public.agents a where a.id=b.agent_id and a.owner_user_id=auth.uid()))))
$$;
revoke all on function private.booth_owner(uuid) from public,anon,authenticated;

create or replace function private.booth_district_access(p_district_id uuid) returns boolean language sql stable security definer set search_path='' as $$ select private.district_access_allowed(p_district_id,auth.uid()) $$;
revoke all on function private.booth_district_access(uuid) from public,anon,authenticated;

create or replace function private.booth_subject_authorized(p_owner_type text,p_owner_id uuid,p_agent_id uuid) returns boolean language plpgsql stable security definer set search_path='' as $$
begin
 if p_owner_type='user' then return p_owner_id=auth.uid() and p_agent_id is null; end if;
 if p_owner_type='organization' then return p_agent_id is null and exists(select 1 from public.organization_members m where m.organization_id=p_owner_id and m.user_id=auth.uid()); end if;
 if p_owner_type='agent' then return p_owner_id is null and exists(select 1 from public.agents a where a.id=p_agent_id and a.owner_user_id=auth.uid()); end if;
 return false;
end $$;
revoke all on function private.booth_subject_authorized(text,uuid,uuid) from public,anon,authenticated;

create or replace function private.booth_visible(p_booth_id uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.booths b where b.id=p_booth_id and b.status='active' and b.moderation_status='approved' and private.booth_district_access(b.district_id)) $$;
revoke all on function private.booth_visible(uuid) from public,anon,authenticated;

drop policy if exists booths_select on public.booths;
drop policy if exists booth_leases_select on public.booth_leases;
drop policy if exists booth_display_assets_select on public.booth_display_assets;
drop policy if exists booth_display_slots_select on public.booth_display_slots;
drop policy if exists booth_activity_events_select on public.booth_activity_events;
create policy booths_select on public.booths for select to authenticated using (private.booth_owner(id) or private.booth_visible(id));
create policy booth_leases_select on public.booth_leases for select to authenticated using (private.booth_owner(booth_id));
create policy booth_display_assets_select on public.booth_display_assets for select to authenticated using (private.booth_owner(booth_id) or private.booth_visible(booth_id));
create policy booth_display_slots_select on public.booth_display_slots for select to authenticated using (private.booth_owner(booth_id) or private.booth_visible(booth_id));
create policy booth_activity_events_select on public.booth_activity_events for select to authenticated using (private.booth_owner(booth_id) or private.booth_visible(booth_id));
revoke all on public.booths,public.booth_leases,public.booth_display_assets,public.booth_display_slots,public.booth_activity_events from anon,authenticated;
grant select on public.booths,public.booth_leases,public.booth_display_assets,public.booth_display_slots,public.booth_activity_events to authenticated;

create or replace function public.create_booth(p_district_id uuid,p_district_zone_id uuid,p_owner_type text,p_owner_id uuid,p_agent_id uuid,p_booth_type text,p_tier text,p_name text,p_slug text,p_description text,p_theme_key text,p_display_config jsonb,p_scene_config jsonb,p_catalog_config jsonb,p_live_entry_config jsonb)
returns public.booths language plpgsql security definer set search_path='' as $$
declare b public.booths; d public.districts;
begin
 select * into d from public.districts where id=p_district_id and status='active';
 if not found or not private.booth_district_access(p_district_id) then raise exception 'BOOTH_DISTRICT_ACCESS_DENIED'; end if;
 if not private.booth_subject_authorized(p_owner_type,p_owner_id,p_agent_id) then raise exception 'BOOTH_OWNER_DENIED'; end if;
 if p_tier<>'free' and not exists(select 1 from public.district_entitlements e where e.district_id=p_district_id and e.status='active' and (e.starts_at is null or e.starts_at<=timezone('utc',now())) and (e.expires_at is null or e.expires_at>timezone('utc',now())) and ((p_owner_type='user' and e.subject_type='user' and e.subject_id=p_owner_id and (e.tier=p_tier or e.tier='enterprise')) or (p_owner_type='organization' and e.subject_type='organization' and e.subject_id=p_owner_id and (e.tier=p_tier or e.tier='enterprise')))) then raise exception 'BOOTH_TIER_NOT_ENTITLED'; end if;
 if d.theme_key is not null and p_theme_key is distinct from d.theme_key then raise exception 'BOOTH_THEME_INCOMPATIBLE'; end if;
 if p_district_zone_id is not null and not exists(select 1 from public.district_zones z where z.id=p_district_zone_id and z.district_id=p_district_id and z.status='active') then raise exception 'BOOTH_ZONE_INVALID'; end if;
 insert into public.booths(owner_user_id,owner_organization_id,agent_id,district_id,district_zone_id,booth_type,tier,name,slug,description,theme_id,theme_key,display_config,scene_config,catalog_config,live_entry_config,status,moderation_status,created_by_user_id,created_at,updated_at)
 values(case when p_owner_type='user' then p_owner_id end,case when p_owner_type='organization' then p_owner_id end,case when p_owner_type='agent' then p_agent_id end,p_district_id,p_district_zone_id,p_booth_type,p_tier,p_name,p_slug,p_description,null,p_theme_key,coalesce(p_display_config,'{}'::jsonb),coalesce(p_scene_config,'{}'::jsonb),coalesce(p_catalog_config,'{}'::jsonb),coalesce(p_live_entry_config,'{}'::jsonb),'draft','pending',auth.uid(),timezone('utc',now()),timezone('utc',now())) returning * into b;
 insert into public.booth_activity_events(booth_id,event_type,actor_type,actor_id) values(b.id,'booth_created','user',auth.uid());
 if p_theme_key is not null then insert into public.booth_activity_events(booth_id,event_type,actor_type,actor_id,payload) values(b.id,'booth_theme_selected','user',auth.uid(),jsonb_build_object('theme_key',p_theme_key)); end if;
 return b;
end $$;

create or replace function public.update_booth(p_booth_id uuid,p_name text,p_description text,p_theme_key text,p_display_config jsonb,p_scene_config jsonb,p_catalog_config jsonb,p_live_entry_config jsonb)
returns public.booths language plpgsql security definer set search_path='' as $$
declare b public.booths; d public.districts;
begin
 if not private.booth_owner(p_booth_id) then raise exception 'BOOTH_OWNER_DENIED'; end if;
 select d.* into d from public.districts d join public.booths x on x.district_id=d.id where x.id=p_booth_id;
 if d.theme_key is not null and p_theme_key is distinct from d.theme_key then raise exception 'BOOTH_THEME_INCOMPATIBLE'; end if;
 update public.booths set name=p_name,description=p_description,theme_key=p_theme_key,display_config=coalesce(p_display_config,display_config),scene_config=coalesce(p_scene_config,scene_config),catalog_config=coalesce(p_catalog_config,catalog_config),live_entry_config=coalesce(p_live_entry_config,live_entry_config),updated_at=timezone('utc',now()) where id=p_booth_id returning * into b;
 insert into public.booth_activity_events(booth_id,event_type,actor_type,actor_id) values(b.id,'booth_updated','user',auth.uid());
 return b;
end $$;

create or replace function public.add_booth_asset(p_booth_id uuid,p_asset_type text,p_storage_path text,p_mime_type text,p_metadata jsonb,p_sort_order integer)
returns public.booth_display_assets language plpgsql security definer set search_path='' as $$
declare a public.booth_display_assets; b public.booths; prefix text;
begin
 if not private.booth_owner(p_booth_id) then raise exception 'BOOTH_OWNER_DENIED'; end if;
 select * into b from public.booths where id=p_booth_id;
 prefix:=case when b.owner_user_id is not null then b.owner_user_id::text when b.owner_organization_id is not null then b.owner_organization_id::text else (select owner_user_id::text from public.agents where id=b.agent_id) end;
 if p_storage_path is null or position(prefix||'/' in p_storage_path)<>1 then raise exception 'BOOTH_ASSET_PATH_DENIED'; end if;
 insert into public.booth_display_assets(booth_id,asset_type,storage_path,mime_type,metadata,sort_order,status) values(p_booth_id,p_asset_type,p_storage_path,p_mime_type,coalesce(p_metadata,'{}'::jsonb),p_sort_order,'pending') returning * into a;
 insert into public.booth_activity_events(booth_id,event_type,actor_type,actor_id,payload) values(b.id,'booth_asset_uploaded','user',auth.uid(),jsonb_build_object('asset_id',a.id,'asset_type',p_asset_type));
 return a;
end $$;

create or replace function public.bind_booth_slot(p_booth_id uuid,p_slot_key text,p_asset_id uuid,p_presentation_config jsonb)
returns public.booth_display_slots language plpgsql security definer set search_path='' as $$
declare s public.booth_display_slots;
begin
 if not private.booth_owner(p_booth_id) then raise exception 'BOOTH_OWNER_DENIED'; end if;
 if not exists(select 1 from public.booth_display_assets a where a.id=p_asset_id and a.booth_id=p_booth_id and a.status='active') then raise exception 'BOOTH_ASSET_NOT_ACTIVE'; end if;
 insert into public.booth_display_slots(booth_id,slot_key,asset_id,presentation_config) values(p_booth_id,p_slot_key,p_asset_id,coalesce(p_presentation_config,'{}'::jsonb)) on conflict(booth_id,slot_key) do update set asset_id=excluded.asset_id,presentation_config=excluded.presentation_config,updated_at=timezone('utc',now()) returning * into s;
 insert into public.booth_activity_events(booth_id,event_type,actor_type,actor_id,payload) values(p_booth_id,'booth_slot_bound','user',auth.uid(),jsonb_build_object('slot_key',p_slot_key,'asset_id',p_asset_id));
 return s;
end $$;

create or replace function public.submit_booth(p_booth_id uuid)
returns public.booths language plpgsql security definer set search_path='' as $$
declare b public.booths;
begin
 if not private.booth_owner(p_booth_id) then raise exception 'BOOTH_OWNER_DENIED'; end if;
 if not exists(select 1 from public.booths x where x.id=p_booth_id and x.status='draft') then raise exception 'BOOTH_NOT_DRAFT'; end if;
 update public.booths set status='pending_review',moderation_status='pending',updated_at=timezone('utc',now()) where id=p_booth_id returning * into b;
 insert into public.booth_activity_events(booth_id,event_type,actor_type,actor_id) values(p_booth_id,'booth_submitted','user',auth.uid());
 return b;
end $$;

create or replace function public.publish_booth(p_booth_id uuid)
returns public.booths language plpgsql security definer set search_path='' as $$
declare b public.booths;
begin
 if not private.booth_owner(p_booth_id) then raise exception 'BOOTH_OWNER_DENIED'; end if;
 select * into b from public.booths where id=p_booth_id;
 if b.status not in ('pending_review','draft') then raise exception 'BOOTH_NOT_PUBLISHABLE'; end if;
 if b.moderation_status<>'approved' then raise exception 'BOOTH_MODERATION_REQUIRED'; end if;
 if not exists(select 1 from public.booth_display_assets a where a.booth_id=b.id and a.status='active') then raise exception 'BOOTH_ASSET_REQUIRED'; end if;
 update public.booths set status='active',updated_at=timezone('utc',now()) where id=b.id returning * into b;
 insert into public.booth_activity_events(booth_id,event_type,actor_type,actor_id) values(b.id,'booth_published','user',auth.uid());
 return b;
end $$;

create or replace function public.request_booth_lease(p_booth_id uuid,p_tier text,p_size_class text,p_visibility_class text,p_price_amount numeric,p_currency text,p_billing_cycle text,p_starts_at timestamptz,p_ends_at timestamptz,p_metadata jsonb)
returns public.booth_leases language plpgsql security definer set search_path='' as $$
declare b public.booths; l public.booth_leases;
begin
 if not private.booth_owner(p_booth_id) then raise exception 'BOOTH_OWNER_DENIED'; end if;
 select * into b from public.booths where id=p_booth_id;
 if b.tier<>p_tier then raise exception 'BOOTH_LEASE_TIER_MISMATCH'; end if;
 insert into public.booth_leases(booth_id,owner_user_id,owner_organization_id,tier,size_class,visibility_class,price_amount,currency,billing_cycle,starts_at,ends_at,status,entitlement_snapshot,metadata)
 values(b.id,b.owner_user_id,b.owner_organization_id,b.tier,p_size_class,p_visibility_class,p_price_amount,p_currency,p_billing_cycle,p_starts_at,p_ends_at,'pending',jsonb_build_object('booth_tier',b.tier),coalesce(p_metadata,'{}'::jsonb)) returning * into l;
 insert into public.booth_activity_events(booth_id,event_type,actor_type,actor_id,payload) values(b.id,'booth_lease_requested','user',auth.uid(),jsonb_build_object('lease_id',l.id));
 return l;
end $$;

create or replace function public.activate_booth_lease(p_lease_id uuid)
returns public.booth_leases language plpgsql security definer set search_path='' as $$
declare l public.booth_leases;
begin
 select * into l from public.booth_leases where id=p_lease_id;
 if not found or not private.booth_owner(l.booth_id) then raise exception 'BOOTH_OWNER_DENIED'; end if;
 if l.status<>'pending' then raise exception 'BOOTH_LEASE_NOT_PENDING'; end if;
 update public.booth_leases set status='active',updated_at=timezone('utc',now()) where id=l.id returning * into l;
 insert into public.booth_activity_events(booth_id,event_type,actor_type,actor_id,payload) values(l.booth_id,'booth_lease_activated','user',auth.uid(),jsonb_build_object('lease_id',l.id));
 return l;
end $$;

do $$ declare r record; begin
 for r in select p.oid::regprocedure as fn from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('create_booth','update_booth','add_booth_asset','bind_booth_slot','submit_booth','publish_booth','request_booth_lease','activate_booth_lease') loop
 execute 'revoke all on function '||r.fn||' from public,anon'; execute 'grant execute on function '||r.fn||' to authenticated'; end loop; end $$;

do $$ begin
 begin alter publication supabase_realtime add table public.booths; exception when duplicate_object then null; end;
 begin alter publication supabase_realtime add table public.booth_leases; exception when duplicate_object then null; end;
 begin alter publication supabase_realtime add table public.booth_display_assets; exception when duplicate_object then null; end;
 begin alter publication supabase_realtime add table public.booth_display_slots; exception when duplicate_object then null; end;
 begin alter publication supabase_realtime add table public.booth_activity_events; exception when duplicate_object then null; end;
end $$;
