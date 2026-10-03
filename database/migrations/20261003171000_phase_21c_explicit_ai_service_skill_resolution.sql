create or replace function public.resolve_public_agent_service(
  p_agent_id uuid,
  p_skill_name text
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_uid uuid := auth.uid();
  v_agent public.agents%rowtype;
  v_skill public.agent_skills%rowtype;
  v_catalog public.agent_skill_catalog%rowtype;
  v_cost integer;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_agent_id is null or length(trim(coalesce(p_skill_name,'')))=0 then raise exception 'SKILL_REQUIRED'; end if;

  select * into v_agent from public.agents
  where id=p_agent_id and status='active' and visibility='public';
  if not found then raise exception 'AGENT_NOT_AVAILABLE'; end if;
  if v_agent.owner_user_id=v_uid then raise exception 'SELF_AGENT_SERVICE_NOT_ALLOWED'; end if;

  if exists(select 1 from public.social_blocks b where b.blocker_type='user' and b.blocker_id=v_uid and b.blocked_type='user' and b.blocked_id=v_agent.owner_user_id)
     or exists(select 1 from public.social_blocks b where b.blocker_type='user' and b.blocker_id=v_agent.owner_user_id and b.blocked_type='user' and b.blocked_id=v_uid)
  then raise exception 'COMMUNICATION_BLOCKED'; end if;

  select * into v_skill from public.agent_skills
  where agent_id=p_agent_id and enabled=true and lower(name)=lower(trim(p_skill_name)) limit 1;
  if not found then raise exception 'AGENT_SKILL_NOT_AVAILABLE'; end if;

  select * into v_catalog from public.agent_skill_catalog
  where lower(skill_key)=lower(v_skill.name) limit 1;

  if not exists(select 1 from public.agent_capabilities where agent_id=p_agent_id and capability='ai.generate' and enabled=true)
  then raise exception 'AGENT_GENERATION_CAPABILITY_NOT_GRANTED'; end if;

  v_cost := case
    when jsonb_typeof(v_skill.configuration)='object'
      and (v_skill.configuration->>'credit_cost') ~ '^[0-9]+$'
      and (v_skill.configuration->>'credit_cost')::integer between 1 and 10000
      then (v_skill.configuration->>'credit_cost')::integer
    else 1 end;

  return jsonb_build_object(
    'agent_id',v_agent.id,'agent_name',v_agent.name,'agent_handle',v_agent.handle,
    'skill_id',v_skill.id,'skill_name',v_skill.name,'skill_description',v_skill.description,
    'skill_category',v_skill.category,'skill_version',v_skill.version,
    'skill_level',v_skill.skill_level,'quality_score',v_skill.quality_score,
    'skill_configuration',coalesce(v_skill.configuration,'{}'::jsonb),
    'skill_risk_level',coalesce(v_catalog.risk_level,'low'),'credit_cost',v_cost,
    'generation_capability','ai.generate'
  );
end
$function$;

revoke all on function public.resolve_public_agent_service(uuid,text) from public;
revoke all on function public.resolve_public_agent_service(uuid,text) from anon;
grant execute on function public.resolve_public_agent_service(uuid,text) to authenticated;
