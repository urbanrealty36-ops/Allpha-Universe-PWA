DO $$
DECLARE
  skills integer;
  types integer;
  chars integer;
  invalid_types integer;
  invalid_chars integer;
  invalid_provenance integer;
BEGIN
  select count(*) into skills from public.agent_skill_catalog where enabled;
  select count(*) into types from public.agent_type_catalog where enabled;
  select count(*) into chars from public.agent_character_catalog where enabled;

  if skills < 100 then raise exception 'Expected at least 100 enabled skills, found %', skills; end if;
  if types < 60 then raise exception 'Expected at least 60 enabled Agent types, found %', types; end if;
  if chars < 30 then raise exception 'Expected at least 30 enabled Agent characters, found %', chars; end if;

  select count(*) into invalid_types
  from public.agent_type_catalog t
  where t.enabled and exists (
    select 1 from unnest(t.default_skill_keys) k
    where not exists (
      select 1 from public.agent_skill_catalog s
      where s.skill_key = k and s.enabled
    )
  );
  if invalid_types <> 0 then
    raise exception 'Found % Agent types with missing default skills', invalid_types;
  end if;

  select count(*) into invalid_chars
  from public.agent_character_catalog c
  where c.enabled
    and (
      jsonb_typeof(c.persona_defaults) <> 'object'
      or jsonb_typeof(c.tone_defaults) <> 'object'
      or jsonb_typeof(c.visual_profile) <> 'object'
    );
  if invalid_chars <> 0 then
    raise exception 'Found % invalid Character profiles', invalid_chars;
  end if;

  select count(*) into invalid_provenance
  from (
    select source_reference from public.agent_skill_catalog where enabled and sort_order >= 500
    union
    select source_reference from public.agent_type_catalog where enabled and sort_order >= 260
  ) p
  where p.source_reference <> 'Allpha Universe Agent Catalog — inspired by 500-AI-Agents-Projects';
  if invalid_provenance <> 0 then
    raise exception 'Found % expanded catalog provenance mismatches', invalid_provenance;
  end if;

  raise notice 'PASS: Universal Allpha Agent catalogs satisfy Phase 11A invariants.';
END $$;