

-- Phase 22F completion: server-authoritative Live transport lifecycle.
create or replace function public.start_live_session(p_session_id uuid,p_stream_provider text,p_stream_reference text)
returns public.live_sessions language plpgsql security definer set search_path=''
as $$ declare s public.live_sessions; begin
 if (select auth.uid()) is null then raise exception 'AUTH_REQUIRED'; end if;
 if nullif(trim(coalesce(p_stream_provider,'')),'') is null then raise exception 'LIVE_STREAM_PROVIDER_REQUIRED'; end if;
 if nullif(trim(coalesce(p_stream_reference,'')),'') is null then raise exception 'LIVE_STREAM_REFERENCE_REQUIRED'; end if;
 select * into s from public.live_sessions where id=p_session_id and host_user_id=(select auth.uid()) for update;
 if s.id is null then raise exception 'LIVE_SESSION_NOT_FOUND_OR_NOT_OWNED'; end if;
 if s.status not in ('draft','scheduled') then raise exception 'LIVE_SESSION_NOT_STARTABLE'; end if;
 if s.experience_template_id is null or s.experience_template_version_id is null then raise exception 'LIVE_EXPERIENCE_TEMPLATE_REQUIRED'; end if;
 update public.live_sessions set status='live',stream_provider=trim(p_stream_provider),stream_reference=trim(p_stream_reference),started_at=timezone('utc',now()),ended_at=null,updated_at=timezone('utc',now()) where id=s.id returning * into s; return s;
end; $$;
create or replace function public.end_live_session(p_session_id uuid)
returns public.live_sessions language plpgsql security definer set search_path=''
as $$ declare s public.live_sessions; begin
 if (select auth.uid()) is null then raise exception 'AUTH_REQUIRED'; end if;
 select * into s from public.live_sessions where id=p_session_id and host_user_id=(select auth.uid()) for update;
 if s.id is null then raise exception 'LIVE_SESSION_NOT_FOUND_OR_NOT_OWNED'; end if;
 if s.status <> 'live' then raise exception 'LIVE_SESSION_NOT_LIVE'; end if;
 update public.live_sessions set status='ended',ended_at=timezone('utc',now()),updated_at=timezone('utc',now()) where id=s.id returning * into s; return s;
end; $$;
revoke all on function public.start_live_session(uuid,text,text) from public,anon,authenticated;
revoke all on function public.end_live_session(uuid) from public,anon,authenticated;
grant execute on function public.start_live_session(uuid,text,text) to authenticated;
grant execute on function public.end_live_session(uuid) to authenticated;
