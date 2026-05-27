"use client";

import type { DayOfWeek, Subject } from "@/lib/types";
import { DAY_NAMES, TIME_SLOTS } from "@/lib/types";

interface EntryWithJoins {
  id: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  room_id: string | null;
  lesson: {
    id: string;
    title: string;
    teacher: { full_name: string };
    subjects: { subject: Subject }[];
    has_materials: boolean;
    has_equipment: boolean;
  };
  class: { name: string; school?: { name: string } | null };
  room: { name: string } | null;
}

interface Props {
  entries: EntryWithJoins[];
  showTeacher?: boolean;
  showClass?: boolean;
}

const DAYS: DayOfWeek[] = [0, 1, 2, 3, 4];

export default function WeeklyTimetable({ entries, showTeacher = true, showClass = true }: Props) {
  // Group entries by day+time
  function getEntry(day: DayOfWeek, startTime: string) {
    return entries.filter(
      (e) => e.day_of_week === day && e.start_time.slice(0, 5) === startTime
    );
  }

  // detect room conflicts: same room + same day + overlapping time
  const conflictEntries = new Set<string>();
  entries.forEach((a) => {
    if (!a.room_id) return;
    entries.forEach((b) => {
      if (a.id === b.id || a.room_id !== b.room_id || a.day_of_week !== b.day_of_week) return;
      if (a.start_time < b.end_time && a.end_time > b.start_time) {
        conflictEntries.add(a.id);
        conflictEntries.add(b.id);
      }
    });
  });

  return (
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
          {TIME_SLOTS.map((time, i) => {
            const nextTime = TIME_SLOTS[i + 1];
            return (
              <tr key={time} className="border-b border-gray-100 last:border-0">
                <td className="px-3 py-1 text-gray-400 text-center align-top pt-2">{time}</td>
                {DAYS.map((day) => {
                  const cells = getEntry(day, time);
                  return (
                    <td key={day} className="p-1 align-top border-r border-gray-100 last:border-0">
                      {cells.map((entry) => (
                        <LessonCell
                          key={entry.id}
                          entry={entry}
                          showTeacher={showTeacher}
                          showClass={showClass}
                          hasConflict={conflictEntries.has(entry.id)}
                        />
                      ))}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function LessonCell({
  entry,
  showTeacher,
  showClass,
  hasConflict,
}: {
  entry: EntryWithJoins;
  showTeacher: boolean;
  showClass: boolean;
  hasConflict: boolean;
}) {
  const subjects = entry.lesson.subjects?.map((ls) => ls.subject) ?? [];
  const color = subjects[0]?.color ?? "#6366f1";

  return (
    <div
      className={`rounded-md px-2 py-1.5 mb-1 border-r-2 ${
        hasConflict ? "bg-red-50 border-red-500" : "bg-blue-50 border-transparent"
      }`}
      style={!hasConflict ? { borderRightColor: color, backgroundColor: `${color}18` } : {}}
      title={hasConflict ? "קונפליקט חדר!" : ""}
    >
      <div className="font-semibold text-gray-900 leading-tight truncate">{entry.lesson.title}</div>
      {showTeacher && (
        <div className="text-gray-500 truncate">{entry.lesson.teacher?.full_name}</div>
      )}
      {showClass && (
        <div className="text-gray-500 truncate">
          {entry.class?.name}{entry.class?.school?.name ? ` — ${entry.class.school.name}` : ""}
        </div>
      )}
      {entry.room && (
        <div className={`truncate ${hasConflict ? "text-red-600 font-medium" : "text-gray-400"}`}>
          {hasConflict && "⚠️ "}{entry.room.name}
        </div>
      )}
      {(entry.lesson.has_materials || entry.lesson.has_equipment) && (
        <div className="flex gap-1 mt-0.5">
          {entry.lesson.has_materials && <span title="מצרכים">🧪</span>}
          {entry.lesson.has_equipment && <span title="ציוד">🔧</span>}
        </div>
      )}
    </div>
  );
}
