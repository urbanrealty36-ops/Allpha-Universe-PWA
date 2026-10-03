-- Phase 11 Feed runtime reconciliation
-- Restores the canonical Feed RPC boundary recorded in Supabase migration history.
-- No business seed data is created.

create or replace function public.get_feed(
  p_surface text default 'home',
  p_limit integer default 20,
  p_offset integer default 0,
  p_query text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare v_user uuid := auth.uid(); v_request uuid := gen_random_uuid(); v_data jsonb;
begin
  if v_user is null then raise exception 'authentication required' using errcode='42501'; end if;
  if p_surface not in ('home','following','for_you','reels','explore','live_now','agent','knowledge','world','context') then raise exception 'unsupported feed surface' using errcode='22023'; end if;
  if p_limit < 1 or p_limit > 50 or p_offset < 0 then raise exception 'invalid pagination' using errcode='22023'; end if;

  with eligible as (
    select c.id,c.owner_type,c.owner_id,c.content_type,c.title,c.excerpt,c.body,c.visibility,c.status,
      c.language_code,c.metadata,c.published_at,c.created_at,c.updated_at,
      case when c.owner_type='user' then coalesce(nullif(p.preferences->>'display_name',''),nullif(u.raw_user_meta_data->>'full_name',''),nullif(split_part(coalesce(u.email,''),'@',1),''),'Human')
           when c.owner_type='agent' then coalesce(a.name,a.handle,'AI Agent') else 'Creator' end owner_display_name,
      case when c.owner_type='user' then nullif(coalesce(u.raw_user_meta_data->>'username',u.raw_user_meta_data->>'user_name'),'')
           when c.owner_type='agent' then a.handle else null end owner_handle,
      (case when c.published_at is null then 0 else exp(-extract(epoch from(now()-c.published_at))/604800.0) end)::numeric freshness_score,
      (select count(*)::numeric from content_events e where e.content_id=c.id and e.created_at>=now()-interval '30 days'
        and e.event_type in ('like','react','comment','share','save','watch_complete','replay')) engagement_count,
      (select count(*)::numeric from feed_impressions fi where fi.user_id=v_user and fi.content_id=c.id and fi.created_at>=now()-interval '7 days') exposure_count,
      exists(select 1 from social_relationships r where r.source_type='user' and r.source_id=v_user and r.target_type=c.owner_type and r.target_id=c.owner_id and r.relationship_type='follow' and r.status='active') is_following,
      exists(select 1 from universe_world_content uwc where uwc.content_id=c.id) has_world,
      coalesce((select max(least(1,greatest(0,coalesce(sia.score,0)::numeric))*least(1,greatest(0,coalesce(sia.confidence,0)::numeric)))
        from content_topic_links ctl join content_topics ct on ct.id=ctl.topic_id
        join interest_nodes i on i.status='active'
        join subject_interest_affinities sia on sia.interest_id=i.id and sia.user_id=v_user
        where ctl.content_id=c.id and (lower(ct.slug)=lower(i.canonical_key) or lower(ct.name)=lower(i.name) or lower(ct.name)=lower(i.canonical_key))),0)::numeric interest_score
    from content_items c
    left join profiles p on p.id=c.owner_id and c.owner_type='user'
    left join auth.users u on u.id=c.owner_id and c.owner_type='user'
    left join agents a on a.id=c.owner_id and c.owner_type='agent'
    where c.status='published' and c.archived_at is null
      and (c.visibility='public' or (c.visibility='connections' and exists(
        select 1 from social_relationships r where r.source_type='user' and r.source_id=v_user and r.target_type=c.owner_type and r.target_id=c.owner_id and r.relationship_type='follow' and r.status='active')))
      and not exists(select 1 from social_blocks b where
        (b.blocker_type='user' and b.blocker_id=v_user and b.blocked_type=c.owner_type and b.blocked_id=c.owner_id)
        or (b.blocker_type=c.owner_type and b.blocker_id=c.owner_id and b.blocked_type='user' and b.blocked_id=v_user))
      and not exists(select 1 from feed_feedback f where f.user_id=v_user and f.feedback_type='report' and f.content_id=c.id)
      and not exists(select 1 from feed_feedback f where f.user_id=v_user and f.feedback_type='not_interested' and f.content_id=c.id)
      and not exists(select 1 from feed_feedback f where f.user_id=v_user and f.feedback_type='mute_creator' and f.owner_type=c.owner_type and f.owner_id=c.owner_id)
      and not exists(select 1 from feed_feedback f join content_topic_links ctl on ctl.topic_id=f.topic_id where f.user_id=v_user and f.feedback_type='hide_topic' and ctl.content_id=c.id)
      and (p_surface<>'reels' or c.content_type='video')
      and (p_surface<>'following' or exists(select 1 from social_relationships r where r.source_type='user' and r.source_id=v_user and r.target_type=c.owner_type and r.target_id=c.owner_id and r.relationship_type='follow' and r.status='active'))
      and (p_surface<>'agent' or c.owner_type='agent')
      and (p_surface<>'knowledge' or c.content_type in ('article','document','research','tutorial','presentation','infographic'))
      and (p_surface<>'world' or exists(select 1 from universe_world_content uwc where uwc.content_id=c.id))
      and (p_surface<>'context' or (p_query is not null and (c.title ilike '%'||p_query||'%' or c.excerpt ilike '%'||p_query||'%' or c.body ilike '%'||p_query||'%')))
      and (p_query is null or c.title ilike '%'||p_query||'%' or c.excerpt ilike '%'||p_query||'%' or c.body ilike '%'||p_query||'%')
  ), scored as (
    select e.*,(e.freshness_score*0.24)+(least(1,e.engagement_count/20.0)*0.20)+(e.interest_score*0.22)
      +(case when e.is_following then 0.20 else 0 end)
      +(case when e.exposure_count=0 then 0.10 else greatest(-0.10,0.10-e.exposure_count*0.025) end)
      +(case when e.has_world then 0.04 else 0 end) rank_score
    from eligible e
  ), diversified as (
    select s.*,row_number() over(partition by s.owner_type,s.owner_id order by s.rank_score desc,s.published_at desc nulls last) creator_rank
    from scored s
  ), ranked as (
    select d.*,row_number() over(order by
      (d.rank_score-case when d.creator_rank>2 then 0.08*(d.creator_rank-2) else 0 end) desc,
      d.published_at desc nulls last,d.created_at desc)-1 position,
      array_remove(array[
        case when d.is_following then 'following_creator' end,
        case when d.interest_score>0 then 'interest_match' end,
        case when d.freshness_score>=0.5 then 'fresh' end,
        case when d.engagement_count>0 then 'engagement' end,
        case when d.exposure_count=0 then 'novelty' end,
        case when d.has_world then 'world_context' end
      ],null) reason_codes
    from diversified d
  ), page as (
    select * from ranked order by position offset p_offset limit p_limit
  ), inserted as (
    insert into feed_impressions(user_id,content_id,surface,position,rank_score,reason_codes,request_id)
    select v_user,id,p_surface,position,rank_score,to_jsonb(reason_codes),v_request from page returning 1
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',id,'owner_type',owner_type,'owner_id',owner_id,'owner_display_name',owner_display_name,'owner_handle',owner_handle,
    'content_type',content_type,'title',title,'excerpt',excerpt,'body',body,'visibility',visibility,'status',status,
    'language_code',language_code,'metadata',metadata,'published_at',published_at,'created_at',created_at,
    'rank_score',round(rank_score,6),'position',position,'reason_codes',reason_codes) order by position),'[]'::jsonb)
  into v_data from page;
  return jsonb_build_object('data',v_data,'request_id',v_request,'surface',p_surface);
