
create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  listing_type text not null check (listing_type in ('product','service')),
  seller_type text not null check (seller_type in ('human','agent','organization','booth')),
  seller_id uuid not null,
  owner_user_id uuid not null references auth.users(id),
  agent_id uuid references public.agents(id),
  booth_id uuid references public.booths(id),
  title text not null,
  slug text not null,
  description text,
  skill_name text,
  capability_requirements text[] not null default '{}',
  price_amount bigint not null check (price_amount >= 0),
  currency text not null default 'IDR',
  price_unit text not null default 'one_time',
  inventory_quantity integer check (inventory_quantity is null or inventory_quantity >= 0),
  status text not null default 'draft' check (status in ('draft','published','paused','archived')),
  moderation_status text not null default 'pending' check (moderation_status in ('pending','approved','restricted','rejected')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  unique(owner_user_id,slug)
);

create index if not exists marketplace_listings_discovery_idx
  on public.marketplace_listings(status,moderation_status,listing_type,created_at desc);
create index if not exists marketplace_listings_owner_idx on public.marketplace_listings(owner_user_id);
create index if not exists marketplace_listings_agent_idx on public.marketplace_listings(agent_id);
create index if not exists marketplace_listings_booth_idx on public.marketplace_listings(booth_id);

create table if not exists public.marketplace_offers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete restrict,
  buyer_user_id uuid not null references auth.users(id),
  seller_owner_user_id uuid not null references auth.users(id),
  amount bigint not null check (amount >= 0),
  currency text not null,
  message text,
  status text not null default 'proposed' check (status in ('proposed','accepted','rejected','expired','cancelled')),
  expires_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now())
);
create index if not exists marketplace_offers_listing_idx on public.marketplace_offers(listing_id,created_at desc);
create index if not exists marketplace_offers_buyer_idx on public.marketplace_offers(buyer_user_id,created_at desc);
create index if not exists marketplace_offers_seller_idx on public.marketplace_offers(seller_owner_user_id,created_at desc);

create table if not exists public.commerce_orders (
  id uuid primary key default gen_random_uuid(),
  buyer_user_id uuid not null references auth.users(id),
  status text not null default 'pending_payment' check (status in ('pending_payment','payment_pending','paid','processing','completed','cancelled','refunded','disputed')),
  currency text not null,
  subtotal_amount bigint not null check (subtotal_amount >= 0),
  total_amount bigint not null check (total_amount >= 0),
  source_type text check (source_type is null or source_type in ('marketplace','booth','live')),
  source_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  paid_at timestamptz,
  completed_at timestamptz
);
create index if not exists commerce_orders_buyer_idx on public.commerce_orders(buyer_user_id,created_at desc);
create index if not exists commerce_orders_status_idx on public.commerce_orders(status,created_at desc);

create table if not exists public.commerce_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.commerce_orders(id) on delete cascade,
  listing_id uuid not null references public.marketplace_listings(id) on delete restrict,
  seller_owner_user_id uuid not null references auth.users(id),
  agent_id uuid references public.agents(id),
  booth_id uuid references public.booths(id),
  title_snapshot text not null,
  listing_type text not null check (listing_type in ('product','service')),
  quantity integer not null check (quantity > 0),
  unit_amount bigint not null check (unit_amount >= 0),
  total_amount bigint not null check (total_amount >= 0),
  currency text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default timezone('utc',now())
);
create index if not exists commerce_order_items_order_idx on public.commerce_order_items(order_id);
create index if not exists commerce_order_items_listing_idx on public.commerce_order_items(listing_id);

create table if not exists public.commerce_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.commerce_orders(id) on delete restrict,
  provider_key text not null,
  status text not null default 'pending_provider' check (status in ('pending_provider','authorized','captured','failed','cancelled','refunded')),
  amount bigint not null check (amount >= 0),
  currency text not null,
  external_reference text,
  checkout_url text,
  provider_payload jsonb not null default '{}',
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  captured_at timestamptz
);
create index if not exists commerce_payments_order_idx on public.commerce_payments(order_id,created_at desc);
create unique index if not exists commerce_payments_external_ref_idx
  on public.commerce_payments(provider_key,external_reference)
  where external_reference is not null;

