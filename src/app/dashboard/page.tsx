import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { count: lessonsCount },
    { count: scheduledCount },
    profile,
  ] = await Promise.all([
    supabase.from("lessons").select("*", { count: "exact", head: true }),
    supabase.from("schedule_entries").select("*", { count: "exact", head: true }).eq("school_year", new Date().getFullYear()),
    getProfile(),
  ]);

  const currentYear = new Date().getFullYear();

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            שלום, {profile?.full_name} 👋
          </h1>
          <p className="text-gray-500 mt-1">שנת לימודים {currentYear}–{currentYear + 1}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-3">
          <StatCard label="שיעורים בבנק" value={lessonsCount ?? 0} color="blue" />
          <StatCard label="שיבוצים השנה" value={scheduledCount ?? 0} color="green" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <ActionCard
            href="/lessons/new"
            title="צור שיעור חדש"
            desc="הוסף שיעור לבנק השיעורים"
            icon="📚"
          />
          <ActionCard
            href="/schedule/plan"
            title="תכנון שנתי"
            desc="שבץ שיעורים לכיתות ולחריצי זמן"
            icon="📅"
          />
          <ActionCard
            href="/lessons"
            title="בנק שיעורים"
            desc="צפה בכל השיעורים של כל המורים"
            icon="🗂️"
          />
          <ActionCard
            href="/schedule"
            title="מערכת שעות"
            desc="לוח שבועי לפי כיתה ומורה"
            icon="🗓️"
          />
        </div>
      </main>
    </>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
  };
  return (
    <div className={`rounded-xl p-4 ${colors[color]}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm mt-1 opacity-80">{label}</div>
    </div>
  );
}

function ActionCard({ href, title, desc, icon }: { href: string; title: string; desc: string; icon: string }) {
  return (
    <Link
      href={href}
      className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all flex items-start gap-3"
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <div className="font-medium text-gray-900">{title}</div>
        <div className="text-sm text-gray-500 mt-0.5">{desc}</div>
      </div>
    </Link>
  );
}
