-- Phase 07 retention and audit hardening.
create or replace function private.audit_memory_knowledge_mutation()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_row jsonb; v_agent_id uuid; v_resource_id uuid; v_owner uuid;
begin
  v_row:=case when TG_OP='DELETE' then to_jsonb(OLD) else to_jsonb(NEW) end;
  v_resource_id:=nullif(v_row->>'id','')::uuid;
  v_agent_id:=nullif(v_row->>'agent_id','')::uuid;
  v_owner:=nullif(v_row->>'owner_user_id','')::uuid;
  insert into public.audit_logs(actor_user_id,actor_agent_id,action,resource_type,resource_id,outcome,metadata)
  values(coalesce(v_owner,(select auth.uid())),v_agent_id,lower(TG_OP),TG_TABLE_NAME,v_resource_id,'success',jsonb_build_object('phase','07','source','database_trigger'));
  return case when TG_OP='DELETE' then OLD else NEW end;
end;
$$;
revoke execute on function private.audit_memory_knowledge_mutation() from public,anon,authenticated;
drop trigger if exists audit_agent_memory_mutation on public.agent_memory;
create trigger audit_agent_memory_mutation after insert or update or delete on public.agent_memory for each row execute function private.audit_memory_knowledge_mutation();
drop trigger if exists audit_knowledge_items_mutation on public.knowledge_items;
create trigger audit_knowledge_items_mutation after insert or update or delete on public.knowledge_items for each row execute function private.audit_memory_knowledge_mutation();

create or replace function public.expire_agent_memory()
returns integer language plpgsql security invoker set search_path=''
as $$
declare v_count integer;
begin
  update public.agent_memory set status='expired',updated_at=timezone('utc',now())
  where owner_user_id=(select auth.uid()) and status='active' and expires_at is not null and expires_at<=timezone('utc',now());
  get diagnostics v_count=row_count; return v_count;
end;
$$;
create or replace function public.expire_agent_knowledge()
returns integer language plpgsql security invoker set search_path=''
as $$
declare v_count integer;
begin
  update public.knowledge_items set status='archived',updated_at=timezone('utc',now())
  where owner_user_id=(select auth.uid()) and status='active'
    and (retention_policy->>'expires_at') is not null
    and ((retention_policy->>'expires_at')::timestamptz)<=timezone('utc',now());
  get diagnostics v_count=row_count; return v_count;
end;
$$;
revoke execute on function public.expire_agent_memory() from public,anon;
revoke execute on function public.expire_agent_knowledge() from public,anon;
grant execute on function public.expire_agent_memory() to authenticated;
grant execute on function public.expire_agent_knowledge() to authenticated;