create table if not exists public.security_devices(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 device_label text not null,user_agent_hash text not null,ip_hash text not null,
 last_seen_at timestamptz not null default timezone('utc',now()),first_seen_at timestamptz not null default timezone('utc',now()),
 revoked_at timestamptz,metadata jsonb not null default '{}'::jsonb,unique(user_id,user_agent_hash,ip_hash));
create index if not exists security_devices_user_idx on public.security_devices(user_id,last_seen_at desc);
alter table public.security_devices enable row level security;
drop policy if exists security_devices_owner_select on public.security_devices;
create policy security_devices_owner_select on public.security_devices for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists security_devices_owner_update on public.security_devices;
create policy security_devices_owner_update on public.security_devices for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create or replace function public.register_security_device(p_device_label text,p_user_agent_hash text,p_ip_hash text)
returns public.security_devices language plpgsql security definer set search_path=''
as $$
declare v public.security_devices;uid uuid:=(select auth.uid());
begin
 if uid is null then raise exception 'authentication_required' using errcode='42501';end if;
 if length(trim(coalesce(p_device_label,'')))<1 or length(p_user_agent_hash)<>64 or length(p_ip_hash)<>64 then raise exception 'invalid_security_device' using errcode='22023';end if;
 insert into public.security_devices(user_id,device_label,user_agent_hash,ip_hash,last_seen_at,revoked_at)
 values(uid,left(trim(p_device_label),120),p_user_agent_hash,p_ip_hash,timezone('utc',now()),null)
 on conflict(user_id,user_agent_hash,ip_hash) do update set device_label=excluded.device_label,last_seen_at=timezone('utc',now()),revoked_at=null
 returning * into v;
 insert into public.audit_logs(actor_user_id,action,resource_type,resource_id,outcome,risk_level,metadata)
 values(uid,'security.device.register','security_device',v.id,'success','low',jsonb_build_object('device_label',v.device_label));
 return v;
end;$$;
revoke all on function public.register_security_device(text,text,text) from public,anon;
grant execute on function public.register_security_device(text,text,text) to authenticated;