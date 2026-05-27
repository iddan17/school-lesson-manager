import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import WeeklyTimetable from "@/components/WeeklyTimetable";
import FilterSelect from "@/components/FilterSelect";
import Link from "next/link";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ class_id?: string; teacher_id?: string; year?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const year = parseInt(params.year ?? String(new Date().getFullYear()));

  const [{ data: classes }, { data: teachers }] = await Promise.all([
    supabase.from("classes").select("*, school:schools(name)").order("school_id").order("grade"),
    supabase.from("profiles").select("id, full_name").order("full_name"),
  ]);

  let query = supabase
    .from("schedule_entries")
    .select(`
      *,
      lesson:lessons(
        id, title, has_materials, has_equipment,
        teacher:profiles(id, full_name),
        subjects:lesson_subjects(subject:subjects(*))
      ),
      class:classes(name, school:schools(name)),
      room:rooms(name)
    `)
    .eq("school_year", year);

  if (params.class_id) query = query.eq("class_id", params.class_id);

  const { data: entries } = await query;

  // filter by teacher after fetch (teacher is nested)
  const filtered = (entries ?? []).filter((e) => {
    if (params.teacher_id && (e.lesson as any)?.teacher?.id !== params.teacher_id) return false;
    return true;
  });

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">מערכת שעות</h1>
          <Link
            href="/schedule/plan"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            + תכנון שנתי
          </Link>
        </div>

        {/* פילטרים */}
        <div className="flex flex-wrap gap-3 mb-6">
          <FilterSelect name="year" value={String(year)} label="שנה" action="/schedule">
            {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((y) => (
              <option key={y} value={y}>{y}–{y + 1}</option>
            ))}
          </FilterSelect>
          <FilterSelect name="class_id" value={params.class_id ?? ""} label="כיתה" action="/schedule">
            <option value="">כל הכיתות</option>
            {classes?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{(c as any).school?.name ? ` — ${(c as any).school.name}` : ""}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect name="teacher_id" value={params.teacher_id ?? ""} label="מורה" action="/schedule">
            <option value="">כל המורים</option>
            {teachers?.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </FilterSelect>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">אין שיעורים מתוכננים</p>
            <Link href="/schedule/plan" className="mt-2 text-blue-600 hover:underline text-sm block">
              התחל לתכנן את מערכת השעות
            </Link>
          </div>
        ) : (
          <WeeklyTimetable entries={filtered as any} />
        )}
      </main>
    </>
  );
}

