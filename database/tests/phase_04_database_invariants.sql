-- Phase 04 database invariants.
-- This is an inspection/test query set, not a seed script.
-- Final automated pgTAP execution belongs to PHASE 31.

select count(*) as public_table_count
from pg_tables
where schemaname = 'public';

select count(*) as rls_enabled_public_tables
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relrowsecurity;

select count(*) as public_rls_policies
from pg_policies
where schemaname = 'public';

select extname, extversion
from pg_extension
where extname in ('pgcrypto', 'vector')
order by extname;

select id, name, public
from storage.buckets
where id like 'allpha-%'
order by id;

select pubname, n.nspname as schema_name, c.relname as table_name
from pg_publication p
join pg_publication_rel pr on pr.prpubid = p.oid
join pg_class c on c.oid = pr.prrelid
join pg_namespace n on n.oid = c.relnamespace
where p.pubname = 'supabase_realtime'
  and n.nspname = 'public'
order by c.relname;

-- Security invariant: the legacy public SECURITY DEFINER helper must not be
-- executable by anon/authenticated.
select has_function_privilege('anon', 'public.rls_auto_enable()', 'EXECUTE') as anon_can_execute,
       has_function_privilege('authenticated', 'public.rls_auto_enable()', 'EXECUTE') as authenticated_can_execute;
