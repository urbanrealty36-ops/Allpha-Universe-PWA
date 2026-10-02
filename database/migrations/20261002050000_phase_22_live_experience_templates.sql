-- Phase 22 — Live Stories / Streaming / Experiences
-- Built-in Live Streaming Collaboration template catalog.
-- Platform configuration only: no fake users, Agents, sessions, viewers, assets or stream records.

create table if not exists public.live_experience_templates (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'platform' check (source in ('platform','creator')),
  catalog_key text,
  catalog_order integer,
  name text not null,
  slug text not null unique,
  category text not null,
  description text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  moderation_status text not null default 'pending' check (moderation_status in ('pending','approved','restricted','removed')),
  created_by_user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists live_experience_templates_platform_catalog_key_uq
on public.live_experience_templates(catalog_key)
where source='platform' and catalog_key is not null;

create index if not exists live_experience_templates_catalog_order_idx
on public.live_experience_templates(source,catalog_order);

create table if not exists public.live_experience_template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.live_experience_templates(id) on delete cascade,
  version integer not null,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  template_schema jsonb not null default '{}'::jsonb,
  performance_budget jsonb not null default '{}'::jsonb,
  accessibility_constraints jsonb not null default '{}'::jsonb,
  validation_status text not null default 'pending' check (validation_status in ('pending','passed','failed')),
  performance_status text not null default 'pending' check (performance_status in ('pending','passed','failed')),
  moderation_status text not null default 'pending' check (moderation_status in ('pending','approved','restricted','removed')),
  created_by_user_id uuid references public.users(id) on delete set null,
  approved_by_user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique(template_id,version)
);

create or replace function private.live_template_schema_safe(p_value jsonb)
returns boolean language plpgsql immutable set search_path=''
as $$
declare item jsonb; key text;
begin
  if p_value is null then return true; end if;
  if jsonb_typeof(p_value)='object' then
    for key in select jsonb_object_keys(p_value) loop
      if lower(key) in ('code','script','sql','permission','permissions','policy','policies','risk','risk_policy','security','governance','ownership','owner_user_id','organization_id','entitlement','billing','approval','audit') then
        return false;
      end if;
      if not private.live_template_schema_safe(p_value->key) then return false; end if;
    end loop;
  elsif jsonb_typeof(p_value)='array' then
    for item in select value from jsonb_array_elements(p_value) loop
      if not private.live_template_schema_safe(item) then return false; end if;
    end loop;
  end if;
  return true;
end $$;

alter table public.live_experience_templates enable row level security;
alter table public.live_experience_templates force row level security;
alter table public.live_experience_template_versions enable row level security;
alter table public.live_experience_template_versions force row level security;

drop policy if exists live_experience_templates_select on public.live_experience_templates;
create policy live_experience_templates_select on public.live_experience_templates
for select to authenticated
using ((source='platform' and status='published' and moderation_status='approved')
  or created_by_user_id=(select auth.uid()));

drop policy if exists live_experience_template_versions_select on public.live_experience_template_versions;
create policy live_experience_template_versions_select on public.live_experience_template_versions
for select to authenticated
using (exists (
  select 1 from public.live_experience_templates t
  where t.id=template_id and (
    (t.source='platform' and t.status='published' and t.moderation_status='approved'
      and status='published' and moderation_status='approved')
    or t.created_by_user_id=(select auth.uid())
  )
));

revoke all on public.live_experience_templates from anon,authenticated;
revoke all on public.live_experience_template_versions from anon,authenticated;
grant select on public.live_experience_templates to authenticated;
grant select on public.live_experience_template_versions to authenticated;

