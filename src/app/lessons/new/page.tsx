import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import LessonForm from "@/components/LessonForm";
import { createLesson } from "@/app/actions";
import Link from "next/link";

export default async function NewLessonPage() {
  const supabase = await createClient();
  const [{ data: subjects }, { data: rooms }, profile] = await Promise.all([
    supabase.from("subjects").select("*").order("name"),
    supabase.from("rooms").select("*").order("name"),
    getProfile(),
  ]);

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/lessons" className="text-gray-400 hover:text-gray-600 text-sm">
            ← חזרה לבנק
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">שיעור חדש</h1>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <LessonForm
            subjects={subjects ?? []}
            rooms={rooms ?? []}
            action={createLesson}
            submitLabel="צור שיעור"
            isAdmin={profile?.role === "admin"}
          />
        </div>
      </main>
    </>
  );
}
