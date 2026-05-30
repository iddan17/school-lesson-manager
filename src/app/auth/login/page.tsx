"use client";

import { useActionState } from "react";
import { login } from "@/app/actions";
import Link from "next/link";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">מערכת שיעורים</h1>
        <p className="text-gray-500 text-sm mb-6">כניסה למורים</p>

        <form action={action} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
            <input
              name="email"
              type="email"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה</label>
            <input
              name="password"
              type="password"
              required
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
            {pending ? "מתחבר..." : "כניסה"}
          </button>
        </form>

        <p className="mt-3 text-sm text-center">
          <Link href="/auth/forgot-password" className="text-gray-500 hover:text-blue-600 hover:underline">
            שכחתי סיסמה
          </Link>
        </p>
        <p className="mt-2 text-sm text-center text-gray-500">
          אין לך חשבון?{" "}
          <Link href="/auth/register" className="text-blue-600 hover:underline">
            הרשמה
          </Link>
        </p>
      </div>
    </div>
  );
}
