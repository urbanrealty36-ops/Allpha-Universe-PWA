-- Allpha Universe — Phase 11A Agent Skill / Type / Character Catalog
-- Platform configuration only. Does not create user-owned Agents.

create table if not exists public.agent_skill_catalog (
  id uuid primary key default gen_random_uuid(),
  skill_key text not null unique,
  name text not null,
  description text not null,
  category text not null,
  risk_level text not null default 'low',
  capability_keys text[] not null default '{}',
  tool_domains text[] not null default '{}',
  source_reference text not null default '500-AI-Agents-Projects',
  metadata jsonb not null default '{}',
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint agent_skill_catalog_risk_check check (risk_level in ('low','medium','high','critical'))
);

create table if not exists public.agent_type_catalog (
  id uuid primary key default gen_random_uuid(),
  type_key text not null unique,
  name text not null,
  description text not null,
  category text not null,
  default_skill_keys text[] not null default '{}',
  recommended_capability_keys text[] not null default '{}',
  default_autonomy_level text not null default 'recommend',
  risk_profile text not null default 'low',
  source_reference text not null default '500-AI-Agents-Projects',
  metadata jsonb not null default '{}',
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint agent_type_catalog_autonomy_check check (default_autonomy_level in ('recommend','assist','bounded_execute','approval_required')),
  constraint agent_type_catalog_risk_check check (risk_profile in ('low','medium','high','critical'))
);

