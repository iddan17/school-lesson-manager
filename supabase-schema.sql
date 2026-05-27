-- ================================
-- מערכת שיעורים - סכמת מסד נתונים
-- ================================

-- הרשאת UUID
create extension if not exists "uuid-ossp";

-- ============ TABLES ============

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null,
  role text not null check (role in ('teacher', 'admin')) default 'teacher',
  created_at timestamptz default now()
);

create table subjects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  color text not null default '#6366f1',
  created_at timestamptz default now()
);

create table classes (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  grade int not null,
  created_at timestamptz default now()
);

create table rooms (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  capacity int,
  created_at timestamptz default now()
);

create table lessons (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  has_materials boolean not null default false,
  has_equipment boolean not null default false,
  materials_notes text,
  equipment_notes text,
  general_notes text,
  preferred_room_id uuid references rooms(id) on delete set null,
  created_at timestamptz default now()
);

create table lesson_subjects (
  lesson_id uuid not null references lessons(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  primary key (lesson_id, subject_id)
);

create table schedule_entries (
  id uuid primary key default uuid_generate_v4(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  school_year int not null,
  day_of_week int not null check (day_of_week between 0 and 4),
  start_time time not null,
  end_time time not null,
  room_id uuid references rooms(id) on delete set null,
  created_at timestamptz default now()
);

-- ============ TRIGGER: auto-create profile on signup ============

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'teacher')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============ ROW LEVEL SECURITY ============

alter table profiles enable row level security;
alter table subjects enable row level security;
alter table classes enable row level security;
alter table rooms enable row level security;
alter table lessons enable row level security;
alter table lesson_subjects enable row level security;
alter table schedule_entries enable row level security;

-- helper: האם המשתמש הנוכחי הוא admin
create or replace function is_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles: כל מחובר קורא; עורך רק את עצמו; admin עורך הכל
create policy "profiles_select" on profiles for select to authenticated using (true);
create policy "profiles_update_self" on profiles for update to authenticated using (auth.uid() = id);
create policy "profiles_update_admin" on profiles for update to authenticated using (is_admin());

-- subjects: כולם קוראים; admin כותב
create policy "subjects_select" on subjects for select to authenticated using (true);
create policy "subjects_insert" on subjects for insert to authenticated with check (is_admin());
create policy "subjects_update" on subjects for update to authenticated using (is_admin());
create policy "subjects_delete" on subjects for delete to authenticated using (is_admin());

-- classes: כולם קוראים; admin כותב
create policy "classes_select" on classes for select to authenticated using (true);
create policy "classes_insert" on classes for insert to authenticated with check (is_admin());
create policy "classes_update" on classes for update to authenticated using (is_admin());
create policy "classes_delete" on classes for delete to authenticated using (is_admin());

-- rooms: כולם קוראים; admin כותב
create policy "rooms_select" on rooms for select to authenticated using (true);
create policy "rooms_insert" on rooms for insert to authenticated with check (is_admin());
create policy "rooms_update" on rooms for update to authenticated using (is_admin());
create policy "rooms_delete" on rooms for delete to authenticated using (is_admin());

-- lessons: כולם קוראים; teacher כותב/עורך שלו; admin עורך הכל
create policy "lessons_select" on lessons for select to authenticated using (true);
create policy "lessons_insert" on lessons for insert to authenticated with check (auth.uid() = teacher_id);
create policy "lessons_update_own" on lessons for update to authenticated using (auth.uid() = teacher_id);
create policy "lessons_update_admin" on lessons for update to authenticated using (is_admin());
create policy "lessons_delete_own" on lessons for delete to authenticated using (auth.uid() = teacher_id);
create policy "lessons_delete_admin" on lessons for delete to authenticated using (is_admin());

-- lesson_subjects: כולם קוראים; teacher ו-admin כותבים לפי בעלות על השיעור
create policy "lesson_subjects_select" on lesson_subjects for select to authenticated using (true);
create policy "lesson_subjects_insert" on lesson_subjects for insert to authenticated
  with check (
    exists (select 1 from lessons where id = lesson_id and (teacher_id = auth.uid() or is_admin()))
  );
create policy "lesson_subjects_delete" on lesson_subjects for delete to authenticated
  using (
    exists (select 1 from lessons where id = lesson_id and (teacher_id = auth.uid() or is_admin()))
  );

-- schedule_entries: כולם קוראים; teacher כותב/עורך שלו; admin עורך הכל
create policy "schedule_select" on schedule_entries for select to authenticated using (true);
create policy "schedule_insert" on schedule_entries for insert to authenticated
  with check (
    exists (select 1 from lessons where id = lesson_id and teacher_id = auth.uid())
  );
create policy "schedule_update_own" on schedule_entries for update to authenticated
  using (
    exists (select 1 from lessons where id = lesson_id and teacher_id = auth.uid())
  );
create policy "schedule_update_admin" on schedule_entries for update to authenticated using (is_admin());
create policy "schedule_delete_own" on schedule_entries for delete to authenticated
  using (
    exists (select 1 from lessons where id = lesson_id and teacher_id = auth.uid())
  );
create policy "schedule_delete_admin" on schedule_entries for delete to authenticated using (is_admin());

-- ============ SAMPLE DATA ============

-- קטגוריות לדוגמה
insert into subjects (name, color) values
  ('מתמטיקה', '#ef4444'),
  ('עברית', '#3b82f6'),
  ('אנגלית', '#10b981'),
  ('מדעים', '#8b5cf6'),
  ('היסטוריה', '#f59e0b'),
  ('ספורת', '#06b6d4'),
  ('אמנות', '#ec4899'),
  ('מחשבים', '#64748b');

-- כיתות לדוגמה
insert into classes (name, grade) values
  ('ז׳א', 7), ('ז׳ב', 7),
  ('ח׳א', 8), ('ח׳ב', 8),
  ('ט׳א', 9), ('ט׳ב', 9),
  ('י׳א', 10), ('י׳ב', 10),
  ('י״א', 11), ('י״ב', 12);

-- חדרים לדוגמה
insert into rooms (name, capacity) values
  ('כיתה 101', 30),
  ('כיתה 102', 30),
  ('כיתה 201', 30),
  ('כיתה 202', 30),
  ('מעבדת מדעים', 24),
  ('מעבדת מחשבים', 28),
  ('אולם ספורט', 100),
  ('אולם אמנות', 24),
  ('ספרייה', 40);
