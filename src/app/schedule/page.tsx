import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import ScheduleWeekFilters from "@/components/ScheduleWeekFilters";
import Link from "next/link";
import type { DayOfWeek } from "@/lib/types";
import { DAY_NAMES, TIME_SLOTS } from "@/lib/types";
import { toYMD, parseYMD, formatDateHe, getNoSchoolMap } from "@/lib/calendar";

const DAYS: DayOfWeek[] = [0, 1, 2, 3, 4];

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ class_label?: string; teacher_id?: string; week?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  // ── Resolve the displayed week (Sunday-based) and its school year ──
  const base = params.week ? parseYMD(params.week) : new Date();
  base.setHours(0, 0, 0, 0);
  const weekStart = new Date(base);
  weekStart.setDate(base.getDate() - base.getDay()); // back up to Sunday
  const weekDates = DAYS.map((i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
  const weekYMD = weekDates.map(toYMD);
  const schoolYear = weekStart.getMonth() >= 8 ? weekStart.getFullYear() : weekStart.getFullYear() - 1;
  const prev = new Date(weekStart); prev.setDate(weekStart.getDate() - 7);
  const next = new Date(weekStart); next.setDate(weekStart.getDate() + 7);

  const filterQS = `${params.class_label ? `&class_label=${encodeURIComponent(params.class_label)}` : ""}${params.teacher_id ? `&teacher_id=${params.teacher_id}` : ""}`;

  const [{ data: labelRows }, { data: teachers }, { data: exceptions }] = await Promise.all([
    supabase.from("teaching_slots").select("class_label").eq("school_year", schoolYear).not("class_label", "is", null),
    supabase.from("profiles").select("id, full_name").order("full_name"),
    supabase.from("calendar_exceptions").select("date, closed, reason").eq("school_year", schoolYear),
  ]);
  const classLabels = Array.from(new Set((labelRows ?? []).map((r: any) => r.class_label as string))).sort();

  let slotQuery = supabase
    .from("teaching_slots")
    .select("*, class:classes(name), teacher:profiles(id, full_name), room:rooms(name)")
    .eq("school_year", schoolYear);
  if (params.class_label) slotQuery = slotQuery.eq("class_label", params.class_label);
  if (params.teacher_id) slotQuery = slotQuery.eq("teacher_id", params.teacher_id);
  const { data: slots } = await slotQuery;
  const all = slots ?? [];

  // Lessons assigned to this specific week's dates (annual-planning sessions)
  const slotIds = all.map((s) => s.id);
  let sessions: any[] = [];
  if (slotIds.length) {
    const { data } = await supabase
      .from("slot_sessions")
      .select("slot_id, date, start_time, end_time, duration_minutes, lesson:lessons(id, title, subjects:lesson_subjects(subject:subjects(*)))")
      .in("slot_id", slotIds)
      .gte("date", weekYMD[0])
      .lte("date", weekYMD[4]);
    sessions = data ?? [];
  }
  const sessionByKey = new Map(sessions.map((s) => [`${s.slot_id}|${s.date}`, s]));

  // Holiday / closed status per day of this week
  const noSchool = getNoSchoolMap(schoolYear, weekDates[0], weekDates[4]);
  const exMap = new Map((exceptions ?? []).map((e) => [e.date, e]));
  function dayInfo(ymd: string): { blocked: boolean; reason: string | null } {
    const ex = exMap.get(ymd);
    if (ex) return { blocked: ex.closed, reason: ex.closed ? (ex.reason || "אין לימודים") : null };
    if (noSchool.has(ymd)) return { blocked: true, reason: noSchool.get(ymd) ?? "חג" };
    return { blocked: false, reason: null };
  }

  const cellSlots = (day: DayOfWeek, time: string) =>
    all.filter((s) => s.day_of_week === day && s.start_time.slice(0, 5) === time);

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

        {/* Week navigation */}
        <div className="flex items-center justify-between gap-3 mb-4 bg-white border border-gray-200 rounded-xl px-4 py-2.5">
          <Link href={`/schedule?week=${toYMD(prev)}${filterQS}`} className="text-sm text-blue-600 hover:underline">← שבוע קודם</Link>
          <div className="text-sm font-medium text-gray-800">
            {formatDateHe(weekDates[0])} – {formatDateHe(weekDates[4])}
            <span className="text-gray-400 font-normal"> · שנה"ל {schoolYear}–{schoolYear + 1}</span>
          </div>
          <Link href={`/schedule?week=${toYMD(next)}${filterQS}`} className="text-sm text-blue-600 hover:underline">שבוע הבא →</Link>
        </div>

        <div className="mb-6">
          <ScheduleWeekFilters classLabels={classLabels} teachers={teachers ?? []} />
        </div>

        {all.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">אין שיבוצים קבועים לשנה זו</p>
            <Link href="/schedule/plan" className="mt-2 text-blue-600 hover:underline text-sm block">
              עבור לתכנון השנתי כדי להוסיף שיבוצים
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-xs border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border-b border-gray-200 px-3 py-2 text-gray-500 font-medium text-right w-16">שעה</th>
                  {DAYS.map((day) => {
                    const info = dayInfo(weekYMD[day]);
                    return (
                      <th key={day} className={`border-b border-gray-200 px-2 py-2 text-center ${info.blocked ? "bg-gray-100" : ""}`}>
                        <div className="text-gray-700 font-semibold">{DAY_NAMES[day]}</div>
                        <div className="text-gray-400 font-normal">{formatDateHe(weekDates[day])}</div>
                        {info.blocked && <div className="text-red-500 text-[10px] font-normal mt-0.5">🚫 {info.reason}</div>}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((time) => (
                  <tr key={time} className="border-b border-gray-100 last:border-0">
                    <td className="px-3 py-1 text-gray-400 text-center align-top pt-2">{time}</td>
                    {DAYS.map((day) => {
                      const info = dayInfo(weekYMD[day]);
                      return (
                        <td key={day} className={`p-1 align-top border-r border-gray-100 last:border-0 ${info.blocked ? "bg-gray-50" : ""}`}>
                          {!info.blocked && cellSlots(day, time).map((slot) => {
                            if (slot.kind === "transport") {
                              return (
                                <div key={slot.id} className="rounded-md px-2 py-1.5 mb-1 border-r-2 border-amber-400 bg-amber-50">
                                  <div className="font-semibold text-gray-900 leading-tight truncate">🚌 {slot.name}</div>
                                  <div className="text-gray-500 truncate">{slot.duration_minutes} דק׳</div>
                                  <div className="text-gray-400 truncate">{(slot.teacher as any)?.full_name}</div>
                                </div>
                              );
                            }
                            const session: any = sessionByKey.get(`${slot.id}|${weekYMD[day]}`);
                            const lesson = session?.lesson;
                            const color = lesson?.subjects?.[0]?.subject?.color ?? "#6366f1";
                            const timeLabel = session?.start_time && session?.end_time
                              ? `${String(session.start_time).slice(0, 5)}–${String(session.end_time).slice(0, 5)}`
                              : session?.duration_minutes ? `${session.duration_minutes} דק׳` : null;
                            return (
                              <div key={slot.id} className="rounded-md px-2 py-1.5 mb-1 border-r-2"
                                style={{ borderRightColor: color, backgroundColor: `${color}14` }}>
                                <div className="font-semibold text-gray-900 leading-tight truncate">
                                  {slot.class_label ?? (slot.class as any)?.name}
                                </div>
                                {lesson ? (
                                  <div className="text-gray-700 truncate">{lesson.title}{timeLabel ? ` · ${timeLabel}` : ""}</div>
                                ) : (
                                  <div className="text-gray-300 truncate">— ללא שיעור —</div>
                                )}
                                <div className="text-gray-400 truncate">{(slot.teacher as any)?.full_name}</div>
                                {(slot.room as any)?.name && <div className="text-gray-400 truncate">{(slot.room as any).name}</div>}
                              </div>
                            );
                          })}
                        </td>
                      );
                    })}
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
