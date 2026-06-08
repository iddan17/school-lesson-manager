"use client";

import { useState } from "react";
import type { Class, Room, DayOfWeek, Subject } from "@/lib/types";
import { DAY_NAMES, TIME_SLOTS, classDisplayName } from "@/lib/types";
import { createScheduleEntry } from "@/app/actions";
import RoomBookingConflict from "./RoomBookingConflict";
import Link from "next/link";

interface LessonWithJoins {
  id: string;
  title: string;
  teacher_id: string;
  has_materials: boolean;
  has_equipment: boolean;
  preferred_room_id: string | null;
  subjects: { subject: Subject }[];
  teacher: { full_name: string };
}

interface ExistingEntry {
  class_id: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  room_id: string | null;
  lesson_id: string;
}

interface Props {
  classes: Class[];
  lessons: LessonWithJoins[];
  rooms: Room[];
  currentYear: number;
  teacherId: string;
  existingEntries: ExistingEntry[];
  isAdmin?: boolean;
}

interface ConflictState {
  conflict: any;
  alternatives: any[];
  pendingData: {
    lesson_id: string;
    class_id: string;
    day: DayOfWeek;
    start_time: string;
    end_time: string;
    room_id: string;
    room_name: string;
  };
}

const DAYS: DayOfWeek[] = [0, 1, 2, 3, 4];