create table if not exists public.commerce_entitlements (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.commerce_orders(id) on delete restrict,
  order_item_id uuid not null references public.commerce_order_items(id) on delete restrict,
  buyer_user_id uuid not null references auth.users(id),
  listing_id uuid not null references public.marketplace_listings(id) on delete restrict,
  entitlement_key text not null,
  status text not null default 'active' check (status in ('pending','active','suspended','expired','revoked')),
  starts_at timestamptz,
  expires_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  unique(order_item_id,entitlement_key)
);
create index if not exists commerce_entitlements_buyer_idx on public.commerce_entitlements(buyer_user_id,status,created_at desc);
create index if not exists commerce_entitlements_listing_idx on public.commerce_entitlements(listing_id,status);

create table if not exists public.commerce_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.commerce_orders(id) on delete restrict,
  payment_id uuid references public.commerce_payments(id) on delete restrict,
  listing_id uuid references public.marketplace_listings(id) on delete restrict,
  actor_user_id uuid references auth.users(id),
  event_type text not null,
  outcome text not null,
  idempotency_key text,
  payload jsonb not null default '{}',
  created_at timestamptz not null default timezone('utc',now())
);
create index if not exists commerce_events_order_idx on public.commerce_events(order_id,created_at asc);
create index if not exists commerce_events_listing_idx on public.commerce_events(listing_id,created_at desc);
create unique index if not exists commerce_events_idempotency_idx
  on public.commerce_events(idempotency_key)
  where idempotency_key is not null;

alter table public.marketplace_listings enable row level security;
alter table public.marketplace_offers enable row level security;
alter table public.commerce_orders enable row level security;
alter table public.commerce_order_items enable row level security;
alter table public.commerce_payments enable row level security;
alter table public.commerce_entitlements enable row level security;
alter table public.commerce_events enable row level security;

drop policy if exists marketplace_listings_public_read on public.marketplace_listings;
create policy marketplace_listings_public_read on public.marketplace_listings
for select to authenticated
using (
  (status='published' and moderation_status='approved')
  or owner_user_id=(select auth.uid())
);

drop policy if exists marketplace_listings_owner_update on public.marketplace_listings;
create policy marketplace_listings_owner_update on public.marketplace_listings
for update to authenticated
using (owner_user_id=(select auth.uid()))
with check (owner_user_id=(select auth.uid()));

drop policy if exists marketplace_offers_participant_read on public.marketplace_offers;
create policy marketplace_offers_participant_read on public.marketplace_offers
for select to authenticated
using (buyer_user_id=(select auth.uid()) or seller_owner_user_id=(select auth.uid()));

drop policy if exists commerce_orders_buyer_read on public.commerce_orders;
create policy commerce_orders_buyer_read on public.commerce_orders
for select to authenticated
using (buyer_user_id=(select auth.uid()));

drop policy if exists commerce_order_items_buyer_read on public.commerce_order_items;
create policy commerce_order_items_buyer_read on public.commerce_order_items
for select to authenticated
using (exists (
  select 1 from public.commerce_orders o
  where o.id=commerce_order_items.order_id and o.buyer_user_id=(select auth.uid())
));

drop policy if exists commerce_payments_buyer_read on public.commerce_payments;
create policy commerce_payments_buyer_read on public.commerce_payments
for select to authenticated
using (exists (
  select 1 from public.commerce_orders o
  where o.id=commerce_payments.order_id and o.buyer_user_id=(select auth.uid())
));

drop policy if exists commerce_entitlements_buyer_read on public.commerce_entitlements;
create policy commerce_entitlements_buyer_read on public.commerce_entitlements
for select to authenticated
using (buyer_user_id=(select auth.uid()));

drop policy if exists commerce_events_participant_read on public.commerce_events;
create policy commerce_events_participant_read on public.commerce_events
for select to authenticated
using (
  actor_user_id=(select auth.uid())
  or exists (select 1 from public.commerce_orders o where o.id=commerce_events.order_id and o.buyer_user_id=(select auth.uid()))
);

revoke all on public.marketplace_listings,public.marketplace_offers,public.commerce_orders,public.commerce_order_items,public.commerce_payments,public.commerce_entitlements,public.commerce_events from anon;
grant select on public.marketplace_listings to authenticated;
grant select on public.marketplace_offers,public.commerce_orders,public.commerce_order_items,public.commerce_payments,public.commerce_entitlements,public.commerce_events to authenticated;

