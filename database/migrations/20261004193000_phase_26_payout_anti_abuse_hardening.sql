-- Phase 26 payout anti-abuse hardening.
-- request_payout now rejects a second pending_approval request for the same seller
-- before calculating/reserving another withdrawal.
create or replace function public.request_payout(p_amount bigint,p_currency text default 'IDR') returns public.payout_requests
language plpgsql security definer set search_path='' as $$
declare uid uuid:=(select auth.uid());acct public.payout_accounts;v_earned bigint;v_reserved bigint;v_available bigint;pr public.payout_requests;ar public.approval_requests;
begin
if uid is null then raise exception 'authentication_required' using errcode='42501';end if;
if p_currency<>'IDR' or p_amount is null or p_amount<=0 then raise exception 'invalid_payout_amount' using errcode='22023';end if;
if exists(select 1 from public.payout_requests where requester_user_id=uid and status='pending_approval') then raise exception 'payout_pending_exists' using errcode='23505';end if;
select * into acct from public.payout_accounts where user_id=uid and is_default and status='active' order by created_at desc limit 1;if acct.id is null then raise exception 'payout_account_required' using errcode='42202';end if;
select coalesce(sum(coi.total_amount),0)::bigint into v_earned from public.commerce_order_items coi join public.commerce_orders co on co.id=coi.order_id where coi.seller_owner_user_id=uid and co.order_kind='marketplace' and co.status in('paid','completed') and exists(select 1 from public.commerce_payments cp where cp.order_id=co.id and cp.status='captured');
select coalesce(sum(amount),0)::bigint into v_reserved from public.payout_requests where requester_user_id=uid and status in('pending_approval','approved','processing','paid');v_available:=greatest(0,v_earned-v_reserved);
if p_amount>v_available then raise exception 'payout_exceeds_available_balance' using errcode='22003';end if;
insert into public.payout_requests(requester_user_id,payout_account_id,amount,currency,status,risk_level,risk_decision) values(uid,acct.id,p_amount,p_currency,'pending_approval','high','review') returning * into pr;
insert into public.approval_requests(requester_user_id,action,resource_type,resource_id,status,risk_level,payload,expires_at) values(uid,'payout.request','payout_request',pr.id,'pending'::public.approval_status,'high'::public.risk_level,jsonb_build_object('amount',p_amount,'currency',p_currency,'payout_account_id',acct.id,'requires_admin_approval',true),timezone('utc',now())+interval '7 days') returning * into ar;
update public.payout_requests set approval_request_id=ar.id,updated_at=timezone('utc',now()) where id=pr.id returning * into pr;
insert into public.risk_assessments(actor_user_id,action,resource_type,resource_id,risk_level,decision,factors,policy_version) values(uid,'payout.request','payout_request',pr.id,'high','review',jsonb_build_object('money_movement',true,'admin_approval_required',true,'available_balance',v_available,'requested_amount',p_amount,'pending_request_guard',true),1);
insert into public.payout_events(payout_request_id,actor_user_id,event_type,to_status,amount,currency,payload) values(pr.id,uid,'requested','pending_approval',p_amount,p_currency,jsonb_build_object('approval_request_id',ar.id));
insert into public.audit_logs(actor_user_id,action,resource_type,resource_id,outcome,risk_level,metadata) values(uid,'payout.requested','payout_request',pr.id,'pending_approval','high',jsonb_build_object('amount',p_amount,'currency',p_currency,'approval_request_id',ar.id));return pr;end;$$;
revoke all on function public.request_payout(bigint,text) from public,anon;grant execute on function public.request_payout(bigint,text) to authenticated;