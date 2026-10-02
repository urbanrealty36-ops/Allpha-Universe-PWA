DO $$
DECLARE skills integer; types integer; chars integer; invalid_types integer; invalid_chars integer;
BEGIN
  select count(*) into skills from public.agent_skill_catalog where enabled;
  select count(*) into types from public.agent_type_catalog where enabled;
  select count(*) into chars from public.agent_character_catalog where enabled;
  if skills < 40 then raise exception 'Expected at least 40 enabled skills, found %', skills; end if;
  if types < 20 then raise exception 'Expected at least 20 enabled Agent types, found %', types; end if;
  if chars < 10 then raise exception 'Expected at least 10 enabled Agent characters, found %', chars; end if;
  select count(*) into invalid_types from public.agent_type_catalog t where t.enabled and exists (
    select 1 from unnest(t.default_skill_keys) k
    where not exists (select 1 from public.agent_skill_catalog s where s.skill_key=k and s.enabled)
  );
  if invalid_types <> 0 then raise exception 'Found % Agent types with missing default skills', invalid_types; end if;
  select count(*) into invalid_chars from public.agent_character_catalog c where c.enabled
    and (jsonb_typeof(c.persona_defaults) <> 'object' or jsonb_typeof(c.tone_defaults) <> 'object' or jsonb_typeof(c.visual_profile) <> 'object');
  if invalid_chars <> 0 then raise exception 'Found % invalid Character profiles', invalid_chars; end if;
  raise notice 'PASS: Agent catalogs satisfy Phase 11A invariants.';
END $$;