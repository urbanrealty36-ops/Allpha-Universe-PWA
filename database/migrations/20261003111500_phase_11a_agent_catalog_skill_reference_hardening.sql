-- Correct Agent type defaults so every referenced value is a catalog skill key.
update public.agent_type_catalog
set default_skill_keys = array['agriculture_analysis','data_analysis','web_research']
where type_key = 'agriculture_agent';

update public.agent_type_catalog
set default_skill_keys = array['education_tutoring','study_planning','web_research']
where type_key = 'education_agent';
