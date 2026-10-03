-- Phase 23E — Review + Reputation + History.
-- Uses existing Agent Reputation Events and Audit Ledger; no second reputation engine.

create table if not exists public.agent_collaboration_results (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references public.agent_collaboration_agreements(id) on delete cascade,
  collaboration_request_id uuid not null references public.agent_collaboration_requests(id) on delete restrict,
  negotiation_id uuid not null references public.agent_collaboration_negotiations(id) on delete restrict,
  requester_agent_id uuid not null references public.agents(id) on delete restrict,
  target_agent_id uuid not null references public.agents(id) on delete restrict,
  requester_owner_user_id uuid not null references auth.users(id) on delete restrict,
  target_owner_user_id uuid not null references auth.users(id) on delete restrict,
  execution_command_id uuid references public.agent_commands(id) on delete set null,
  workflow_run_id uuid references public.workflow_runs(id) on delete set null,
  status text not null default 'recorded' check (status in ('recorded','successful','partial','failed','cancelled','disputed')),
  outcome_summary text,
  output jsonb not null default '{}'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  recorded_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now())
);
create unique index if not exists agent_collaboration_results_agreement_uidx on public.agent_collaboration_results(agreement_id);
create index if not exists agent_collaboration_results_requester_idx on public.agent_collaboration_results(requester_agent_id,created_at desc);
create index if not exists agent_collaboration_results_target_idx on public.agent_collaboration_results(target_agent_id,created_at desc);

create table if not exists public.agent_collaboration_reviews (
  id uuid primary key default gen_random_uuid(),
  result_id uuid not null references public.agent_collaboration_results(id) on delete cascade,
  agreement_id uuid not null references public.agent_collaboration_agreements(id) on delete cascade,
  reviewer_user_id uuid not null references auth.users(id) on delete restrict,
  reviewer_agent_id uuid references public.agents(id) on delete set null,
  subject_agent_id uuid not null references public.agents(id) on delete restrict,
  role text not null check (role in ('requester_owner','target_owner','observer')),
  rating smallint not null check (rating between 1 and 5),
  outcome text not null check (outcome in ('successful','partial','failed','disputed')),
  review_text text,
  dimensions jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'published' check (status in ('draft','published','withdrawn','disputed')),
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  unique(result_id,reviewer_user_id)
);
create index if not exists agent_collaboration_reviews_subject_idx on public.agent_collaboration_reviews(subject_agent_id,created_at desc);
create index if not exists agent_collaboration_reviews_result_idx on public.agent_collaboration_reviews(result_id,created_at desc);

alter table public.agent_collaboration_results enable row level security;
alter table public.agent_collaboration_reviews enable row level security;

drop policy if exists agent_collaboration_results_participant_read on public.agent_collaboration_results;
create policy agent_collaboration_results_participant_read on public.agent_collaboration_results for select to authenticated using (requester_owner_user_id=(select auth.uid()) or target_owner_user_id=(select auth.uid()));

drop policy if exists agent_collaboration_reviews_participant_read on public.agent_collaboration_reviews;
create policy agent_collaboration_reviews_participant_read on public.agent_collaboration_reviews for select to authenticated using (
 reviewer_user_id=(select auth.uid()) or exists(select 1 from public.agent_collaboration_results r where r.id=agent_collaboration_reviews.result_id and (r.requester_owner_user_id=(select auth.uid()) or r.target_owner_user_id=(select auth.uid())))
);

create or replace function public.record_agent_collaboration_result(p_agreement_id uuid,p_status text,p_outcome_summary text default null,p_output jsonb default '{}'::jsonb,p_metrics jsonb default '{}'::jsonb,p_execution_command_id uuid default null,p_workflow_run_id uuid default null)
returns public.agent_collaboration_results language plpgsql security definer set search_path to ''
as $function$
declare uid uuid:=auth.uid(); a public.agent_collaboration_agreements; r public.agent_collaboration_requests; n public.agent_collaboration_negotiations; row public.agent_collaboration_results;
begin
 if uid is null then raise exception 'AUTH_REQUIRED'; end if;
 if p_status not in ('recorded','successful','partial','failed','cancelled','disputed') then raise exception 'COLLABORATION_RESULT_STATUS_INVALID'; end if;
 select * into a from public.agent_collaboration_agreements where id=p_agreement_id and (requester_owner_user_id=uid or target_owner_user_id=uid);
 if not found then raise exception 'COLLABORATION_AGREEMENT_NOT_FOUND_OR_NOT_PARTICIPANT'; end if;
 if a.state <> 'approved' then raise exception 'COLLABORATION_AGREEMENT_NOT_APPROVED'; end if;
 select * into r from public.agent_collaboration_requests where id=a.collaboration_request_id;
 select * into n from public.agent_collaboration_negotiations where id=a.negotiation_id;
 insert into public.agent_collaboration_results(agreement_id,collaboration_request_id,negotiation_id,requester_agent_id,target_agent_id,requester_owner_user_id,target_owner_user_id,execution_command_id,workflow_run_id,status,outcome_summary,output,metrics,completed_at,recorded_by_user_id)
 values(a.id,r.id,n.id,a.requester_agent_id,a.target_agent_id,a.requester_owner_user_id,a.target_owner_user_id,p_execution_command_id,p_workflow_run_id,p_status,p_outcome_summary,coalesce(p_output,'{}'::jsonb),coalesce(p_metrics,'{}'::jsonb),case when p_status in ('successful','partial','failed','cancelled','disputed') then now() else null end,uid)
 on conflict(agreement_id) do update set status=excluded.status,outcome_summary=excluded.outcome_summary,output=excluded.output,metrics=excluded.metrics,execution_command_id=coalesce(excluded.execution_command_id,agent_collaboration_results.execution_command_id),workflow_run_id=coalesce(excluded.workflow_run_id,agent_collaboration_results.workflow_run_id),completed_at=excluded.completed_at,recorded_by_user_id=uid,updated_at=now()
 returning * into row;
 insert into public.audit_logs(actor_user_id,action,resource_type,resource_id,outcome,metadata) values(uid,'collaboration.result.recorded','agent_collaboration_result',row.id,'success',jsonb_build_object('agreement_id',row.agreement_id,'status',row.status));
 return row;
