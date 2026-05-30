"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { DayOfWeek } from "@/lib/types";

// ===== AUTH =====

export async function login(_: unknown, formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect("/dashboard");
}

export async function register(_: unknown, formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const full_name = formData.get("full_name") as string;
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name, role: "teacher" } },
  });
  if (error) return { error: error.message };
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

export async function forgotPassword(_: unknown, formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const headersList = await headers();
  const origin =
    headersList.get("origin") ??
    `${headersList.get("x-forwarded-proto") ?? "http"}://${headersList.get("host") ?? "localhost:3001"}`;
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/reset-password`,
  });
  return { success: true };
}

export async function updatePassword(_: unknown, formData: FormData) {
  const supabase = await createClient();
  const password = formData.get("password") as string;
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/dashboard");
}

export async function createSubjectInline(formData: FormData) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subjects")
    .insert({ name: formData.get("name") as string, color: formData.get("color") as string })
    .select()
    .single();
  if (error) return { error: error.message };
  return { subject: data };
}

export async function updateSubjectInline(id: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("subjects").update({
    name: formData.get("name") as string,
    color: formData.get("color") as string,
  }).eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteSubjectInline(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("subjects").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function createRoomInline(formData: FormData) {
  const supabase = await createClient();
  const capacity = formData.get("capacity") as string;
  const { data, error } = await supabase
    .from("rooms")
    .insert({ name: formData.get("name") as string, capacity: capacity ? parseInt(capacity) : null })
    .select()
    .single();
  if (error) return { error: error.message };
  return { room: data };
}

export async function updateRoomInline(id: string, formData: FormData) {
  const supabase = await createClient();
  const capacity = formData.get("capacity") as string;
  const { error } = await supabase.from("rooms").update({
    name: formData.get("name") as string,
    capacity: capacity ? parseInt(capacity) : null,
  }).eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteRoomInline(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("rooms").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

// ===== LESSONS =====

export async function createLesson(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "לא מחובר" };

  const subjectIds = formData.getAll("subject_ids") as string[];

  const { data: lesson, error } = await supabase
    .from("lessons")
    .insert({
      teacher_id: user.id,
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      has_materials: formData.get("has_materials") === "true",
      has_equipment: formData.get("has_equipment") === "true",
      materials_notes: (formData.get("materials_notes") as string) || null,
      equipment_notes: (formData.get("equipment_notes") as string) || null,
      general_notes: (formData.get("general_notes") as string) || null,
      preferred_room_id: (formData.get("preferred_room_id") as string) || null,
    })
    .select()
    .single();

  if (error || !lesson) return { error: error?.message ?? "שגיאה" };

  if (subjectIds.length > 0) {
    await supabase.from("lesson_subjects").insert(
      subjectIds.map((subject_id) => ({ lesson_id: lesson.id, subject_id }))
    );
  }

  redirect("/lessons");
}

export async function updateLesson(id: string, formData: FormData) {
  const supabase = await createClient();
  const subjectIds = formData.getAll("subject_ids") as string[];

  const { error } = await supabase
    .from("lessons")
    .update({
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      has_materials: formData.get("has_materials") === "true",
      has_equipment: formData.get("has_equipment") === "true",
      materials_notes: (formData.get("materials_notes") as string) || null,
      equipment_notes: (formData.get("equipment_notes") as string) || null,
      general_notes: (formData.get("general_notes") as string) || null,
      preferred_room_id: (formData.get("preferred_room_id") as string) || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await supabase.from("lesson_subjects").delete().eq("lesson_id", id);
  if (subjectIds.length > 0) {
    await supabase.from("lesson_subjects").insert(
      subjectIds.map((subject_id) => ({ lesson_id: id, subject_id }))
    );
  }

  redirect("/lessons");
}

export async function deleteLesson(id: string) {
  const supabase = await createClient();
  await supabase.from("lessons").delete().eq("id", id);
  redirect("/lessons");
}

// ===== SCHEDULE =====

export async function createScheduleEntry(data: {
  lesson_id: string;
  class_id: string;
  school_year: number;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  room_id?: string | null;
}) {
  const supabase = await createClient();

  // בדיקת קונפליקט חדר
  if (data.room_id) {
    const { data: conflict } = await supabase
      .from("schedule_entries")
      .select(`
        *,
        lesson:lessons(title, teacher:profiles(full_name)),
        class:classes(name)
      `)
      .eq("room_id", data.room_id)
      .eq("school_year", data.school_year)
      .eq("day_of_week", data.day_of_week)
      .lt("start_time", data.end_time)
      .gt("end_time", data.start_time)
      .maybeSingle();

    if (conflict) {
      // מציאת חריצים חלופיים: אותה כיתה + החדר פנוי
      const { data: alternatives } = await supabase
        .from("schedule_entries")
        .select("day_of_week, start_time, end_time")
        .eq("class_id", data.class_id)
        .eq("school_year", data.school_year)
        .not("id", "eq", conflict.id);

      return {
        conflict: {
          teacher_name: (conflict.lesson as any)?.teacher?.full_name ?? "",
          class_name: (conflict.class as any)?.name ?? "",
          lesson_title: (conflict.lesson as any)?.title ?? "",
          day_of_week: conflict.day_of_week,
          start_time: conflict.start_time,
          end_time: conflict.end_time,
        },
        alternatives: alternatives ?? [],
      };
    }
  }

  const { error } = await supabase.from("schedule_entries").insert(data);
  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteScheduleEntry(id: string) {
  const supabase = await createClient();
  await supabase.from("schedule_entries").delete().eq("id", id);
}

// ===== ADMIN =====

export async function createSubject(formData: FormData): Promise<void> {
  const supabase = await createClient();
  await supabase.from("subjects").insert({
    name: formData.get("name") as string,
    color: formData.get("color") as string,
  });
  redirect("/admin/subjects");
}

export async function deleteSubject(id: string) {
  const supabase = await createClient();
  await supabase.from("subjects").delete().eq("id", id);
  redirect("/admin/subjects");
}

export async function createSchool(formData: FormData): Promise<void> {
  const supabase = await createClient();
  await supabase.from("schools").insert({ name: formData.get("name") as string });
  redirect("/admin");
}

export async function deleteSchool(id: string) {
  const supabase = await createClient();
  await supabase.from("schools").delete().eq("id", id);
  redirect("/admin");
}

export async function createClass(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const grade = parseInt(formData.get("grade") as string);
  const gradeNames: Record<number, string> = {
    1: "א'", 2: "ב'", 3: "ג'", 4: "ד'", 5: "ה'",
    6: "ו'", 7: "ז'", 8: "ח'", 9: "ט'",
  };
  await supabase.from("classes").insert({
    name: gradeNames[grade],
    grade,
    school_id: formData.get("school_id") as string,
  });
  redirect("/admin");
}

export async function deleteClass(id: string) {
  const supabase = await createClient();
  await supabase.from("classes").delete().eq("id", id);
  redirect("/admin");
}

export async function createRoom(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const capacity = formData.get("capacity") as string;
  await supabase.from("rooms").insert({
    name: formData.get("name") as string,
    capacity: capacity ? parseInt(capacity) : null,
  });
  redirect("/admin");
}

export async function deleteRoom(id: string) {
  const supabase = await createClient();
  await supabase.from("rooms").delete().eq("id", id);
  redirect("/admin");
}

export async function updateUserRole(userId: string, role: "teacher" | "admin") {
  const supabase = await createClient();
  await supabase.from("profiles").update({ role }).eq("id", userId);
  redirect("/admin");
}
