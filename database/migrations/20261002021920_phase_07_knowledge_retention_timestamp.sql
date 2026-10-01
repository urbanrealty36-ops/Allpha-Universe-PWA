alter table public.knowledge_items add column if not exists retention_expires_at timestamptz;
create index if not exists knowledge_items_retention_expires_idx on public.knowledge_items(retention_expires_at) where status='active';
create or replace function public.create_knowledge_item(p_agent_id uuid,p_title text,p_content text,p_source_uri text default null,p_provenance jsonb default '{}'::jsonb,p_visibility public.visibility_level default 'private',p_retention_policy jsonb default '{}'::jsonb)
returns jsonb language plpgsql security invoker set search_path=''
as $$
declare v_id uuid; v_expires timestamptz;
begin
  if (select auth.uid()) is null then raise exception using errcode='42501',message='Authentication required'; end if;
  if p_content is null or length(btrim(p_content))=0 then raise exception using errcode='22023',message='Knowledge content is required'; end if;
  if p_agent_id is not null and not exists(select 1 from public.agents a where a.id=p_agent_id and a.owner_user_id=(select auth.uid())) then raise exception using errcode='42501',message='Agent ownership denied'; end if;
  if (p_retention_policy ? 'expires_at') then
    begin v_expires := (p_retention_policy->>'expires_at')::timestamptz;
    exception when others then raise exception using errcode='22023',message='Invalid retention expires_at'; end;
  end if;
  insert into public.knowledge_items(owner_user_id,agent_id,title,content,source_uri,provenance,visibility,retention_policy,retention_expires_at,status)
  values((select auth.uid()),p_agent_id,nullif(btrim(p_title),''),p_content,p_source_uri,p_provenance,p_visibility,p_retention_policy,v_expires,'active')
  returning id into v_id;
  return jsonb_build_object('knowledge_item_id',v_id);
end;
$$;
create or replace function public.expire_agent_knowledge()
returns integer language plpgsql security invoker set search_path=''
as $$
declare v_count integer;
begin
  update public.knowledge_items set status='archived',updated_at=timezone('utc',now())
  where owner_user_id=(select auth.uid()) and status='active' and retention_expires_at is not null and retention_expires_at<=timezone('utc',now());
  get diagnostics v_count=row_count; return v_count;
end;
$$;