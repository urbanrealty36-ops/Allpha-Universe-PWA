begin;
insert into public.permissions(key,description,system_managed) values
('payout.account.manage','Manage the authenticated seller payout bank account.',true),
('payout.request','Request a seller payout against settled marketplace earnings.',true),
('payout.read','Read platform payout operations.',true),('payout.review','Approve or reject seller payout requests.',true),
('payout.process','Process and mark approved payouts as disbursed.',true)
on conflict(key) do update set description=excluded.description,system_managed=true,updated_at=timezone('utc',now());
insert into public.platform_role_permissions(role_id,permission_id)
select r.id,p.id from public.platform_roles r cross join public.permissions p
where r.key in ('super_admin','platform_admin') and p.key in ('payout.account.manage','payout.request','payout.read','payout.review','payout.process') on conflict do nothing;

create table if not exists public.payout_accounts(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 bank_code text not null, bank_name text not null, account_name text not null, account_number text not null,
 is_default boolean not null default true, status text not null default 'active' check(status in ('active','disabled')),
 created_at timestamptz not null default timezone('utc',now()),updated_at timestamptz not null default timezone('utc',now()));
create unique index if not exists payout_accounts_one_default_per_user on public.payout_accounts(user_id) where is_default and status='active';

create table if not exists public.payout_requests(
 id uuid primary key default gen_random_uuid(), requester_user_id uuid not null references auth.users(id) on delete restrict,
 payout_account_id uuid not null references public.payout_accounts(id) on delete restrict, amount bigint not null check(amount>0),
 currency text not null default 'IDR', status text not null default 'pending_approval' check(status in('pending_approval','approved','rejected','processing','paid','failed','cancelled')),
 risk_level public.risk_level not null default 'high',risk_decision text not null default 'review',
 approval_request_id uuid references public.approval_requests(id) on delete set null,decision_by_user_id uuid references auth.users(id) on delete set null,
 decision_reason text,disbursement_reference text,processed_at timestamptz,paid_at timestamptz,failure_reason text,
 metadata jsonb not null default '{}'::jsonb,created_at timestamptz not null default timezone('utc',now()),updated_at timestamptz not null default timezone('utc',now()));
create unique index if not exists payout_requests_approval_unique on public.payout_requests(approval_request_id) where approval_request_id is not null;
create index if not exists payout_requests_user_idx on public.payout_requests(requester_user_id,created_at desc);
create index if not exists payout_requests_status_idx on public.payout_requests(status,created_at desc);

create table if not exists public.payout_events(
 id uuid primary key default gen_random_uuid(),payout_request_id uuid not null references public.payout_requests(id) on delete cascade,
 actor_user_id uuid references auth.users(id) on delete set null,event_type text not null,from_status text,to_status text,amount bigint,currency text,
 payload jsonb not null default '{}'::jsonb,created_at timestamptz not null default timezone('utc',now()));
create index if not exists payout_events_request_idx on public.payout_events(payout_request_id,created_at desc);

alter table public.payout_accounts enable row level security; alter table public.payout_requests enable row level security; alter table public.payout_events enable row level security;
drop policy if exists payout_accounts_owner_select on public.payout_accounts;
create policy payout_accounts_owner_select on public.payout_accounts for select using(user_id=(select auth.uid()));
drop policy if exists payout_accounts_owner_insert on public.payout_accounts;
create policy payout_accounts_owner_insert on public.payout_accounts for insert with check(user_id=(select auth.uid()));
drop policy if exists payout_accounts_owner_update on public.payout_accounts;
create policy payout_accounts_owner_update on public.payout_accounts for update using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
drop policy if exists payout_requests_owner_select on public.payout_requests;
create policy payout_requests_owner_select on public.payout_requests for select using(requester_user_id=(select auth.uid()));
drop policy if exists payout_events_owner_select on public.payout_events;
create policy payout_events_owner_select on public.payout_events for select using(exists(select 1 from public.payout_requests pr where pr.id=payout_request_id and pr.requester_user_id=(select auth.uid())));

