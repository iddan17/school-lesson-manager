"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Class, Profile } from "@/lib/types";

export default function ScheduleWeekFilters({
  classes,
  teachers,
}: {
  classes: (Class & { school?: { name: string } | null })[];
  teachers: Pick<Profile, "id" | "full_name">[];
}) {
  const router = useRouter();
  const sp = useSearchParams();

  function setParam(key: string, val: string) {
    const p = new URLSearchParams(sp.toString());
    if (val) p.set(key, val);
    else p.delete(key);
    router.push(`/schedule?${p.toString()}`);
  }

  const sel = "border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="flex flex-wrap gap-3">
      <select className={sel} aria-label="כיתה" value={sp.get("class_id") ?? ""} onChange={(e) => setParam("class_id", e.target.value)}>
        <option value="">כל הכיתות</option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}{c.school?.name ? ` — ${c.school.name}` : ""}
          </option>
        ))}
      </select>
      <select className={sel} aria-label="מורה" value={sp.get("teacher_id") ?? ""} onChange={(e) => setParam("teacher_id", e.target.value)}>
        <option value="">כל המורים</option>
        {teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
      </select>
    </div>
  );
}
