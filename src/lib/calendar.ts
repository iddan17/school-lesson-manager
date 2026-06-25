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

// Parse "yyyy-mm-dd" into a LOCAL-midnight Date (avoids UTC day-shift).
export function parseYMD(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Official Israeli Ministry of Education vacation spans, keyed by school year
// (the September year). Each span is inclusive [start, end] of no-school days.
// Sourced from the published תשפ"ו / תשפ"ז calendars; admins refine via
// calendar_exceptions. Years not listed fall back to the Hebrew-calendar calc.
const MINISTRY_VACATIONS: Record<number, { start: string; end: string; name: string }[]> = {
  // תשפ"ו — 2025/2026
  2025: [
    { start: "2025-09-22", end: "2025-09-24", name: "ראש השנה" },
    { start: "2025-10-01", end: "2025-10-14", name: "יום כיפור וסוכות" },
    { start: "2025-12-16", end: "2025-12-22", name: "חנוכה" },
    { start: "2026-03-03", end: "2026-03-04", name: "פורים" },
    { start: "2026-03-24", end: "2026-04-08", name: "פסח" },
    { start: "2026-04-22", end: "2026-04-22", name: "יום העצמאות" },
    { start: "2026-05-05", end: "2026-05-05", name: "ל\"ג בעומר" },
    { start: "2026-05-21", end: "2026-05-22", name: "שבועות" },
  ],
  // תשפ"ז — 2026/2027
  2026: [
    { start: "2026-09-11", end: "2026-09-13", name: "ראש השנה" },
    { start: "2026-09-20", end: "2026-10-03", name: "יום כיפור וסוכות" },
    { start: "2026-12-06", end: "2026-12-12", name: "חנוכה" },
    { start: "2027-03-23", end: "2027-03-24", name: "פורים" },
    { start: "2027-04-13", end: "2027-04-28", name: "פסח" },
    { start: "2027-05-12", end: "2027-05-12", name: "יום העצמאות" },
    { start: "2027-05-25", end: "2027-05-25", name: "ל\"ג בעומר" },
    { start: "2027-06-10", end: "2027-06-11", name: "שבועות" },
  ],
};

// Maps each Israeli no-school date in range to its Hebrew holiday name.
// Uses the official Ministry vacation list for the given school year when
// available; otherwise derives holidays from the Hebrew calendar (@hebcal).
export function getNoSchoolMap(schoolYear: number, start: Date, end: Date): Map<string, string> {
  const out = new Map<string, string>();

  const ministry = MINISTRY_VACATIONS[schoolYear];
  if (ministry) {
    for (const v of ministry) {
      const d = parseYMD(v.start);
      const last = parseYMD(v.end);
      while (d <= last) {
        out.set(toYMD(d), v.name);
        d.setDate(d.getDate() + 1);
      }
    }
    return out;
  }

  const events = HebrewCalendar.calendar({ start, end, il: true });
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