create or replace function public.create_marketplace_listing(
  p_listing_type text,p_seller_type text,p_seller_id uuid,p_agent_id uuid,p_booth_id uuid,
  p_title text,p_slug text,p_description text,p_skill_name text,p_capability_requirements text[],
  p_price_amount bigint,p_currency text,p_price_unit text,p_inventory_quantity integer,p_metadata jsonb
) returns public.marketplace_listings
language plpgsql security definer set search_path=''
as $$
declare r public.marketplace_listings;
declare v_owner uuid;
begin
  if (select auth.uid()) is null then raise exception 'authentication_required' using errcode='42501'; end if;
  if length(trim(p_title))=0 or length(trim(p_slug))=0 then raise exception 'title_and_slug_required'; end if;
  if p_price_amount < 0 then raise exception 'invalid_price'; end if;
  if p_seller_type='agent' then
    select a.owner_user_id into v_owner from public.agents a where a.id=p_agent_id and a.id=p_seller_id and a.status='active';
    if v_owner is null or v_owner<>(select auth.uid()) then raise exception 'agent_not_owned_or_inactive' using errcode='42501'; end if;
    if p_listing_type<>'service' or p_skill_name is null then raise exception 'agent_service_listing_requires_skill'; end if;
    if not exists(select 1 from public.agent_skills s where s.agent_id=p_agent_id and s.name=p_skill_name and s.enabled=true) then
      raise exception 'agent_skill_not_enabled';
    end if;
    if exists(select 1 from unnest(coalesce(p_capability_requirements,'{}')) c where not exists(
      select 1 from public.agent_capabilities ac where ac.agent_id=p_agent_id and ac.capability=c and ac.enabled=true
    )) then raise exception 'agent_capability_requirement_not_granted'; end if;
  elsif p_seller_type='booth' then
    select b.owner_user_id into v_owner from public.booths b where b.id=p_booth_id and (b.owner_user_id=(select auth.uid()) or b.agent_id in (select id from public.agents where owner_user_id=(select auth.uid())));
    if v_owner is null and not exists(select 1 from public.booths b where b.id=p_booth_id and b.platform_owned=false) then
      raise exception 'booth_not_owned'; end if;
  else
    if p_seller_id<>(select auth.uid()) then raise exception 'seller_not_owned' using errcode='42501'; end if;
    v_owner := (select auth.uid());
  end if;
  insert into public.marketplace_listings(
    listing_type,seller_type,seller_id,owner_user_id,agent_id,booth_id,title,slug,description,skill_name,
    capability_requirements,price_amount,currency,price_unit,inventory_quantity,metadata
  ) values (
    p_listing_type,p_seller_type,p_seller_id,v_owner,p_agent_id,p_booth_id,trim(p_title),trim(p_slug),p_description,p_skill_name,
    coalesce(p_capability_requirements,'{}'),p_price_amount,upper(p_currency),p_price_unit,p_inventory_quantity,coalesce(p_metadata,'{}')
  ) returning * into r;
  insert into public.audit_logs(actor_user_id,action,resource_type,resource_id,outcome,metadata)
  values((select auth.uid()),'marketplace.listing.created','marketplace_listing',r.id,'success',jsonb_build_object('listing_type',p_listing_type,'seller_type',p_seller_type));
  return r;
end $$;

create or replace function public.publish_marketplace_listing(p_listing_id uuid)
returns public.marketplace_listings
language plpgsql security definer set search_path=''
as $$
declare r public.marketplace_listings;
begin
  if (select auth.uid()) is null then raise exception 'authentication_required' using errcode='42501'; end if;
  update public.marketplace_listings
  set status='published', moderation_status='pending', updated_at=timezone('utc',now())
  where id=p_listing_id and owner_user_id=(select auth.uid())
  returning * into r;
  if r.id is null then raise exception 'listing_not_found_or_not_owned' using errcode='42501'; end if;
  insert into public.commerce_events(listing_id,actor_user_id,event_type,outcome,payload)
  values(r.id,(select auth.uid()),'listing.published','pending_moderation','{}');
  insert into public.audit_logs(actor_user_id,action,resource_type,resource_id,outcome,metadata)
  values((select auth.uid()),'marketplace.listing.published','marketplace_listing',r.id,'pending_moderation','{}');
  return r;
end $$;

create or replace function public.list_marketplace_listings(p_q text,p_listing_type text,p_skill_name text,p_booth_id uuid,p_limit integer)
returns setof public.marketplace_listings
language sql security invoker
set search_path=''
as $
  select l.* from public.marketplace_listings l
  where l.status='published' and l.moderation_status='approved'
    and (p_listing_type is null or l.listing_type=p_listing_type)
    and (p_skill_name is null or l.skill_name=p_skill_name)
    and (p_booth_id is null or l.booth_id=p_booth_id)
    and (p_q is null or l.title ilike '%'||p_q||'%' or coalesce(l.description,'') ilike '%'||p_q||'%')
  order by l.created_at desc limit greatest(1,least(coalesce(p_limit,50),100));
