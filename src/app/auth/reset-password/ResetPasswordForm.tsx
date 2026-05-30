"use client";

import { useActionState } from "react";
import { updatePassword } from "@/app/actions";

export default function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, undefined);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">סיסמה חדשה</h1>
        <p className="text-gray-500 text-sm mb-6">הכנס את הסיסמה החדשה שלך</p>

        <form action={action} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה חדשה</label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {(state as any)?.error && (
            <p className="text-red-500 text-sm">{(state as any).error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {pending ? "שומר..." : "שמור סיסמה חדשה"}
          </button>
        </form>
      </div>
    </div>
  );
}