end;
$$;

drop function if exists public.record_feed_interaction(uuid,text,text,integer,integer,jsonb);
create or replace function public.record_feed_interaction(
  p_content_id uuid,p_surface text,p_event_type text,p_position integer default null,
  p_watch_duration_ms bigint default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=public,auth
as $$
declare v_user uuid:=auth.uid(); v_content public.content_items%rowtype;
begin
  if v_user is null then raise exception 'authentication required' using errcode='42501'; end if;
  if p_surface not in ('home','following','for_you','reels','explore','live_now','agent','knowledge','world','context') then raise exception 'unsupported feed surface' using errcode='22023'; end if;
  if p_event_type not in ('impression','watch_start','watch_progress','watch_complete','replay','pause','skip','like','react','comment','share','save','follow','profile_visit','community_join','search_after_view','catalog_interaction','event_interaction','collaboration','not_interested','mute_creator','hide_topic','report') then raise exception 'unsupported feed interaction' using errcode='22023'; end if;
  select * into v_content from content_items where id=p_content_id and status='published' and archived_at is null;
  if not found then raise exception 'content not available' using errcode='42501'; end if;
  if not(v_content.visibility='public' or (v_content.visibility='connections' and exists(
    select 1 from social_relationships r where r.source_type='user' and r.source_id=v_user and r.target_type=v_content.owner_type and r.target_id=v_content.owner_id and r.relationship_type='follow' and r.status='active'))) then
    raise exception 'content not available' using errcode='42501';
  end if;
  if exists(select 1 from social_blocks b where
    (b.blocker_type='user' and b.blocker_id=v_user and b.blocked_type=v_content.owner_type and b.blocked_id=v_content.owner_id)
    or (b.blocker_type=v_content.owner_type and b.blocker_id=v_content.owner_id and b.blocked_type='user' and b.blocked_id=v_user)) then
    raise exception 'content not available' using errcode='42501';
  end if;
  insert into content_events(content_id,actor_user_id,event_type,metadata)
  values(p_content_id,v_user,p_event_type,jsonb_build_object('surface',p_surface,'position',p_position,'watch_duration_ms',p_watch_duration_ms,'metadata',coalesce(p_metadata,'{}'::jsonb)));
  return jsonb_build_object('ok',true,'content_id',p_content_id,'event_type',p_event_type);
end;
$$;

create or replace function public.record_feed_feedback(
  p_content_id uuid default null,p_owner_type text default null,p_owner_id uuid default null,
  p_topic_id uuid default null,p_feedback_type text default 'not_interested',p_reason text default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=public,auth
as $$
declare v_user uuid:=auth.uid(); v_content public.content_items%rowtype; v_owner_type text:=p_owner_type; v_owner_id uuid:=p_owner_id; v_topic_id uuid:=p_topic_id;
begin
  if v_user is null then raise exception 'authentication required' using errcode='42501'; end if;
  if p_feedback_type not in ('not_interested','mute_creator','hide_topic','report') then raise exception 'unsupported feedback' using errcode='22023'; end if;
  if p_content_id is not null then
    select * into v_content from content_items where id=p_content_id;
    if not found then raise exception 'content not found' using errcode='42501'; end if;
    v_owner_type:=v_content.owner_type; v_owner_id:=v_content.owner_id;
    if p_feedback_type='hide_topic' and (v_topic_id is null or not exists(select 1 from content_topic_links ctl where ctl.content_id=p_content_id and ctl.topic_id=v_topic_id)) then
      raise exception 'topic is not linked to content' using errcode='422';
    end if;
  end if;
  if p_feedback_type='mute_creator' and (v_owner_type is null or v_owner_id is null) then raise exception 'creator is required' using errcode='422'; end if;
  if p_feedback_type='hide_topic' and v_topic_id is null then raise exception 'topic is required' using errcode='422'; end if;
  if p_content_id is null and p_feedback_type in ('not_interested','report') then raise exception 'content is required' using errcode='422'; end if;
  insert into feed_feedback(user_id,content_id,owner_type,owner_id,topic_id,feedback_type,reason,metadata)
  values(v_user,p_content_id,v_owner_type,v_owner_id,v_topic_id,p_feedback_type,left(p_reason,500),coalesce(p_metadata,'{}'::jsonb));
  return jsonb_build_object('ok',true,'feedback_type',p_feedback_type,'content_id',p_content_id);
end;
$$;

revoke all on function public.get_feed(text,integer,integer,text) from public,anon;
revoke all on function public.record_feed_interaction(uuid,text,text,integer,bigint,jsonb) from public,anon;
revoke all on function public.record_feed_feedback(uuid,text,uuid,uuid,text,text,jsonb) from public,anon;
grant execute on function public.get_feed(text,integer,integer,text) to authenticated;
grant execute on function public.record_feed_interaction(uuid,text,text,integer,bigint,jsonb) to authenticated;
grant execute on function public.record_feed_feedback(uuid,text,uuid,uuid,text,text,jsonb) to authenticated;
