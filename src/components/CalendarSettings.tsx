"use client";

import { useState } from "react";
import type { SchoolYearConfig, CalendarExceptionRow } from "@/lib/types";
import { setSchoolYearConfig, addCalendarException, removeCalendarException } from "@/app/actions";
import { formatDateHe } from "@/lib/calendar";

interface Props {
  schoolYear: number;
  yearConfig: SchoolYearConfig | null;
  exceptions: CalendarExceptionRow[];
}

function defaultYMD(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function CalendarSettings({ schoolYear, yearConfig, exceptions: initExceptions }: Props) {
  const [open, setOpen] = useState(false);
  const [exceptions, setExceptions] = useState<CalendarExceptionRow[]>(initExceptions);
  const [start, setStart] = useState(yearConfig?.start_date ?? defaultYMD(schoolYear, 9, 1));
  const [end, setEnd] = useState(yearConfig?.end_date ?? defaultYMD(schoolYear + 1, 6, 30));
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100">
        <span>📅 הגדרות לוח שנה וחגים (מנהל)</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="bg-white p-4 space-y-5">
          {/* Year range */}
          <form
            action={async (fd) => {
              fd.set("school_year", String(schoolYear));
              setBusy(true); await setSchoolYearConfig(fd); setBusy(false);
              setSaved(true); setTimeout(() => setSaved(false), 2000);
            }}
            className="flex flex-wrap items-end gap-3"
          >
            <label className="text-sm">
              <span className="block text-gray-600 mb-1">תחילת שנה</span>
              <input type="date" name="start_date" value={start} onChange={(e) => setStart(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
            </label>
            <label className="text-sm">
              <span className="block text-gray-600 mb-1">סוף שנה</span>
              <input type="date" name="end_date" value={end} onChange={(e) => setEnd(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
            </label>
            <button type="submit" disabled={busy}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              שמור טווח
            </button>
            {saved && <span className="text-sm text-green-600">נשמר ✓</span>}
          </form>

          {/* Exceptions */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">חריגים ידניים</p>
            <p className="text-xs text-gray-400 mb-3">
              חגי ישראל מחושבים אוטומטית. כאן ניתן להוסיף ימי חופש נוספים (למשל טיול) או לבטל חג ולקבוע יום לימודים.
            </p>
            {exceptions.length > 0 && (
              <div className="space-y-1 mb-3">
                {exceptions.map((ex) => (
                  <div key={ex.id} className="flex items-center justify-between text-sm border border-gray-100 rounded-lg px-3 py-1.5">
                    <span>
                      {formatDateHe(new Date(ex.date))} — {ex.closed ? "אין לימודים" : "יש לימודים"}
                      {ex.reason ? ` (${ex.reason})` : ""}
                    </span>
                    <button onClick={async () => {
                      await removeCalendarException(ex.id);
                      setExceptions((p) => p.filter((e) => e.id !== ex.id));
                    }} className="text-xs text-red-400 hover:text-red-600">מחק</button>
                  </div>
                ))}
              </div>
            )}
            <form
              action={async (fd) => {
                fd.set("school_year", String(schoolYear));
                setBusy(true); await addCalendarException(fd); setBusy(false);
                const date = fd.get("date") as string;
                const closed = fd.get("closed") === "true";
                const reason = (fd.get("reason") as string) || null;
                setExceptions((p) => [...p.filter((e) => e.date !== date), { id: crypto.randomUUID(), school_year: schoolYear, date, closed, reason }]);
              }}
              className="flex flex-wrap items-end gap-2"
            >
              <input type="date" name="date" required className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
              <select name="closed" className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
                <option value="true">אין לימודים</option>
                <option value="false">יש לימודים</option>
              </select>
              <input name="reason" placeholder="סיבה (אופציונלי)" className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm flex-1 min-w-[140px]" />
              <button type="submit" disabled={busy}
                className="bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50">
                הוסף חריג
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
