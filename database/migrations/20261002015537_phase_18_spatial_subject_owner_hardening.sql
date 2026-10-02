-- Phase 18 spatial subject hardening
create or replace function private.spatial_subject_in_world(p_world_id uuid,p_subject_type text,p_subject_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
select exists(
  select 1 from public.universe_world_memberships m
  where m.world_id=p_world_id and m.subject_type=p_subject_type and m.subject_id=p_subject_id and m.status='active'
)
or (
  p_subject_type='agent'
  and exists(
    select 1 from public.universe_world_agents wa
    where wa.world_id=p_world_id and wa.agent_id=p_subject_id and wa.status='active'
  )
)
or exists(
  select 1 from public.universe_worlds w
  where w.id=p_world_id
    and private.universe_subject_owned(w.owner_type,w.owner_id)
    and (
      (p_subject_type='user' and p_subject_id=auth.uid())
      or (p_subject_type='agent' and exists(select 1 from public.agents a where a.id=p_subject_id and a.owner_user_id=auth.uid()))
    )
)
$$;
revoke all on function private.spatial_subject_in_world(uuid,text,uuid) from public,anon,authenticated;
