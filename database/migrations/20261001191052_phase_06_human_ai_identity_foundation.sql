create table if not exists public.agent_identities (
  agent_id uuid primary key references public.agents(id) on delete cascade,
  identity_type text not null default 'ai_agent',
  identity_version integer not null default 1 check (identity_version > 0),
  verification_status text not null default 'unverified' check (verification_status in ('unverified','pending','verified','revoked')),
  verification_method text,
  verified_at timestamptz,
  external_subject text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.agent_credentials (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  credential_type text not null,
  issuer text not null,
  subject text,
  status text not null default 'active' check (status in ('pending','active','expired','revoked')),
  issued_at timestamptz,
  expires_at timestamptz,
  claims jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (expires_at is null or issued_at is null or expires_at > issued_at)
);

create table if not exists public.agent_budgets (
  agent_id uuid primary key references public.agents(id) on delete cascade,
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  max_spend_per_action numeric(20,2) check (max_spend_per_action is null or max_spend_per_action >= 0),
  daily_spend_limit numeric(20,2) check (daily_spend_limit is null or daily_spend_limit >= 0),
  monthly_spend_limit numeric(20,2) check (monthly_spend_limit is null or monthly_spend_limit >= 0),
  requires_approval_above numeric(20,2) check (requires_approval_above is null or requires_approval_above >= 0),
  enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.agent_reputation_events (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  event_type text not null,
  score_delta numeric(12,4) not null,
  source_type text,
  source_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.agent_passports drop constraint if exists agent_passports_verification_status_check;
alter table public.agent_passports add constraint agent_passports_verification_status_check check (verification_status in ('unverified','pending','verified','revoked'));
alter table public.agent_policies drop constraint if exists agent_policies_autonomy_level_check;
alter table public.agent_policies add constraint agent_policies_autonomy_level_check check (autonomy_level is null or autonomy_level in ('recommend','assist','conditional','autonomous'));

create index if not exists agent_credentials_agent_idx on public.agent_credentials(agent_id);
create index if not exists agent_credentials_status_idx on public.agent_credentials(agent_id,status);
create index if not exists agent_reputation_events_agent_occurred_idx on public.agent_reputation_events(agent_id,occurred_at desc);
create index if not exists agent_budgets_enabled_idx on public.agent_budgets(agent_id,enabled);

alter table public.agent_identities enable row level security;
alter table public.agent_credentials enable row level security;
alter table public.agent_budgets enable row level security;
alter table public.agent_reputation_events enable row level security;

revoke all on table public.agent_identities, public.agent_credentials, public.agent_budgets, public.agent_reputation_events from anon, authenticated;
grant select,insert,update,delete on table public.agent_identities, public.agent_credentials, public.agent_budgets to authenticated;
grant select on table public.agent_reputation_events to authenticated;

drop policy if exists agent_identities_owner_all on public.agent_identities;
create policy agent_identities_owner_all on public.agent_identities for all to authenticated
using (exists (select 1 from public.agents a where a.id=agent_id and a.owner_user_id=(select auth.uid())))
with check (exists (select 1 from public.agents a where a.id=agent_id and a.owner_user_id=(select auth.uid())));

drop policy if exists agent_credentials_owner_all on public.agent_credentials;
create policy agent_credentials_owner_all on public.agent_credentials for all to authenticated
using (exists (select 1 from public.agents a where a.id=agent_id and a.owner_user_id=(select auth.uid())))
with check (exists (select 1 from public.agents a where a.id=agent_id and a.owner_user_id=(select auth.uid())));

drop policy if exists agent_budgets_owner_all on public.agent_budgets;
create policy agent_budgets_owner_all on public.agent_budgets for all to authenticated
using (exists (select 1 from public.agents a where a.id=agent_id and a.owner_user_id=(select auth.uid())))
with check (exists (select 1 from public.agents a where a.id=agent_id and a.owner_user_id=(select auth.uid())));

drop policy if exists agent_reputation_events_owner_select on public.agent_reputation_events;
create policy agent_reputation_events_owner_select on public.agent_reputation_events for select to authenticated
using (exists (select 1 from public.agents a where a.id=agent_id and a.owner_user_id=(select auth.uid())));

drop policy if exists agent_passports_owner_all on public.agent_passports;
create policy agent_passports_owner_all on public.agent_passports for all to authenticated
using (exists (select 1 from public.agents a where a.id=agent_id and a.owner_user_id=(select auth.uid())))
with check (exists (select 1 from public.agents a where a.id=agent_id and a.owner_user_id=(select auth.uid())));

create or replace function public.create_agent_identity(
  p_name text, p_handle text default null, p_description text default null, p_organization_id uuid default null,
  p_visibility public.visibility_level default 'public', p_persona jsonb default '{}'::jsonb, p_tone jsonb default '{}'::jsonb,
  p_interests jsonb default '[]'::jsonb, p_goals jsonb default '[]'::jsonb, p_boundaries jsonb default '{}'::jsonb,
  p_autonomy_level text default 'recommend', p_budget_currency text default 'USD',
  p_max_spend_per_action numeric default null, p_daily_spend_limit numeric default null,
  p_monthly_spend_limit numeric default null, p_requires_approval_above numeric default null)
returns jsonb language plpgsql security invoker set search_path=''
as $$
declare v_agent_id uuid;
begin
  if (select auth.uid()) is null then raise exception using errcode='42501',message='Authentication required'; end if;
  if p_name is null or length(btrim(p_name))=0 then raise exception using errcode='22023',message='Agent name is required'; end if;
  if p_autonomy_level not in ('recommend','assist','conditional','autonomous') then raise exception using errcode='22023',message='Invalid autonomy level'; end if;
  if p_budget_currency !~ '^[A-Z]{3}$' then raise exception using errcode='22023',message='Invalid budget currency'; end if;
  insert into public.agents(owner_user_id,organization_id,name,handle,description,visibility)
  values((select auth.uid()),p_organization_id,btrim(p_name),nullif(btrim(p_handle),''),p_description,p_visibility) returning id into v_agent_id;
  insert into public.agent_identities(agent_id) values(v_agent_id);
  insert into public.agent_personas(agent_id,persona,tone,interests,goals,boundaries) values(v_agent_id,p_persona,p_tone,p_interests,p_goals,p_boundaries);
  insert into public.agent_passports(agent_id,verification_status,credentials,capability_summary,reputation_summary,delegation_summary,history_summary,issued_at)
  values(v_agent_id,'unverified','[]'::jsonb,'{}'::jsonb,'{}'::jsonb,'{}'::jsonb,'{}'::jsonb,null);
  insert into public.agent_policies(agent_id,name,policy_version,rules,autonomy_level,spending_limit,rate_limit,enabled)
  values(v_agent_id,'owner authority policy',1,jsonb_build_object('human_approval_required_for_high_risk',true),p_autonomy_level,p_max_spend_per_action,'{}'::jsonb,true);
  insert into public.agent_budgets(agent_id,currency,max_spend_per_action,daily_spend_limit,monthly_spend_limit,requires_approval_above)
  values(v_agent_id,p_budget_currency,p_max_spend_per_action,p_daily_spend_limit,p_monthly_spend_limit,p_requires_approval_above);
  return jsonb_build_object('agent_id',v_agent_id);
end;
$$;

revoke execute on function public.create_agent_identity(text,text,text,uuid,public.visibility_level,jsonb,jsonb,jsonb,jsonb,jsonb,text,text,numeric,numeric,numeric,numeric) from public,anon;
grant execute on function public.create_agent_identity(text,text,text,uuid,public.visibility_level,jsonb,jsonb,jsonb,jsonb,jsonb,text,text,numeric,numeric,numeric,numeric) to authenticated;
