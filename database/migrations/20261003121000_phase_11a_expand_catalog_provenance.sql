-- Allpha Universe — reconcile provenance for expanded universal catalog
update public.agent_skill_catalog
set source_reference='Allpha Universe Agent Catalog — inspired by 500-AI-Agents-Projects'
where sort_order >= 500;

update public.agent_type_catalog
set source_reference='Allpha Universe Agent Catalog — inspired by 500-AI-Agents-Projects'
where sort_order >= 260;
