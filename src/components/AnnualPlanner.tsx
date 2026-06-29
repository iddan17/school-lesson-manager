"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type {
  Class, Room, DayOfWeek, Subject, TeachingSlot, SlotSession, SchoolYearConfig, CalendarExceptionRow,
} from "@/lib/types";
import { DAY_NAMES, TIME_SLOTS } from "@/lib/types";
import { getYearRange, getNoSchoolMap, getSlotSchedule, formatDateHe } from "@/lib/calendar";
import {
  createTeachingSlot, deleteTeachingSlot, assignSessionLesson, clearSession,
} from "@/app/actions";

interface LessonOption {
  id: string;
  title: string;
  is_public?: boolean;
  preferred_room_id: string | null;
  subjects?: { subject: Subject }[];
}

interface RoomBooking {
  room_id: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
}

interface Props {
  teacherId: string;
  schoolYear: number;
  classes: Class[];
  rooms: Room[];
  lessons: LessonOption[];
  slots: TeachingSlot[];
  sessions: SlotSession[];
  yearConfig: SchoolYearConfig | null;
  exceptions: CalendarExceptionRow[];
  roomBookings: RoomBooking[];
}

const DAYS: DayOfWeek[] = [0, 1, 2, 3, 4];

export default function AnnualPlanner({
  teacherId, schoolYear, classes, rooms, lessons, slots: initSlots, sessions: initSessions, yearConfig, exceptions, roomBookings: initRoomBookings,
}: Props) {
  const [roomBookings, setRoomBookings] = useState<RoomBooking[]>(initRoomBookings);
  const [slots, setSlots] = useState<TeachingSlot[]>(initSlots);
  const [sessions, setSessions] = useState<SlotSession[]>(initSessions);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(initSlots[0]?.id ?? null);
  const [showAddSlot, setShowAddSlot] = useState(initSlots.length === 0);
  const [assigning, setAssigning] = useState<{ date: string } | null>(null);
  const [timeMode, setTimeMode] = useState<"default" | "range" | "duration">("default");
  const [busy, setBusy] = useState(false);

  const classMap = useMemo(() => Object.fromEntries(classes.map((c) => [c.id, c])), [classes]);
  const lessonMap = useMemo(() => Object.fromEntries(lessons.map((l) => [l.id, l])), [lessons]);
  const sessionByKey = useMemo(() => {
    const m = new Map<string, SlotSession>();
    for (const s of sessions) m.set(`${s.slot_id}|${s.date}`, s);
    return m;
  }, [sessions]);

  const range = useMemo(() => getYearRange(schoolYear, yearConfig), [schoolYear, yearConfig]);
  const noSchool = useMemo(() => getNoSchoolMap(schoolYear, range.start, range.end), [schoolYear, range]);
  const exForCalc = useMemo(() => exceptions.map((e) => ({ date: e.date, closed: e.closed, reason: e.reason })), [exceptions]);

  function sessionTimeLabel(s?: SlotSession | null): string | null {
    if (!s) return null;
    if (s.start_time && s.end_time) return `${s.start_time.slice(0, 5)}–${s.end_time.slice(0, 5)}`;
    if (s.duration_minutes) return `${s.duration_minutes} דק׳`;
    return null;
  }

  const selectedSlot = slots.find((s) => s.id === selectedSlotId) ?? null;
  const isTransport = selectedSlot?.kind === "transport";
  const schedule = useMemo(() => {
    if (!selectedSlot) return [];
    return getSlotSchedule(selectedSlot.day_of_week, range, noSchool, exForCalc);
  }, [selectedSlot, range, noSchool, exForCalc]);
  const schoolDayCount = schedule.filter((s) => !s.blocked).length;

  if (classes.length === 0) {
    return (
      <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
        <p className="text-4xl mb-3">🏫</p>
        <p className="text-lg font-semibold text-gray-700 mb-1">אין כיתות במערכת</p>
        <Link href="/admin" className="inline-block mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          עבור לניהול מערכת
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Teaching slots ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">שיבוצים קבועים</h2>
          <button onClick={() => setShowAddSlot((v) => !v)}
            className="text-sm text-blue-600 hover:underline">
            {showAddSlot ? "סגור" : "+ שיבוץ חדש"}
          </button>
        </div>

        {showAddSlot && (
          <AddSlotForm
            classes={classes} rooms={rooms} roomBookings={roomBookings} schoolYear={schoolYear} teacherId={teacherId} busy={busy}
            onCreate={async (fd) => {
              setBusy(true);
              const res = await createTeachingSlot(fd);
              setBusy(false);
              if ((res as any).slot) {
                const ns = (res as any).slot;
                setSlots((p) => [...p, ns]);
                if (ns.room_id) {
                  setRoomBookings((p) => [...p, { room_id: ns.room_id, day_of_week: ns.day_of_week, start_time: ns.start_time, end_time: ns.end_time }]);
                }
                setSelectedSlotId(ns.id);
                setShowAddSlot(false);
                return null;
              }
              return (res as any).error ?? "שגיאה";
            }}
          />
        )}

        {slots.length === 0 ? (
          <p className="text-sm text-gray-400 mt-2">אין שיבוצים עדיין. הוסף שיבוץ קבוע (כיתה, יום ושעה) כדי להתחיל.</p>
        ) : (
          <div className="flex flex-wrap gap-2 mt-3">
            {slots.map((slot) => {
              const active = slot.id === selectedSlotId;
              const label = slot.kind === "transport"
                ? `🚌 ${slot.name} · ${DAY_NAMES[slot.day_of_week]} · ${slot.start_time.slice(0, 5)}`
                : `${classMap[slot.class_id ?? ""]?.name ?? "כיתה"} · ${DAY_NAMES[slot.day_of_week]} · ${slot.start_time.slice(0, 5)}`;
              return (
                <div key={slot.id}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                  }`}>
                  <button onClick={() => setSelectedSlotId(slot.id)} className="font-medium">
                    {label}
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm("למחוק שיבוץ זה? כל השיעורים ששויכו אליו יימחקו.")) return;
                      setBusy(true);
                      await deleteTeachingSlot(slot.id);
                      setBusy(false);
                      setSlots((p) => p.filter((s) => s.id !== slot.id));
                      setSessions((p) => p.filter((s) => s.slot_id !== slot.id));
                      if (slot.room_id) {
                        setRoomBookings((p) => {
                          const idx = p.findIndex((b) => b.room_id === slot.room_id && b.day_of_week === slot.day_of_week && b.start_time === slot.start_time);
                          if (idx < 0) return p;
                          const c = [...p]; c.splice(idx, 1); return c;
                        });
                      }
                      if (selectedSlotId === slot.id) setSelectedSlotId(null);
                    }}
                    className={`text-xs ${active ? "text-blue-100 hover:text-white" : "text-red-400 hover:text-red-600"}`}
                    title="מחק שיבוץ"
                  >✕</button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Sessions for the selected slot ── */}
      {selectedSlot && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">
              {isTransport
                ? `🚌 הסעה — ${selectedSlot.name} · ${DAY_NAMES[selectedSlot.day_of_week]} ${selectedSlot.start_time.slice(0, 5)}–${selectedSlot.end_time.slice(0, 5)}`
                : `שיעורים — ${classMap[selectedSlot.class_id ?? ""]?.name ?? ""} · ${DAY_NAMES[selectedSlot.day_of_week]} ${selectedSlot.start_time.slice(0, 5)}–${selectedSlot.end_time.slice(0, 5)}`}
            </h2>
            <span className="text-xs text-gray-400">{schoolDayCount} מפגשים (ללא חגים)</span>
          </div>

          {!isTransport && lessons.length === 0 && (
            <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800">
              אין לך שיעורים בבנק.{" "}
              <Link href="/lessons/new" className="font-medium underline">צור שיעור חדש</Link>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            {schedule.map((item) => {
              const ymd = item.ymd;
              if (item.blocked) {
                return (
                  <div key={ymd} className="flex items-center gap-3 px-4 py-2.5 bg-gray-50/60">
                    <span className="text-xs text-gray-400 w-24 shrink-0">{DAY_NAMES[selectedSlot.day_of_week]} {formatDateHe(item.date)}</span>
                    <span className="text-sm text-gray-400 flex items-center gap-1">
                      <span>🚫</span> אין לימודים{item.reason ? ` — ${item.reason}` : ""}
                    </span>
                  </div>
                );
              }
              // Transport slot: just show the recurring occurrence, no lesson to assign
              if (isTransport) {
                return (
                  <div key={ymd} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-xs text-gray-400 w-24 shrink-0">{DAY_NAMES[selectedSlot.day_of_week]} {formatDateHe(item.date)}</span>
                    <span className="rounded-md px-2 py-1 text-sm border-r-2 truncate bg-amber-50 border-amber-400">
                      🚌 {selectedSlot.name} ({selectedSlot.duration_minutes} דק׳)
                    </span>
                  </div>
                );
              }
              const session = sessionByKey.get(`${selectedSlot.id}|${ymd}`);
              const lesson: any = session?.lesson ?? (session?.lesson_id ? lessonMap[session.lesson_id] : null);
              const color = lesson?.subjects?.[0]?.subject?.color ?? "#6366f1";
              const timeLabel = sessionTimeLabel(session);
              return (
                <div key={ymd} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-gray-400 w-24 shrink-0">{DAY_NAMES[selectedSlot.day_of_week]} {formatDateHe(item.date)}</span>
                    {lesson ? (
                      <span className="rounded-md px-2 py-1 text-sm border-r-2 truncate"
                        style={{ borderRightColor: color, backgroundColor: `${color}18` }}>
                        {lesson.title}{timeLabel ? ` · ${timeLabel}` : ""}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-300">— ללא שיעור —</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button onClick={() => setAssigning({ date: ymd })}
                      className="text-xs text-blue-600 hover:underline">
                      {lesson ? "החלף" : "שייך שיעור"}
                    </button>
                    {session && (
                      <button onClick={async () => {
                        setBusy(true);
                        await clearSession(selectedSlot.id, ymd);
                        setBusy(false);
                        setSessions((p) => p.filter((s) => !(s.slot_id === selectedSlot.id && s.date === ymd)));
                      }} className="text-xs text-red-400 hover:text-red-600">נקה</button>
                    )}
                  </div>
                </div>
              );
            })}
            {schedule.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-gray-400">אין מפגשים בטווח השנה.</p>
            )}
          </div>
        </section>
      )}

      {/* ── Assign-lesson modal ── */}
      {assigning && selectedSlot && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">שיוך שיעור</h3>
            <p className="text-sm text-gray-500 mb-4">
              {classMap[selectedSlot.class_id ?? ""]?.name} · {assigning.date.split("-").reverse().join("/")}
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">שיעור</label>
            <select id="assign-lesson" defaultValue=""
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3">
              <option value="">-- בחר שיעור --</option>
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>{l.title}{l.is_public ? " (ציבורי)" : ""}</option>
              ))}
            </select>

            {/* Custom time for this date */}
            <label className="block text-sm font-medium text-gray-700 mb-1">משך / שעות</label>
            <select value={timeMode} onChange={(e) => setTimeMode(e.target.value as any)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2">
              <option value="default">ברירת מחדל (לפי השיבוץ)</option>
              <option value="range">משעה עד שעה</option>
              <option value="duration">משך בדקות</option>
            </select>
            {timeMode === "range" && (
              <div className="flex items-center gap-2 mb-4" dir="ltr">
                <select id="assign-start" defaultValue={selectedSlot.start_time.slice(0, 5)} className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
                  {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <span className="text-gray-400">–</span>
                <select id="assign-end" defaultValue={selectedSlot.end_time.slice(0, 5)} className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
                  {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}
            {timeMode === "duration" && (
              <div className="mb-4">
                <input id="assign-duration" type="number" min={5} step={5} defaultValue={45} placeholder="דקות"
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
              </div>
            )}
            {timeMode === "default" && <div className="mb-2" />}

            <div className="flex gap-2">
              <button disabled={busy}
                onClick={async () => {
                  const sel = (document.getElementById("assign-lesson") as HTMLSelectElement).value;
                  if (!sel) return;
                  const opts: { start_time?: string | null; end_time?: string | null; duration_minutes?: number | null } = {};
                  if (timeMode === "range") {
                    opts.start_time = (document.getElementById("assign-start") as HTMLSelectElement).value;
                    opts.end_time = (document.getElementById("assign-end") as HTMLSelectElement).value;
                  } else if (timeMode === "duration") {
                    opts.duration_minutes = parseInt((document.getElementById("assign-duration") as HTMLInputElement).value) || null;
                  }
                  setBusy(true);
                  const res = await assignSessionLesson(selectedSlot.id, assigning.date, sel, opts);
                  setBusy(false);
                  if (!(res as any).error) {
                    setSessions((p) => {
                      const rest = p.filter((s) => !(s.slot_id === selectedSlot.id && s.date === assigning.date));
                      return [...rest, { id: crypto.randomUUID(), slot_id: selectedSlot.id, date: assigning.date, lesson_id: sel, room_id: null, start_time: opts.start_time ?? null, end_time: opts.end_time ?? null, duration_minutes: opts.duration_minutes ?? null, created_at: "" }];
                    });
                    setAssigning(null);
                    setTimeMode("default");
                  }
                }}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {busy ? "שומר..." : "שמור"}
              </button>
              <button onClick={() => setAssigning(null)}
                className="px-4 py-2 text-gray-600 rounded-lg text-sm hover:bg-gray-100">ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddSlotForm({
  classes, rooms, roomBookings, schoolYear, teacherId, busy, onCreate,
}: {
  classes: Class[]; rooms: Room[]; roomBookings: RoomBooking[]; schoolYear: number; teacherId: string; busy: boolean;
  onCreate: (fd: FormData) => Promise<string | null>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<"lesson" | "transport">("lesson");
  const [day, setDay] = useState<DayOfWeek>(0);
  const [start, setStart] = useState(TIME_SLOTS[0]);
  const [end, setEnd] = useState(TIME_SLOTS[1]);

  const takenRoomIds = new Set(
    roomBookings
      .filter((b) => b.day_of_week === day && b.start_time.slice(0, 5) < end && b.end_time.slice(0, 5) > start)
      .map((b) => b.room_id)
  );

  const tab = (k: "lesson" | "transport", label: string) => (
    <button type="button" onClick={() => setKind(k)}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${kind === k ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300"}`}>
      {label}
    </button>
  );

  return (
    <form
      action={async (fd) => {
        fd.set("school_year", String(schoolYear));
        fd.set("teacher_id", teacherId);
        fd.set("kind", kind);
        const err = await onCreate(fd);
        setError(err);
      }}
      className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid gap-3 sm:grid-cols-2"
    >
      <div className="sm:col-span-2 flex gap-2">
        {tab("lesson", "שיעור")}
        {tab("transport", "🚌 הסעה")}
      </div>

      {kind === "lesson" ? (
        <label className="text-sm">
          <span className="block text-gray-600 mb-1">כיתה</span>
          <select name="class_id" required className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      ) : (
        <label className="text-sm">
          <span className="block text-gray-600 mb-1">שם ההסעה</span>
          <input name="name" required placeholder="למשל: הסעה לטיול"
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
        </label>
      )}

      <label className="text-sm">
        <span className="block text-gray-600 mb-1">יום</span>
        <select name="day_of_week" required value={day} onChange={(e) => setDay(parseInt(e.target.value) as DayOfWeek)}
          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
          {DAYS.map((d) => <option key={d} value={d}>{DAY_NAMES[d]}</option>)}
        </select>
      </label>

      <label className="text-sm">
        <span className="block text-gray-600 mb-1">{kind === "transport" ? "שעה" : "משעה"}</span>
        <select name="start_time" value={start} onChange={(e) => setStart(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
          {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>

      {kind === "lesson" ? (
        <>
          <label className="text-sm">
            <span className="block text-gray-600 mb-1">עד שעה</span>
            <select name="end_time" value={end} onChange={(e) => setEnd(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
              {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="block text-gray-600 mb-1">חדר (אופציונלי)</span>
            <select name="room_id" className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
              <option value="">ללא חדר קבוע</option>
              {rooms.map((r) => {
                const taken = takenRoomIds.has(r.id);
                return <option key={r.id} value={r.id} disabled={taken}>{r.name}{taken ? " — תפוס" : ""}</option>;
              })}
            </select>
            <p className="text-xs text-gray-400 mt-1">חדרים שכבר תפוסים ביום ובשעה שנבחרו מסומנים ולא ניתנים לבחירה.</p>
          </label>
        </>
      ) : (
        <label className="text-sm">
          <span className="block text-gray-600 mb-1">משך (דקות)</span>
          <input name="duration_minutes" type="number" min={5} step={5} defaultValue={30}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
        </label>
      )}

      {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
      <div className="sm:col-span-2">
        <button type="submit" disabled={busy}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {busy ? "מוסיף..." : "הוסף שיבוץ"}
        </button>
      </div>
    </form>
  );
}
