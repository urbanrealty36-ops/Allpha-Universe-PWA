-- Payment, Billing & Economy Completion: subscription lifecycle
create or replace function public.cancel_my_subscription(p_subscription_id uuid)
returns public.billing_subscriptions
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_sub public.billing_subscriptions;
begin
  select * into v_sub
  from public.billing_subscriptions
  where id=p_subscription_id
    and user_id=(select auth.uid())
  for update;

  if v_sub.id is null then
    raise exception 'subscription_not_found' using errcode='P0002';
  end if;

  if v_sub.status not in ('active','past_due','paused','pending_payment') then
    raise exception 'subscription_not_cancellable' using errcode='22023';
  end if;

  if v_sub.status='pending_payment' then
    update public.billing_subscriptions
      set status='cancelled',cancelled_at=timezone('utc',now()),updated_at=timezone('utc',now())
      where id=v_sub.id
      returning * into v_sub;

    update public.billing_invoices
      set status='void',updated_at=timezone('utc',now())
      where subscription_id=v_sub.id and status='open';

    update public.commerce_orders
      set status='cancelled',updated_at=timezone('utc',now())
      where id in (select order_id from public.billing_invoices where subscription_id=v_sub.id)
        and status='pending_payment';
  else
    update public.billing_subscriptions
      set cancel_at_period_end=true,updated_at=timezone('utc',now())
      where id=v_sub.id
      returning * into v_sub;
  end if;

  insert into public.audit_logs(actor_user_id,action,resource_type,resource_id,outcome,metadata)
  values (
    (select auth.uid()),
    'billing.subscription.cancel',
    'billing_subscription',
    v_sub.id,
    case when v_sub.status='cancelled' then 'cancelled' else 'cancel_at_period_end' end,
    jsonb_build_object('subscription_id',v_sub.id)
  );

  return v_sub;
end;
$$;

revoke all on function public.cancel_my_subscription(uuid) from public;
grant execute on function public.cancel_my_subscription(uuid) to authenticated;
