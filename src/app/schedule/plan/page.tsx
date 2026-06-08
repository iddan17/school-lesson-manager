import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import PlanningWizard from "@/components/PlanningWizard";

export default async function PlanPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: classes }, { data: lessons }, { data: rooms }, { data: profile }] = await Promise.all([
    supabase.from("classes").select("*").order("grade"),
    supabase
      .from("lessons")
      .select(`*, subjects:lesson_subjects(subject:subjects(*)), teacher:profiles(full_name)`)
      .order("title"),
    supabase.from("rooms").select("*").order("name"),
    supabase.from("profiles").select("*").eq("id", user!.id).single(),
  ]);

  const currentYear = new Date().getFullYear();

  // fetch existing entries for current teacher this year
  const { data: myEntries } = await supabase
    .from("schedule_entries")
    .select("*, lesson:lessons(teacher_id)")
    .eq("school_year", currentYear);

  const myScheduledEntries = myEntries?.filter(
    (e) => (e.lesson as any)?.teacher_id === user!.id
  ) ?? [];

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">תכנון מערכת שעות שנתי</h1>
        <p className="text-gray-500 text-sm mb-6">שנת {currentYear}–{currentYear + 1}</p>
        <PlanningWizard
          classes={classes ?? []}
          lessons={lessons as any ?? []}
          rooms={rooms ?? []}
          currentYear={currentYear}
          teacherId={user!.id}
          existingEntries={myScheduledEntries as any}
        />
      </main>
    </>
  );
}
