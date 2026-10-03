begin;

select plan(47);

select has_table('public','communities','communities table exists');
select has_table('public','community_memberships','membership table exists');
select has_table('public','community_topics','topic table exists');
select has_table('public','community_topic_links','topic link table exists');
select has_table('public','community_posts','post table exists');
select has_table('public','community_comments','comment table exists');
select has_table('public','community_events','event table exists');
select has_table('public','community_event_attendees','event attendee table exists');
select has_table('public','community_reports','report table exists');
select has_table('public','community_moderation_cases','moderation table exists');
select has_table('public','community_activity_events','activity table exists');

select is((select relrowsecurity from pg_class where oid='public.communities'::regclass),true,'communities RLS');
select is((select relrowsecurity from pg_class where oid='public.community_memberships'::regclass),true,'memberships RLS');
select is((select relrowsecurity from pg_class where oid='public.community_posts'::regclass),true,'posts RLS');
select is((select relrowsecurity from pg_class where oid='public.community_comments'::regclass),true,'comments RLS');
select is((select relrowsecurity from pg_class where oid='public.community_events'::regclass),true,'events RLS');
select is((select relrowsecurity from pg_class where oid='public.community_reports'::regclass),true,'reports RLS');
select is((select relrowsecurity from pg_class where oid='public.community_moderation_cases'::regclass),true,'moderation RLS');
select is((select relrowsecurity from pg_class where oid='public.community_activity_events'::regclass),true,'activity RLS');

select has_function('public','create_community',array['text','uuid','text','text','text','text','text','jsonb'],'create community RPC');
select has_function('public','join_community',array['uuid','text','uuid'],'join community RPC');
select has_function('public','leave_community',array['uuid','text','uuid'],'leave community RPC');
select has_function('public','manage_community_membership',array['uuid','text'],'membership moderation RPC');
select has_function('public','create_community_post',array['uuid','uuid','text','uuid'],'community post RPC');
select has_function('public','create_community_comment',array['uuid','uuid','text','uuid','text','uuid'],'community comment RPC');
select has_function('public','create_community_event',array['uuid','text','uuid','text','text','timestamptz','timestamptz','text','jsonb','integer','jsonb'],'community event RPC');
select has_function('public','rsvp_community_event',array['uuid','text','uuid'],'event RSVP RPC');
select has_function('public','report_community_target',array['uuid','text','uuid','text','text'],'community report RPC');
select has_function('public','create_community_topic',array['uuid','text','text','text','uuid'],'community topic RPC');
select has_function('public','link_community_topic',array['uuid','uuid'],'community topic link RPC');
select has_function('public','link_community_to_world',array['uuid','uuid','text'],'community world link RPC');
select has_function('public','decide_community_moderation_case',array['uuid','text','text'],'community moderation decision RPC');

select is((select prosecdef from pg_proc where oid='public.create_community(text,uuid,text,text,text,text,text,jsonb)'::regprocedure),true,'create community is security definer');
select is((select prosecdef from pg_proc where oid='public.join_community(uuid,text,uuid)'::regprocedure),true,'join community is security definer');
select is((select prosecdef from pg_proc where oid='public.create_community_post(uuid,uuid,text,uuid)'::regprocedure),true,'post RPC is security definer');
select is((select prosecdef from pg_proc where oid='public.create_community_comment(uuid,uuid,text,uuid,text,uuid)'::regprocedure),true,'comment RPC is security definer');
select is((select prosecdef from pg_proc where oid='public.report_community_target(uuid,text,uuid,text,text)'::regprocedure),true,'report RPC is security definer');
select is((select prosecdef from pg_proc where oid='public.create_community_topic(uuid,text,text,text,uuid)'::regprocedure),true,'topic RPC is security definer');
select is((select prosecdef from pg_proc where oid='public.link_community_topic(uuid,uuid)'::regprocedure),true,'topic link RPC is security definer');
select is((select prosecdef from pg_proc where oid='public.link_community_to_world(uuid,uuid,text)'::regprocedure),true,'world link RPC is security definer');
select is((select prosecdef from pg_proc where oid='public.decide_community_moderation_case(uuid,text,text)'::regprocedure),true,'moderation decision RPC is security definer');

select is((select count(*) from public.communities),0::bigint,'no community seed data');
select is((select count(*) from public.community_memberships),0::bigint,'no membership seed data');
select is((select count(*) from public.community_posts),0::bigint,'no post seed data');
select is((select count(*) from public.community_comments),0::bigint,'no comment seed data');
select is((select count(*) from public.community_events),0::bigint,'no event seed data');
select is((select count(*) from public.community_reports),0::bigint,'no report seed data');

select * from finish();
rollback;