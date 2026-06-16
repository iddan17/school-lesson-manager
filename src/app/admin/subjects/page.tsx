import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createSubject, deleteSubject } from "@/app/actions";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
  "#64748b", "#14b8a6",
];

export default async function SubjectsPage() {
  const supabase = await createClient();
  const [profile, { data: subjects }] = await Promise.all([
    getProfile(),
    supabase.from("subjects").select("*").order("name"),
  ]);
  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">קטגוריות ומקצועות</h1>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
          <div className="grid grid-cols-3 gap-3 p-4 sm:grid-cols-4">
            {subjects?.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-2 border border-gray-100 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-sm font-medium truncate">{s.name}</span>
                </div>
                <form action={deleteSubject.bind(null, s.id)}>
                  <button type="submit" className="text-gray-400 hover:text-red-500 text-xs leading-none">×</button>
                </form>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">קטגוריה חדשה</h2>
          <form action={createSubject} className="space-y-3">
            <input
              name="name"
              placeholder="שם הקטגוריה"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <div>
              <p className="text-xs text-gray-500 mb-2">בחר צבע:</p>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <label key={color} className="cursor-pointer">
                    <input type="radio" name="color" value={color} className="sr-only" defaultChecked={color === "#3b82f6"} />
                    <span
                      className="block w-7 h-7 rounded-full border-2 border-transparent hover:border-gray-400 transition-all"
                      style={{ backgroundColor: color }}
                    />
                  </label>
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
            >
              + הוסף קטגוריה
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
