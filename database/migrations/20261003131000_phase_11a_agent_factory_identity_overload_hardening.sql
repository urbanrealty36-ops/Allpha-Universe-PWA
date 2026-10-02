-- Remove the pre-factory overload so Agent Factory has one canonical creation RPC.
drop function if exists public.create_agent_identity(text,text,text,uuid,public.visibility_level,jsonb,jsonb,jsonb,jsonb,jsonb,text,text,numeric,numeric,numeric,numeric);
