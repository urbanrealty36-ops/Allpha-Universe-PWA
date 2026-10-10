create table if not exists public.theme_asset_lifecycle_audit (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.theme_assets(id) on delete restrict,
  theme_id uuid not null references public.themes(id) on delete restrict,
  theme_version_id uuid references public.theme_versions(id) on delete restrict,
  gate text not null check (gate in ('moderation','safety','performance')),
  decision text not null check (decision in ('approved','restricted','passed','failed','pending')),
  evidence jsonb not null default '{}'::jsonb,
  actor_user_id uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists theme_asset_lifecycle_audit_asset_created_idx
  on public.theme_asset_lifecycle_audit(asset_id, created_at desc);

alter table public.theme_asset_lifecycle_audit enable row level security;
revoke all on public.theme_asset_lifecycle_audit from anon, authenticated;
grant select, insert, update, delete on public.theme_asset_lifecycle_audit to service_role;

create or replace function private.record_v3_theme_asset_gate(
  p_asset_id uuid,
  p_gate text,
  p_decision text,
  p_evidence jsonb,
  p_reason text default null
) returns jsonb
language plpgsql
security definer
set search_path = public, private, auth, pg_temp
as $$
declare
  v_asset public.theme_assets%rowtype;
  v_theme public.themes%rowtype;
  v_user_id uuid := auth.uid();
  v_evidence jsonb := coalesce(p_evidence, '{}'::jsonb);
  v_decision text := lower(coalesce(p_decision, ''));
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;
  if not private.has_platform_permission('admin.manage') then
    raise exception using errcode = '42501', message = 'ADMIN_MANAGE_REQUIRED';
  end if;
  if p_gate not in ('moderation','safety','performance') then
    raise exception using errcode = '22023', message = 'INVALID_ASSET_GATE';
  end if;
  if (p_gate = 'moderation' and v_decision not in ('approved','restricted','pending'))
     or (p_gate in ('safety','performance') and v_decision not in ('passed','failed','pending')) then
    raise exception using errcode = '22023', message = 'INVALID_GATE_DECISION';
  end if;
  if jsonb_typeof(v_evidence) <> 'object' or v_evidence = '{}'::jsonb then
    raise exception using errcode = '22023', message = 'GATE_EVIDENCE_REQUIRED';
  end if;

  select * into v_asset from public.theme_assets where id = p_asset_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'THEME_ASSET_NOT_FOUND'; end if;
  select * into v_theme from public.themes where id = v_asset.theme_id;
  if not found or v_theme.slug <> 'allpha-universe-v3' or v_theme.source <> 'platform'
     or coalesce(v_asset.storage_path,'') not like 'theme-v3-tripo/%' then
    raise exception using errcode = '22023', message = 'ASSET_OUTSIDE_V3_SCOPE';
  end if;

  if p_gate = 'safety' and v_decision = 'passed' then
    if coalesce(v_evidence->>'asset_checksum_sha256','') = ''
       or v_evidence->>'asset_checksum_sha256' is distinct from v_asset.checksum_sha256
       or coalesce(v_evidence->>'scanner','') = ''
       or coalesce(v_evidence->>'scan_id','') = ''
       or coalesce(v_evidence->>'findings','') <> '0' then
      raise exception using errcode = '22023', message = 'SAFETY_EVIDENCE_INCOMPLETE_OR_CHECKSUM_MISMATCH';
    end if;
  end if;
  if p_gate = 'performance' and v_decision = 'passed' then
    if coalesce(v_evidence->>'asset_checksum_sha256','') = ''
       or v_evidence->>'asset_checksum_sha256' is distinct from v_asset.checksum_sha256
       or coalesce(v_evidence->>'device_profile','') = ''
       or coalesce(v_evidence->>'measurement_id','') = ''
       or coalesce(v_evidence->>'measured_at','') = ''
       or coalesce(v_evidence->>'p95_frame_ms','') = ''
       or coalesce(v_evidence->>'memory_mb','') = '' then
      raise exception using errcode = '22023', message = 'PERFORMANCE_EVIDENCE_INCOMPLETE_OR_CHECKSUM_MISMATCH';
    end if;
  end if;
  if p_gate = 'moderation' and v_decision = 'approved'
     and coalesce(trim(v_evidence->>'reviewer_note'),'') = '' then
    raise exception using errcode = '22023', message = 'MODERATION_REVIEW_NOTE_REQUIRED';
  end if;

  insert into public.theme_asset_lifecycle_audit
    (asset_id, theme_id, theme_version_id, gate, decision, evidence, actor_user_id)
  values
    (v_asset.id, v_asset.theme_id, v_asset.theme_version_id, p_gate, v_decision,
     v_evidence || jsonb_build_object('reason', p_reason, 'recorded_at', now()), v_user_id);

  if p_gate = 'moderation' then
    update public.theme_assets set moderation_status =
      case when v_decision = 'approved' then 'approved'
           when v_decision = 'restricted' then 'restricted' else 'pending' end
    where id = v_asset.id;
  elsif p_gate = 'safety' then
    update public.theme_assets set safety_status = v_decision where id = v_asset.id;
  elsif p_gate = 'performance' then
    update public.theme_assets set performance_status = v_decision where id = v_asset.id;
  end if;

  return jsonb_build_object(
    'asset_id', v_asset.id, 'gate', p_gate, 'decision', v_decision,
    'status', 'recorded', 'audit_id', (select id from public.theme_asset_lifecycle_audit
      where asset_id = v_asset.id and actor_user_id = v_user_id order by created_at desc limit 1)
  );
end;
$$;

revoke all on function private.record_v3_theme_asset_gate(uuid,text,text,jsonb,text) from public, anon;
grant execute on function private.record_v3_theme_asset_gate(uuid,text,text,jsonb,text) to authenticated, service_role;
