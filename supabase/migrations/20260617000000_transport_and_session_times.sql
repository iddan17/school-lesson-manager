-- Transport slots + per-session custom times.

-- teaching_slots can now be a lesson slot or a transport slot (name + duration).
alter table public.teaching_slots
  add column if not exists kind text not null default 'lesson' check (kind in ('lesson', 'transport')),
  add column if not exists name text,
  add column if not exists duration_minutes int;

-- transport slots are not tied to a class
alter table public.teaching_slots alter column class_id drop not null;

-- per-session custom time: either explicit start/end, or a duration in minutes
alter table public.slot_sessions
  add column if not exists start_time time,
  add column if not exists end_time time,
  add column if not exists duration_minutes int;
