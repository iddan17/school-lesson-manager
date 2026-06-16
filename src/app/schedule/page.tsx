import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import FilterSelect from "@/components/FilterSelect";
import Link from "next/link";
import type { DayOfWeek } from "@/lib/types";
import { DAY_NAMES, TIME_SLOTS } from "@/lib/types";

const DAYS: DayOfWeek[] = [0, 1, 2, 3, 4];

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
    .from("teaching_slots")
    .select(`*, class:classes(name, school:schools(name)), teacher:profiles(id, full_name), room:rooms(name)`)
    .eq("school_year", year);
  if (params.class_id) query = query.eq("class_id", params.class_id);
  if (params.teacher_id) query = query.eq("teacher_id", params.teacher_id);

  const { data: slots } = await query;
  const all = slots ?? [];

  function cellSlots(day: DayOfWeek, time: string) {
    return all.filter((s) => s.day_of_week === day && s.start_time.slice(0, 5) === time);
  }

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">מערכת שעות</h1>
          <Link href="/schedule/plan" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            + תכנון שנתי
          </Link>
        </div>

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

        {all.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">אין שיבוצים קבועים</p>
            <Link href="/schedule/plan" className="mt-2 text-blue-600 hover:underline text-sm block">
              עבור לתכנון השנתי כדי להוסיף שיבוצים
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-xs border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border-b border-gray-200 px-3 py-2 text-gray-500 font-medium text-right w-16">שעה</th>
                  {DAYS.map((day) => (
                    <th key={day} className="border-b border-gray-200 px-3 py-2 text-gray-700 font-semibold text-center">
                      {DAY_NAMES[day]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((time) => (
                  <tr key={time} className="border-b border-gray-100 last:border-0">
                    <td className="px-3 py-1 text-gray-400 text-center align-top pt-2">{time}</td>
                    {DAYS.map((day) => (
                      <td key={day} className="p-1 align-top border-r border-gray-100 last:border-0">
                        {cellSlots(day, time).map((s) => (
                          <Link
                            key={s.id}
                            href={`/schedule/plan?teacher_id=${(s.teacher as any)?.id}&year=${year}`}
                            className="block rounded-md px-2 py-1.5 mb-1 bg-blue-50 border-r-2 border-blue-400 hover:bg-blue-100 transition-colors"
                          >
                            <div className="font-semibold text-gray-900 leading-tight truncate">
                              {(s.class as any)?.name}
                            </div>
                            <div className="text-gray-500 truncate">{(s.teacher as any)?.full_name}</div>
                            {(s.room as any)?.name && <div className="text-gray-400 truncate">{(s.room as any).name}</div>}
                          </Link>
                        ))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
