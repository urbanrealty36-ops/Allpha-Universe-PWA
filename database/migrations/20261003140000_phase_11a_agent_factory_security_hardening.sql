-- Allpha Universe — Agent Factory SECURITY DEFINER public execute hardening
-- Keep the canonical factory RPC available to authenticated API calls only.
revoke execute on function public.create_agent_identity(
  text,text,text,uuid,public.visibility_level,jsonb,jsonb,jsonb,jsonb,jsonb,
  text,text,numeric,numeric,numeric,numeric,jsonb
) from anon;
