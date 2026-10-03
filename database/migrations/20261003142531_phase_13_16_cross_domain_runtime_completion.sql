-- Applied live as Supabase migration 20261003142531.
-- Cross-domain Agent Service -> Content Platform completion.
-- Generated content is requester-owned draft only; canonical moderation/publish remains separate.

alter table public.agent_service_requests
  add column if not exists generated_content_id uuid;

create unique index if not exists agent_service_requests_generated_content_uidx
  on public.agent_service_requests(generated_content_id)
  where generated_content_id is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'agent_service_requests_generated_content_id_fkey'
      and conrelid = 'public.agent_service_requests'::regclass
  ) then
    alter table public.agent_service_requests
      add constraint agent_service_requests_generated_content_id_fkey
      foreign key (generated_content_id) references public.content_items(id)
      on delete set null;
  end if;
end $$;

create or replace function public.complete_agent_service_request(
  p_request_id uuid,
  p_ai_gateway_request_id uuid,
  p_result_message_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user uuid := (select auth.uid());
  v_req public.agent_service_requests%rowtype;
  v_content public.content_items%rowtype;
  v_generated jsonb := coalesce(p_metadata->'generated_content', '{}'::jsonb);
  v_content_id uuid;
begin
  select * into v_req from public.agent_service_requests where id=p_request_id for update;
  if not found then raise exception 'SERVICE_REQUEST_NOT_FOUND'; end if;
  if v_req.requester_user_id<>v_user then raise exception 'SERVICE_REQUEST_FORBIDDEN'; end if;

  if v_req.status='completed' then
    return jsonb_build_object('id',v_req.id,'status','completed','reused',true,
      'generated_content_id',v_req.generated_content_id,'credit_cost',v_req.credit_cost);
  end if;
  if v_req.status not in ('reserved','processing') then raise exception 'SERVICE_REQUEST_NOT_SETTLEABLE'; end if;

  if jsonb_typeof(v_generated)='object'
     and coalesce(v_generated->>'enabled','false')='true'
     and nullif(trim(coalesce(v_generated->>'body','')),'') is not null then
    if v_req.generated_content_id is null then
      insert into public.content_items(
        owner_type,owner_id,content_type,title,body,excerpt,visibility,language_code,metadata
      )
      values(
        'user',v_req.requester_user_id,
        case when v_generated->>'content_type' in
          ('post','image','video','carousel','article','document','presentation','podcast','audio',
           'tutorial','infographic','research','ai_capsule')
          then v_generated->>'content_type' else 'article' end,
        nullif(trim(v_generated->>'title'),''),
        v_generated->>'body',
        nullif(trim(v_generated->>'excerpt'),''),
        case when v_generated->>'visibility' in ('public','connections','private','unlisted')
          then v_generated->>'visibility' else 'public' end,
        nullif(trim(v_generated->>'language_code'),''),
        coalesce(v_generated->'metadata','{}'::jsonb)
          || jsonb_build_object('origin','agent_service','service_request_id',v_req.id,
            'agent_id',v_req.agent_id,'skill_name',v_req.skill_name,
            'status_contract','draft_requires_moderation_before_publish')
      )
      returning * into v_content;

      v_content_id:=v_content.id;
      insert into public.content_events(content_id,actor_user_id,event_type,metadata)
      values(v_content.id,v_req.requester_user_id,'created',
        jsonb_build_object('source','agent_service','service_request_id',v_req.id,'agent_id',v_req.agent_id));
      update public.agent_service_requests set generated_content_id=v_content.id where id=v_req.id;
    else
      v_content_id:=v_req.generated_content_id;
    end if;
  end if;

  update public.agent_service_requests set status='completed',
    ai_gateway_request_id=p_ai_gateway_request_id,result_message_id=p_result_message_id,
    completed_at=timezone('utc',now()),updated_at=timezone('utc',now())
  where id=v_req.id;

  insert into public.ai_credit_ledger(
    user_id,entry_type,amount,status,source_type,source_id,counterparty_user_id,agent_id,
    service_request_id,metadata,posted_at
  )
  values(
    v_req.agent_owner_user_id,'reward',v_req.credit_cost,'posted','agent_service',v_req.id,
    v_req.requester_user_id,v_req.agent_id,v_req.id,
    coalesce(p_metadata,'{}')||jsonb_build_object('skill_name',v_req.skill_name,'phase','13',
      'generated_content_id',v_content_id),timezone('utc',now())
  )
  on conflict(service_request_id,entry_type) do nothing;

  if not exists(
    select 1 from public.social_notifications
    where recipient_user_id=v_req.agent_owner_user_id and notification_type='agent_service_reward'
      and target_type='agent_service_request' and target_id=v_req.id
  ) then
    insert into public.social_notifications(
      recipient_user_id,actor_type,actor_id,notification_type,target_type,target_id,payload
    )
    values(
      v_req.agent_owner_user_id,'agent',v_req.agent_id,'agent_service_reward','agent_service_request',v_req.id,
      jsonb_build_object('service_request_id',v_req.id,'skill_name',v_req.skill_name,
        'credit_reward',v_req.credit_cost,'requester_user_id',v_req.requester_user_id,
        'generated_content_id',v_content_id)
    );
  end if;

  return jsonb_build_object('id',v_req.id,'status','completed',
    'agent_owner_user_id',v_req.agent_owner_user_id,'credit_cost',v_req.credit_cost,
    'generated_content_id',v_content_id);
end
$function$;

revoke execute on function public.complete_agent_service_request(uuid,uuid,uuid,jsonb) from public,anon;
grant execute on function public.complete_agent_service_request(uuid,uuid,uuid,jsonb) to authenticated;

comment on function public.complete_agent_service_request(uuid,uuid,uuid,jsonb)
is 'Canonical Agent Service settlement. Optional generated_content metadata creates requester-owned draft Content; publish remains behind canonical moderation.';
