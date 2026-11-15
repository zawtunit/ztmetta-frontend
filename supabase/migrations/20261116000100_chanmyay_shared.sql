-- Apply once to the chosen Supabase project. No credentials or live donor data.
create schema if not exists cm_private;
revoke all on schema cm_private from public, anon, authenticated;

create table public.cm_administrators (
  id smallint primary key default 1 check (id = 1),
  user_id uuid not null unique references auth.users(id) on delete restrict
);
alter table public.cm_administrators enable row level security;
revoke all on public.cm_administrators from public, anon, authenticated;

create function public.cm_is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.cm_administrators where user_id = (select auth.uid()));
$$;
revoke all on function public.cm_is_admin() from public, anon;
grant execute on function public.cm_is_admin() to authenticated;

create table public.cm_offerings (
  id uuid primary key,
  name text not null check (char_length(btrim(name)) between 1 and 160),
  phone text not null default '' check (char_length(phone) <= 40),
  dedication text not null default '' check (char_length(dedication) <= 300),
  start_date date not null check (start_date between date '0001-01-01' and date '9999-12-31'),
  end_date date not null check (end_date >= start_date and end_date <= date '9999-12-31'),
  categories text[] not null check (cardinality(categories) between 1 and 4 and categories <@ array['breakfast','lunch','water','rental']::text[] and array_position(categories, null) is null),
  status text not null default 'Approved' check (status in ('Pending','Approved','Cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1 check (version > 0)
);
create index cm_offerings_tv_dates on public.cm_offerings (start_date, end_date) where status = 'Approved';
alter table public.cm_offerings enable row level security;
create policy cm_admin_read on public.cm_offerings for select to authenticated using ((select public.cm_is_admin()));
revoke all on public.cm_offerings from public, anon, authenticated;
grant select on public.cm_offerings to authenticated;

create table public.cm_display_settings (
  id smallint primary key default 1 check (id = 1),
  event_name text not null default '' check (char_length(event_name) <= 160),
  updated_at timestamptz not null default now(),
  version integer not null default 1 check (version > 0)
);
insert into public.cm_display_settings (id) values (1);
alter table public.cm_display_settings enable row level security;
create policy cm_admin_settings_read on public.cm_display_settings for select to authenticated using ((select public.cm_is_admin()));
revoke all on public.cm_display_settings from public, anon, authenticated;
grant select on public.cm_display_settings to authenticated;

create table cm_private.audit_log (
  id bigint generated always as identity primary key,
  changed_at timestamptz not null default now(),
  actor uuid,
  table_name text not null,
  action text not null,
  old_record jsonb,
  new_record jsonb
);
create function cm_private.audit_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into cm_private.audit_log (actor, table_name, action, old_record, new_record)
  values (auth.uid(), tg_table_name, tg_op, case when tg_op <> 'INSERT' then to_jsonb(old) end, to_jsonb(new));
  return new;
end;
$$;
revoke all on function cm_private.audit_change() from public, anon, authenticated;
create trigger cm_offering_audit after insert or update on public.cm_offerings for each row execute function cm_private.audit_change();
create trigger cm_settings_audit after update on public.cm_display_settings for each row execute function cm_private.audit_change();

-- All writes check the one administrator on the server. Version checks prevent
-- an edit from one device silently overwriting changes made on another device.
create function public.cm_save_offering(p_donor jsonb, p_expected_version integer default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  saved public.cm_offerings;
  cats text[];
begin
  if not public.cm_is_admin() then raise exception 'Administrator login is required' using errcode = '42501'; end if;
  if jsonb_typeof(p_donor) <> 'object' then raise exception 'Invalid offering'; end if;
  select array_agg(distinct value order by value) into cats from jsonb_array_elements_text(p_donor->'categories');
  if p_expected_version is null then
    insert into public.cm_offerings (id, name, phone, dedication, start_date, end_date, categories, status)
    values ((p_donor->>'id')::uuid, btrim(p_donor->>'name'), coalesce(p_donor->>'phone',''), coalesce(p_donor->>'dedication',''),
      (p_donor->>'start_date')::date, (p_donor->>'end_date')::date, cats, coalesce(p_donor->>'status','Approved'))
    returning * into saved;
  else
    update public.cm_offerings set name = btrim(p_donor->>'name'), phone = coalesce(p_donor->>'phone',''),
      dedication = coalesce(p_donor->>'dedication',''), start_date = (p_donor->>'start_date')::date,
      end_date = (p_donor->>'end_date')::date, categories = cats, status = p_donor->>'status',
      updated_at = clock_timestamp(), version = version + 1
    where id = (p_donor->>'id')::uuid and version = p_expected_version returning * into saved;
    if not found then raise exception 'This record changed on another device. Close and reopen it before saving.' using errcode = '40001'; end if;
  end if;
  return to_jsonb(saved);
end;
$$;
revoke all on function public.cm_save_offering(jsonb, integer) from public, anon;
grant execute on function public.cm_save_offering(jsonb, integer) to authenticated;

create function public.cm_save_display_settings(p_event_name text, p_expected_version integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare saved public.cm_display_settings;
begin
  if not public.cm_is_admin() then raise exception 'Administrator login is required' using errcode = '42501'; end if;
  update public.cm_display_settings set event_name = btrim(p_event_name), version = version + 1, updated_at = clock_timestamp()
    where id = 1 and version = p_expected_version returning * into saved;
  if not found then raise exception 'TV settings changed on another device. Reload before saving.' using errcode = '40001'; end if;
  return to_jsonb(saved);
end;
$$;
revoke all on function public.cm_save_display_settings(text, integer) from public, anon;
grant execute on function public.cm_save_display_settings(text, integer) to authenticated;

-- The public TV endpoint deliberately projects ONLY approved display fields.
-- Phone numbers, administrator IDs, timestamps and audit records are never returned.
create function public.cm_tv_display(p_date date) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'event_name', (select event_name from public.cm_display_settings where id = 1),
    'donors', coalesce((select jsonb_agg(jsonb_build_object(
      'id', id, 'name', name, 'dedication', dedication, 'start_date', start_date,
      'end_date', end_date, 'categories', categories, 'status', status
    ) order by created_at, id) from public.cm_offerings
      where status = 'Approved' and start_date <= p_date and end_date >= p_date), '[]'::jsonb)
  );
$$;
revoke all on function public.cm_tv_display(date) from public;
grant execute on function public.cm_tv_display(date) to anon, authenticated;

create function public.cm_import_offerings(p_donors jsonb) returns integer
language plpgsql security definer set search_path = '' as $$
declare item jsonb; imported integer := 0;
begin
  if not public.cm_is_admin() then raise exception 'Administrator login is required' using errcode = '42501'; end if;
  if jsonb_typeof(p_donors) <> 'array' or jsonb_array_length(p_donors) > 2000 then raise exception 'Import up to 2000 records at once'; end if;
  for item in select value from jsonb_array_elements(p_donors) loop
    if not exists(select 1 from public.cm_offerings where id = (item->>'id')::uuid) then
      perform public.cm_save_offering(item, null);
      imported := imported + 1;
    end if;
  end loop;
  return imported;
end;
$$;
revoke all on function public.cm_import_offerings(jsonb) from public, anon;
grant execute on function public.cm_import_offerings(jsonb) to authenticated;