create or replace function public.get_my_payout_summary() returns jsonb language sql stable set search_path='' as $$
with earned as(select coalesce(sum(coi.total_amount),0)::bigint amount from public.commerce_order_items coi join public.commerce_orders co on co.id=coi.order_id where coi.seller_owner_user_id=(select auth.uid()) and co.order_kind='marketplace' and co.status in('paid','completed') and exists(select 1 from public.commerce_payments cp where cp.order_id=co.id and cp.status='captured')),
reserved as(select coalesce(sum(amount),0)::bigint amount from public.payout_requests where requester_user_id=(select auth.uid()) and status in('pending_approval','approved','processing','paid'))
select jsonb_build_object('earned',(select amount from earned),'reserved',(select amount from reserved),'available',greatest(0,(select amount from earned)-(select amount from reserved)),'currency','IDR',
'payout_account',(select jsonb_build_object('id',id,'bank_code',bank_code,'bank_name',bank_name,'account_name',account_name,'account_number',account_number) from public.payout_accounts where user_id=(select auth.uid()) and is_default and status='active' order by created_at desc limit 1),
'pending_requests',(select count(*) from public.payout_requests where requester_user_id=(select auth.uid()) and status='pending_approval')); $$;

create or replace function public.upsert_my_payout_account(p_bank_code text,p_bank_name text,p_account_name text,p_account_number text) returns public.payout_accounts
language plpgsql security definer set search_path='' as $$
declare v public.payout_accounts;uid uuid:=(select auth.uid());
begin
if uid is null then raise exception 'authentication_required' using errcode='42501';end if;
if length(trim(coalesce(p_bank_code,'')))<2 or length(trim(coalesce(p_bank_name,'')))<2 or length(trim(coalesce(p_account_name,'')))<2 or length(trim(coalesce(p_account_number,'')))<4 then raise exception 'invalid_payout_account' using errcode='22023';end if;
update public.payout_accounts set is_default=false,updated_at=timezone('utc',now()) where user_id=uid and is_default;
insert into public.payout_accounts(user_id,bank_code,bank_name,account_name,account_number,is_default,status) values(uid,trim(p_bank_code),trim(p_bank_name),trim(p_account_name),trim(p_account_number),true,'active') returning * into v;
insert into public.audit_logs(actor_user_id,action,resource_type,resource_id,outcome,risk_level,metadata) values(uid,'payout.account.updated','payout_account',v.id,'success','medium',jsonb_build_object('bank_code',v.bank_code,'account_number_masked',repeat('*',greatest(0,length(v.account_number)-4))||right(v.account_number,4)));
return v;end;$$;

