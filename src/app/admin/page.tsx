import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  createClass, deleteClass,
  createRoom, deleteRoom,
  createSchool, deleteSchool,
  updateUserRole,
} from "@/app/actions";
import CreateUserForm from "@/components/CreateUserForm";
import { GRADE_NAMES } from "@/lib/types";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ user_error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const [user, profile, { data: schools }, { data: classes }, { data: rooms }, { data: users }] = await Promise.all([
    getCurrentUser(),
    getProfile(),
    supabase.from("schools").select("*").order("name"),
    supabase.from("classes").select("*, school:schools(name)").order("school_id").order("grade"),
    supabase.from("rooms").select("*").order("name"),
    supabase.from("profiles").select("*").order("full_name"),
  ]);
  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        <h1 className="text-2xl font-bold text-gray-900">ניהול מערכת</h1>

        {/* בתי ספר */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">בתי ספר</h2>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-right px-4 py-2">שם בית הספר</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {schools?.map((school) => (
                  <tr key={school.id} className="border-t border-gray-100">
                    <td className="px-4 py-2 font-medium">{school.name}</td>
                    <td className="px-4 py-2 text-left">
                      <form action={deleteSchool.bind(null, school.id)}>
                        <button type="submit" className="text-red-500 hover:text-red-700 text-xs">מחק</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <form action={createSchool} className="flex gap-2 p-3 border-t border-gray-100 bg-gray-50">
              <input name="name" placeholder="שם בית הספר" required
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
              <button type="submit" className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700">
                + הוסף
              </button>
            </form>
          </div>
        </section>

        {/* כיתות */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">כיתות</h2>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-right px-4 py-2">כיתה</th>
                  <th className="text-right px-4 py-2">בית ספר</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {classes?.map((cls) => (
                  <tr key={cls.id} className="border-t border-gray-100">
                    <td className="px-4 py-2 font-medium">{cls.name}</td>
                    <td className="px-4 py-2 text-gray-500">{(cls.school as any)?.name}</td>
                    <td className="px-4 py-2 text-left">
                      <form action={deleteClass.bind(null, cls.id)}>
                        <button type="submit" className="text-red-500 hover:text-red-700 text-xs">מחק</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {schools && schools.length > 0 ? (
              <form action={createClass} className="flex gap-2 p-3 border-t border-gray-100 bg-gray-50 flex-wrap">
                <select name="school_id" required
                  className="flex-1 min-w-[140px] border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
                  <option value="">בחר בית ספר</option>
                  {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select name="grade" required
                  className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
                  {Object.entries(GRADE_NAMES).map(([g, name]) => (
                    <option key={g} value={g}>{name}</option>
                  ))}
                </select>
                <button type="submit" className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700">
                  + הוסף
                </button>
              </form>
            ) : (
              <p className="text-sm text-gray-400 p-3 border-t border-gray-100">הוסף תחילה בית ספר</p>
            )}
          </div>
        </section>

        {/* חדרים */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">חדרים ומקומות</h2>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-right px-4 py-2">שם</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rooms?.map((room) => (
                  <tr key={room.id} className="border-t border-gray-100">
                    <td className="px-4 py-2 font-medium">{room.name}</td>
                    <td className="px-4 py-2 text-left">
                      <form action={deleteRoom.bind(null, room.id)}>
                        <button type="submit" className="text-red-500 hover:text-red-700 text-xs">מחק</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <form action={createRoom} className="flex gap-2 p-3 border-t border-gray-100 bg-gray-50">
              <input name="name" placeholder="שם חדר (מעבדה, אולם...)" required
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
              <button type="submit" className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700">
                + הוסף
              </button>
            </form>
          </div>
        </section>

        {/* משתמשים */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">משתמשים</h2>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-right px-4 py-2">שם</th>
                  <th className="text-right px-4 py-2">תפקיד</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {users?.map((u) => (
                  <tr key={u.id} className="border-t border-gray-100">
                    <td className="px-4 py-2 font-medium">{u.full_name}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        u.role === "admin" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {u.role === "admin" ? "מנהל" : "מורה"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-left">
                      {u.id !== user!.id && (
                        <form action={updateUserRole.bind(null, u.id, u.role === "admin" ? "teacher" : "admin")}>
                          <button type="submit" className="text-blue-500 hover:text-blue-700 text-xs">
                            {u.role === "admin" ? "הפוך למורה" : "הפוך למנהל"}
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <CreateUserForm error={params.user_error} />
          </div>
        </section>
      </main>
    </>
  );
}
