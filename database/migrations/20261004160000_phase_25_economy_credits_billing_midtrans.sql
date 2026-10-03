alter table public.commerce_orders add column if not exists order_kind text not null default 'marketplace' check (order_kind in ('marketplace','credit_purchase','subscription','booth','live','other'));
alter table public.commerce_payments add column if not exists provider_transaction_id text, add column if not exists provider_status text, add column if not exists paid_at timestamptz, add column if not exists notification_count integer not null default 0;
create unique index if not exists commerce_payments_provider_tx_idx on public.commerce_payments(provider_key,provider_transaction_id) where provider_transaction_id is not null;
create table if not exists public.economy_credit_products (id uuid primary key default gen_random_uuid(),product_key text not null unique,name text not null,description text,credits integer not null check (credits>0),price_amount bigint not null check(price_amount>0),currency text not null default 'IDR',status text not null default 'draft' check(status in ('draft','published','paused','archived')),metadata jsonb not null default '{}',created_at timestamptz not null default timezone('utc',now()),updated_at timestamptz not null default timezone('utc',now()));
create table if not exists public.economy_credit_purchases (id uuid primary key default gen_random_uuid(),order_id uuid not null unique references public.commerce_orders(id) on delete restrict,buyer_user_id uuid not null references auth.users(id),credit_product_id uuid not null references public.economy_credit_products(id) on delete restrict,credits integer not null check(credits>0),status text not null default 'pending_payment' check(status in ('pending_payment','paid','cancelled','refunded')),ledger_entry_id uuid references public.ai_credit_ledger(id),created_at timestamptz not null default timezone('utc',now()),paid_at timestamptz,refunded_at timestamptz);
create index if not exists economy_credit_purchases_buyer_idx on public.economy_credit_purchases(buyer_user_id,created_at desc);
create table if not exists public.billing_plans (id uuid primary key default gen_random_uuid(),plan_key text not null unique,name text not null,description text,interval_unit text not null check(interval_unit in ('month','year')),interval_count integer not null check(interval_count>0),price_amount bigint not null check(price_amount>0),currency text not null default 'IDR',included_credits integer not null default 0 check(included_credits>=0),status text not null default 'draft' check(status in ('draft','published','paused','archived')),metadata jsonb not null default '{}',created_at timestamptz not null default timezone('utc',now()),updated_at timestamptz not null default timezone('utc',now()));
create table if not exists public.billing_subscriptions (id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),plan_id uuid not null references public.billing_plans(id),status text not null default 'pending_payment' check(status in ('pending_payment','active','past_due','paused','cancelled','expired')),current_period_start timestamptz,current_period_end timestamptz,cancel_at_period_end boolean not null default false,provider_key text,provider_subscription_id text,created_at timestamptz not null default timezone('utc',now()),updated_at timestamptz not null default timezone('utc',now()),cancelled_at timestamptz);
create unique index if not exists billing_subscriptions_active_user_idx on public.billing_subscriptions(user_id) where status in ('pending_payment','active','past_due','paused');
create index if not exists billing_subscriptions_user_idx on public.billing_subscriptions(user_id,created_at desc);
create table if not exists public.billing_invoices (id uuid primary key default gen_random_uuid(),invoice_number text not null unique,user_id uuid not null references auth.users(id),subscription_id uuid references public.billing_subscriptions(id),order_id uuid not null unique references public.commerce_orders(id) on delete restrict,status text not null default 'open' check(status in ('draft','open','paid','void','refunded','uncollectible')),amount bigint not null check(amount>=0),currency text not null,period_start timestamptz,period_end timestamptz,due_at timestamptz,paid_at timestamptz,metadata jsonb not null default '{}',created_at timestamptz not null default timezone('utc',now()),updated_at timestamptz not null default timezone('utc',now()));
create index if not exists billing_invoices_user_idx on public.billing_invoices(user_id,created_at desc);
create table if not exists public.economy_settlement_events (id uuid primary key default gen_random_uuid(),payment_id uuid not null references public.commerce_payments(id) on delete restrict,event_key text not null unique,transaction_status text not null,gross_amount bigint not null check(gross_amount>=0),currency text not null,provider_transaction_id text,processed_at timestamptz not null default timezone('utc',now()),payload jsonb not null default '{}');
create index if not exists economy_settlement_events_payment_idx on public.economy_settlement_events(payment_id,processed_at desc);
alter table public.economy_credit_products enable row level security;
alter table public.economy_credit_purchases enable row level security;
alter table public.billing_plans enable row level security;
alter table public.billing_subscriptions enable row level security;
alter table public.billing_invoices enable row level security;
alter table public.economy_settlement_events enable row level security;
drop policy if exists economy_credit_products_public_read on public.economy_credit_products;
create policy economy_credit_products_public_read on public.economy_credit_products for select to authenticated using(status='published');
drop policy if exists economy_credit_purchases_owner_read on public.economy_credit_purchases;
create policy economy_credit_purchases_owner_read on public.economy_credit_purchases for select to authenticated using(buyer_user_id=(select auth.uid()));
drop policy if exists billing_plans_public_read on public.billing_plans;
create policy billing_plans_public_read on public.billing_plans for select to authenticated using(status='published');
drop policy if exists billing_subscriptions_owner_read on public.billing_subscriptions;
create policy billing_subscriptions_owner_read on public.billing_subscriptions for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists billing_invoices_owner_read on public.billing_invoices;
create policy billing_invoices_owner_read on public.billing_invoices for select to authenticated using(user_id=(select auth.uid()));
revoke all on public.economy_credit_products,public.economy_credit_purchases,public.billing_plans,public.billing_subscriptions,public.billing_invoices,public.economy_settlement_events from anon;
grant select on public.economy_credit_products,public.billing_plans to authenticated;
grant select on public.economy_credit_purchases,public.billing_subscriptions,public.billing_invoices to authenticated;

