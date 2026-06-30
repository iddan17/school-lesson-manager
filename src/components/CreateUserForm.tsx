"use client";

import { useState } from "react";
import { createUserAccount } from "@/app/actions";

export default function CreateUserForm({ error }: { error?: string }) {
  const [role, setRole] = useState<"teacher" | "admin">("teacher");
  const field = "border border-gray-300 rounded-lg px-3 py-1.5 text-sm";

  return (
    <div className="border-t border-gray-100 bg-gray-50 p-3">
      {error && <p className="text-red-600 text-xs mb-2">{error}</p>}
      <form action={createUserAccount} className="flex flex-wrap items-end gap-2">
        <input name="username" placeholder="שם משתמש" required dir="ltr" className={`${field} flex-1 min-w-[140px] text-left`} />
        <select name="role" value={role} onChange={(e) => setRole(e.target.value as "teacher" | "admin")} className={field}>
          <option value="teacher">מורה</option>
          <option value="admin">מנהל</option>
        </select>
        {role === "admin" && (
          <input name="password" type="password" placeholder="סיסמה למנהל" required dir="ltr" className={`${field} text-left`} />
        )}
        <button type="submit" className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700">
          + צור משתמש
        </button>
      </form>
      <p className="text-xs text-gray-400 mt-1">מורה נכנס עם שם המשתמש בלבד. מנהל נכנס עם שם משתמש + סיסמה.</p>
    </div>
  );
}