create or replace function public.request_payout(p_amount bigint,p_currency text default 'IDR') returns public.payout_requests
language plpgsql security definer set search_path='' as $$
declare uid uuid:=(select auth.uid());acct public.payout_accounts;v_earned bigint;v_reserved bigint;v_available bigint;pr public.payout_requests;ar public.approval_requests;
begin
if uid is null then raise exception 'authentication_required' using errcode='42501';end if;
if p_currency<>'IDR' or p_amount is null or p_amount<=0 then raise exception 'invalid_payout_amount' using errcode='22023';end if;
select * into acct from public.payout_accounts where user_id=uid and is_default and status='active' order by created_at desc limit 1;if acct.id is null then raise exception 'payout_account_required' using errcode='42202';end if;
select coalesce(sum(coi.total_amount),0)::bigint into v_earned from public.commerce_order_items coi join public.commerce_orders co on co.id=coi.order_id where coi.seller_owner_user_id=uid and co.order_kind='marketplace' and co.status in('paid','completed') and exists(select 1 from public.commerce_payments cp where cp.order_id=co.id and cp.status='captured');
select coalesce(sum(amount),0)::bigint into v_reserved from public.payout_requests where requester_user_id=uid and status in('pending_approval','approved','processing','paid');v_available:=greatest(0,v_earned-v_reserved);
if p_amount>v_available then raise exception 'payout_exceeds_available_balance' using errcode='22003';end if;
insert into public.payout_requests(requester_user_id,payout_account_id,amount,currency,status,risk_level,risk_decision) values(uid,acct.id,p_amount,p_currency,'pending_approval','high','review') returning * into pr;
insert into public.approval_requests(requester_user_id,action,resource_type,resource_id,status,risk_level,payload,expires_at) values(uid,'payout.request','payout_request',pr.id,'pending'::public.approval_status,'high'::public.risk_level,jsonb_build_object('amount',p_amount,'currency',p_currency,'payout_account_id',acct.id,'requires_admin_approval',true),timezone('utc',now())+interval '7 days') returning * into ar;
update public.payout_requests set approval_request_id=ar.id,updated_at=timezone('utc',now()) where id=pr.id returning * into pr;
insert into public.risk_assessments(actor_user_id,action,resource_type,resource_id,risk_level,decision,factors,policy_version) values(uid,'payout.request','payout_request',pr.id,'high','review',jsonb_build_object('money_movement',true,'admin_approval_required',true,'available_balance',v_available,'requested_amount',p_amount),1);
insert into public.payout_events(payout_request_id,actor_user_id,event_type,to_status,amount,currency,payload) values(pr.id,uid,'requested','pending_approval',p_amount,p_currency,jsonb_build_object('approval_request_id',ar.id));
insert into public.audit_logs(actor_user_id,action,resource_type,resource_id,outcome,risk_level,metadata) values(uid,'payout.requested','payout_request',pr.id,'pending_approval','high',jsonb_build_object('amount',p_amount,'currency',p_currency,'approval_request_id',ar.id));return pr;end;$$;

create or replace function public.get_admin_payout_requests(p_status text default null,p_limit integer default 100) returns jsonb language plpgsql security definer set search_path='' as $$
declare n integer:=greatest(1,least(coalesce(p_limit,100),500));out jsonb;
begin
if not private.has_platform_permission('payout.read') then raise exception 'PAYOUT_ADMIN_PERMISSION_REQUIRED' using errcode='42501';end if;
select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) into out from(select pr.id,pr.requester_user_id,pr.amount,pr.currency,pr.status,pr.risk_level,pr.risk_decision,pr.approval_request_id,pr.decision_by_user_id,pr.decision_reason,pr.disbursement_reference,pr.processed_at,pr.paid_at,pr.failure_reason,pr.created_at,jsonb_build_object('id',pa.id,'bank_code',pa.bank_code,'bank_name',pa.bank_name,'account_name',pa.account_name,'account_number',pa.account_number) payout_account from public.payout_requests pr join public.payout_accounts pa on pa.id=pr.payout_account_id where p_status is null or pr.status=p_status order by pr.created_at desc limit n)x;return out;end;$$;

create or replace function public.decide_payout_request(p_payout_request_id uuid,p_decision text,p_reason text default null) returns public.payout_requests language plpgsql security definer set search_path='' as $$
declare pr public.payout_requests;ar public.approval_requests;uid uuid:=(select auth.uid());
begin
if not private.has_platform_permission('payout.review') then raise exception 'PAYOUT_REVIEW_PERMISSION_REQUIRED' using errcode='42501';end if;
if p_decision not in('approved','rejected') then raise exception 'invalid_payout_decision' using errcode='22023';end if;
select * into pr from public.payout_requests where id=p_payout_request_id for update;if pr.id is null then raise exception 'payout_request_not_found';end if;if pr.status<>'pending_approval' then raise exception 'payout_not_pending_approval';end if;
select * into ar from public.approval_requests where id=pr.approval_request_id for update;if ar.id is null or ar.status<>'pending'::public.approval_status then raise exception 'approval_request_not_pending';end if;
update public.approval_requests set status=case when p_decision='approved' then 'approved'::public.approval_status else 'rejected'::public.approval_status end,decision_by_user_id=uid,decision_reason=p_reason,decided_at=timezone('utc',now()) where id=ar.id;
update public.payout_requests set status=case when p_decision='approved' then 'approved' else 'rejected' end,decision_by_user_id=uid,decision_reason=p_reason,updated_at=timezone('utc',now()) where id=pr.id returning * into pr;
insert into public.payout_events(payout_request_id,actor_user_id,event_type,from_status,to_status,amount,currency,payload) values(pr.id,uid,'admin_decision','pending_approval',pr.status,pr.amount,pr.currency,jsonb_build_object('reason',p_reason));
insert into public.audit_logs(actor_user_id,action,resource_type,resource_id,outcome,risk_level,metadata) values(uid,'payout.admin.decision','payout_request',pr.id,pr.status,pr.risk_level,jsonb_build_object('reason',p_reason,'approval_request_id',ar.id));return pr;end;$$;

