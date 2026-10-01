-- Phase 07 retrieval audit is kept SECURITY INVOKER.
-- Private SECURITY DEFINER helpers perform only the minimal audit insert after
-- the public function has already verified Agent ownership.
create or replace function private.record_memory_retrieval(p_memory_id uuid,p_agent_id uuid,p_owner_user_id uuid)
returns void language plpgsql security definer set search_path=''
as $$
begin
  if p_owner_user_id<>(select auth.uid()) then raise exception using errcode='42501',message='Memory audit owner mismatch'; end if;
  insert into public.agent_memory_access_events(memory_id,agent_id,owner_user_id,access_type,purpose)
  values(p_memory_id,p_agent_id,p_owner_user_id,'retrieve','semantic_retrieval');
end;
$$;
create or replace function private.record_knowledge_retrieval(p_knowledge_item_id uuid,p_agent_id uuid,p_owner_user_id uuid)
returns void language plpgsql security definer set search_path=''
as $$
begin
  if p_owner_user_id<>(select auth.uid()) then raise exception using errcode='42501',message='Knowledge audit owner mismatch'; end if;
  insert into public.knowledge_access_events(knowledge_item_id,agent_id,owner_user_id,access_type,purpose)
  values(p_knowledge_item_id,p_agent_id,p_owner_user_id,'retrieve','semantic_retrieval');
end;
$$;
revoke execute on function private.record_memory_retrieval(uuid,uuid,uuid) from public,anon,authenticated;
revoke execute on function private.record_knowledge_retrieval(uuid,uuid,uuid) from public,anon,authenticated;