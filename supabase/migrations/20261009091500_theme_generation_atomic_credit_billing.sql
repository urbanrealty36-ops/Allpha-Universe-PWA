create table if not exists public.theme_generation_pricing (
  id smallint primary key default 1 check (id = 1),
  enabled boolean not null default true,
  credits_per_asset integer not null default 1 check (credits_per_asset between 1 and 100000),
  max_assets_per_package integer not null default 25 check (max_assets_per_package between 1 and 25),
  updated_by_user_id uuid null references public.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into public.theme_generation_pricing (id, enabled, credits_per_asset, max_assets_per_package)
values (1, true, 1, 25) on conflict (id) do nothing;
alter table public.theme_generation_pricing enable row level security;
revoke all on public.theme_generation_pricing from anon, authenticated;
grant select, insert, update on public.theme_generation_pricing to service_role;

create or replace function public.reserve_theme_generation_credits(p_user_id uuid, p_package_id uuid, p_amount integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare existing public.ai_credit_ledger%rowtype; posted_balance bigint; reserved_balance bigint;
begin
  if p_amount < 1 then raise exception 'THEME_CREDIT_AMOUNT_INVALID'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 0));
  select * into existing from public.ai_credit_ledger where user_id=p_user_id and source_type='theme_generation' and source_id=p_package_id and entry_type='debit' order by created_at desc limit 1 for update;
  if found then
    if existing.status in ('reserved','posted') then return jsonb_build_object('ok',true,'reused',true,'ledger_id',existing.id,'status',existing.status,'amount',existing.amount); end if;
    raise exception 'THEME_CREDIT_RESERVATION_CLOSED';
  end if;
  select coalesce(sum(case when entry_type in ('grant','purchase','reward','refund','adjustment') and status='posted' then amount when entry_type='debit' and status='posted' then -amount else 0 end),0) into posted_balance from public.ai_credit_ledger where user_id=p_user_id;
  select coalesce(sum(amount),0) into reserved_balance from public.ai_credit_ledger where user_id=p_user_id and entry_type='debit' and status='reserved';
  if posted_balance-reserved_balance < p_amount then raise exception 'INSUFFICIENT_AI_CREDITS'; end if;
  insert into public.ai_credit_ledger(user_id,entry_type,amount,status,source_type,source_id,metadata)
  values(p_user_id,'debit',p_amount,'reserved','theme_generation',p_package_id,jsonb_build_object('purpose','theme_package_generation'))
  returning * into existing;
  return jsonb_build_object('ok',true,'reused',false,'ledger_id',existing.id,'status',existing.status,'amount',existing.amount,'available_after',posted_balance-reserved_balance-p_amount);
end; $$;

create or replace function public.settle_theme_generation_credits(p_user_id uuid, p_package_id uuid, p_successful_assets integer, p_credits_per_asset integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare entry public.ai_credit_ledger%rowtype; final_amount integer;
begin
  if p_successful_assets < 0 or p_credits_per_asset < 1 then raise exception 'THEME_CREDIT_SETTLEMENT_INVALID'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 0));
  select * into entry from public.ai_credit_ledger where user_id=p_user_id and source_type='theme_generation' and source_id=p_package_id and entry_type='debit' order by created_at desc limit 1 for update;
  if not found then raise exception 'THEME_CREDIT_RESERVATION_NOT_FOUND'; end if;
  if entry.status in ('posted','reversed') then return jsonb_build_object('ok',true,'reused',true,'ledger_id',entry.id,'status',entry.status,'amount',entry.amount); end if;
  final_amount := p_successful_assets*p_credits_per_asset;
  if final_amount > entry.amount then raise exception 'THEME_CREDIT_SETTLEMENT_EXCEEDS_RESERVATION'; end if;
  if final_amount=0 then
    update public.ai_credit_ledger set status='reversed',reversed_at=timezone('utc',now()),metadata=metadata||jsonb_build_object('settlement','all_assets_failed','successful_assets',0) where id=entry.id;
    return jsonb_build_object('ok',true,'status','reversed','amount',entry.amount,'charged',0);
  end if;
  update public.ai_credit_ledger set amount=final_amount,status='posted',posted_at=timezone('utc',now()),metadata=metadata||jsonb_build_object('settlement','completed','successful_assets',p_successful_assets,'credits_per_asset',p_credits_per_asset,'refunded_reserved_credits',entry.amount-final_amount) where id=entry.id;
  return jsonb_build_object('ok',true,'status','posted','amount',final_amount,'charged',final_amount,'refunded_reserved_credits',entry.amount-final_amount);
end; $$;
revoke all on function public.reserve_theme_generation_credits(uuid,uuid,integer) from public, anon, authenticated;
revoke all on function public.settle_theme_generation_credits(uuid,uuid,integer,integer) from public, anon, authenticated;
grant execute on function public.reserve_theme_generation_credits(uuid,uuid,integer) to service_role;
grant execute on function public.settle_theme_generation_credits(uuid,uuid,integer,integer) to service_role;
