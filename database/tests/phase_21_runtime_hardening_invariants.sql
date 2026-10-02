begin;
select plan(20);

select ok(to_regprocedure('public.validate_world_template_version(uuid)') is not null,'template validation RPC exists');
select ok(to_regprocedure('public.submit_world_template(uuid)') is not null,'template submit RPC exists');
select ok(to_regprocedure('public.publish_world_template(uuid)') is not null,'template publish RPC exists');
select ok(to_regprocedure('public.moderate_theme(uuid,uuid,text)') is not null,'theme moderation RPC exists');
select ok(to_regprocedure('public.moderate_world_template(uuid,uuid,text)') is not null,'template moderation RPC exists');

select ok((select prosecdef from pg_proc where oid='public.validate_world_template_version(uuid)'::regprocedure),'template validation SECURITY DEFINER');
select ok((select proconfig @> ARRAY['search_path=""'] from pg_proc where oid='public.validate_world_template_version(uuid)'::regprocedure),'template validation empty search_path');
select ok((select prosecdef from pg_proc where oid='public.moderate_theme(uuid,uuid,text)'::regprocedure),'theme moderation SECURITY DEFINER');
select ok((select proconfig @> ARRAY['search_path=""'] from pg_proc where oid='public.moderate_theme(uuid,uuid,text)'::regprocedure),'theme moderation empty search_path');
select ok((select prosecdef from pg_proc where oid='public.moderate_world_template(uuid,uuid,text)'::regprocedure),'template moderation SECURITY DEFINER');

select ok(private.theme_tokens_safe('{"theme.color.primary":"var(--allpha-primary)"}'::jsonb),'canonical theme token accepted');
select ok(not private.theme_tokens_safe('{"security.policy":"deny"}'::jsonb),'security namespace rejected');
select ok(not private.theme_tokens_safe('{"theme.security.policy":"deny"}'::jsonb),'protected theme namespace rejected');
select ok(private.scene_schema_safe('{"zones":[],"objects":[{"type":"booth","position":[0,0]}]}'::jsonb),'declarative scene accepted');
select ok(not private.scene_schema_safe('{"objects":[{"code":"alert(1)"}]}'::jsonb),'code rejected recursively');
select ok(not private.scene_schema_safe('{"objects":[{"nested":{"script":"x"}}]}'::jsonb),'script rejected recursively');
select ok(not private.scene_schema_safe('{"security":{"role":"admin"}}'::jsonb),'protected authority namespace rejected recursively');

select is((select count(*)::int from public.themes),0,'no theme business seed data');
select is((select count(*)::int from public.world_templates),0,'no world template business seed data');
select is((select count(*)::int from public.world_builder_states),0,'no builder business seed data');

select * from finish();
rollback;