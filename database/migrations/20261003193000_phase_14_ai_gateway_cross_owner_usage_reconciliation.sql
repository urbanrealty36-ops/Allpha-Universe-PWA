-- Phase 14 AI Gateway: cross-owner Agent Service usage telemetry reconciliation.
-- Preserves the single AI Gateway while allowing an authorized requester to
-- record usage for a foreign Agent only through a canonical Agent Service command.

create or replace function public.record_ai_usage_event(
  p_request_id uuid,
  p_event_type text,
  p_provider_id uuid default null,
  p_model_id uuid default null,
  p_agent_id uuid default null,
  p_input_tokens integer default null,
  p_output_tokens integer default null,
  p_total_tokens integer default null,
  p_estimated_cost_usd numeric default null,
  p_latency_ms integer default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.ai_usage_events
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v public.ai_usage_events;
  v_request public.ai_gateway_requests;
  v_service_authorized boolean := false;
begin
  if p_request_id is not null then
    select * into v_request
      from public.ai_gateway_requests r
     where r.id = p_request_id
       and r.user_id = auth.uid();

    if v_request.id is null then
      raise exception 'AI_GATEWAY_REQUEST_NOT_OWNED';
    end if;
  end if;

  if p_agent_id is not null and not exists (
    select 1 from public.agents a
     where a.id = p_agent_id
       and a.owner_user_id = auth.uid()
  ) then
    if v_request.id is not null and (v_request.metadata ? 'command_id') then
      v_service_authorized := exists (
        select 1
          from public.agent_commands c
          join public.agent_service_requests sr on sr.id = c.service_request_id
         where c.id = (v_request.metadata ->> 'command_id')::uuid
           and c.agent_id = p_agent_id
           and sr.requester_user_id = auth.uid()
           and sr.status in ('reserved','processing','completed')
      );
    end if;

    if not v_service_authorized then
      raise exception 'AI_GATEWAY_AGENT_NOT_OWNED';
    end if;
  end if;

  insert into public.ai_usage_events(
    request_id,user_id,agent_id,provider_id,model_id,event_type,
    input_tokens,output_tokens,total_tokens,estimated_cost_usd,latency_ms,metadata
  )
  values(
    p_request_id,auth.uid(),p_agent_id,p_provider_id,p_model_id,p_event_type,
    p_input_tokens,p_output_tokens,p_total_tokens,p_estimated_cost_usd,p_latency_ms,
    coalesce(p_metadata,'{}'::jsonb)
  )
  returning * into v;

  return v;
end;
$function$;

revoke execute on function public.record_ai_usage_event(
  uuid,text,uuid,uuid,uuid,integer,integer,integer,numeric,integer,jsonb
) from anon;
grant execute on function public.record_ai_usage_event(
  uuid,text,uuid,uuid,uuid,integer,integer,integer,numeric,integer,jsonb
) to authenticated;
