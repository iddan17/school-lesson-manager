"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createUserAccount } from "@/app/actions";

export default function CreateUserForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [role, setRole] = useState<"teacher" | "admin">("teacher");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const field = "border border-gray-300 rounded-lg px-3 py-1.5 text-sm";

  return (
    <div className="border-t border-gray-100 bg-gray-50 p-3">
      {error && <p className="text-red-600 text-xs mb-2">{error}</p>}
      {ok && <p className="text-green-600 text-xs mb-2">המשתמש נוצר ✓</p>}
      <form
        ref={formRef}
        action={async (fd) => {
          setBusy(true);
          setOk(false);
          const res = await createUserAccount(fd);
          setBusy(false);
          if (res.error) {
            setError(res.error);
          } else {
            setError(null);
            setOk(true);
            formRef.current?.reset();
            setRole("teacher");
            router.refresh(); // refresh the user list without scrolling away
          }
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <input name="username" placeholder="שם משתמש" required className={`${field} flex-1 min-w-[140px]`} />
        <select name="role" value={role} onChange={(e) => setRole(e.target.value as "teacher" | "admin")} className={field}>
          <option value="teacher">מורה</option>
          <option value="admin">מנהל</option>
        </select>
        {role === "admin" && (
          <input name="password" type="password" placeholder="סיסמה למנהל" required dir="ltr" className={`${field} text-left`} />
        )}
        <button type="submit" disabled={busy} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
          {busy ? "יוצר..." : "+ צור משתמש"}
        </button>
      </form>
      <p className="text-xs text-gray-400 mt-1">מורה נכנס עם שם המשתמש בלבד. מנהל נכנס עם שם משתמש + סיסמה. ניתן להשתמש בשמות בעברית.</p>
    </div>
  );
}
