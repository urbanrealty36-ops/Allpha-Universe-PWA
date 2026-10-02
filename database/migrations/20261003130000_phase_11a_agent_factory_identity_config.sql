-- Allpha Universe — Agent Factory identity metadata
create or replace function public.create_agent_identity(
  p_name text, p_handle text default null, p_description text default null,
  p_organization_id uuid default null,
  p_visibility public.visibility_level default 'public'::public.visibility_level,
  p_persona jsonb default '{}'::jsonb, p_tone jsonb default '{}'::jsonb,
  p_interests jsonb default '[]'::jsonb, p_goals jsonb default '[]'::jsonb,
  p_boundaries jsonb default '{}'::jsonb, p_autonomy_level text default 'recommend',
  p_budget_currency text default 'USD', p_max_spend_per_action numeric default null,
  p_daily_spend_limit numeric default null, p_monthly_spend_limit numeric default null,
  p_requires_approval_above numeric default null, p_factory_config jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare v_agent_id uuid;
begin
  if (select auth.uid()) is null then raise exception using errcode='42501',message='Authentication required'; end if;
  if p_name is null or length(btrim(p_name))=0 then raise exception using errcode='22023',message='Agent name is required'; end if;
  if p_autonomy_level not in ('recommend','assist','conditional','autonomous') then raise exception using errcode='22023',message='Invalid autonomy level'; end if;
  if p_budget_currency !~ '^[A-Z]{3}$' then raise exception using errcode='22023',message='Invalid budget currency'; end if;
  if jsonb_typeof(p_factory_config) <> 'object' then raise exception using errcode='22023',message='Invalid factory configuration'; end if;
  if p_organization_id is not null and not exists (
    select 1 from public.organizations o
    where o.id=p_organization_id and (o.owner_user_id=(select auth.uid()) or o.id in (select private.user_organization_ids()))
  ) then raise exception using errcode='42501',message='Organization access denied'; end if;

  insert into public.agents(owner_user_id,organization_id,name,handle,description,visibility)
  values((select auth.uid()),p_organization_id,btrim(p_name),nullif(btrim(p_handle),''),p_description,p_visibility)
  returning id into v_agent_id;

  insert into public.agent_identities(agent_id,metadata)
  values(v_agent_id,jsonb_build_object('factory_config',p_factory_config,'factory_version',1));

  insert into public.agent_personas(agent_id,persona,tone,interests,goals,boundaries)
  values(v_agent_id,p_persona,p_tone,p_interests,p_goals,p_boundaries);

  insert into public.agent_passports(agent_id,verification_status,credentials,capability_summary,reputation_summary,delegation_summary,history_summary,issued_at)
  values(v_agent_id,'unverified','[]'::jsonb,'{}'::jsonb,'{}'::jsonb,'{}'::jsonb,'{}'::jsonb,null);

  insert into public.agent_policies(agent_id,name,policy_version,rules,autonomy_level,spending_limit,rate_limit,enabled)
  values(v_agent_id,'owner authority policy',1,jsonb_build_object('human_approval_required_for_high_risk',true),p_autonomy_level,p_max_spend_per_action,'{}'::jsonb,true);

  insert into public.agent_budgets(agent_id,currency,max_spend_per_action,daily_spend_limit,monthly_spend_limit,requires_approval_above)
  values(v_agent_id,p_budget_currency,p_max_spend_per_action,p_daily_spend_limit,p_monthly_spend_limit,p_requires_approval_above);

  return jsonb_build_object('agent_id',v_agent_id);
end;
$function$;

revoke all on function public.create_agent_identity(text,text,text,uuid,public.visibility_level,jsonb,jsonb,jsonb,jsonb,jsonb,text,text,numeric,numeric,numeric,numeric,jsonb) from public;
grant execute on function public.create_agent_identity(text,text,text,uuid,public.visibility_level,jsonb,jsonb,jsonb,jsonb,jsonb,text,text,numeric,numeric,numeric,numeric,jsonb) to authenticated;