export default function PlanningWizard({ classes, lessons, rooms, currentYear, teacherId, existingEntries, isAdmin }: Props) {
  const [selectedClass, setSelectedClass] = useState<Class | null>(classes[0] ?? null);
  const [scheduledHere, setScheduledHere] = useState<ExistingEntry[]>(existingEntries);
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [selectingSlot, setSelectingSlot] = useState<{ day: DayOfWeek; time: string } | null>(null);
  const [selectLesson, setSelectLesson] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [saving, setSaving] = useState(false);

  // myLessons = lessons this user owns (for the "no lessons" warning)
  // schedulableLessons = lessons this user can schedule:
  //   - admin: all lessons they own (any is_public value)
  //   - teacher: only their own private lessons
  const myLessons = lessons.filter((l) => l.teacher_id === teacherId);
  const schedulableLessons = isAdmin
    ? lessons
    : myLessons.filter((l) => !(l as any).is_public);
  const hasClasses = classes.length > 0;
  const hasMyLessons = myLessons.length > 0;

  function getEntriesForCell(classId: string, day: DayOfWeek, time: string) {
    return scheduledHere.filter(
      (e) => e.class_id === classId && e.day_of_week === day && e.start_time.slice(0, 5) === time
    );
  }

  function openSlot(day: DayOfWeek, time: string) {
    setSelectingSlot({ day, time });
    setSelectLesson(true);
    setSelectedLessonId("");
    setSelectedRoomId("");
  }

  async function handleAddEntry(forceNoRoom = false) {
    if (!selectedClass || !selectingSlot || !selectedLessonId) return;
    setSaving(true);

    const startIdx = TIME_SLOTS.indexOf(selectingSlot.time);
    const endTime = TIME_SLOTS[startIdx + 1] ?? "16:30";
    const roomId = forceNoRoom ? null : (selectedRoomId || null);

    const result = await createScheduleEntry({
      lesson_id: selectedLessonId,
      class_id: selectedClass.id,
      school_year: currentYear,
      day_of_week: selectingSlot.day,
      start_time: selectingSlot.time,
      end_time: endTime,
      room_id: roomId,
    });

    setSaving(false);

    if ((result as any).conflict) {
      const r = rooms.find((r) => r.id === selectedRoomId);
      setConflict({
        conflict: (result as any).conflict,
        alternatives: (result as any).alternatives ?? [],
        pendingData: {
          lesson_id: selectedLessonId,
          class_id: selectedClass.id,
          day: selectingSlot.day,
          start_time: selectingSlot.time,
          end_time: endTime,
          room_id: selectedRoomId,
          room_name: r?.name ?? selectedRoomId,
        },
      });
      return;
    }

    if ((result as any).success || !(result as any).error) {
      const newEntry: ExistingEntry = {
        class_id: selectedClass.id,
        day_of_week: selectingSlot.day,
        start_time: selectingSlot.time,
        end_time: endTime,
        room_id: roomId,
        lesson_id: selectedLessonId,
      };
      setScheduledHere((prev) => [...prev, newEntry]);
      setSelectLesson(false);
      setSelectingSlot(null);
    }
  }

  async function handleSelectAlternative(slot: { day_of_week: DayOfWeek; start_time: string; end_time: string }) {
    if (!conflict || !selectedClass) return;
    setSaving(true);
    const result = await createScheduleEntry({
      lesson_id: conflict.pendingData.lesson_id,
      class_id: selectedClass.id,
      school_year: currentYear,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      room_id: conflict.pendingData.room_id,
    });
    setSaving(false);
    setConflict(null);
    if ((result as any).success || !(result as any).error) {
      setScheduledHere((prev) => [...prev, {
        class_id: selectedClass.id,
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
        room_id: conflict.pendingData.room_id,
        lesson_id: conflict.pendingData.lesson_id,
      }]);
      setSelectLesson(false);
      setSelectingSlot(null);
    }
  }

  async function handleIgnoreConflict() {
    if (!conflict) return;
    setSaving(true);
    const result = await createScheduleEntry({
      lesson_id: conflict.pendingData.lesson_id,
      class_id: conflict.pendingData.class_id,
      school_year: currentYear,
      day_of_week: conflict.pendingData.day,
      start_time: conflict.pendingData.start_time,
      end_time: conflict.pendingData.end_time,
      room_id: null,
    });
    setSaving(false);
    setConflict(null);
    if ((result as any).success || !(result as any).error) {
      setScheduledHere((prev) => [...prev, {
        class_id: conflict.pendingData.class_id,
        day_of_week: conflict.pendingData.day,
        start_time: conflict.pendingData.start_time,
        end_time: conflict.pendingData.end_time,
        room_id: null,
        lesson_id: conflict.pendingData.lesson_id,
      }]);
      setSelectLesson(false);
      setSelectingSlot(null);
    }
  }

  const lessonMap = Object.fromEntries(lessons.map((l) => [l.id, l]));

  if (!hasClasses) {
    return (
      <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
        <p className="text-4xl mb-3">🏫</p>
        <p className="text-lg font-semibold text-gray-700 mb-1">אין כיתות במערכת</p>
        <p className="text-sm text-gray-500 mb-4">לפני שניתן לתכנן, יש להוסיף כיתות.</p>
        <Link href="/admin" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          עבור לניהול מערכת
        </Link>
      </div>
    );
  }

  return (
    <div>
      {!hasMyLessons && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3 text-sm">
          <span className="text-xl">📝</span>
          <span className="text-amber-800">
            אין לך שיעורים בבנק עדיין.{" "}
            <Link href="/lessons/new" className="font-medium underline hover:text-amber-900">
              צור שיעור חדש
            </Link>
            {" "}כדי שתוכל לשבץ אותו בלוח.
          </span>
        </div>
      )}

      {/* בחירת כיתה */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">בחר כיתה:</p>
        <div className="flex flex-wrap gap-2">
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => setSelectedClass(cls)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                selectedClass?.id === cls.id
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
              }`}
            >
              {cls.name}
            </button>
          ))}
        </div>
      </div>

      {selectedClass && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              לוח שבועי — {selectedClass.name}
            </h2>
            <Link href="/schedule" className="text-sm text-blue-600 hover:underline">
              צפה במערכת המלאה
            </Link>
          </div>

          {/* גריד שבועי */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white mb-6">
            <table className="w-full text-xs border-collapse min-w-[550px]">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border-b border-gray-200 px-3 py-2 text-gray-500 w-16 text-right">שעה</th>
                  {DAYS.map((day) => (
                    <th key={day} className="border-b border-gray-200 px-2 py-2 text-gray-700 font-semibold text-center">
                      {DAY_NAMES[day]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((time) => (
                  <tr key={time} className="border-b border-gray-100 last:border-0">
                    <td className="px-3 py-1 text-gray-400 text-center align-top pt-2">{time}</td>
                    {DAYS.map((day) => {
                      const cellEntries = getEntriesForCell(selectedClass.id, day, time);
                      return (
                        <td key={day} className="p-1 border-r border-gray-100 last:border-0 align-top min-w-[90px]">
                          {cellEntries.map((e, i) => {
                            const lesson = lessonMap[e.lesson_id];
                            const color = lesson?.subjects?.[0]?.subject?.color ?? "#6366f1";
                            return (
                              <div
                                key={i}
                                className="rounded-md px-2 py-1 mb-1 border-r-2 text-xs"
                                style={{ borderRightColor: color, backgroundColor: `${color}18` }}
                              >
                                <span className="font-medium text-gray-900 truncate block">
                                  {lesson?.title ?? "שיעור"}
                                </span>
                                {e.room_id && (
                                  <span className="text-gray-400">
                                    {rooms.find((r) => r.id === e.room_id)?.name}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                          <button
                            onClick={() => openSlot(day, time)}
                            className="w-full h-7 rounded border border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-colors text-base leading-none"
                            title="הוסף שיעור"
                          >
                            +
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* מודל בחירת שיעור */}
      {selectLesson && selectingSlot && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {DAY_NAMES[selectingSlot.day]} {selectingSlot.time}
            </h3>
            <p className="text-sm text-gray-500 mb-4">כיתה {selectedClass?.name}</p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">בחר שיעור</label>
              <select
                value={selectedLessonId}
                onChange={(e) => {
                  setSelectedLessonId(e.target.value);
                  const lesson = lessons.find((l) => l.id === e.target.value);
                  if (lesson?.preferred_room_id) setSelectedRoomId(lesson.preferred_room_id);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">-- בחר שיעור --</option>
                {schedulableLessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}{(l as any).is_public ? " (ציבורי)" : ""}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                מציג את השיעורים שלך.{" "}
                <Link href="/lessons/new" className="text-blue-500 hover:underline" target="_blank">
                  צור שיעור חדש
                </Link>
              </p>
            </div>

            {selectedLessonId && rooms.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">שריין חדר (אופציונלי)</label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">ללא שריון חדר</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleAddEntry(false)}
                disabled={!selectedLessonId || saving}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "שומר..." : "הוסף ללוח"}
              </button>
              <button
                onClick={() => { setSelectLesson(false); setSelectingSlot(null); }}
                className="px-4 py-2 text-gray-600 rounded-lg text-sm hover:bg-gray-100"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* מודל קונפליקט חדר */}
      {conflict && (
        <RoomBookingConflict
          conflict={conflict.conflict}
          alternatives={conflict.alternatives}
          roomName={conflict.pendingData.room_name}
          onSelectAlternative={handleSelectAlternative}
          onIgnore={handleIgnoreConflict}
          onCancel={() => setConflict(null)}
        />
      )}
    </div>
  );
}