$$;

create or replace function public.create_marketplace_offer(p_listing_id uuid,p_amount bigint,p_message text,p_expires_at timestamptz)
returns public.marketplace_offers
language plpgsql security definer set search_path=''
as $$
declare l public.marketplace_listings; r public.marketplace_offers;
begin
  if (select auth.uid()) is null then raise exception 'authentication_required' using errcode='42501'; end if;
  select * into l from public.marketplace_listings where id=p_listing_id and status='published' and moderation_status='approved';
  if l.id is null then raise exception 'listing_not_available'; end if;
  if l.owner_user_id=(select auth.uid()) then raise exception 'seller_cannot_offer_on_own_listing'; end if;
  insert into public.marketplace_offers(listing_id,buyer_user_id,seller_owner_user_id,amount,currency,message,expires_at)
  values(l.id,(select auth.uid()),l.owner_user_id,p_amount,l.currency,p_message,p_expires_at) returning * into r;
  insert into public.commerce_events(listing_id,actor_user_id,event_type,outcome,payload)
  values(l.id,(select auth.uid()),'offer.created','success',jsonb_build_object('offer_id',r.id,'amount',p_amount));
  return r;
end $$;

create or replace function public.respond_marketplace_offer(p_offer_id uuid,p_decision text)
returns public.marketplace_offers
language plpgsql security definer set search_path=''
as $$
declare r public.marketplace_offers;
begin
  if (select auth.uid()) is null then raise exception 'authentication_required' using errcode='42501'; end if;
  if p_decision not in ('accepted','rejected','cancelled') then raise exception 'invalid_offer_decision'; end if;
  update public.marketplace_offers
  set status=p_decision,responded_at=timezone('utc',now()),updated_at=timezone('utc',now())
  where id=p_offer_id and ((seller_owner_user_id=(select auth.uid()) and p_decision in ('accepted','rejected')) or buyer_user_id=(select auth.uid()) and p_decision='cancelled')
  returning * into r;
  if r.id is null then raise exception 'offer_not_found_or_not_authorized' using errcode='42501'; end if;
  insert into public.commerce_events(listing_id,actor_user_id,event_type,outcome,payload)
  values(r.listing_id,(select auth.uid()),'offer.'||p_decision,'success',jsonb_build_object('offer_id',r.id));
  return r;
end $$;

create or replace function public.create_commerce_order(
  p_listing_id uuid,p_quantity integer,p_source_type text,p_source_id uuid,p_idempotency_key text
) returns public.commerce_orders
language plpgsql security definer set search_path=''
as $$
declare l public.marketplace_listings; o public.commerce_orders; v_total bigint; v_item public.commerce_order_items;
begin
  if (select auth.uid()) is null then raise exception 'authentication_required' using errcode='42501'; end if;
  if p_quantity is null or p_quantity<1 then raise exception 'invalid_quantity'; end if;
  if p_idempotency_key is not null and exists(select 1 from public.commerce_events where idempotency_key=p_idempotency_key) then
    select co.order_id into o.id from public.commerce_events co where co.idempotency_key=p_idempotency_key limit 1;
    select * into o from public.commerce_orders where id=o.id;
    return o;
  end if;
  select * into l from public.marketplace_listings where id=p_listing_id and status='published' and moderation_status='approved';
  if l.id is null then raise exception 'listing_not_available'; end if;
  if l.owner_user_id=(select auth.uid()) then raise exception 'cannot_purchase_own_listing'; end if;
  if l.inventory_quantity is not null and l.inventory_quantity<p_quantity then raise exception 'insufficient_inventory'; end if;
  v_total:=l.price_amount*p_quantity;
  insert into public.commerce_orders(buyer_user_id,status,currency,subtotal_amount,total_amount,source_type,source_id)
  values((select auth.uid()),'pending_payment',l.currency,v_total,v_total,p_source_type,p_source_id) returning * into o;
  insert into public.commerce_order_items(order_id,listing_id,seller_owner_user_id,agent_id,booth_id,title_snapshot,listing_type,quantity,unit_amount,total_amount,currency,metadata)
  values(o.id,l.id,l.owner_user_id,l.agent_id,l.booth_id,l.title,l.listing_type,p_quantity,l.price_amount,v_total,l.currency,jsonb_build_object('skill_name',l.skill_name)) returning * into v_item;
  insert into public.commerce_events(order_id,listing_id,actor_user_id,event_type,outcome,idempotency_key,payload)
  values(o.id,l.id,(select auth.uid()),'order.created','payment_required',p_idempotency_key,jsonb_build_object('quantity',p_quantity,'total_amount',v_total));
  insert into public.audit_logs(actor_user_id,action,resource_type,resource_id,outcome,idempotency_key,metadata)
  values((select auth.uid()),'commerce.order.created','commerce_order',o.id,'payment_required',p_idempotency_key,jsonb_build_object('listing_id',l.id,'total_amount',v_total));
  return o;
