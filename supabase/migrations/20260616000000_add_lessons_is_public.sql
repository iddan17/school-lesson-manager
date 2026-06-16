-- The app (admin public/private toggle, visibility filter, bank badges) expects
-- lessons.is_public, but the live table was missing it — every insert that set
-- is_public failed with "column lessons.is_public does not exist", so no lesson
-- could be saved. Add the column with a safe default.
alter table lessons
  add column if not exists is_public boolean not null default false;
