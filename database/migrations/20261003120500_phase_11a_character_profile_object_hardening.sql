-- Allpha Universe — harden expanded Character profile JSON shape
update public.agent_character_catalog
set persona_defaults = jsonb_build_object('traits', persona_defaults)
where sort_order >= 160 and jsonb_typeof(persona_defaults) = 'array';
