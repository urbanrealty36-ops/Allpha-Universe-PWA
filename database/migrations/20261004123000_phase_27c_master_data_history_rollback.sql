-- Phase 27C Master Data History + Rollback
create or replace function private.mutate_admin_master_data__allpha_sd(
  p_resource text,p_id uuid default null,p_action text default 'upsert',
  p_payload jsonb default '{}'::jsonb,p_reason text default null)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_id uuid:=p_id; v_before jsonb; v_result jsonb;
begin
  perform private.admin_27c_require_manage();
  if nullif(trim(coalesce(p_reason,'')),'') is null then raise exception 'admin_reason_required' using errcode='22023'; end if;
  if p_resource='billing_plans' then
    if v_id is not null then select jsonb_build_object('id',id,'plan_key',plan_key,'name',name,'description',description,'interval_unit',interval_unit,'interval_count',interval_count,'price_amount',price_amount,'currency',currency,'included_credits',included_credits,'status',status,'metadata',metadata) into v_before from public.billing_plans where id=v_id; end if;
    if p_action='archive' then if v_id is null then raise exception 'id_required' using errcode='22023'; end if; update public.billing_plans set status='archived',updated_at=timezone('utc',now()) where id=v_id;
    elsif p_action='upsert' then
      if coalesce(p_payload->>'plan_key','') !~ '^[a-z][a-z0-9_.:-]{1,127}$' or coalesce(p_payload->>'name','')='' then raise exception 'invalid_billing_plan' using errcode='22023'; end if;
      if v_id is null then
        insert into public.billing_plans(plan_key,name,description,interval_unit,interval_count,price_amount,currency,included_credits,status,metadata)
        values(p_payload->>'plan_key',p_payload->>'name',nullif(p_payload->>'description',''),coalesce(p_payload->>'interval_unit','month'),greatest(1,coalesce((p_payload->>'interval_count')::int,1)),greatest(0,coalesce((p_payload->>'price_amount')::bigint,0)),coalesce(p_payload->>'currency','IDR'),greatest(0,coalesce((p_payload->>'included_credits')::int,0)),coalesce(p_payload->>'status','draft'),coalesce(p_payload->'metadata','{}'::jsonb)) returning id into v_id;
      else
        update public.billing_plans set plan_key=coalesce(p_payload->>'plan_key',plan_key),name=coalesce(p_payload->>'name',name),description=case when p_payload ? 'description' then nullif(p_payload->>'description','') else description end,interval_unit=coalesce(p_payload->>'interval_unit',interval_unit),interval_count=greatest(1,coalesce((p_payload->>'interval_count')::int,interval_count)),price_amount=greatest(0,coalesce((p_payload->>'price_amount')::bigint,price_amount)),currency=coalesce(p_payload->>'currency',currency),included_credits=greatest(0,coalesce((p_payload->>'included_credits')::int,included_credits)),status=coalesce(p_payload->>'status',status),metadata=case when p_payload ? 'metadata' then p_payload->'metadata' else metadata end,updated_at=timezone('utc',now()) where id=v_id;
      end if;
    else raise exception 'unsupported_master_action' using errcode='22023'; end if;
    select jsonb_build_object('id',id,'plan_key',plan_key,'name',name,'description',description,'interval_unit',interval_unit,'interval_count',interval_count,'price_amount',price_amount,'currency',currency,'included_credits',included_credits,'status',status,'metadata',metadata) into v_result from public.billing_plans where id=v_id;
  elsif p_resource='credit_products' then
    if v_id is not null then select jsonb_build_object('id',id,'product_key',product_key,'name',name,'description',description,'credits',credits,'price_amount',price_amount,'currency',currency,'status',status,'metadata',metadata) into v_before from public.economy_credit_products where id=v_id; end if;
    if p_action='archive' then if v_id is null then raise exception 'id_required' using errcode='22023'; end if; update public.economy_credit_products set status='archived',updated_at=timezone('utc',now()) where id=v_id;
    elsif p_action='upsert' then
      if coalesce(p_payload->>'product_key','') !~ '^[a-z][a-z0-9_.:-]{1,127}$' or coalesce(p_payload->>'name','')='' then raise exception 'invalid_credit_product' using errcode='22023'; end if;
      if v_id is null then
        insert into public.economy_credit_products(product_key,name,description,credits,price_amount,currency,status,metadata)
        values(p_payload->>'product_key',p_payload->>'name',nullif(p_payload->>'description',''),greatest(1,coalesce((p_payload->>'credits')::int,1)),greatest(0,coalesce((p_payload->>'price_amount')::bigint,0)),coalesce(p_payload->>'currency','IDR'),coalesce(p_payload->>'status','draft'),coalesce(p_payload->'metadata','{}'::jsonb)) returning id into v_id;
      else
        update public.economy_credit_products set product_key=coalesce(p_payload->>'product_key',product_key),name=coalesce(p_payload->>'name',name),description=case when p_payload ? 'description' then nullif(p_payload->>'description','') else description end,credits=greatest(1,coalesce((p_payload->>'credits')::int,credits)),price_amount=greatest(0,coalesce((p_payload->>'price_amount')::bigint,price_amount)),currency=coalesce(p_payload->>'currency',currency),status=coalesce(p_payload->>'status',status),metadata=case when p_payload ? 'metadata' then p_payload->'metadata' else metadata end,updated_at=timezone('utc',now()) where id=v_id;
      end if;
    else raise exception 'unsupported_master_action' using errcode='22023'; end if;
    select jsonb_build_object('id',id,'product_key',product_key,'name',name,'description',description,'credits',credits,'price_amount',price_amount,'currency',currency,'status',status,'metadata',metadata) into v_result from public.economy_credit_products where id=v_id;
  elsif p_resource='world_templates' then
    if p_action not in ('publish','archive') or v_id is null then raise exception 'unsupported_master_action' using errcode='22023'; end if;
    if not exists(select 1 from public.world_templates where id=v_id and creator_user_id is null and creator_organization_id is null and source='platform_catalog' and catalog_key is not null) then raise exception 'platform_catalog_only' using errcode='42501'; end if;
    select jsonb_build_object('id',id,'name',name,'slug',slug,'description',description,'category',category,'compatibility',compatibility,'status',status,'moderation_status',moderation_status,'source',source,'catalog_key',catalog_key,'catalog_order',catalog_order) into v_before from public.world_templates where id=v_id;
    update public.world_templates set status=case when p_action='publish' then 'published' else 'archived' end,updated_at=timezone('utc',now()) where id=v_id;
    select jsonb_build_object('id',id,'name',name,'slug',slug,'description',description,'category',category,'compatibility',compatibility,'status',status,'moderation_status',moderation_status,'source',source,'catalog_key',catalog_key,'catalog_order',catalog_order) into v_result from public.world_templates where id=v_id;
  else raise exception 'unsupported_master_resource' using errcode='22023'; end if;
  if v_result is null then raise exception 'master_record_not_found' using errcode='P0002'; end if;
  insert into public.audit_logs(actor_user_id,action,resource_type,resource_id,outcome,risk_level,metadata) values(auth.uid(),'admin.master_data.'||p_action,p_resource,v_id,'success','high',jsonb_build_object('reason',p_reason,'before',v_before,'after',v_result));
  return v_result;