do $$
declare r jsonb; s jsonb; v jsonb;
begin
  for r in select * from jsonb_array_elements([{"key":"live-01-podcast-studio","order":1,"slug":"podcast-studio","name":"Podcast Studio","category":"Podcast","description":"Two-person host + AI co-host studio with conversation-first framing.","roles":["host","ai_cohost","guest"],"layout":"split_host_ai","overlay":"lower_thirds"},{"key":"live-02-talkshow-prime","order":2,"slug":"talkshow-prime","name":"Talkshow Prime","category":"Talkshow","description":"Premium talkshow stage for a Human Owner and owned AI Agent with guest slots.","roles":["host","ai_cohost","guest"],"layout":"host_center_guest_right","overlay":"lower_thirds"},{"key":"live-03-interview-lab","order":3,"slug":"interview-lab","name":"Interview Lab","category":"Interview","description":"Interview layout optimized for host, AI interviewer and one guest.","roles":["host","ai_interviewer","guest"],"layout":"interview_dual","overlay":"name_tags"},{"key":"live-04-product-showcase","order":4,"slug":"product-showcase","name":"Product Showcase","category":"Product Show","description":"Demonstration stage with Human presenter, AI product expert and product canvas.","roles":["host","ai_product_expert"],"layout":"presenter_product","overlay":"product_card"},{"key":"live-05-news-discussion","order":5,"slug":"news-discussion","name":"News & Discussion","category":"News","description":"Editorial discussion desk with Human anchor and AI analyst.","roles":["anchor","ai_analyst","guest"],"layout":"news_desk","overlay":"headline_strip"},{"key":"live-06-webinar-vision","order":6,"slug":"webinar-vision","name":"Webinar Vision","category":"Webinar","description":"Education-first webinar stage with Human presenter and AI teaching assistant.","roles":["presenter","ai_assistant","guest"],"layout":"presentation_center","overlay":"topic_banner"},{"key":"live-07-conference-stage","order":7,"slug":"conference-stage","name":"Conference Stage","category":"Conference","description":"Large event keynote layout for Human speaker with AI co-presenter.","roles":["speaker","ai_copresenter"],"layout":"keynote_stage","overlay":"speaker_lower_third"},{"key":"live-08-investor-pitch","order":8,"slug":"investor-pitch","name":"Investor Pitch","category":"Pitching","description":"Pitch deck stage for Human founder and AI strategy/finance co-pilot.","roles":["founder","ai_copilot","guest"],"layout":"pitch_split","overlay":"metric_strip"},{"key":"live-09-product-launch","order":9,"slug":"product-launch","name":"Product Launch","category":"Product Launch","description":"Launch reveal stage combining Human presenter, AI demonstrator and product media.","roles":["presenter","ai_demonstrator"],"layout":"launch_hero","overlay":"launch_badge"},{"key":"live-10-ama-arena","order":10,"slug":"ama-arena","name":"AMA Arena","category":"AMA","description":"Audience-driven Q&A arena with Human owner and AI answer partner.","roles":["host","ai_answer_partner"],"layout":"host_audience","overlay":"question_card"},{"key":"live-11-debate-forum","order":11,"slug":"debate-forum","name":"Debate Forum","category":"Debate","description":"Structured two-sided debate stage with Human and AI positions.","roles":["human_speaker","ai_speaker","moderator"],"layout":"debate_dual","overlay":"topic_ribbon"},{"key":"live-12-education-classroom","order":12,"slug":"education-classroom","name":"Education Classroom","category":"Education","description":"Virtual classroom for Human teacher and AI teaching assistant.","roles":["teacher","ai_ta","guest"],"layout":"classroom","overlay":"lesson_panel"},{"key":"live-13-research-panel","order":13,"slug":"research-panel","name":"Research Panel","category":"Research","description":"Research discussion panel with Human lead and AI research specialist.","roles":["lead","ai_researcher","panelist"],"layout":"research_panel","overlay":"source_strip"},{"key":"live-14-community-show","order":14,"slug":"community-show","name":"Community Show","category":"Community","description":"Community-hosted social stage with Human owner, AI community host and guests.","roles":["host","ai_community_host","guest"],"layout":"community_lounge","overlay":"community_banner"},{"key":"live-15-creator-show","order":15,"slug":"creator-show","name":"Creator Show","category":"Creator","description":"Creator-first live room for Human creator and AI creative partner.","roles":["creator","ai_creative_partner"],"layout":"creator_dual","overlay":"creator_tag"},{"key":"live-16-shopping-live","order":16,"slug":"shopping-live","name":"Shopping Live","category":"Shopping","description":"Commerce-ready live stage with Human host and AI product assistant.","roles":["host","ai_product_assistant"],"layout":"shopping_stage","overlay":"product_carousel"},{"key":"live-17-virtual-concert","order":17,"slug":"virtual-concert","name":"Virtual Concert","category":"Concert","description":"Performance stage with Human performer and AI visual/music companion.","roles":["performer","ai_companion"],"layout":"concert_stage","overlay":"now_playing"},{"key":"live-18-music-session","order":18,"slug":"music-session","name":"Music Session","category":"Music","description":"Intimate music room for Human musician and AI session partner.","roles":["musician","ai_session_partner"],"layout":"music_room","overlay":"track_badge"},{"key":"live-19-gaming-live","order":19,"slug":"gaming-live","name":"Gaming Live","category":"Gaming","description":"Gaming broadcast layout with Human player and AI strategy companion.","roles":["player","ai_strategy_partner"],"layout":"gaming_split","overlay":"game_hud"},{"key":"live-20-workshop-live","order":20,"slug":"workshop-live","name":"Workshop Live","category":"Workshop","description":"Hands-on workshop stage with Human facilitator and AI assistant.","roles":["facilitator","ai_assistant"],"layout":"workshop_canvas","overlay":"step_indicator"},{"key":"live-21-demo-day","order":21,"slug":"demo-day","name":"Demo Day","category":"Demo Day","description":"Startup demo stage with Human founder and AI technical/product co-presenter.","roles":["founder","ai_copresenter","reviewer"],"layout":"demo_stage","overlay":"demo_metrics"},{"key":"live-22-town-hall","order":22,"slug":"town-hall","name":"Town Hall","category":"Town Hall","description":"Open community town hall with Human owner, AI moderator and audience.","roles":["host","ai_moderator"],"layout":"townhall","overlay":"speaker_queue"},{"key":"live-23-roundtable","order":23,"slug":"roundtable","name":"Roundtable","category":"Roundtable","description":"Collaborative roundtable with Human owner and multiple AI/human participants.","roles":["host","ai_participant","guest"],"layout":"roundtable","overlay":"participant_strip"},{"key":"live-24-coaching-room","order":24,"slug":"coaching-room","name":"Coaching Room","category":"Coaching","description":"Private coaching conversation with Human coach and AI preparation partner.","roles":["coach","ai_coach_assistant","guest"],"layout":"coaching_dual","overlay":"goal_card"},{"key":"live-25-agent-to-agent-show","order":25,"slug":"agent-to-agent-show","name":"Agent-to-Agent Show","category":"Agent-to-Agent","description":"AI-to-AI show supervised by the Human Owner with visible human control.","roles":["owner","agent_a","agent_b"],"layout":"agent_dual","overlay":"agent_status"}]::jsonb) loop
    insert into public.live_experience_templates
      (source,catalog_key,catalog_order,name,slug,category,description,status,moderation_status,created_by_user_id)
    values
      ('platform',r->>'key',(r->>'order')::int,r->>'name',r->>'slug',r->>'category',r->>'description','published','approved',null)
    on conflict(slug) do update set
      catalog_key=excluded.catalog_key,catalog_order=excluded.catalog_order,name=excluded.name,
      category=excluded.category,description=excluded.description,status='published',
      moderation_status='approved',source='platform',created_by_user_id=null,updated_at=now();

    s := jsonb_build_object(
      'format','allpha.live_experience_template.v1',
      'presentation_only',true,
      'stage',jsonb_build_object('layout',r->>'layout','aspect_ratio','16:9','safe_area','broadcast_safe','camera_mode','multi_source'),
      'roles',(select coalesce(jsonb_agg(jsonb_build_object('slot',x,'kind','human_or_owned_agent','suggested_participation',case when x like 'ai_%' or x like 'agent_%' then 'co_host' else 'host' end)),'[]'::jsonb) from jsonb_array_elements_text(r->'roles') x),
      'human_owner',jsonb_build_object('control_surface','persistent','pause_stop','visible'),
      'ai_collaboration',jsonb_build_object('enabled',true,'suggested_role_slots',
        (select coalesce(jsonb_agg(x), '[]'::jsonb) from jsonb_array_elements_text(r->'roles') x where x like 'ai_%' or x like 'agent_%'),
        'interaction','realtime_conversation','voice','optional','character','optional'),
      'overlays',jsonb_build_object('primary',r->>'overlay','caption','bottom_safe','audience','right_rail','status','top_bar'),
      'audience',jsonb_build_object('chat','side_panel','questions','enabled','reactions','enabled','participant_requests','enabled'),
      'responsive',jsonb_build_object('mobile','stacked','tablet','dual_pane','desktop','broadcast_canvas'),
      'accessibility',jsonb_build_object('captions','supported','reduced_motion','supported','keyboard_focus','required','contrast','semantic_tokens'),
      'theme_tokens',jsonb_build_object('theme.surface','glass-dark','theme.primary','electric-indigo','theme.secondary','violet','theme.accent','cyan','theme.text','primary','theme.textMuted','secondary'),
      'runtime_readiness',jsonb_build_object('phase','22','requires_live_session',true,'requires_agent_runtime_for_ai',true,'requires_ai_gateway_for_ai',true)
    );

    insert into public.live_experience_template_versions
      (template_id,version,status,template_schema,performance_budget,accessibility_constraints,validation_status,performance_status,moderation_status,created_by_user_id,approved_by_user_id,published_at)
    select id,1,'published',s,
      jsonb_build_object('max_sources',6,'target_fps',30,'mobile_max_sources',4,'overlay_budget',12),
      jsonb_build_object('captions',true,'reduced_motion',true,'keyboard',true,'contrast','AA'),
      'passed','passed','approved',null,null,now()
    from public.live_experience_templates where slug=r->>'slug'
    on conflict(template_id,version) do update set
      status='published',template_schema=excluded.template_schema,
      performance_budget=excluded.performance_budget,accessibility_constraints=excluded.accessibility_constraints,
      validation_status='passed',performance_status='passed',moderation_status='approved',
      created_by_user_id=null,approved_by_user_id=null,published_at=coalesce(public.live_experience_template_versions.published_at,now());
  end loop;

  if exists(select 1 from public.live_experience_template_versions where not private.live_template_schema_safe(template_schema)) then
    raise exception 'Unsafe Phase 22 template schema';
  end if;
end $$;
