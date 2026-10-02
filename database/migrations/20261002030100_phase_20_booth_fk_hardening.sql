do $$ begin
if not exists(select 1 from pg_constraint where conname='booths_district_id_fkey') then alter table public.booths add constraint booths_district_id_fkey foreign key(district_id) references public.districts(id) on delete cascade; end if;
if not exists(select 1 from pg_constraint where conname='booths_district_zone_id_fkey') then alter table public.booths add constraint booths_district_zone_id_fkey foreign key(district_zone_id) references public.district_zones(id) on delete set null; end if;
end $$;
create index if not exists booths_district_zone_idx on public.booths(district_zone_id,status);
