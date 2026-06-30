"use client";

import { useState } from "react";
import { useActionState } from "react";
import { login } from "@/app/actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);
  const [mode, setMode] = useState<"teacher" | "admin">("teacher");

  const tab = (m: "teacher" | "admin", label: string) => (
    <button
      type="button"
      onClick={() => setMode(m)}
      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
        mode === m ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">מערכת שיעורים</h1>
        <p className="text-gray-500 text-sm mb-5">כניסה למערכת</p>

        <div className="flex gap-2 mb-5">
          {tab("teacher", "כניסת מורה")}
          {tab("admin", "כניסת מנהל")}
        </div>

        <form action={action} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם משתמש</label>
            <input
              name="username"
              type="text"
              required
              autoFocus
              autoComplete="username"
              dir="ltr"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {mode === "admin" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה</label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                dir="ltr"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          {(state as any)?.error && (
            <p className="text-red-500 text-sm">{(state as any).error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {pending ? "מתחבר..." : "כניסה"}
          </button>
        </form>
      </div>
    </div>
  );
}
