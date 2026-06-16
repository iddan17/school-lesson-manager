-- Annual planning: recurring teaching slots + per-date lesson sessions,
-- a configurable school-year range, and manual holiday/no-school overrides.

create table if not exists public.teaching_slots (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  school_year int not null,
  day_of_week int not null check (day_of_week >= 0 and day_of_week <= 4),
  start_time time not null,
  end_time time not null,
  room_id uuid references public.rooms(id) on delete set null,
  created_at timestamptz default now(),
  unique (teacher_id, class_id, school_year, day_of_week, start_time)
);

create table if not exists public.slot_sessions (
  id uuid primary key default uuid_generate_v4(),
  slot_id uuid not null references public.teaching_slots(id) on delete cascade,
  date date not null,
  lesson_id uuid references public.lessons(id) on delete set null,
  room_id uuid references public.rooms(id) on delete set null,
  created_at timestamptz default now(),
  unique (slot_id, date)
);

create table if not exists public.school_year_config (
  school_year int primary key,
  start_date date not null,
  end_date date not null
);

create table if not exists public.calendar_exceptions (
  id uuid primary key default uuid_generate_v4(),
  school_year int not null,
  date date not null,
  closed boolean not null,
  reason text,
  unique (school_year, date)
);

alter table public.teaching_slots enable row level security;
alter table public.slot_sessions enable row level security;
alter table public.school_year_config enable row level security;
alter table public.calendar_exceptions enable row level security;

-- teaching_slots: everyone reads; owner teacher or admin writes
create policy "teaching_slots_select" on public.teaching_slots for select to authenticated using (true);
create policy "teaching_slots_insert" on public.teaching_slots for insert to authenticated with check (teacher_id = auth.uid() or is_admin());
create policy "teaching_slots_update" on public.teaching_slots for update to authenticated using (teacher_id = auth.uid() or is_admin());
create policy "teaching_slots_delete" on public.teaching_slots for delete to authenticated using (teacher_id = auth.uid() or is_admin());

-- slot_sessions: everyone reads; writes gated by ownership of the parent slot
create policy "slot_sessions_select" on public.slot_sessions for select to authenticated using (true);
create policy "slot_sessions_insert" on public.slot_sessions for insert to authenticated
  with check (exists (select 1 from public.teaching_slots ts where ts.id = slot_id and (ts.teacher_id = auth.uid() or is_admin())));
create policy "slot_sessions_update" on public.slot_sessions for update to authenticated
  using (exists (select 1 from public.teaching_slots ts where ts.id = slot_id and (ts.teacher_id = auth.uid() or is_admin())));
create policy "slot_sessions_delete" on public.slot_sessions for delete to authenticated
  using (exists (select 1 from public.teaching_slots ts where ts.id = slot_id and (ts.teacher_id = auth.uid() or is_admin())));

-- school_year_config: everyone reads; admin writes
create policy "syc_select" on public.school_year_config for select to authenticated using (true);
create policy "syc_insert" on public.school_year_config for insert to authenticated with check (is_admin());
create policy "syc_update" on public.school_year_config for update to authenticated using (is_admin());
create policy "syc_delete" on public.school_year_config for delete to authenticated using (is_admin());

-- calendar_exceptions: everyone reads; admin writes
create policy "ce_select" on public.calendar_exceptions for select to authenticated using (true);
create policy "ce_insert" on public.calendar_exceptions for insert to authenticated with check (is_admin());
create policy "ce_update" on public.calendar_exceptions for update to authenticated using (is_admin());
create policy "ce_delete" on public.calendar_exceptions for delete to authenticated using (is_admin());
