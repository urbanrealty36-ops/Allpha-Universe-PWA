begin;
select plan(43);
select has_table('public','communication_preferences','communication preferences exists');
select has_table('public','conversations','conversations exists');
select has_table('public','conversation_participants','conversation participants exists');
select has_table('public','conversation_requests','conversation requests exists');
select has_table('public','messages','messages exists');
select has_table('public','message_delivery_receipts','delivery receipts exists');
select has_table('public','message_reactions','message reactions exists');
select has_table('public','message_reports','message reports exists');
select has_table('public','communication_activity_events','communication activity exists');

select is((select relrowsecurity from pg_class where oid='public.communication_preferences'::regclass),true,'preferences RLS');
select is((select relrowsecurity from pg_class where oid='public.conversations'::regclass),true,'conversations RLS');
select is((select relrowsecurity from pg_class where oid='public.conversation_participants'::regclass),true,'participants RLS');
select is((select relrowsecurity from pg_class where oid='public.conversation_requests'::regclass),true,'requests RLS');
select is((select relrowsecurity from pg_class where oid='public.messages'::regclass),true,'messages RLS');
select is((select relrowsecurity from pg_class where oid='public.message_delivery_receipts'::regclass),true,'receipts RLS');
select is((select relrowsecurity from pg_class where oid='public.message_reactions'::regclass),true,'reactions RLS');
select is((select relrowsecurity from pg_class where oid='public.message_reports'::regclass),true,'reports RLS');
select is((select relrowsecurity from pg_class where oid='public.communication_activity_events'::regclass),true,'activity RLS');

select has_function('public','set_communication_preferences',array['text','uuid','text','boolean','boolean','jsonb'],'preferences RPC');
select has_function('public','create_direct_conversation',array['text','uuid','text','uuid','text','text'],'direct conversation RPC');
select has_function('public','respond_conversation_request',array['uuid','text'],'request response RPC');
select has_function('public','send_message',array['uuid','text','uuid','text','uuid','text','jsonb'],'send message RPC');
select has_function('public','update_message_delivery',array['uuid','text','uuid','text'],'delivery RPC');
select has_function('public','edit_message',array['uuid','text','uuid','text'],'edit message RPC');
select has_function('public','delete_message',array['uuid','text','uuid'],'delete message RPC');
select has_function('public','react_to_message',array['uuid','text','uuid','text'],'reaction RPC');
select has_function('public','report_message',array['uuid','uuid','text','text'],'report RPC');

select is((select prosecdef from pg_proc where oid='public.create_direct_conversation(text,uuid,text,uuid,text,text)'::regprocedure),true,'direct conversation is security definer');
select is((select prosecdef from pg_proc where oid='public.send_message(uuid,text,uuid,text,uuid,text,jsonb)'::regprocedure),true,'send is security definer');
select is((select prosecdef from pg_proc where oid='public.update_message_delivery(uuid,text,uuid,text)'::regprocedure),true,'delivery is security definer');
select is((select prosecdef from pg_proc where oid='public.report_message(uuid,uuid,text,text)'::regprocedure),true,'report is security definer');

select is((select has_function_privilege('anon','public.create_direct_conversation(text,uuid,text,uuid,text,text)','execute')),false,'anon cannot execute create direct');
select is((select has_function_privilege('anon','public.send_message(uuid,text,uuid,text,uuid,text,jsonb)','execute')),false,'anon cannot execute send');
select is((select has_function_privilege('anon','public.respond_conversation_request(uuid,text)','execute')),false,'anon cannot execute request response');
select is((select has_function_privilege('anon','public.report_message(uuid,uuid,text,text)','execute')),false,'anon cannot execute report');

select is((select count(*) from public.conversations),0::bigint,'no conversation seed data');
select is((select count(*) from public.conversation_participants),0::bigint,'no participant seed data');
select is((select count(*) from public.messages),0::bigint,'no message seed data');
select is((select count(*) from public.message_delivery_receipts),0::bigint,'no receipt seed data');
select is((select count(*) from public.message_reports),0::bigint,'no report seed data');
select is((select count(*) from public.communication_activity_events),0::bigint,'no communication activity seed data');
select * from finish();
rollback;