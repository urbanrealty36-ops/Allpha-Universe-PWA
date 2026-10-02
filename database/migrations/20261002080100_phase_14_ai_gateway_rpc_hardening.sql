-- Phase 14 RPC hardening mirror.
-- Security-definer RPC bodies are maintained in the applied Supabase migration history.

-- create_ai_gateway_request(uuid,text,text[],text,jsonb)
-- record_ai_gateway_attempt(uuid,integer,uuid,uuid,text,integer,integer,integer,integer,numeric,integer,text,text)
-- record_ai_usage_event(uuid,text,uuid,uuid,uuid,integer,integer,integer,numeric,integer,jsonb)
-- record_ai_gateway_outcome(uuid,text,text,uuid,uuid,integer,integer,integer,numeric,integer,text,text,text,jsonb)
--
-- All four functions use security-definer, empty search_path, authenticated-only execution,
-- ownership checks and no public/anonymous execute privilege.