end;$function$;

create or replace function public.submit_agent_collaboration_review(p_result_id uuid,p_rating smallint,p_outcome text,p_review_text text default null,p_dimensions jsonb default '{}'::jsonb)
returns public.agent_collaboration_reviews language plpgsql security definer set search_path to ''
as $function$
declare uid uuid:=auth.uid(); r public.agent_collaboration_results; a public.agent_collaboration_agreements; subject uuid; role_value text; reviewer_agent uuid; row public.agent_collaboration_reviews; inserted_new boolean; delta numeric;
begin
 if uid is null then raise exception 'AUTH_REQUIRED'; end if;
 if p_rating not between 1 and 5 then raise exception 'COLLABORATION_REVIEW_RATING_INVALID'; end if;
 if p_outcome not in ('successful','partial','failed','disputed') then raise exception 'COLLABORATION_REVIEW_OUTCOME_INVALID'; end if;
 select * into r from public.agent_collaboration_results where id=p_result_id and (requester_owner_user_id=uid or target_owner_user_id=uid);
 if not found then raise exception 'COLLABORATION_RESULT_NOT_FOUND_OR_NOT_PARTICIPANT'; end if;
 select * into a from public.agent_collaboration_agreements where id=r.agreement_id;
 if uid=a.requester_owner_user_id then subject=r.target_agent_id; role_value='requester_owner'; reviewer_agent=r.requester_agent_id;
 elsif uid=a.target_owner_user_id then subject=r.requester_agent_id; role_value='target_owner'; reviewer_agent=r.target_agent_id;
 else raise exception 'COLLABORATION_REVIEWER_NOT_ALLOWED'; end if;
 delta:=round((p_rating::numeric-3)*1.0,2);
 select exists(select 1 from public.agent_collaboration_reviews where result_id=p_result_id and reviewer_user_id=uid) into inserted_new;
 insert into public.agent_collaboration_reviews(result_id,agreement_id,reviewer_user_id,reviewer_agent_id,subject_agent_id,role,rating,outcome,review_text,dimensions)
 values(p_result_id,r.agreement_id,uid,reviewer_agent,subject,role_value,p_rating,p_outcome,p_review_text,coalesce(p_dimensions,'{}'::jsonb))
 on conflict(result_id,reviewer_user_id) do update set rating=excluded.rating,outcome=excluded.outcome,review_text=excluded.review_text,dimensions=excluded.dimensions,status='published',updated_at=now()
 returning * into row;
 if not inserted_new and row.status='published' then
   insert into public.agent_reputation_events(agent_id,event_type,score_delta,source_type,source_id,metadata)
   values(subject,'collaboration_review',delta,'agent_collaboration_review',row.id,jsonb_build_object('result_id',p_result_id,'agreement_id',r.agreement_id,'rating',p_rating,'outcome',p_outcome,'reviewer_user_id',uid));
   insert into public.audit_logs(actor_user_id,action,resource_type,resource_id,outcome,metadata) values(uid,'collaboration.review.published','agent_collaboration_review',row.id,'success',jsonb_build_object('subject_agent_id',subject,'rating',p_rating,'outcome',p_outcome,'reputation_delta',delta));
 end if;
 return row;
end;$function$;

create or replace function public.get_agent_collaboration_history(p_agent_id uuid,p_limit integer default 50)
returns table(result_id uuid,agreement_id uuid,requester_agent_id uuid,target_agent_id uuid,status text,outcome_summary text,metrics jsonb,completed_at timestamptz,review_count bigint,average_rating numeric)
language sql security definer set search_path to ''
as $function$
select r.id,r.agreement_id,r.requester_agent_id,r.target_agent_id,r.status,r.outcome_summary,r.metrics,r.completed_at,count(rv.id),round(avg(rv.rating)::numeric,2)
from public.agent_collaboration_results r left join public.agent_collaboration_reviews rv on rv.result_id=r.id and rv.status='published'
where (r.requester_agent_id=p_agent_id or r.target_agent_id=p_agent_id)
and exists(select 1 from public.agents ag where ag.id=p_agent_id and ag.owner_user_id=auth.uid())
group by r.id order by coalesce(r.completed_at,r.created_at) desc limit greatest(1,least(coalesce(p_limit,50),100));
$function$;

revoke all on function public.record_agent_collaboration_result(uuid,text,text,jsonb,jsonb,uuid,uuid) from public,anon;
grant execute on function public.record_agent_collaboration_result(uuid,text,text,jsonb,jsonb,uuid,uuid) to authenticated;
revoke all on function public.submit_agent_collaboration_review(uuid,smallint,text,text,jsonb) from public,anon;
grant execute on function public.submit_agent_collaboration_review(uuid,smallint,text,text,jsonb) to authenticated;
revoke all on function public.get_agent_collaboration_history(uuid,integer) from public,anon;
grant execute on function public.get_agent_collaboration_history(uuid,integer) to authenticated;
