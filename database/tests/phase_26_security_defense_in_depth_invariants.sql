select to_regclass('public.security_devices') is not null as security_devices_table;
select (select relrowsecurity from pg_class where oid='public.security_devices'::regclass) as security_devices_rls;
select has_function_privilege('anon','public.register_security_device(text,text,text)','execute')=false as device_rpc_not_anon;
select has_function_privilege('authenticated','public.register_security_device(text,text,text)','execute') as device_rpc_authenticated;
select count(*)=0 as no_device_seed from public.security_devices;
select count(*)>0 as existing_security_event_surface from information_schema.tables where table_schema='public' and table_name='security_events';