create or replace function public.process_payout_request(p_payout_request_id uuid,p_outcome text,p_disbursement_reference text default null,p_reason text default null) returns public.payout_requests language plpgsql security definer set search_path='' as $$
declare pr public.payout_requests;uid uuid:=(select auth.uid());next_status text;
begin
if not private.has_platform_permission('payout.process') then raise exception 'PAYOUT_PROCESS_PERMISSION_REQUIRED' using errcode='42501';end if;
if p_outcome not in('processing','paid','failed') then raise exception 'invalid_payout_processing_outcome' using errcode='22023';end if;
select * into pr from public.payout_requests where id=p_payout_request_id for update;if pr.id is null then raise exception 'payout_request_not_found';end if;
if p_outcome='processing' and pr.status<>'approved' then raise exception 'payout_must_be_approved';end if;
if p_outcome in('paid','failed') and pr.status not in('approved','processing') then raise exception 'payout_not_processable';end if;
if p_outcome='paid' and length(trim(coalesce(p_disbursement_reference,'')))<3 then raise exception 'disbursement_reference_required';end if;
next_status:=p_outcome;update public.payout_requests set status=next_status,disbursement_reference=coalesce(nullif(trim(p_disbursement_reference),''),disbursement_reference),failure_reason=case when p_outcome='failed' then p_reason else failure_reason end,processed_at=case when p_outcome in('processing','paid','failed') then coalesce(processed_at,timezone('utc',now())) else processed_at end,paid_at=case when p_outcome='paid' then timezone('utc',now()) else paid_at end,updated_at=timezone('utc',now()) where id=pr.id returning * into pr;
insert into public.payout_events(payout_request_id,actor_user_id,event_type,from_status,to_status,amount,currency,payload) values(pr.id,uid,'admin_processing',null,pr.status,pr.amount,pr.currency,jsonb_build_object('reference',p_disbursement_reference,'reason',p_reason));
insert into public.audit_logs(actor_user_id,action,resource_type,resource_id,outcome,risk_level,metadata) values(uid,'payout.admin.process','payout_request',pr.id,pr.status,pr.risk_level,jsonb_build_object('reference',p_disbursement_reference,'reason',p_reason));return pr;end;$$;

revoke all on function public.request_payout(bigint,text) from public,anon;grant execute on function public.request_payout(bigint,text) to authenticated;
revoke all on function public.upsert_my_payout_account(text,text,text,text) from public,anon;grant execute on function public.upsert_my_payout_account(text,text,text,text) to authenticated;
revoke all on function public.get_my_payout_summary() from public,anon;grant execute on function public.get_my_payout_summary() to authenticated;
revoke all on function public.get_admin_payout_requests(text,integer) from public,anon,authenticated;grant execute on function public.get_admin_payout_requests(text,integer) to authenticated;
revoke all on function public.decide_payout_request(uuid,text,text) from public,anon,authenticated;grant execute on function public.decide_payout_request(uuid,text,text) to authenticated;
revoke all on function public.process_payout_request(uuid,text,text,text) from public,anon,authenticated;grant execute on function public.process_payout_request(uuid,text,text,text) to authenticated;
commit;