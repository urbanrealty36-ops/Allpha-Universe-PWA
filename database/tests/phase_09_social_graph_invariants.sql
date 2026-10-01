begin;

select plan(31);

select has_table('public', 'social_relationships', 'social relationship graph table exists');
select has_table('public', 'social_blocks', 'social block table exists');
select has_table('public', 'social_mentions', 'social mention table exists');
select has_table('public', 'social_activity_events', 'social activity event table exists');
select has_table('public', 'social_notifications', 'social notification table exists');

select col_is_pk('public', 'social_relationships', 'id', 'social relationship has primary key');
select col_is_unique('public', 'social_relationships', 'id', 'social relationship id is unique');
select col_is_pk('public', 'social_blocks', 'id', 'social block has primary key');
select col_is_unique('public', 'social_blocks', 'id', 'social block id is unique');
select col_is_pk('public', 'social_mentions', 'id', 'social mention has primary key');
select col_is_pk('public', 'social_activity_events', 'id', 'social activity has primary key');
select col_is_pk('public', 'social_notifications', 'id', 'social notification has primary key');

select is((select relrowsecurity from pg_class where oid='public.social_relationships'::regclass), true, 'social relationships RLS enabled');
select is((select relrowsecurity from pg_class where oid='public.social_blocks'::regclass), true, 'social blocks RLS enabled');
select is((select relrowsecurity from pg_class where oid='public.social_mentions'::regclass), true, 'social mentions RLS enabled');
select is((select relrowsecurity from pg_class where oid='public.social_activity_events'::regclass), true, 'social activity RLS enabled');
select is((select relrowsecurity from pg_class where oid='public.social_notifications'::regclass), true, 'social notifications RLS enabled');

select has_function('public', 'create_social_relationship', array['text','uuid','text','uuid','text','jsonb'], 'relationship create RPC exists');
select has_function('public', 'accept_social_relationship', array['uuid'], 'relationship accept RPC exists');
select has_function('public', 'reject_social_relationship', array['uuid'], 'relationship reject RPC exists');
select has_function('public', 'revoke_social_relationship', array['uuid'], 'relationship revoke RPC exists');
select has_function('public', 'block_social_subject', array['text','uuid','text','uuid'], 'block RPC exists');
select has_function('public', 'unblock_social_subject', array['text','uuid','text','uuid'], 'unblock RPC exists');
select has_function('public', 'create_social_mention', array['text','uuid','text','uuid','jsonb'], 'mention RPC exists');
select has_function('public', 'record_social_activity', array['text','uuid','text','text','uuid','text','jsonb'], 'activity RPC exists');
select has_function('public', 'mark_social_notification_read', array['uuid'], 'notification read RPC exists');

select is((select count(*) from public.social_relationships), 0::bigint, 'no social relationship seed data');
select is((select count(*) from public.social_blocks), 0::bigint, 'no social block seed data');
select is((select count(*) from public.social_mentions), 0::bigint, 'no social mention seed data');
select is((select count(*) from public.social_activity_events), 0::bigint, 'no social activity seed data');
select is((select count(*) from public.social_notifications), 0::bigint, 'no social notification seed data');

select * from finish();
rollback;
