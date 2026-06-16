import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getProfile } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import AnnualPlanner from "@/components/AnnualPlanner";
import CalendarSettings from "@/components/CalendarSettings";
import FilterSelect from "@/components/FilterSelect";

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ teacher_id?: string; year?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const [user, profile] = await Promise.all([getCurrentUser(), getProfile()]);
  const isAdmin = profile?.role === "admin";
  const schoolYear = parseInt(params.year ?? String(new Date().getFullYear()));
  const teacherId = isAdmin && params.teacher_id ? params.teacher_id : user!.id;

  const [
    { data: classes },
    { data: rooms },
    { data: teachers },
    { data: lessonsRaw },
    { data: slots },
    { data: yearConfig },
    { data: exceptions },
  ] = await Promise.all([
    supabase.from("classes").select("*").order("grade"),
    supabase.from("rooms").select("*").order("name"),
    supabase.from("profiles").select("id, full_name").order("full_name"),
    supabase
      .from("lessons")
      .select(`id, title, teacher_id, is_public, preferred_room_id, subjects:lesson_subjects(subject:subjects(*))`)
      .order("title"),
    supabase
      .from("teaching_slots")
      .select(`*, class:classes(*), room:rooms(name)`)
      .eq("teacher_id", teacherId)
      .eq("school_year", schoolYear)
      .order("day_of_week")
      .order("start_time"),
    supabase.from("school_year_config").select("*").eq("school_year", schoolYear).maybeSingle(),
    supabase.from("calendar_exceptions").select("*").eq("school_year", schoolYear),
  ]);

  // sessions for the current teacher's slots
  const slotIds = (slots ?? []).map((s) => s.id);
  let sessions: any[] = [];
  if (slotIds.length) {
    const { data } = await supabase
      .from("slot_sessions")
      .select(`*, lesson:lessons(id, title, subjects:lesson_subjects(subject:subjects(*)))`)
      .in("slot_id", slotIds);
    sessions = data ?? [];
  }

  const allLessons = lessonsRaw ?? [];
  // schedulable: admin → any lesson; teacher → their own private lessons (matches the old planner)
  const lessons = isAdmin ? allLessons : allLessons.filter((l) => l.teacher_id === user!.id && !(l as any).is_public);

  const currentYear = new Date().getFullYear();

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">תכנון מערכת שעות שנתי</h1>
        <p className="text-gray-500 text-sm mb-6">שנת {schoolYear}–{schoolYear + 1}</p>

        <div className="flex flex-wrap gap-3 mb-6">
          <FilterSelect name="year" value={String(schoolYear)} label="שנה" action="/schedule/plan">
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>{y}–{y + 1}</option>
            ))}
          </FilterSelect>
          {isAdmin && (
            <FilterSelect name="teacher_id" value={teacherId} label="מורה" action="/schedule/plan">
              {teachers?.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </FilterSelect>
          )}
        </div>

        {isAdmin && (
          <div className="mb-6">
            <CalendarSettings schoolYear={schoolYear} yearConfig={yearConfig ?? null} exceptions={exceptions ?? []} />
          </div>
        )}

        <AnnualPlanner
          teacherId={teacherId}
          schoolYear={schoolYear}
          classes={classes ?? []}
          rooms={rooms ?? []}
          lessons={lessons as any}
          slots={(slots ?? []) as any}
          sessions={sessions as any}
          yearConfig={yearConfig ?? null}
          exceptions={exceptions ?? []}
        />
      </main>
    </>
  );
}
