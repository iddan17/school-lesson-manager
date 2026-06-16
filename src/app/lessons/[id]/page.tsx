import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import LessonForm from "@/components/LessonForm";
import { updateLesson } from "@/app/actions";
import Link from "next/link";
import type { Subject } from "@/lib/types";

export default async function EditLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [user, profile, { data: lesson }] = await Promise.all([
    getCurrentUser(),
    getProfile(),
    supabase
      .from("lessons")
      .select(`*, subjects:lesson_subjects(subject:subjects(*)), preferred_room:rooms(*)`)
      .eq("id", id)
      .single(),
  ]);

  if (!lesson) redirect("/lessons");

  // Only owner or admin can edit
  if (lesson.teacher_id !== user!.id && profile?.role !== "admin") redirect("/lessons");

  const lessonWithSubjects = {
    ...lesson,
    subjects: (lesson.subjects as any[])?.map((ls) => ls.subject as Subject) ?? [],
  };

  const [{ data: subjects }, { data: rooms }] = await Promise.all([
    supabase.from("subjects").select("*").order("name"),
    supabase.from("rooms").select("*").order("name"),
  ]);

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/lessons" className="text-gray-400 hover:text-gray-600 text-sm">
            ← חזרה לבנק
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">עריכת שיעור</h1>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <LessonForm
            subjects={subjects ?? []}
            rooms={rooms ?? []}
            lesson={lessonWithSubjects as any}
            action={updateLesson.bind(null, id)}
            submitLabel="שמור שינויים"
            isAdmin={profile?.role === "admin"}
          />
        </div>
      </main>
    </>
  );
}