create or replace function public.create_credit_purchase_order(p_credit_product_id uuid,p_idempotency_key text) returns public.commerce_orders language plpgsql security definer set search_path='' as $$
declare v_product public.economy_credit_products; v_order public.commerce_orders; v_purchase public.economy_credit_purchases;
begin
if (select auth.uid()) is null then raise exception 'authentication_required' using errcode='42501'; end if;
select * into v_product from public.economy_credit_products where id=p_credit_product_id and status='published';
if v_product.id is null then raise exception 'credit_product_not_available'; end if;
if p_idempotency_key is not null then select o.* into v_order from public.commerce_orders o join public.commerce_events e on e.order_id=o.id where e.idempotency_key=p_idempotency_key and o.buyer_user_id=(select auth.uid()) limit 1; if v_order.id is not null then return v_order; end if; end if;
insert into public.commerce_orders(buyer_user_id,order_kind,status,currency,subtotal_amount,total_amount,metadata) values((select auth.uid()),'credit_purchase','pending_payment',v_product.currency,v_product.price_amount,v_product.price_amount,jsonb_build_object('credit_product_id',v_product.id,'credits',v_product.credits)) returning * into v_order;
insert into public.economy_credit_purchases(order_id,buyer_user_id,credit_product_id,credits) values(v_order.id,(select auth.uid()),v_product.id,v_product.credits);
insert into public.commerce_events(order_id,actor_user_id,event_type,outcome,idempotency_key,payload) values(v_order.id,(select auth.uid()),'credit.purchase.created','payment_required',p_idempotency_key,jsonb_build_object('credits',v_product.credits,'product_id',v_product.id));
insert into public.audit_logs(actor_user_id,action,resource_type,resource_id,outcome,idempotency_key,metadata) values((select auth.uid()),'economy.credit_purchase.created','commerce_order',v_order.id,'payment_required',p_idempotency_key,jsonb_build_object('credit_product_id',v_product.id,'credits',v_product.credits));
return v_order;
end $$;

