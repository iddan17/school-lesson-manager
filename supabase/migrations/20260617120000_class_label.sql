-- Free-text class on teaching slots (replaces picking from the class/school bank).
alter table public.teaching_slots add column if not exists class_label text;
