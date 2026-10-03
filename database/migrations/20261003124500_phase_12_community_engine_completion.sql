-- Phase 12 Community Engine completion
-- Adds the missing topic, World linkage, and moderation decision API boundaries.
-- No seed/demo business data.

create or replace function public.create_community_topic(
  p_community_id uuid,
  p_name text,
  p_slug text,
  p_description text default null,
  p_interest_id uuid default null
) returns jsonb
language plpgsql security definer set search_path to ''
as $function$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if not exists (
    select 1 from public.community_memberships m
    where m.community_id=p_community_id and m.subject_type='user' and m.subject_id=v_uid
      and m.status='active' and m.role in ('owner','admin','moderator')
  ) then raise exception 'community_moderation_denied'; end if;
  if not exists (select 1 from public.communities c where c.id=p_community_id and c.status='active') then raise exception 'community_not_found'; end if;
  if p_interest_id is not null and not exists (select 1 from public.interest_nodes i where i.id=p_interest_id) then raise exception 'interest_not_found'; end if;
  insert into public.community_topics(community_id,interest_id,name,slug,description,status,created_by_user_id)
  values(p_community_id,p_interest_id,p_name,p_slug,p_description,'active',v_uid) returning id into v_id;
  insert into public.community_activity_events(community_id,actor_type,actor_id,event_type,target_type,target_id)
  values(p_community_id,'user',v_uid,'topic_created','topic',v_id);
  return jsonb_build_object('id',v_id);
end $function$;

create or replace function public.link_community_topic(
  p_community_id uuid,
  p_topic_id uuid
) returns jsonb
language plpgsql security definer set search_path to ''
as $function$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if not exists (
    select 1 from public.community_memberships m
    where m.community_id=p_community_id and m.subject_type='user' and m.subject_id=v_uid
      and m.status='active' and m.role in ('owner','admin','moderator')
  ) then raise exception 'community_moderation_denied'; end if;
  if not exists (select 1 from public.community_topics t where t.id=p_topic_id and t.community_id=p_community_id and t.status='active') then raise exception 'community_topic_not_found'; end if;
  insert into public.community_topic_links(community_id,topic_id) values(p_community_id,p_topic_id) on conflict do nothing;
  return jsonb_build_object('community_id',p_community_id,'topic_id',p_topic_id);
end $function$;

create or replace function public.link_community_to_world(
  p_world_id uuid,
  p_community_id uuid,
  p_placement text default 'community'
) returns jsonb
language plpgsql security definer set search_path to ''
as $function$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  perform public.link_universe_world_community(p_world_id,p_community_id,p_placement);
  return jsonb_build_object('world_id',p_world_id,'community_id',p_community_id,'placement',p_placement);
end $function$;

create or replace function public.decide_community_moderation_case(
  p_case_id uuid,
  p_decision text,
  p_notes text default null
) returns jsonb
language plpgsql security definer set search_path to ''
as $function$
declare v_uid uuid := auth.uid(); v_case record;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  select mc.*, r.reporter_user_id into v_case
  from public.community_moderation_cases mc
  left join public.community_reports r on r.id=mc.report_id
  where mc.id=p_case_id;
  if not found then raise exception 'moderation_case_not_found'; end if;
  if not exists (
    select 1 from public.community_memberships m
    where m.community_id=v_case.community_id and m.subject_type='user' and m.subject_id=v_uid
      and m.status='active' and m.role in ('owner','admin','moderator')
  ) then raise exception 'community_moderation_denied'; end if;
  if p_decision not in ('dismissed','resolved','remove','suspend_member','ban_member','escalated') then raise exception 'invalid_moderation_decision'; end if;

  if p_decision='remove' then
    if v_case.target_type='post' then
      update public.community_posts set status='removed',updated_at=timezone('utc',now()) where id=v_case.target_id and community_id=v_case.community_id;
    elsif v_case.target_type='comment' then
      update public.community_comments set status='removed',updated_at=timezone('utc',now()) where id=v_case.target_id and community_id=v_case.community_id;
    elsif v_case.target_type='event' then
      update public.community_events set status='cancelled',updated_at=timezone('utc',now()) where id=v_case.target_id and community_id=v_case.community_id;
    end if;
  elsif p_decision in ('suspend_member','ban_member') and v_case.target_type='member' then
    update public.community_memberships
      set status=case when p_decision='ban_member' then 'banned' else 'suspended' end,
          updated_at=timezone('utc',now())
      where id=v_case.target_id and community_id=v_case.community_id;
  end if;

  update public.community_moderation_cases
    set decision=p_decision,decided_by_user_id=v_uid,notes=p_notes,decided_at=timezone('utc',now())
    where id=p_case_id;
  update public.community_reports
    set status=case when p_decision='dismissed' then 'dismissed' else 'resolved' end,resolved_at=timezone('utc',now())
    where id=v_case.report_id;

  insert into public.community_activity_events(community_id,actor_type,actor_id,event_type,target_type,target_id,metadata)
  values(v_case.community_id,'user',v_uid,'moderation_decision',v_case.target_type,v_case.target_id,
         jsonb_build_object('case_id',p_case_id,'decision',p_decision));
  return jsonb_build_object('id',p_case_id,'decision',p_decision);
end $function$;

revoke all on function public.create_community_topic(uuid,text,text,text,uuid) from public,anon;
grant execute on function public.create_community_topic(uuid,text,text,text,uuid) to authenticated;
revoke all on function public.link_community_topic(uuid,uuid) from public,anon;
grant execute on function public.link_community_topic(uuid,uuid) to authenticated;
revoke all on function public.link_community_to_world(uuid,uuid,text) from public,anon;
grant execute on function public.link_community_to_world(uuid,uuid,text) to authenticated;
revoke all on function public.decide_community_moderation_case(uuid,text,text) from public,anon;
grant execute on function public.decide_community_moderation_case(uuid,text,text) to authenticated;
