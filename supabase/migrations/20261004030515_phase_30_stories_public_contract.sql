create or replace function public.create_story(
  p_owner_type text,
  p_owner_id uuid,
  p_title text default null,
  p_body text default null,
  p_excerpt text default null,
  p_visibility text default 'public',
  p_language_code text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_expires_at timestamptz default null
) returns public.stories
language sql security invoker set search_path = ''
as $$
  select private.create_story__allpha_sd(p_owner_type,p_owner_id,p_title,p_body,p_excerpt,p_visibility,p_language_code,p_metadata,p_expires_at)
$$;

create or replace function public.publish_story(p_story_id uuid)
returns public.stories
language sql security invoker set search_path = ''
as $$
  select private.publish_story__allpha_sd(p_story_id)
$$;

revoke execute on function public.create_story(text,uuid,text,text,text,text,text,jsonb,timestamptz) from anon;
revoke execute on function public.publish_story(uuid) from anon;
grant execute on function public.create_story(text,uuid,text,text,text,text,text,jsonb,timestamptz) to authenticated, service_role;
grant execute on function public.publish_story(uuid) to authenticated, service_role;