create or replace function public.create_subscription_order(p_plan_id uuid,p_idempotency_key text) returns public.commerce_orders language plpgsql security definer set search_path='' as $$
declare v_plan public.billing_plans; v_order public.commerce_orders; v_sub public.billing_subscriptions; v_invoice public.billing_invoices; v_start timestamptz:=timezone('utc',now()); v_end timestamptz; v_number text;
begin
if (select auth.uid()) is null then raise exception 'authentication_required' using errcode='42501'; end if;
select * into v_plan from public.billing_plans where id=p_plan_id and status='published';
if v_plan.id is null then raise exception 'billing_plan_not_available'; end if;
if exists(select 1 from public.billing_subscriptions where user_id=(select auth.uid()) and status in ('pending_payment','active','past_due','paused')) then raise exception 'active_subscription_exists'; end if;
if p_idempotency_key is not null then select o.* into v_order from public.commerce_orders o join public.commerce_events e on e.order_id=o.id where e.idempotency_key=p_idempotency_key and o.buyer_user_id=(select auth.uid()) limit 1; if v_order.id is not null then return v_order; end if; end if;
if v_plan.interval_unit='month' then v_end:=v_start+make_interval(months=>v_plan.interval_count); else v_end:=v_start+make_interval(years=>v_plan.interval_count); end if;
insert into public.commerce_orders(buyer_user_id,order_kind,status,currency,subtotal_amount,total_amount,metadata) values((select auth.uid()),'subscription','pending_payment',v_plan.currency,v_plan.price_amount,v_plan.price_amount,jsonb_build_object('plan_id',v_plan.id,'plan_key',v_plan.plan_key)) returning * into v_order;
insert into public.billing_subscriptions(user_id,plan_id,status,current_period_start,current_period_end) values((select auth.uid()),v_plan.id,'pending_payment',v_start,v_end) returning * into v_sub;
v_number:='ALP-'||to_char(v_start,'YYYYMMDDHH24MISS')||'-'||substr(replace(v_order.id::text,'-',''),1,8);
insert into public.billing_invoices(invoice_number,user_id,subscription_id,order_id,status,amount,currency,period_start,period_end,due_at) values(v_number,(select auth.uid()),v_sub.id,v_order.id,'open',v_plan.price_amount,v_plan.currency,v_start,v_end,v_start+interval '24 hours');
insert into public.commerce_events(order_id,actor_user_id,event_type,outcome,idempotency_key,payload) values(v_order.id,(select auth.uid()),'subscription.order.created','payment_required',p_idempotency_key,jsonb_build_object('plan_id',v_plan.id,'subscription_id',v_sub.id));
insert into public.audit_logs(actor_user_id,action,resource_type,resource_id,outcome,idempotency_key,metadata) values((select auth.uid()),'billing.subscription.created','commerce_order',v_order.id,'payment_required',p_idempotency_key,jsonb_build_object('plan_id',v_plan.id,'subscription_id',v_sub.id));
return v_order;
end $$;

create or replace function public.get_my_economy_summary() returns jsonb language sql security invoker set search_path='' as $$
select jsonb_build_object('credit_balance',coalesce((select sum(case when entry_type in ('grant','purchase','reward','refund','adjustment') and status='posted' then amount when entry_type='debit' and status='posted' then -amount else 0 end) from public.ai_credit_ledger where user_id=(select auth.uid())),0),'active_subscription',(select jsonb_build_object('id',s.id,'plan_id',s.plan_id,'status',s.status,'current_period_start',s.current_period_start,'current_period_end',s.current_period_end) from public.billing_subscriptions s where s.user_id=(select auth.uid()) and s.status in ('active','past_due','paused') order by s.created_at desc limit 1));
$$;

