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
  // Anyone can view any teacher's plan; you can only edit your own (or admin edits all).
  const teacherId = params.teacher_id ?? user!.id;
  const canEdit = teacherId === user!.id || isAdmin;

  const [
    { data: classes },
    { data: rooms },
    { data: teachers },
    { data: lessonsRaw },
    { data: slots },
    { data: yearConfig },
    { data: exceptions },
    { data: roomBookings },
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
    supabase.from("teaching_slots").select("room_id, day_of_week, start_time, end_time").eq("school_year", schoolYear).not("room_id", "is", null),
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

  // Everyone can schedule any lesson from the shared bank.
  const lessons = lessonsRaw ?? [];
  const viewingTeacher = teachers?.find((t) => t.id === teacherId);

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
          <FilterSelect name="teacher_id" value={teacherId} label="מורה" action="/schedule/plan">
            {teachers?.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </FilterSelect>
        </div>

        {!canEdit && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm text-amber-800">
            צפייה בתכנון של {viewingTeacher?.full_name ?? "מורה אחר"} (קריאה בלבד).
          </div>
        )}

        {isAdmin && (
          <div className="mb-6">
            <CalendarSettings schoolYear={schoolYear} yearConfig={yearConfig ?? null} exceptions={exceptions ?? []} />
          </div>
        )}

        <AnnualPlanner
          teacherId={teacherId}
          canEdit={canEdit}
          schoolYear={schoolYear}
          classes={classes ?? []}
          rooms={rooms ?? []}
          lessons={lessons as any}
          slots={(slots ?? []) as any}
          sessions={sessions as any}
          yearConfig={yearConfig ?? null}
          exceptions={exceptions ?? []}
          roomBookings={(roomBookings ?? []) as any}
        />
      </main>
    </>
  );
}
