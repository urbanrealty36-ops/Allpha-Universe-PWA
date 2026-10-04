-- Phase 27D: canonical governance evidence for transaction drill-down
create or replace function private.get_admin_transaction_governance_context__allpha_sd(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare approvals jsonb; risks jsonb; payouts jsonb; audits jsonb;
begin
  perform private.admin_27c_require_read();
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) into approvals
  from (select id, requester_user_id, requester_agent_id, action, resource_type, resource_id, status, risk_level, decision_by_user_id, decision_reason, expires_at, created_at, decided_at from public.approval_requests where resource_id=p_order_id) x;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) into risks
  from (select id, actor_user_id, actor_agent_id, action, resource_type, resource_id, risk_level, decision, policy_version, created_at from public.risk_assessments where resource_id=p_order_id) x;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) into payouts
  from (select pr.id, pr.requester_user_id, pr.amount, pr.currency, pr.status, pr.risk_level, pr.risk_decision, pr.approval_request_id, pr.decision_by_user_id, pr.decision_reason, pr.disbursement_reference, pr.processed_at, pr.paid_at, pr.failure_reason, pr.created_at, pr.updated_at from public.payout_requests pr where pr.approval_request_id in (select ar.id from public.approval_requests ar where ar.resource_id=p_order_id)) x;
  select coalesce(jsonb_agg(to_jsonb(a) order by a.created_at desc),'[]'::jsonb) into audits
  from public.audit_logs a
  where a.resource_id=p_order_id
     or a.resource_id in (select ar.id from public.approval_requests ar where ar.resource_id=p_order_id)
     or a.resource_id in (select ra.id from public.risk_assessments ra where ra.resource_id=p_order_id)
     or a.resource_id in (select pr.id from public.payout_requests pr where pr.approval_request_id in (select ar.id from public.approval_requests ar where ar.resource_id=p_order_id));
  return jsonb_build_object('order_id',p_order_id,'approvals',approvals,'risk_assessments',risks,'payouts',payouts,'audit',audits);
end;
$$;
create or replace function public.get_admin_transaction_governance_context(p_order_id uuid)
returns jsonb language sql set search_path to '' as $function$
select private.get_admin_transaction_governance_context__allpha_sd($1); $function$;
revoke execute on function public.get_admin_transaction_governance_context(uuid) from anon;
revoke execute on function public.get_admin_transaction_governance_context(uuid) from public;
grant execute on function public.get_admin_transaction_governance_context(uuid) to authenticated;
grant execute on function public.get_admin_transaction_governance_context(uuid) to service_role;