import { HebrewCalendar, flags } from "@hebcal/core";
import type { DayOfWeek } from "@/lib/types";

// yyyy-mm-dd in LOCAL time (avoids UTC date shifts).
export function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDateHe(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export interface YearRange {
  start: Date;
  end: Date;
}

// Default Israeli school year: Sept 1 (school_year) → June 30 (school_year + 1).
export function getYearRange(
  schoolYear: number,
  config?: { start_date: string; end_date: string } | null
): YearRange {
  if (config) {
    return { start: new Date(config.start_date), end: new Date(config.end_date) };
  }
  return { start: new Date(schoolYear, 8, 1), end: new Date(schoolYear + 1, 5, 30) };
}

// Israeli no-school days within [start, end], derived from the Hebrew calendar.
// Default = full festival days + chol hamoed + a curated set of school-closed
// holidays. It's an adjustable approximation; admins refine it via calendar_exceptions.
const NO_SCHOOL_BASENAMES = new Set([
  "Chanukah",
  "Purim",
  "Yom HaAtzma'ut",
  "Tish'a B'Av",
]);

// Maps each Israeli no-school date in range to its Hebrew holiday name.
export function getNoSchoolMap(start: Date, end: Date): Map<string, string> {
  const events = HebrewCalendar.calendar({ start, end, il: true });
  const out = new Map<string, string>();
  for (const ev of events) {
    const f = ev.getFlags();
    const isChag = (f & flags.CHAG) !== 0;
    const isCholHamoed = (f & flags.CHOL_HAMOED) !== 0;
    const named = NO_SCHOOL_BASENAMES.has(ev.basename());
    if (isChag || isCholHamoed || named) {
      const ymd = toYMD(ev.getDate().greg());
      if (!out.has(ymd)) out.set(ymd, ev.render("he"));
    }
  }
  return out;
}

export interface CalendarException {
  date: string; // yyyy-mm-dd
  closed: boolean; // true = force no-school, false = force school day
  reason?: string | null;
}

export interface SlotDay {
  date: Date;
  ymd: string;
  blocked: boolean; // true = no lesson can be placed (holiday / closed)
  reason: string | null; // why it's blocked (holiday name etc.)
}

// Every calendar date in range that falls on `dayOfWeek`, each flagged as a
// school day or a blocked (holiday/closed) day. An explicit exception always
// wins over the computed holiday set.
export function getSlotSchedule(
  dayOfWeek: DayOfWeek,
  range: YearRange,
  noSchool: Map<string, string>,
  exceptions: CalendarException[]
): SlotDay[] {
  const exMap = new Map(exceptions.map((e) => [e.date, e]));
  const result: SlotDay[] = [];
  const d = new Date(range.start);
  d.setHours(0, 0, 0, 0);
  const end = new Date(range.end);
  end.setHours(0, 0, 0, 0);
  while (d <= end) {
    if (d.getDay() === dayOfWeek) {
      const ymd = toYMD(d);
      const ex = exMap.get(ymd);
      let blocked: boolean;
      let reason: string | null;
      if (ex) {
        blocked = ex.closed;
        reason = ex.closed ? (ex.reason || "אין לימודים") : null;
      } else if (noSchool.has(ymd)) {
        blocked = true;
        reason = noSchool.get(ymd) ?? "חג";
      } else {
        blocked = false;
        reason = null;
      }
      result.push({ date: new Date(d), ymd, blocked, reason });
    }
    d.setDate(d.getDate() + 1);
  }
  return result;
}
