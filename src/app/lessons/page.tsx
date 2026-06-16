import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getProfile } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import SubjectBadge from "@/components/SubjectBadge";
import FilterSelect from "@/components/FilterSelect";
import { deleteLesson } from "@/app/actions";
import Link from "next/link";
import type { Subject } from "@/lib/types";

export default async function LessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; teacher?: string; needs?: string; visibility?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const [{ data: lessons }, { data: subjects }, { data: teachers }, user, profile] = await Promise.all([
    supabase
      .from("lessons")
      .select(`
        *,
        teacher:profiles(id, full_name),
        subjects:lesson_subjects(subject:subjects(*)),
        preferred_room:rooms(name)
      `)
      .order("created_at", { ascending: false }),
    supabase.from("subjects").select("*").order("name"),
    supabase.from("profiles").select("id, full_name").order("full_name"),
    getCurrentUser(),
    getProfile(),
  ]);

  const isAdmin = profile?.role === "admin";

  const lessonsWithSubjects = lessons?.map((l) => ({
    ...l,
    subjects: (l.subjects as any[])?.map((ls) => ls.subject as Subject) ?? [],
  })) ?? [];

  let filtered = lessonsWithSubjects;
  if (params.subject) filtered = filtered.filter((l) => l.subjects.some((s: Subject) => s.id === params.subject));
  if (params.teacher) filtered = filtered.filter((l) => (l.teacher as any)?.id === params.teacher);
  if (params.needs === "materials") filtered = filtered.filter((l) => l.has_materials);
  if (params.needs === "equipment") filtered = filtered.filter((l) => l.has_equipment);
  if (params.visibility === "public") filtered = filtered.filter((l) => (l as any).is_public);
  if (params.visibility === "private") filtered = filtered.filter((l) => !(l as any).is_public);

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">בנק שיעורים</h1>
          <Link
            href="/lessons/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            + שיעור חדש
          </Link>
        </div>

        {/* פילטרים */}
        <div className="flex flex-wrap gap-2 mb-6">
          <FilterSelect name="subject" value={params.subject ?? ""} label="קטגוריה" action="/lessons">
            <option value="">כל הקטגוריות</option>
            {subjects?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </FilterSelect>
          {isAdmin && (
            <FilterSelect name="teacher" value={params.teacher ?? ""} label="מורה" action="/lessons">
              <option value="">כל המורים</option>
              {teachers?.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </FilterSelect>
          )}
          <FilterSelect name="needs" value={params.needs ?? ""} label="צרכים" action="/lessons">
            <option value="">הכל</option>
            <option value="materials">יש מצרכים</option>
            <option value="equipment">יש ציוד</option>
          </FilterSelect>
          <FilterSelect name="visibility" value={params.visibility ?? ""} label="נראות" action="/lessons">
            <option value="">הכל</option>
            <option value="public">ציבורי</option>
            <option value="private">פרטי</option>
          </FilterSelect>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">אין שיעורים להצגה</p>
            <Link href="/lessons/new" className="mt-2 text-blue-600 hover:underline text-sm block">
              צור את השיעור הראשון
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((lesson) => {
              const isOwner = (lesson.teacher as any)?.id === user!.id;
              const canEdit = isOwner || isAdmin;
              const lessonIsPublic = (lesson as any).is_public;

              return (
                <div
                  key={lesson.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 truncate">{lesson.title}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          lessonIsPublic
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {lessonIsPublic ? "ציבורי" : "פרטי"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {(lesson.teacher as any)?.full_name}
                      </p>
                    </div>
                    {canEdit && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link
                          href={`/lessons/${lesson.id}`}
                          className="text-xs text-blue-600 hover:underline leading-none"
                        >
                          ערוך
                        </Link>
                        <form action={deleteLesson.bind(null, lesson.id)} className="flex items-center">
                          <button type="submit" className="text-xs text-red-500 hover:underline leading-none">מחק</button>
                        </form>
                      </div>
                    )}
                  </div>

                  {lesson.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{lesson.description}</p>
                  )}

                  <div className="flex flex-wrap gap-1 mt-3">
                    {lesson.subjects.map((s: Subject) => <SubjectBadge key={s.id} subject={s} />)}
                  </div>

                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
                    {(lesson.preferred_room as any)?.name && (
                      <span className="flex items-center gap-1">
                        <span>📍</span> {(lesson.preferred_room as any).name}
                      </span>
                    )}
                  </div>
                  {lesson.has_materials && (
                    <div className="mt-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                      <span className="font-medium">🧪 מצרכים</span>
                      {(lesson as any).materials_notes && (
                        <p className="mt-0.5 text-amber-600">{(lesson as any).materials_notes}</p>
                      )}
                    </div>
                  )}
                  {lesson.has_equipment && (
                    <div className="mt-2 text-xs text-purple-700 bg-purple-50 rounded-lg px-3 py-2">
                      <span className="font-medium">🔧 ציוד</span>
                      {(lesson as any).equipment_notes && (
                        <p className="mt-0.5 text-purple-600">{(lesson as any).equipment_notes}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