end $$;

create or replace function public.create_commerce_payment_intent(p_order_id uuid,p_provider_key text,p_idempotency_key text)
returns public.commerce_payments
language plpgsql security definer set search_path=''
as $$
declare o public.commerce_orders; p public.commerce_payments;
begin
  if (select auth.uid()) is null then raise exception 'authentication_required' using errcode='42501'; end if;
  select * into o from public.commerce_orders where id=p_order_id and buyer_user_id=(select auth.uid());
  if o.id is null then raise exception 'order_not_found_or_not_owned' using errcode='42501'; end if;
  if o.status not in ('pending_payment','payment_pending') then raise exception 'order_not_payable'; end if;
  select * into p from public.commerce_payments where order_id=o.id and status='pending_provider' order by created_at desc limit 1;
  if p.id is not null then return p; end if;
  insert into public.commerce_payments(order_id,provider_key,status,amount,currency)
  values(o.id,trim(p_provider_key),'pending_provider',o.total_amount,o.currency) returning * into p;
  update public.commerce_orders set status='payment_pending',updated_at=timezone('utc',now()) where id=o.id;
  insert into public.commerce_events(order_id,payment_id,actor_user_id,event_type,outcome,idempotency_key,payload)
  values(o.id,p.id,(select auth.uid()),'payment.intent.created','pending_provider',p_idempotency_key,jsonb_build_object('provider_key',p_provider_key));
  insert into public.audit_logs(actor_user_id,action,resource_type,resource_id,outcome,idempotency_key,metadata)
  values((select auth.uid()),'commerce.payment.intent.created','commerce_payment',p.id,'pending_provider',p_idempotency_key,jsonb_build_object('order_id',o.id,'provider_key',p_provider_key));
  return p;
end $$;

create or replace function public.get_my_commerce_orders(p_limit integer)
returns table(id uuid,status text,currency text,subtotal_amount bigint,total_amount bigint,created_at timestamptz,paid_at timestamptz,completed_at timestamptz,item_count bigint)
language sql security invoker
as $$
 select o.id,o.status,o.currency,o.subtotal_amount,o.total_amount,o.created_at,o.paid_at,o.completed_at,
        count(i.id) item_count
 from public.commerce_orders o
 left join public.commerce_order_items i on i.order_id=o.id
 where o.buyer_user_id=(select auth.uid())
 group by o.id
 order by o.created_at desc
 limit greatest(1,least(coalesce(p_limit,50),100));
$$;

revoke all on function public.create_marketplace_listing(text,text,uuid,uuid,uuid,text,text,text,text,text[],bigint,text,text,integer,jsonb) from public,anon;
revoke all on function public.publish_marketplace_listing(uuid) from public,anon;
revoke all on function public.list_marketplace_listings(text,text,text,uuid,integer) from public,anon;
revoke all on function public.create_marketplace_offer(uuid,bigint,text,timestamptz) from public,anon;
revoke all on function public.respond_marketplace_offer(uuid,text) from public,anon;
revoke all on function public.create_commerce_order(uuid,integer,text,uuid,text) from public,anon;
revoke all on function public.create_commerce_payment_intent(uuid,text,text) from public,anon;
revoke all on function public.get_my_commerce_orders(integer) from public,anon;
grant execute on function public.create_marketplace_listing(text,text,uuid,uuid,uuid,text,text,text,text,text[],bigint,text,text,integer,jsonb) to authenticated;
grant execute on function public.publish_marketplace_listing(uuid) to authenticated;
grant execute on function public.list_marketplace_listings(text,text,text,uuid,integer) to authenticated;
grant execute on function public.create_marketplace_offer(uuid,bigint,text,timestamptz) to authenticated;
grant execute on function public.respond_marketplace_offer(uuid,text) to authenticated;
grant execute on function public.create_commerce_order(uuid,integer,text,uuid,text) to authenticated;
grant execute on function public.create_commerce_payment_intent(uuid,text,text) to authenticated;
grant execute on function public.get_my_commerce_orders(integer) to authenticated;

