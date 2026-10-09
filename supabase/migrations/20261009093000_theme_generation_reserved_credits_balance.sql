create or replace function public.get_ai_credit_balance()
returns integer
language sql
security definer
set search_path = ''
as $$
  select coalesce(sum(case
    when entry_type in ('grant','purchase','reward','refund','adjustment') and status='posted' then amount
    when entry_type='debit' and status in ('posted','reserved') then -amount
    else 0
  end),0)::integer
  from public.ai_credit_ledger
  where user_id=(select auth.uid());
$$;
