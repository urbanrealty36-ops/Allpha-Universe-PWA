-- Phase 27C canonical private functions, generated from live AllphaDb-Universe definitions.
-- Public wrappers and grants are declared below.
CREATE OR REPLACE FUNCTION private.admin_27c_require_manage()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if auth.uid() is null or not private.has_platform_permission('admin.manage') then
    raise exception 'permission_denied' using errcode='42501';
  end if;
end;
$function$


CREATE OR REPLACE FUNCTION private.admin_27c_require_read()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if auth.uid() is null or not private.has_platform_permission('admin.read') then
    raise exception 'permission_denied' using errcode='42501';
  end if;
end;
$function$


CREATE OR REPLACE FUNCTION private.execute_admin_domain_operation__allpha_sd(p_operation text, p_resource text, p_id uuid, p_payload jsonb DEFAULT '{}'::jsonb, p_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_result jsonb;
begin
  perform private.admin_27c_require_manage();
  if nullif(trim(coalesce(p_reason,'')),'') is null then raise exception 'admin_reason_required' using errcode='22023'; end if;

  if p_operation='moderation_decision' and p_resource='content_moderation' then
    v_result:=public.decide_content_moderation(p_id,coalesce(p_payload->>'decision',''),p_reason);
  elsif p_operation='payout_decision' and p_resource='payout' then
    v_result:=public.decide_payout_request(p_id,coalesce(p_payload->>'decision',''),p_reason);
  elsif p_operation='payout_process' and p_resource='payout' then
    v_result:=public.process_payout_request(p_id,coalesce(p_payload->>'outcome',''),nullif(p_payload->>'disbursement_reference',''),p_reason);
  elsif p_operation='publish_listing' and p_resource='marketplace_listing' then
    v_result:=public.publish_marketplace_listing(p_id);
  elsif p_operation='publish_theme' and p_resource='theme' then
    v_result:=public.publish_theme(p_id);
  elsif p_operation='moderate_theme' and p_resource='theme' then
    v_result:=public.moderate_theme(p_id,case when nullif(p_payload->>'theme_version_id','') is null then null else (p_payload->>'theme_version_id')::uuid end,coalesce(p_payload->>'decision',''));
  else
    raise exception 'unsupported_admin_operation' using errcode='22023';
  end if;

  insert into public.audit_logs(actor_user_id,action,resource_type,resource_id,outcome,risk_level,metadata)
  values(auth.uid(),'admin.domain.'||p_operation,p_resource,p_id,'success','high',jsonb_build_object('reason',p_reason,'payload',p_payload));
  return coalesce(v_result,jsonb_build_object('success',true));
end;
$function$


CREATE OR REPLACE FUNCTION private.get_admin_domain_records__allpha_sd(p_resource text, p_q text DEFAULT NULL::text, p_status text DEFAULT NULL::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_sql text; v_count_sql text; v_items jsonb; v_total bigint;
  v_limit integer := greatest(1,least(coalesce(p_limit,50),200));
  v_offset integer := greatest(0,coalesce(p_offset,0));
  v_q text := nullif(trim(p_q),'');
begin
  perform private.admin_27c_require_read();
  case p_resource
    when 'users' then
      v_sql := $sql$select id,display_name,username,status,locale,timezone,created_at,updated_at,deleted_at from public.users where ($1 is null or display_name ilike '%'||$1||'%' or username ilike '%'||$1||'%' or id::text ilike '%'||$1||'%') and ($2 is null or status::text=$2) order by created_at desc limit $3 offset $4$sql$;
      v_count_sql := $sql$select count(*) from public.users where ($1 is null or display_name ilike '%'||$1||'%' or username ilike '%'||$1||'%' or id::text ilike '%'||$1||'%') and ($2 is null or status::text=$2)$sql$;
    when 'agents' then
      v_sql := $sql$select id,owner_user_id,name,handle,status,runtime_state,visibility,authority_policy_version,created_at,updated_at from public.agents where ($1 is null or name ilike '%'||$1||'%' or handle ilike '%'||$1||'%' or id::text ilike '%'||$1||'%') and ($2 is null or status::text=$2) order by created_at desc limit $3 offset $4$sql$;
      v_count_sql := $sql$select count(*) from public.agents where ($1 is null or name ilike '%'||$1||'%' or handle ilike '%'||$1||'%' or id::text ilike '%'||$1||'%') and ($2 is null or status::text=$2)$sql$;
    when 'content' then
      v_sql := $sql$select id,owner_type,owner_id,content_type,title,visibility,status,language_code,published_at,created_at,updated_at from public.content_items where ($1 is null or coalesce(title,'') ilike '%'||$1||'%' or id::text ilike '%'||$1||'%') and ($2 is null or status=$2) order by created_at desc limit $3 offset $4$sql$;
      v_count_sql := $sql$select count(*) from public.content_items where ($1 is null or coalesce(title,'') ilike '%'||$1||'%' or id::text ilike '%'||$1||'%') and ($2 is null or status=$2)$sql$;
    when 'moderation' then
      v_sql := $sql$select id,content_id,media_asset_id,submitted_by_user_id,status,reason_code,decided_by_user_id,decided_at,created_at from public.content_moderation_cases where ($1 is null or coalesce(reason_code,'') ilike '%'||$1||'%' or id::text ilike '%'||$1||'%') and ($2 is null or status=$2) order by created_at desc limit $3 offset $4$sql$;
      v_count_sql := $sql$select count(*) from public.content_moderation_cases where ($1 is null or coalesce(reason_code,'') ilike '%'||$1||'%' or id::text ilike '%'||$1||'%') and ($2 is null or status=$2)$sql$;
    when 'galaxies' then
      v_sql := $sql$select id,name,slug,owner_type,owner_id,visibility,status,created_at,updated_at from public.universe_galaxies where ($1 is null or name ilike '%'||$1||'%' or slug ilike '%'||$1||'%') and ($2 is null or status=$2) order by created_at desc limit $3 offset $4$sql$;
      v_count_sql := $sql$select count(*) from public.universe_galaxies where ($1 is null or name ilike '%'||$1||'%' or slug ilike '%'||$1||'%') and ($2 is null or status=$2)$sql$;
    when 'worlds' then
      v_sql := $sql$select id,galaxy_id,name,slug,owner_type,owner_id,world_type,visibility,status,theme_key,created_at,updated_at from public.universe_worlds where ($1 is null or name ilike '%'||$1||'%' or slug ilike '%'||$1||'%') and ($2 is null or status=$2) order by created_at desc limit $3 offset $4$sql$;
      v_count_sql := $sql$select count(*) from public.universe_worlds where ($1 is null or name ilike '%'||$1||'%' or slug ilike '%'||$1||'%') and ($2 is null or status=$2)$sql$;
    when 'districts' then
      v_sql := $sql$select id,world_id,name,slug,owner_type,owner_id,district_type,visibility,status,theme_key,created_at,updated_at from public.districts where ($1 is null or name ilike '%'||$1||'%' or slug ilike '%'||$1||'%') and ($2 is null or status=$2) order by created_at desc limit $3 offset $4$sql$;
      v_count_sql := $sql$select count(*) from public.districts where ($1 is null or name ilike '%'||$1||'%' or slug ilike '%'||$1||'%') and ($2 is null or status=$2)$sql$;
    when 'zones' then
      v_sql := $sql$select id,district_id,zone_key,name,zone_type,status,created_at,updated_at from public.district_zones where ($1 is null or name ilike '%'||$1||'%' or zone_key ilike '%'||$1||'%') and ($2 is null or status=$2) order by created_at desc limit $3 offset $4$sql$;
      v_count_sql := $sql$select count(*) from public.district_zones where ($1 is null or name ilike '%'||$1||'%' or zone_key ilike '%'||$1||'%') and ($2 is null or status=$2)$sql$;
    when 'booths' then
      v_sql := $sql$select id,name,slug,owner_user_id,owner_organization_id,agent_id,district_id,district_zone_id,booth_type,tier,status,moderation_status,theme_key,platform_owned,created_at,updated_at from public.booths where ($1 is null or name ilike '%'||$1||'%' or slug ilike '%'||$1||'%') and ($2 is null or status=$2) order by created_at desc limit $3 offset $4$sql$;
      v_count_sql := $sql$select count(*) from public.booths where ($1 is null or name ilike '%'||$1||'%' or slug ilike '%'||$1||'%') and ($2 is null or status=$2)$sql$;
    when 'themes' then
      v_sql := $sql$select id,name,slug,category,status,moderation_status,source,catalog_key,catalog_order,creator_user_id,created_at,updated_at from public.themes where ($1 is null or name ilike '%'||$1||'%' or slug ilike '%'||$1||'%' or coalesce(catalog_key,'') ilike '%'||$1||'%') and ($2 is null or status=$2) order by catalog_order nulls last,created_at desc limit $3 offset $4$sql$;
      v_count_sql := $sql$select count(*) from public.themes where ($1 is null or name ilike '%'||$1||'%' or slug ilike '%'||$1||'%' or coalesce(catalog_key,'') ilike '%'||$1||'%') and ($2 is null or status=$2)$sql$;
    when 'theme_versions' then
      v_sql := $sql$select id,theme_id,version,status,validation_status,performance_status,moderation_status,checksum,created_by_user_id,approved_by_user_id,created_at,published_at,effective_from,effective_until from public.theme_versions where ($1 is null or id::text ilike '%'||$1||'%') and ($2 is null or status=$2) order by created_at desc limit $3 offset $4$sql$;
      v_count_sql := $sql$select count(*) from public.theme_versions where ($1 is null or id::text ilike '%'||$1||'%') and ($2 is null or status=$2)$sql$;
    when 'marketplace_listings' then
      v_sql := $sql$select id,listing_type,seller_type,seller_id,owner_user_id,agent_id,booth_id,title,slug,price_amount,currency,price_unit,inventory_quantity,status,moderation_status,created_at,updated_at from public.marketplace_listings where ($1 is null or title ilike '%'||$1||'%' or slug ilike '%'||$1||'%') and ($2 is null or status=$2) order by created_at desc limit $3 offset $4$sql$;
      v_count_sql := $sql$select count(*) from public.marketplace_listings where ($1 is null or title ilike '%'||$1||'%' or slug ilike '%'||$1||'%') and ($2 is null or status=$2)$sql$;
    when 'marketplace_offers' then
      v_sql := $sql$select id,listing_id,buyer_user_id,seller_owner_user_id,amount,currency,status,expires_at,responded_at,created_at,updated_at from public.marketplace_offers where ($1 is null or id::text ilike '%'||$1||'%') and ($2 is null or status=$2) order by created_at desc limit $3 offset $4$sql$;
      v_count_sql := $sql$select count(*) from public.marketplace_offers where ($1 is null or id::text ilike '%'||$1||'%') and ($2 is null or status=$2)$sql$;
    when 'billing_plans' then
      v_sql := $sql$select id,plan_key,name,description,interval_unit,interval_count,price_amount,currency,included_credits,status,created_at,updated_at from public.billing_plans where ($1 is null or name ilike '%'||$1||'%' or plan_key ilike '%'||$1||'%') and ($2 is null or status=$2) order by created_at desc limit $3 offset $4$sql$;
      v_count_sql := $sql$select count(*) from public.billing_plans where ($1 is null or name ilike '%'||$1||'%' or plan_key ilike '%'||$1||'%') and ($2 is null or status=$2)$sql$;
    when 'credit_products' then
      v_sql := $sql$select id,product_key,name,description,credits,price_amount,currency,status,created_at,updated_at from public.economy_credit_products where ($1 is null or name ilike '%'||$1||'%' or product_key ilike '%'||$1||'%') and ($2 is null or status=$2) order by created_at desc limit $3 offset $4$sql$;
      v_count_sql := $sql$select count(*) from public.economy_credit_products where ($1 is null or name ilike '%'||$1||'%' or product_key ilike '%'||$1||'%') and ($2 is null or status=$2)$sql$;
    when 'subscriptions' then
      v_sql := $sql$select id,user_id,plan_id,status,current_period_start,current_period_end,cancel_at_period_end,provider_key,provider_subscription_id,created_at,updated_at,cancelled_at from public.billing_subscriptions where ($1 is null or id::text ilike '%'||$1||'%') and ($2 is null or status=$2) order by created_at desc limit $3 offset $4$sql$;
      v_count_sql := $sql$select count(*) from public.billing_subscriptions where ($1 is null or id::text ilike '%'||$1||'%') and ($2 is null or status=$2)$sql$;
    when 'invoices' then
      v_sql := $sql$select id,invoice_number,user_id,subscription_id,order_id,status,amount,currency,period_start,period_end,due_at,paid_at,created_at,updated_at from public.billing_invoices where ($1 is null or invoice_number ilike '%'||$1||'%' or id::text ilike '%'||$1||'%') and ($2 is null or status=$2) order by created_at desc limit $3 offset $4$sql$;
      v_count_sql := $sql$select count(*) from public.billing_invoices where ($1 is null or invoice_number ilike '%'||$1||'%' or id::text ilike '%'||$1||'%') and ($2 is null or status=$2)$sql$;
    when 'payouts' then
      v_sql := $sql$select id,requester_user_id,payout_account_id,amount,currency,status,risk_level,risk_decision,approval_request_id,decision_by_user_id,decision_reason,disbursement_reference,processed_at,paid_at,failure_reason,created_at,updated_at from public.payout_requests where ($1 is null or id::text ilike '%'||$1||'%') and ($2 is null or status=$2) order by created_at desc limit $3 offset $4$sql$;
      v_count_sql := $sql$select count(*) from public.payout_requests where ($1 is null or id::text ilike '%'||$1||'%') and ($2 is null or status=$2)$sql$;
    when 'approvals' then
      v_sql := $sql$select id,requester_user_id,requester_agent_id,action,resource_type,resource_id,status,risk_level,decision_by_user_id,decision_reason,expires_at,created_at,decided_at from public.approval_requests where ($1 is null or action ilike '%'||$1||'%' or coalesce(resource_type,'') ilike '%'||$1||'%' or id::text ilike '%'||$1||'%') and ($2 is null or status::text=$2) order by created_at desc limit $3 offset $4$sql$;
      v_count_sql := $sql$select count(*) from public.approval_requests where ($1 is null or action ilike '%'||$1||'%' or coalesce(resource_type,'') ilike '%'||$1||'%' or id::text ilike '%'||$1||'%') and ($2 is null or status::text=$2)$sql$;
    when 'risk' then
      v_sql := $sql$select id,actor_user_id,actor_agent_id,action,resource_type,resource_id,risk_level,decision,policy_version,created_at from public.risk_assessments where ($1 is null or action ilike '%'||$1||'%' or coalesce(resource_type,'') ilike '%'||$1||'%' or id::text ilike '%'||$1||'%') and ($2 is null or decision=$2) order by created_at desc limit $3 offset $4$sql$;
      v_count_sql := $sql$select count(*) from public.risk_assessments where ($1 is null or action ilike '%'||$1||'%' or coalesce(resource_type,'') ilike '%'||$1||'%' or id::text ilike '%'||$1||'%') and ($2 is null or decision=$2)$sql$;
    when 'feature_flags' then
      v_sql := $sql$select id,key,description,enabled,rollout_percent,targeting,metadata,created_by_user_id,updated_by_user_id,created_at,updated_at from public.platform_feature_flags where ($1 is null or key ilike '%'||$1||'%') and ($2 is null or (case when enabled then 'enabled' else 'disabled' end)=$2) order by key limit $3 offset $4$sql$;
      v_count_sql := $sql$select count(*) from public.platform_feature_flags where ($1 is null or key ilike '%'||$1||'%') and ($2 is null or (case when enabled then 'enabled' else 'disabled' end)=$2)$sql$;
    when 'config_versions' then
      v_sql := $sql$select id,namespace,version_no,status,created_by_user_id,published_by_user_id,published_at,created_at,updated_at from public.platform_config_versions where ($1 is null or namespace ilike '%'||$1||'%') and ($2 is null or status=$2) order by namespace,version_no desc limit $3 offset $4$sql$;
      v_count_sql := $sql$select count(*) from public.platform_config_versions where ($1 is null or namespace ilike '%'||$1||'%') and ($2 is null or status=$2)$sql$;
    else
      raise exception 'unsupported_admin_resource' using errcode='22023';
  end case;

  execute v_count_sql into v_total using v_q,p_status;
  execute 'select coalesce(jsonb_agg(to_jsonb(t)),''[]''::jsonb) from ('||v_sql||') t' into v_items using v_q,p_status,v_limit,v_offset;
  return jsonb_build_object('resource',p_resource,'items',v_items,'total',v_total,'limit',v_limit,'offset',v_offset);
end;
$function$


CREATE OR REPLACE FUNCTION private.get_admin_transaction_detail__allpha_sd(p_order_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_result jsonb;
begin
  perform private.admin_27c_require_read();
  select jsonb_build_object(
    'order',(select to_jsonb(o)-'metadata' from public.commerce_orders o where o.id=p_order_id),
    'buyer',(select jsonb_build_object('id',u.id,'display_name',u.display_name,'username',u.username,'status',u.status) from public.users u where u.id=(select buyer_user_id from public.commerce_orders where id=p_order_id)),
    'items',coalesce((select jsonb_agg(jsonb_build_object('id',oi.id,'listing_id',oi.listing_id,'seller_owner_user_id',oi.seller_owner_user_id,'seller_display_name',su.display_name,'seller_username',su.username,'agent_id',oi.agent_id,'booth_id',oi.booth_id,'title_snapshot',oi.title_snapshot,'listing_type',oi.listing_type,'quantity',oi.quantity,'unit_amount',oi.unit_amount,'total_amount',oi.total_amount,'currency',oi.currency,'created_at',oi.created_at) order by oi.created_at) from public.commerce_order_items oi left join public.users su on su.id=oi.seller_owner_user_id where oi.order_id=p_order_id),'[]'::jsonb),
    'payments',coalesce((select jsonb_agg(jsonb_build_object('id',cp.id,'provider_key',cp.provider_key,'status',cp.status,'amount',cp.amount,'currency',cp.currency,'external_reference',cp.external_reference,'provider_transaction_id',cp.provider_transaction_id,'provider_status',cp.provider_status,'notification_count',cp.notification_count,'created_at',cp.created_at,'updated_at',cp.updated_at,'captured_at',cp.captured_at,'paid_at',cp.paid_at) order by cp.created_at desc) from public.commerce_payments cp where cp.order_id=p_order_id),'[]'::jsonb),
    'events',coalesce((select jsonb_agg(jsonb_build_object('id',ce.id,'event_type',ce.event_type,'outcome',ce.outcome,'actor_user_id',ce.actor_user_id,'listing_id',ce.listing_id,'payment_id',ce.payment_id,'created_at',ce.created_at,'payload',ce.payload) order by ce.created_at desc) from public.commerce_events ce where ce.order_id=p_order_id),'[]'::jsonb),
    'invoice',(select jsonb_build_object('id',i.id,'invoice_number',i.invoice_number,'status',i.status,'amount',i.amount,'currency',i.currency,'period_start',i.period_start,'period_end',i.period_end,'due_at',i.due_at,'paid_at',i.paid_at,'created_at',i.created_at) from public.billing_invoices i where i.order_id=p_order_id),
    'credit_purchase',(select to_jsonb(ecp) from public.economy_credit_purchases ecp where ecp.order_id=p_order_id limit 1),
    'audit',coalesce((select jsonb_agg(to_jsonb(a) order by a.created_at desc) from public.audit_logs a where a.resource_id=p_order_id),'[]'::jsonb)
  ) into v_result;
  if v_result->'order' is null then raise exception 'transaction_not_found' using errcode='P0002'; end if;
  return v_result;
end;
$function$


CREATE OR REPLACE FUNCTION private.get_admin_transaction_explorer__allpha_sd(p_q text DEFAULT NULL::text, p_order_kind text DEFAULT NULL::text, p_order_status text DEFAULT NULL::text, p_payment_status text DEFAULT NULL::text, p_provider_status text DEFAULT NULL::text, p_from timestamp with time zone DEFAULT NULL::timestamp with time zone, p_to timestamp with time zone DEFAULT NULL::timestamp with time zone, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_limit integer := greatest(1,least(coalesce(p_limit,50),200));
  v_offset integer := greatest(0,coalesce(p_offset,0));
  v_q text := nullif(trim(p_q),'');
  v_items jsonb;
  v_total bigint;
begin
  perform private.admin_27c_require_read();
  select count(*) into v_total
  from public.commerce_orders o
  left join public.users u on u.id=o.buyer_user_id
  where (p_order_kind is null or o.order_kind=p_order_kind)
    and (p_order_status is null or o.status=p_order_status)
    and (p_from is null or o.created_at>=p_from)
    and (p_to is null or o.created_at<=p_to)
    and (v_q is null or o.id::text ilike '%'||v_q||'%' or coalesce(u.username,'') ilike '%'||v_q||'%' or coalesce(u.display_name,'') ilike '%'||v_q||'%'
      or exists(select 1 from public.commerce_payments cp where cp.order_id=o.id and (coalesce(cp.provider_transaction_id,'') ilike '%'||v_q||'%' or coalesce(cp.external_reference,'') ilike '%'||v_q||'%')))
    and (p_payment_status is null or exists(select 1 from public.commerce_payments cp2 where cp2.order_id=o.id and cp2.status=p_payment_status))
    and (p_provider_status is null or exists(select 1 from public.commerce_payments cp3 where cp3.order_id=o.id and cp3.provider_status=p_provider_status));

  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) into v_items
  from (
    select o.id order_id,o.order_kind,o.status order_status,o.currency,o.subtotal_amount,o.total_amount,
      o.buyer_user_id,u.display_name buyer_display_name,u.username buyer_username,o.created_at,o.updated_at,o.paid_at,o.completed_at,
      coalesce((select jsonb_agg(jsonb_build_object('id',cp.id,'status',cp.status,'provider_key',cp.provider_key,'provider_status',cp.provider_status,'provider_transaction_id',cp.provider_transaction_id,'external_reference',cp.external_reference,'amount',cp.amount,'currency',cp.currency,'created_at',cp.created_at,'paid_at',cp.paid_at,'captured_at',cp.captured_at) order by cp.created_at desc) from public.commerce_payments cp where cp.order_id=o.id),'[]'::jsonb) payments,
      (select count(*) from public.commerce_order_items oi where oi.order_id=o.id) item_count,
      coalesce((select sum(oi.total_amount) from public.commerce_order_items oi where oi.order_id=o.id),0) item_value
    from public.commerce_orders o left join public.users u on u.id=o.buyer_user_id
    where (p_order_kind is null or o.order_kind=p_order_kind)
      and (p_order_status is null or o.status=p_order_status)
      and (p_from is null or o.created_at>=p_from) and (p_to is null or o.created_at<=p_to)
      and (v_q is null or o.id::text ilike '%'||v_q||'%' or coalesce(u.username,'') ilike '%'||v_q||'%' or coalesce(u.display_name,'') ilike '%'||v_q||'%'
        or exists(select 1 from public.commerce_payments cp4 where cp4.order_id=o.id and (coalesce(cp4.provider_transaction_id,'') ilike '%'||v_q||'%' or coalesce(cp4.external_reference,'') ilike '%'||v_q||'%')))
      and (p_payment_status is null or exists(select 1 from public.commerce_payments cp5 where cp5.order_id=o.id and cp5.status=p_payment_status))
      and (p_provider_status is null or exists(select 1 from public.commerce_payments cp6 where cp6.order_id=o.id and cp6.provider_status=p_provider_status))
    order by o.created_at desc limit v_limit offset v_offset
  ) x;
  return jsonb_build_object('items',v_items,'total',v_total,'limit',v_limit,'offset',v_offset);
end;
$function$


CREATE OR REPLACE FUNCTION private.mutate_admin_master_data__allpha_sd(p_resource text, p_id uuid DEFAULT NULL::uuid, p_action text DEFAULT 'upsert'::text, p_payload jsonb DEFAULT '{}'::jsonb, p_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id uuid:=p_id; v_result jsonb;
begin
  perform private.admin_27c_require_manage();
  if nullif(trim(coalesce(p_reason,'')),'') is null then raise exception 'admin_reason_required' using errcode='22023'; end if;

  if p_resource='billing_plans' then
    if p_action='archive' then
      if v_id is null then raise exception 'id_required' using errcode='22023'; end if;
      update public.billing_plans set status='archived',updated_at=timezone('utc',now()) where id=v_id
        returning jsonb_build_object('id',id,'plan_key',plan_key,'name',name,'status',status,'price_amount',price_amount,'currency',currency,'included_credits',included_credits) into v_result;
    elsif p_action='upsert' then
      if coalesce(p_payload->>'plan_key','') !~ '^[a-z][a-z0-9_.:-]{1,127}$' or coalesce(p_payload->>'name','')='' then raise exception 'invalid_billing_plan' using errcode='22023'; end if;
      if v_id is null then
        insert into public.billing_plans(plan_key,name,description,interval_unit,interval_count,price_amount,currency,included_credits,status,metadata)
        values(p_payload->>'plan_key',p_payload->>'name',nullif(p_payload->>'description',''),coalesce(p_payload->>'interval_unit','month'),greatest(1,coalesce((p_payload->>'interval_count')::int,1)),greatest(0,coalesce((p_payload->>'price_amount')::bigint,0)),coalesce(p_payload->>'currency','IDR'),greatest(0,coalesce((p_payload->>'included_credits')::int,0)),coalesce(p_payload->>'status','draft'),coalesce(p_payload->'metadata','{}'::jsonb))
        returning id into v_id;
      else
        update public.billing_plans set
          plan_key=coalesce(p_payload->>'plan_key',plan_key),name=coalesce(p_payload->>'name',name),
          description=case when p_payload ? 'description' then nullif(p_payload->>'description','') else description end,
          interval_unit=coalesce(p_payload->>'interval_unit',interval_unit),
          interval_count=greatest(1,coalesce((p_payload->>'interval_count')::int,interval_count)),
          price_amount=greatest(0,coalesce((p_payload->>'price_amount')::bigint,price_amount)),
          currency=coalesce(p_payload->>'currency',currency),
          included_credits=greatest(0,coalesce((p_payload->>'included_credits')::int,included_credits)),
          status=coalesce(p_payload->>'status',status),
          metadata=case when p_payload ? 'metadata' then p_payload->'metadata' else metadata end,
          updated_at=timezone('utc',now()) where id=v_id;
      end if;
      select jsonb_build_object('id',id,'plan_key',plan_key,'name',name,'status',status,'price_amount',price_amount,'currency',currency,'included_credits',included_credits) into v_result from public.billing_plans where id=v_id;
    else raise exception 'unsupported_master_action' using errcode='22023'; end if;

  elsif p_resource='credit_products' then
    if p_action='archive' then
      if v_id is null then raise exception 'id_required' using errcode='22023'; end if;
      update public.economy_credit_products set status='archived',updated_at=timezone('utc',now()) where id=v_id
        returning jsonb_build_object('id',id,'product_key',product_key,'name',name,'status',status,'credits',credits,'price_amount',price_amount,'currency',currency) into v_result;
    elsif p_action='upsert' then
      if coalesce(p_payload->>'product_key','') !~ '^[a-z][a-z0-9_.:-]{1,127}$' or coalesce(p_payload->>'name','')='' then raise exception 'invalid_credit_product' using errcode='22023'; end if;
      if v_id is null then
        insert into public.economy_credit_products(product_key,name,description,credits,price_amount,currency,status,metadata)
        values(p_payload->>'product_key',p_payload->>'name',nullif(p_payload->>'description',''),greatest(1,coalesce((p_payload->>'credits')::int,1)),greatest(0,coalesce((p_payload->>'price_amount')::bigint,0)),coalesce(p_payload->>'currency','IDR'),coalesce(p_payload->>'status','draft'),coalesce(p_payload->'metadata','{}'::jsonb))
        returning id into v_id;
      else
        update public.economy_credit_products set
          product_key=coalesce(p_payload->>'product_key',product_key),name=coalesce(p_payload->>'name',name),
          description=case when p_payload ? 'description' then nullif(p_payload->>'description','') else description end,
          credits=greatest(1,coalesce((p_payload->>'credits')::int,credits)),
          price_amount=greatest(0,coalesce((p_payload->>'price_amount')::bigint,price_amount)),
          currency=coalesce(p_payload->>'currency',currency),
          status=coalesce(p_payload->>'status',status),
          metadata=case when p_payload ? 'metadata' then p_payload->'metadata' else metadata end,
          updated_at=timezone('utc',now()) where id=v_id;
      end if;
      select jsonb_build_object('id',id,'product_key',product_key,'name',name,'status',status,'credits',credits,'price_amount',price_amount,'currency',currency) into v_result from public.economy_credit_products where id=v_id;
    else raise exception 'unsupported_master_action' using errcode='22023'; end if;

  elsif p_resource='world_templates' then
    if p_action not in ('publish','archive') or v_id is null then raise exception 'unsupported_master_action' using errcode='22023'; end if;
    if not exists(select 1 from public.world_templates where id=v_id and creator_user_id is null and creator_organization_id is null and source='platform_catalog' and catalog_key is not null) then
      raise exception 'platform_catalog_only' using errcode='42501';
    end if;
    update public.world_templates set status=case when p_action='publish' then 'published' else 'archived' end,updated_at=timezone('utc',now()) where id=v_id;
    select jsonb_build_object('id',id,'name',name,'slug',slug,'status',status,'catalog_key',catalog_key) into v_result from public.world_templates where id=v_id;

  else
    raise exception 'unsupported_master_resource' using errcode='22023';
  end if;

  if v_result is null then raise exception 'master_record_not_found' using errcode='P0002'; end if;
  insert into public.audit_logs(actor_user_id,action,resource_type,resource_id,outcome,risk_level,metadata)
  values(auth.uid(),'admin.master_data.'||p_action,p_resource,v_id,'success','high',jsonb_build_object('reason',p_reason,'resource',p_resource));
  return v_result;
end;
$function$


create or replace function public.get_admin_transaction_explorer(p_q text default null,p_order_kind text default null,p_order_status text default null,p_payment_status text default null,p_provider_status text default null,p_from timestamptz default null,p_to timestamptz default null,p_limit integer default 50,p_offset integer default 0)
returns jsonb language sql security invoker set search_path='' as $$ select private.get_admin_transaction_explorer__allpha_sd($1,$2,$3,$4,$5,$6,$7,$8,$9); $$;
create or replace function public.get_admin_transaction_detail(p_order_id uuid)
returns jsonb language sql security invoker set search_path='' as $$ select private.get_admin_transaction_detail__allpha_sd($1); $$;
create or replace function public.get_admin_domain_records(p_resource text,p_q text default null,p_status text default null,p_limit integer default 50,p_offset integer default 0)
returns jsonb language sql security invoker set search_path='' as $$ select private.get_admin_domain_records__allpha_sd($1,$2,$3,$4,$5); $$;
create or replace function public.mutate_admin_master_data(p_resource text,p_id uuid default null,p_action text default 'upsert',p_payload jsonb default '{}'::jsonb,p_reason text default null)
returns jsonb language sql security invoker set search_path='' as $$ select private.mutate_admin_master_data__allpha_sd($1,$2,$3,$4,$5); $$;
create or replace function public.execute_admin_domain_operation(p_operation text,p_resource text,p_id uuid,p_payload jsonb default '{}'::jsonb,p_reason text default null)
returns jsonb language sql security invoker set search_path='' as $$ select private.execute_admin_domain_operation__allpha_sd($1,$2,$3,$4,$5); $$;
revoke all on function public.get_admin_transaction_explorer(text,text,text,text,text,timestamptz,timestamptz,integer,integer) from public,anon;
revoke all on function public.get_admin_transaction_detail(uuid) from public,anon;
revoke all on function public.get_admin_domain_records(text,text,text,integer,integer) from public,anon;
revoke all on function public.mutate_admin_master_data(text,uuid,text,jsonb,text) from public,anon;
revoke all on function public.execute_admin_domain_operation(text,text,uuid,jsonb,text) from public,anon;
grant execute on function public.get_admin_transaction_explorer(text,text,text,text,text,timestamptz,timestamptz,integer,integer) to authenticated;
grant execute on function public.get_admin_transaction_detail(uuid) to authenticated;
grant execute on function public.get_admin_domain_records(text,text,text,integer,integer) to authenticated;
grant execute on function public.mutate_admin_master_data(text,uuid,text,jsonb,text) to authenticated;
grant execute on function public.execute_admin_domain_operation(text,text,uuid,jsonb,text) to authenticated;
grant execute on function private.get_admin_transaction_explorer__allpha_sd(text,text,text,text,text,timestamptz,timestamptz,integer,integer) to authenticated;
grant execute on function private.get_admin_transaction_detail__allpha_sd(uuid) to authenticated;
grant execute on function private.get_admin_domain_records__allpha_sd(text,text,text,integer,integer) to authenticated;
grant execute on function private.mutate_admin_master_data__allpha_sd(text,uuid,text,jsonb,text) to authenticated;
grant execute on function private.execute_admin_domain_operation__allpha_sd(text,text,uuid,jsonb,text) to authenticated;
revoke all on function private.admin_27c_require_manage() from public,anon;
revoke all on function private.admin_27c_require_read() from public,anon;
grant execute on function private.admin_27c_require_manage() to authenticated;
grant execute on function private.admin_27c_require_read() to authenticated;