end;
$$;

create or replace function private.get_admin_master_data_history__allpha_sd(p_resource text,p_id uuid,p_limit integer default 50)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_items jsonb;
begin
  perform private.admin_27c_require_read();
  if p_resource not in ('billing_plans','credit_products','world_templates') then raise exception 'unsupported_master_resource' using errcode='22023'; end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) into v_items from (select a.id,a.action,a.outcome,a.risk_level,a.created_at,a.metadata from public.audit_logs a where a.resource_type=p_resource and a.resource_id=p_id and a.action like 'admin.master_data.%' order by a.created_at desc limit greatest(1,least(coalesce(p_limit,50),100))) x;
  return v_items;
end;
$$;

create or replace function private.rollback_admin_master_data__allpha_sd(p_resource text,p_id uuid,p_audit_id uuid,p_reason text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_meta jsonb; v_before jsonb; v_result jsonb;
begin
  perform private.admin_27c_require_manage();
  if nullif(trim(coalesce(p_reason,'')),'') is null then raise exception 'admin_reason_required' using errcode='22023'; end if;
  select metadata into v_meta from public.audit_logs where id=p_audit_id and resource_type=p_resource and resource_id=p_id and action like 'admin.master_data.%' and outcome='success';
  if v_meta is null then raise exception 'master_history_not_found' using errcode='P0002'; end if;
  v_before:=v_meta->'before';
  if v_before is null or v_before='null'::jsonb then raise exception 'create_rollback_requires_explicit_delete_policy' using errcode='22023'; end if;
  if p_resource='billing_plans' then
    update public.billing_plans set plan_key=v_before->>'plan_key',name=v_before->>'name',description=v_before->>'description',interval_unit=v_before->>'interval_unit',interval_count=(v_before->>'interval_count')::int,price_amount=(v_before->>'price_amount')::bigint,currency=v_before->>'currency',included_credits=(v_before->>'included_credits')::int,status=v_before->>'status',metadata=coalesce(v_before->'metadata','{}'::jsonb),updated_at=timezone('utc',now()) where id=p_id;
    select jsonb_build_object('id',id,'plan_key',plan_key,'name',name,'status',status,'price_amount',price_amount,'currency',currency,'included_credits',included_credits) into v_result from public.billing_plans where id=p_id;
  elsif p_resource='credit_products' then
    update public.economy_credit_products set product_key=v_before->>'product_key',name=v_before->>'name',description=v_before->>'description',credits=(v_before->>'credits')::int,price_amount=(v_before->>'price_amount')::bigint,currency=v_before->>'currency',status=v_before->>'status',metadata=coalesce(v_before->'metadata','{}'::jsonb),updated_at=timezone('utc',now()) where id=p_id;
    select jsonb_build_object('id',id,'product_key',product_key,'name',name,'status',status,'credits',credits,'price_amount',price_amount,'currency',currency) into v_result from public.economy_credit_products where id=p_id;
  elsif p_resource='world_templates' then
    update public.world_templates set name=v_before->>'name',slug=v_before->>'slug',description=v_before->>'description',category=v_before->>'category',compatibility=coalesce(v_before->'compatibility','{}'::jsonb),status=v_before->>'status',moderation_status=v_before->>'moderation_status',updated_at=timezone('utc',now()) where id=p_id and creator_user_id is null and creator_organization_id is null and source='platform_catalog' and catalog_key is not null;
    select jsonb_build_object('id',id,'name',name,'slug',slug,'status',status,'catalog_key',catalog_key) into v_result from public.world_templates where id=p_id;
  else raise exception 'unsupported_master_resource' using errcode='22023'; end if;
  if v_result is null then raise exception 'master_record_not_found' using errcode='P0002'; end if;
  insert into public.audit_logs(actor_user_id,action,resource_type,resource_id,outcome,risk_level,metadata) values(auth.uid(),'admin.master_data.rollback',p_resource,p_id,'success','high',jsonb_build_object('reason',p_reason,'source_audit_id',p_audit_id,'restored',v_result));
  return v_result;
end;
$$;

create or replace function public.get_admin_master_data_history(p_resource text,p_id uuid,p_limit integer default 50)
returns jsonb language sql security invoker set search_path='' as $$ select private.get_admin_master_data_history__allpha_sd($1,$2,$3); $$;
create or replace function public.rollback_admin_master_data(p_resource text,p_id uuid,p_audit_id uuid,p_reason text)
returns jsonb language sql security invoker set search_path='' as $$ select private.rollback_admin_master_data__allpha_sd($1,$2,$3,$4); $$;
revoke all on function public.get_admin_master_data_history(text,uuid,integer) from public,anon;
revoke all on function public.rollback_admin_master_data(text,uuid,uuid,text) from public,anon;
grant execute on function public.get_admin_master_data_history(text,uuid,integer) to authenticated;
grant execute on function public.rollback_admin_master_data(text,uuid,uuid,text) to authenticated;
revoke all on function private.get_admin_master_data_history__allpha_sd(text,uuid,integer) from public,anon;
revoke all on function private.rollback_admin_master_data__allpha_sd(text,uuid,uuid,text) from public,anon;
grant execute on function private.get_admin_master_data_history__allpha_sd(text,uuid,integer) to authenticated;
grant execute on function private.rollback_admin_master_data__allpha_sd(text,uuid,uuid,text) to authenticated;