create or replace function public.process_midtrans_settlement(p_payment_id uuid,p_transaction_status text,p_transaction_id text,p_gross_amount bigint,p_currency text,p_provider_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_payment public.commerce_payments; v_order public.commerce_orders; v_purchase public.economy_credit_purchases; v_sub public.billing_subscriptions; v_item public.commerce_order_items; v_entry public.ai_credit_ledger; v_event_key text; v_success boolean; v_status text;
begin
if p_payment_id is null then raise exception 'payment_id_required'; end if;
select * into v_payment from public.commerce_payments where id=p_payment_id for update;
if v_payment.id is null then raise exception 'payment_not_found'; end if;
select * into v_order from public.commerce_orders where id=v_payment.order_id for update;
if p_gross_amount<>v_payment.amount or p_currency<>v_payment.currency then raise exception 'payment_amount_currency_mismatch'; end if;
v_event_key:=coalesce(p_transaction_id,p_payment.id::text)||':'||p_transaction_status;
if exists(select 1 from public.economy_settlement_events where event_key=v_event_key) then return jsonb_build_object('status','already_processed','event_key',v_event_key); end if;
v_success:=p_transaction_status in ('settlement','capture') and (p_transaction_status<>'capture' or coalesce(lower(p_provider_payload->>'fraud_status'),'accept')='accept');
v_status:=case when v_success then 'captured' when p_transaction_status='pending' then 'pending_provider' when p_transaction_status in ('expire','cancel') then 'cancelled' when p_transaction_status in ('deny','failure') then 'failed' else 'pending_provider' end;
update public.commerce_payments set status=v_status,provider_transaction_id=coalesce(p_transaction_id,provider_transaction_id),provider_status=p_transaction_status,provider_payload=coalesce(p_provider_payload,'{}'),notification_count=notification_count+1,paid_at=case when v_success then timezone('utc',now()) else paid_at end,captured_at=case when v_success then timezone('utc',now()) else captured_at end,updated_at=timezone('utc',now()) where id=v_payment.id;
if v_success then
 update public.commerce_orders set status='paid',paid_at=timezone('utc',now()),updated_at=timezone('utc',now()) where id=v_order.id and status not in ('completed','refunded');
 select * into v_purchase from public.economy_credit_purchases where order_id=v_order.id;
 if v_purchase.id is not null and v_purchase.status<>'paid' then
  insert into public.ai_credit_ledger(user_id,entry_type,amount,status,source_type,source_id,metadata,posted_at) values(v_purchase.buyer_user_id,'purchase',v_purchase.credits,'posted','commerce_credit_purchase',v_purchase.id,jsonb_build_object('order_id',v_order.id,'payment_id',v_payment.id,'provider','midtrans'),timezone('utc',now())) returning * into v_entry;
  update public.economy_credit_purchases set status='paid',ledger_entry_id=v_entry.id,paid_at=timezone('utc',now()) where id=v_purchase.id;
 end if;
 select s.* into v_sub from public.billing_subscriptions s where exists(select 1 from public.billing_invoices i where i.order_id=v_order.id and i.subscription_id=s.id) limit 1;
 if v_sub.id is not null then
  update public.billing_subscriptions set status='active',provider_key='midtrans',updated_at=timezone('utc',now()) where id=v_sub.id;
  update public.billing_invoices set status='paid',paid_at=timezone('utc',now()),updated_at=timezone('utc',now()) where order_id=v_order.id;
  if (select included_credits from public.billing_plans where id=v_sub.plan_id)>0 and not exists(select 1 from public.ai_credit_ledger where source_type='subscription' and source_id=v_sub.id and entry_type='grant') then
   insert into public.ai_credit_ledger(user_id,entry_type,amount,status,source_type,source_id,metadata,posted_at) select v_sub.user_id,'grant',p.included_credits,'posted','subscription',v_sub.id,jsonb_build_object('plan_id',p.id,'order_id',v_order.id,'payment_id',v_payment.id,'provider','midtrans'),timezone('utc',now()) from public.billing_plans p where p.id=v_sub.plan_id;
  end if;
 end if;
 for v_item in select * from public.commerce_order_items where order_id=v_order.id loop
  insert into public.commerce_entitlements(order_id,order_item_id,buyer_user_id,listing_id,entitlement_key,status,starts_at,metadata) values(v_order.id,v_item.id,v_order.buyer_user_id,v_item.listing_id,'purchase:'||v_item.id::text,'active',timezone('utc',now()),jsonb_build_object('payment_id',v_payment.id,'provider','midtrans')) on conflict(order_item_id,entitlement_key) do nothing;
 end loop;
else
 if p_transaction_status in ('expire','cancel','deny','failure') then
  update public.commerce_orders set status='cancelled',updated_at=timezone('utc',now()) where id=v_order.id and status not in ('paid','completed','refunded');
  update public.economy_credit_purchases set status='cancelled' where order_id=v_order.id and status='pending_payment';
  update public.billing_invoices set status='void',updated_at=timezone('utc',now()) where order_id=v_order.id and status='open';
  update public.billing_subscriptions set status='cancelled',updated_at=timezone('utc',now()) where id in(select subscription_id from public.billing_invoices where order_id=v_order.id) and status='pending_payment';
 end if;
end if;
insert into public.economy_settlement_events(payment_id,event_key,transaction_status,gross_amount,currency,provider_transaction_id,payload) values(v_payment.id,v_event_key,p_transaction_status,p_gross_amount,p_currency,p_transaction_id,coalesce(p_provider_payload,'{}'));
insert into public.commerce_events(order_id,payment_id,event_type,outcome,payload) values(v_order.id,v_payment.id,'payment.notification.processed',case when v_success then 'success' else v_status end,jsonb_build_object('provider','midtrans','transaction_status',p_transaction_status,'transaction_id',p_transaction_id));
return jsonb_build_object('status',case when v_success then 'paid' else v_status end,'order_id',v_order.id,'payment_id',v_payment.id);
end $$;
revoke all on function public.create_credit_purchase_order(uuid,text),public.create_subscription_order(uuid,text),public.get_my_economy_summary(),public.process_midtrans_settlement(uuid,text,text,bigint,text,jsonb) from public,anon;
grant execute on function public.create_credit_purchase_order(uuid,text),public.create_subscription_order(uuid,text),public.get_my_economy_summary() to authenticated;
grant execute on function public.process_midtrans_settlement(uuid,text,text,bigint,text,jsonb) to service_role;