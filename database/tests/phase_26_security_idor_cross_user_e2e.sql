begin;

insert into auth.users(
  id,instance_id,aud,role,email,raw_app_meta_data,raw_user_meta_data,
  is_super_admin,is_sso_user,is_anonymous,created_at,updated_at,email_confirmed_at
)
values (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '00000000-0000-0000-0000-000000000000',
  'authenticated','authenticated',
  'phase26.idor.e2e@example.invalid',
  '{}','{"test":"phase26"}',
  false,false,false,now(),now(),now()
);

insert into public.security_devices(id,user_id,device_label,user_agent_hash,ip_hash)
values
('11111111-1111-1111-1111-111111111111',
 '12d43b9b-eb8b-4094-9ff6-3031cb822410',
 'idor-test-a',repeat('a',64),repeat('1',64)),
('22222222-2222-2222-2222-222222222222',
 'cccccccc-cccc-cccc-cccc-cccccccccccc',
 'idor-test-b',repeat('b',64),repeat('2',64));

set local role authenticated;
set local request.jwt.claims='{"role":"authenticated","sub":"12d43b9b-eb8b-4094-9ff6-3031cb822410"}';

select
  (select count(*) from public.security_devices)=1 as sees_only_own,
  (select count(*) from public.security_devices where id='22222222-2222-2222-2222-222222222222')=0 as cannot_read_other,
  (select count(*) from public.security_devices where id='11111111-1111-1111-1111-111111111111')=1 as can_read_own,
  (select count(*) from public.security_devices where id='22222222-2222-2222-2222-222222222222' and user_id='12d43b9b-eb8b-4094-9ff6-3031cb822410')=0 as cannot_target_other_owner;

rollback;
