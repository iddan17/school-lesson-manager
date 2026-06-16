export type Role = "teacher" | "admin";
export type DayOfWeek = 0 | 1 | 2 | 3 | 4;

export const DAY_NAMES: Record<DayOfWeek, string> = {
  0: "ראשון",
  1: "שני",
  2: "שלישי",
  3: "רביעי",
  4: "חמישי",
};

export const TIME_SLOTS = [
  "07:30", "08:15", "09:00", "09:45", "10:30",
  "11:15", "12:00", "12:45", "13:30", "14:15",
  "15:00", "15:45",
];

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export const GRADE_NAMES: Record<number, string> = {
  1: "א'", 2: "ב'", 3: "ג'", 4: "ד'", 5: "ה'",
  6: "ו'", 7: "ז'", 8: "ח'", 9: "ט'",
};

export interface School {
  id: string;
  name: string;
  created_at: string;
}

export interface Class {
  id: string;
  name: string;
  grade: number;
  school_id: string;
  created_at: string;
  // joined
  school?: School;
}

export function classDisplayName(cls: Class): string {
  return `${cls.name}${cls.school ? ` — ${cls.school.name}` : ""}`;
}

export interface Room {
  id: string;
  name: string;
  capacity: number | null;
  created_at: string;
}

export interface Lesson {
  id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  has_materials: boolean;
  has_equipment: boolean;
  materials_notes: string | null;
  equipment_notes: string | null;
  general_notes: string | null;
  preferred_room_id: string | null;
  created_at: string;
  // joined
  teacher?: Profile;
  subjects?: Subject[];
  preferred_room?: Room;
}

export interface ScheduleEntry {
  id: string;
  lesson_id: string;
  class_id: string;
  school_year: number;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  room_id: string | null;
  created_at: string;
  // joined
  lesson?: Lesson;
  class?: Class;
  room?: Room;
}

export interface ConflictInfo {
  entry: ScheduleEntry;
  teacher_name: string;
  class_name: string;
  lesson_title: string;
}

export interface AlternativeSlot {
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
}

export interface TeachingSlot {
  id: string;
  teacher_id: string;
  class_id: string;
  school_year: number;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  room_id: string | null;
  created_at: string;
  // joined
  teacher?: Profile;
  class?: Class;
  room?: Room;
}

export interface SlotSession {
  id: string;
  slot_id: string;
  date: string; // yyyy-mm-dd
  lesson_id: string | null;
  room_id: string | null;
  created_at: string;
  // joined
  lesson?: Lesson;
}

export interface SchoolYearConfig {
  school_year: number;
  start_date: string;
  end_date: string;
}

export interface CalendarExceptionRow {
  id: string;
  school_year: number;
  date: string; // yyyy-mm-dd
  closed: boolean;
  reason: string | null;
}

// Supabase Database type stubs for createClient generics
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, "created_at">; Update: Partial<Profile> };
      subjects: { Row: Subject; Insert: Omit<Subject, "id" | "created_at">; Update: Partial<Subject> };
      classes: { Row: Class; Insert: Omit<Class, "id" | "created_at">; Update: Partial<Class> };
      rooms: { Row: Room; Insert: Omit<Room, "id" | "created_at">; Update: Partial<Room> };
      lessons: { Row: Lesson; Insert: Omit<Lesson, "id" | "created_at" | "teacher" | "subjects" | "preferred_room">; Update: Partial<Lesson> };
      lesson_subjects: { Row: { lesson_id: string; subject_id: string }; Insert: { lesson_id: string; subject_id: string }; Update: never };
      schedule_entries: { Row: ScheduleEntry; Insert: Omit<ScheduleEntry, "id" | "created_at" | "lesson" | "class" | "room">; Update: Partial<ScheduleEntry> };
      teaching_slots: { Row: TeachingSlot; Insert: Omit<TeachingSlot, "id" | "created_at" | "teacher" | "class" | "room">; Update: Partial<TeachingSlot> };
      slot_sessions: { Row: SlotSession; Insert: Omit<SlotSession, "id" | "created_at" | "lesson">; Update: Partial<SlotSession> };
      school_year_config: { Row: SchoolYearConfig; Insert: SchoolYearConfig; Update: Partial<SchoolYearConfig> };
      calendar_exceptions: { Row: CalendarExceptionRow; Insert: Omit<CalendarExceptionRow, "id">; Update: Partial<CalendarExceptionRow> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