create table if not exists public.agent_character_catalog (
  id uuid primary key default gen_random_uuid(),
  character_key text not null unique,
  name text not null,
  archetype text not null,
  description text not null,
  interaction_style text not null,
  persona_defaults jsonb not null default '{}',
  tone_defaults jsonb not null default '{}',
  visual_profile jsonb not null default '{}',
  source_reference text not null default 'Allpha Character System',
  metadata jsonb not null default '{}',
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.agent_skill_catalog enable row level security;
alter table public.agent_type_catalog enable row level security;
alter table public.agent_character_catalog enable row level security;

revoke all on public.agent_skill_catalog from anon, authenticated;
revoke all on public.agent_type_catalog from anon, authenticated;
revoke all on public.agent_character_catalog from anon, authenticated;
grant select on public.agent_skill_catalog to authenticated;
grant select on public.agent_type_catalog to authenticated;
grant select on public.agent_character_catalog to authenticated;

drop policy if exists agent_skill_catalog_authenticated_read on public.agent_skill_catalog;
create policy agent_skill_catalog_authenticated_read on public.agent_skill_catalog for select to authenticated using (enabled = true);
drop policy if exists agent_type_catalog_authenticated_read on public.agent_type_catalog;
create policy agent_type_catalog_authenticated_read on public.agent_type_catalog for select to authenticated using (enabled = true);
drop policy if exists agent_character_catalog_authenticated_read on public.agent_character_catalog;
create policy agent_character_catalog_authenticated_read on public.agent_character_catalog for select to authenticated using (enabled = true);

create index if not exists agent_skill_catalog_category_idx on public.agent_skill_catalog(category, sort_order);
create index if not exists agent_type_catalog_category_idx on public.agent_type_catalog(category, sort_order);
create index if not exists agent_character_catalog_archetype_idx on public.agent_character_catalog(archetype, sort_order);

insert into public.agent_skill_catalog (skill_key,name,description,category,risk_level,capability_keys,tool_domains,sort_order) values
('web_research','Web Research','Research public web information and synthesize sourced findings.','research','low',array['web_search'],array['web'],10),
('deep_research','Deep Research','Plan and execute multi-source research with evidence synthesis.','research','low',array['web_search','retrieval'],array['web','knowledge'],20),
('document_analysis','Document Analysis','Extract, compare and summarize permitted documents.','knowledge','low',array['document_read','retrieval'],array['documents','knowledge'],30),
('rag_qa','RAG Question Answering','Answer using permission-scoped retrieved knowledge.','knowledge','low',array['retrieval'],array['knowledge'],40),
('adaptive_rag','Adaptive RAG','Adjust retrieval strategy to query complexity.','knowledge','low',array['retrieval'],array['knowledge'],50),
('self_rag','Self RAG','Review output and request additional retrieval when evidence is insufficient.','knowledge','medium',array['retrieval'],array['knowledge'],60),
('data_analysis','Data Analysis','Analyze structured datasets and produce evidence-based findings.','data','low',array['data_read','computation'],array['data'],70),
('data_visualization','Data Visualization','Turn permitted datasets into charts and explanatory outputs.','data','low',array['data_read','visualization'],array['data','design'],80),
('sql_analysis','SQL Analysis','Translate approved natural-language questions into constrained database analysis.','data','high',array['database_read'],array['database'],90),
('content_writing','Content Writing','Draft structured written content for an approved purpose.','content','low',array['content_generate'],array['writing'],100),
('copywriting','Copywriting','Create concise marketing and conversion-oriented copy.','marketing','low',array['content_generate'],array['writing'],110),
('content_strategy','Content Strategy','Plan content themes, formats, cadence and distribution.','marketing','low',array['content_generate','web_search'],array['content','web'],120),
('social_content','Social Content','Create platform-aware social content drafts and variations.','marketing','low',array['content_generate'],array['social'],130),
('seo_research','SEO Research','Analyze search intent, topics and content opportunities.','marketing','low',array['web_search','content_generate'],array['web','content'],140),
('lead_research','Lead Research','Research permitted prospect information and organize sales context.','sales','medium',array['web_search','crm_read'],array['web','crm'],150),
('lead_scoring','Lead Scoring','Evaluate lead signals using configured business criteria.','sales','medium',array['crm_read','computation'],array['crm','data'],160),
('sales_outreach_drafting','Sales Outreach Drafting','Draft personalized outreach for human review or approved automation.','sales','medium',array['crm_read','content_generate'],array['crm','communication'],170),
('customer_support','Customer Support','Answer customer questions using approved knowledge and escalation rules.','support','medium',array['retrieval','communication'],array['knowledge','support'],180),
('meeting_assistance','Meeting Assistance','Prepare agendas, summaries, action items and follow-up drafts.','productivity','low',array['calendar_read','content_generate'],array['calendar','documents'],190),
('travel_planning','Travel Planning','Build itineraries from stated preferences and permitted travel information.','planning','low',array['web_search','content_generate'],array['web','planning'],200),
('education_tutoring','Education Tutoring','Explain concepts and create adaptive learning exercises.','education','low',array['retrieval','content_generate'],array['knowledge','education'],210),
('study_planning','Study Planning','Create structured study plans from explicit goals.','education','low',array['content_generate'],array['planning'],220),
('coding','Software Development','Generate and explain software changes within an approved scope.','engineering','high',array['code_generate','repository_read'],array['github','code'],230),
('code_review','Code Review','Review code for correctness, maintainability and security issues.','engineering','medium',array['repository_read','code_analysis'],array['github','code'],240),
('debugging','Debugging','Investigate reproducible software failures and propose fixes.','engineering','high',array['repository_read','code_generate'],array['github','code'],250),
('documentation','Technical Documentation','Generate technical documentation from authoritative sources.','engineering','low',array['repository_read','content_generate'],array['github','writing'],260),
('workflow_planning','Workflow Planning','Break goals into structured steps for Workflow/Mission execution.','orchestration','medium',array['planning'],array['workflow'],270),
('multi_agent_coordination','Multi-Agent Coordination','Coordinate specialized Agents through explicit orchestration contracts.','orchestration','high',array['agent_collaboration','planning'],array['agents','workflow'],280),
('reflection','Reflection','Critique an output and propose a revised version without exposing private reasoning.','reasoning','low',array['content_generate'],array['evaluation'],290),
('evaluation','Agent Evaluation','Evaluate outputs against explicit quality criteria and tests.','observability','low',array['evaluation'],array['evaluation'],300),
('observability','Agent Observability','Summarize permitted runtime, latency, error and usage telemetry.','observability','low',array['telemetry_read'],array['telemetry'],310),
('image_understanding','Image Understanding','Interpret user-authorized images.','multimodal','medium',array['vision'],array['vision'],320),
('audio_transcription','Audio Transcription','Transcribe permitted audio into structured text.','multimodal','low',array['audio'],array['audio'],330),
('translation','Translation','Translate permitted text while preserving intended meaning and format.','language','low',array['content_generate'],array['language'],340),
('legal_document_review','Legal Document Review','Identify clauses and questions in permitted legal documents; not legal advice.','legal','high',array['document_read','retrieval'],array['documents','legal'],350),
('financial_analysis','Financial Analysis','Analyze permitted financial information and produce transparent calculations.','finance','high',array['data_read','computation'],array['finance','data'],360),
('health_information','Health Information Support','Explain permitted health information without diagnosing or replacing clinicians.','healthcare','high',array['document_read','retrieval'],array['health'],370),
('logistics_optimization','Logistics Optimization','Analyze routes, schedules and logistics constraints.','operations','medium',array['data_read','computation'],array['logistics','data'],380),
('real_estate_analysis','Real Estate Analysis','Analyze permitted property and market information.','real_estate','medium',array['web_search','data_read'],array['property','web'],390),
('agriculture_analysis','Agriculture Analysis','Analyze permitted agriculture observations and planning data.','agriculture','medium',array['data_read','retrieval'],array['agriculture','data'],400),
('manufacturing_monitoring','Manufacturing Monitoring','Analyze permitted production and quality signals.','manufacturing','high',array['data_read','telemetry_read'],array['manufacturing','telemetry'],410),
('cybersecurity_analysis','Cybersecurity Analysis','Analyze authorized security telemetry and defensive findings.','security','critical',array['security_read','data_read'],array['security','telemetry'],420),
('privacy_sanitization','Privacy Sanitization','Detect and redact sensitive information before downstream model processing.','security','high',array['privacy_transform'],array['privacy','security'],430),
('shopping_assistance','Shopping Assistance','Compare permitted product information against explicit requirements.','commerce','low',array['web_search'],array['commerce','web'],440),
('media_analysis','Media Analysis','Analyze permitted media topics, trends and audience signals.','media','low',array['web_search','data_read'],array['media','web'],450),
('creative_ideation','Creative Ideation','Generate concepts, variations and structured creative directions.','creative','low',array['content_generate'],array['creative'],460)
on conflict(skill_key) do nothing;

insert into public.agent_type_catalog (type_key,name,description,category,default_skill_keys,recommended_capability_keys,default_autonomy_level,risk_profile,sort_order) values
('research_agent','Research Agent','Investigates questions and synthesizes evidence from permitted sources.','knowledge',array['web_research','deep_research','document_analysis'],array['web_search','retrieval'],'recommend','low',10),
('knowledge_agent','Knowledge Agent','Answers questions over permission-scoped organizational knowledge.','knowledge',array['rag_qa','adaptive_rag','document_analysis'],array['retrieval'],'recommend','low',20),
('content_agent','Content Agent','Creates and transforms content for explicit user goals.','content',array['content_writing','content_strategy','creative_ideation'],array['content_generate'],'recommend','low',30),
('marketing_agent','Marketing Agent','Supports content strategy, SEO and campaign execution.','marketing',array['content_strategy','copywriting','seo_research','social_content'],array['web_search','content_generate'],'recommend','medium',40),
('sales_agent','Sales Agent','Researches leads and prepares bounded sales workflows.','sales',array['lead_research','lead_scoring','sales_outreach_drafting'],array['crm_read','content_generate'],'approval_required','medium',50),
('customer_success_agent','Customer Success Agent','Supports customer questions and escalation workflows.','support',array['customer_support','document_analysis','meeting_assistance'],array['retrieval','communication'],'recommend','medium',60),
('operations_agent','Operations Agent','Coordinates operational information, tasks and workflows.','operations',array['workflow_planning','data_analysis','meeting_assistance'],array['planning','data_read'],'approval_required','medium',70),
('finance_agent','Finance Analysis Agent','Analyzes permitted financial information without autonomous financial transactions.','finance',array['financial_analysis','data_analysis','data_visualization'],array['data_read','computation'],'recommend','high',80),
('legal_agent','Legal Information Agent','Reviews permitted legal documents and surfaces clauses/questions.','legal',array['legal_document_review','document_analysis','rag_qa'],array['document_read','retrieval'],'recommend','high',90),
('health_information_agent','Health Information Agent','Explains permitted health information and prepares questions for professionals.','healthcare',array['health_information','document_analysis','rag_qa'],array['document_read','retrieval'],'recommend','high',100),
('education_agent','Education Agent','Tutors users and creates learning plans.','education',array['education_tutoring','study_planning','web_research'],array['retrieval','content_generate'],'recommend','low',110),
('coding_agent','Coding Agent','Assists with software development, review and debugging.','engineering',array['coding','code_review','debugging','documentation'],array['repository_read','code_generate'],'approval_required','high',120),
('data_analyst_agent','Data Analyst Agent','Analyzes permitted structured data and communicates findings.','data',array['data_analysis','data_visualization','evaluation'],array['data_read','computation'],'recommend','medium',130),
('orchestrator_agent','Orchestrator Agent','Coordinates specialized Agents through Workflow/Mission contracts.','orchestration',array['workflow_planning','multi_agent_coordination','evaluation'],array['planning','agent_collaboration'],'approval_required','high',140),
('customer_support_agent','Customer Support Agent','Handles bounded support conversations using approved knowledge.','support',array['customer_support','rag_qa','translation'],array['retrieval','communication'],'recommend','medium',150),
('travel_agent','Travel Agent','Plans trips and itineraries from explicit preferences.','planning',array['travel_planning','web_research','content_writing'],array['web_search','content_generate'],'recommend','low',160),
('real_estate_agent','Real Estate Agent','Analyzes permitted property and market information.','real_estate',array['real_estate_analysis','web_research','data_analysis'],array['web_search','data_read'],'recommend','medium',170),
('logistics_agent','Logistics Agent','Supports route, schedule and logistics optimization.','operations',array['logistics_optimization','data_analysis','workflow_planning'],array['data_read','computation'],'approval_required','medium',180),
('agriculture_agent','Agriculture Agent','Supports agriculture analysis and planning from permitted data.','agriculture',array['agriculture_analysis','data_analysis','web_research'],array['data_read','retrieval'],'recommend','medium',190),
('manufacturing_agent','Manufacturing Agent','Monitors permitted manufacturing and quality signals.','manufacturing',array['manufacturing_monitoring','data_analysis','observability'],array['data_read','telemetry_read'],'recommend','high',200),
('security_agent','Defensive Security Agent','Analyzes authorized security telemetry and defensive findings.','security',array['cybersecurity_analysis','privacy_sanitization','observability'],array['security_read','telemetry_read'],'approval_required','critical',210),
('multimodal_agent','Multimodal Agent','Works across authorized text, image and audio inputs.','multimodal',array['image_understanding','audio_transcription','translation'],array['vision','audio'],'recommend','medium',220),
('media_agent','Media Intelligence Agent','Analyzes media, trends and audience signals.','media',array['media_analysis','web_research','data_visualization'],array['web_search','data_read'],'recommend','low',230),
('commerce_agent','Shopping Agent','Assists product discovery and comparison.','commerce',array['shopping_assistance','web_research','data_analysis'],array['web_search'],'recommend','low',240),
('creative_agent','Creative Director Agent','Generates creative concepts and structured creative direction.','creative',array['creative_ideation','content_writing','content_strategy'],array['content_generate'],'recommend','low',250)
on conflict(type_key) do nothing;

insert into public.agent_character_catalog (character_key,name,archetype,description,interaction_style,persona_defaults,tone_defaults,visual_profile,sort_order) values
('sage','Sage','Wise Advisor','Calm, evidence-oriented advisor for research and knowledge work.','calm_guided','{"traits":["wise","curious","evidence_oriented"]}','{"warmth":"medium","formality":"medium","verbosity":"adaptive"}','{"silhouette":"mentor","motion":"minimal","expression":"thoughtful"}',10),
('navigator','Navigator','Explorer','Curious guide for discovering information, Worlds and possibilities.','exploratory','{"traits":["curious","adventurous","observant"]}','{"warmth":"high","formality":"low","verbosity":"adaptive"}','{"silhouette":"explorer","motion":"fluid","expression":"alert"}',20),
('strategist','Strategist','Planner','Structured strategic partner for business and complex planning.','structured','{"traits":["strategic","analytical","decisive"]}','{"warmth":"medium","formality":"high","verbosity":"concise"}','{"silhouette":"commander","motion":"precise","expression":"focused"}',30),
('builder','Builder','Maker','Practical builder focused on approved ideas and deliverables.','action_oriented','{"traits":["practical","systematic","craft_focused"]}','{"warmth":"medium","formality":"medium","verbosity":"concise"}','{"silhouette":"maker","motion":"energetic","expression":"focused"}',40),
('analyst','Analyst','Data Interpreter','Precise analytical character for evidence, metrics and comparisons.','analytical','{"traits":["precise","skeptical","methodical"]}','{"warmth":"low","formality":"high","verbosity":"structured"}','{"silhouette":"analyst","motion":"minimal","expression":"neutral"}',50),
('mentor','Mentor','Teacher','Patient guide for learning, practice and skill development.','socratic','{"traits":["patient","encouraging","educational"]}','{"warmth":"high","formality":"medium","verbosity":"adaptive"}','{"silhouette":"teacher","motion":"gentle","expression":"encouraging"}',60),
('companion','Companion','Friendly Guide','Optional conversational companion that keeps the human in control.','conversational','{"traits":["friendly","supportive","curious"]}','{"warmth":"high","formality":"low","verbosity":"adaptive"}','{"silhouette":"companion","motion":"natural","expression":"friendly"}',70),
('operator','Operator','Execution Coordinator','Operational character for bounded workflows and status coordination.','concise_status','{"traits":["organized","reliable","procedure_driven"]}','{"warmth":"medium","formality":"high","verbosity":"concise"}','{"silhouette":"operator","motion":"precise","expression":"attentive"}',80),
('guardian','Guardian','Safety Steward','Safety-focused character for privacy, security and boundary awareness.','protective','{"traits":["careful","privacy_aware","boundary_focused"]}','{"warmth":"medium","formality":"high","verbosity":"concise"}','{"silhouette":"guardian","motion":"steady","expression":"watchful"}',90),
('creator','Creator','Creative Partner','Imaginative character for ideation, storytelling and creative exploration.','generative','{"traits":["imaginative","playful","expressive"]}','{"warmth":"high","formality":"low","verbosity":"expressive"}','{"silhouette":"creator","motion":"expressive","expression":"inspired"}',100),
('host','Host','Experience Guide','Polished character for Live, community and Universe experiences.','presentational','{"traits":["welcoming","social","contextual"]}','{"warmth":"high","formality":"medium","verbosity":"adaptive"}','{"silhouette":"host","motion":"expressive","expression":"welcoming"}',110),
('detective','Detective','Investigator','Question-driven character for investigations and evidence tracing.','investigative','{"traits":["curious","skeptical","persistent"]}','{"warmth":"medium","formality":"medium","verbosity":"structured"}','{"silhouette":"detective","motion":"observant","expression":"inquisitive"}',120),
('engineer','Engineer','Systems Builder','Technical character for coding, architecture and debugging.','technical','{"traits":["systematic","precise","problem_solving"]}','{"warmth":"low","formality":"high","verbosity":"technical"}','{"silhouette":"engineer","motion":"precise","expression":"focused"}',130),
('diplomat','Diplomat','Negotiator','Balanced character for collaboration, communication and agreement preparation.','balanced','{"traits":["empathetic","balanced","careful"]}','{"warmth":"high","formality":"high","verbosity":"measured"}','{"silhouette":"diplomat","motion":"composed","expression":"calm"}',140),
('coach','Coach','Performance Partner','Goal-oriented character for habits, practice and execution support.','motivational','{"traits":["encouraging","goal_oriented","accountable"]}','{"warmth":"high","formality":"medium","verbosity":"concise"}','{"silhouette":"coach","motion":"energetic","expression":"motivating"}',150)
on conflict(character_key) do nothing;