-- Phase 22 Live Streaming Collaboration built-in template invariants

do $$
declare c integer;
begin
  select count(*) into c from public.live_experience_templates where source='platform';
  if c <> 25 then raise exception 'Expected 25 platform live templates, got %', c; end if;

  select count(*) into c
  from public.live_experience_template_versions v
  join public.live_experience_templates t on t.id=v.template_id
  where t.source='platform' and v.version=1 and v.status='published'
    and v.validation_status='passed' and v.performance_status='passed'
    and v.moderation_status='approved';
  if c <> 25 then raise exception 'Expected 25 approved platform live template versions, got %', c; end if;

  select count(*) into c
  from public.live_experience_templates
  where source='platform' and created_by_user_id is not null;
  if c <> 0 then raise exception 'Platform live templates must not have creator ownership'; end if;

  select count(*) into c
  from public.live_experience_template_versions
  where not private.live_template_schema_safe(template_schema);
  if c <> 0 then raise exception 'Unsafe live template schemas detected'; end if;

  select count(*) into c
  from public.live_experience_template_versions v
  where v.template_schema->>'format' <> 'allpha.live_experience_template.v1'
     or coalesce((v.template_schema->>'presentation_only')::boolean,false) is distinct from true;
  if c <> 0 then raise exception 'Invalid live template presentation contract'; end if;

  select count(*) into c
  from public.live_experience_template_versions v
  where not (v.template_schema ? 'human_owner')
     or not (v.template_schema ? 'ai_collaboration')
     or not (v.template_schema ? 'overlays')
     or not (v.template_schema ? 'audience');
  if c <> 0 then raise exception 'Live collaboration template contract incomplete'; end if;

  raise notice 'Phase 22 Live Streaming Collaboration template invariants passed: 25 platform templates';
end $$;
