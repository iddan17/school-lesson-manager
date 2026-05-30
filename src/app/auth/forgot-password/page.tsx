"use client";

import { useActionState } from "react";
import { forgotPassword } from "@/app/actions";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(forgotPassword, undefined);

  if ((state as any)?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm text-center">
          <div className="text-4xl mb-3">📧</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">נשלח מייל לאיפוס</h1>
          <p className="text-sm text-gray-500 mb-4">בדוק את תיבת המייל שלך ולחץ על הקישור לאיפוס הסיסמה.</p>
          <Link href="/auth/login" className="text-blue-600 hover:underline text-sm">
            חזרה לכניסה
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">שכחתי סיסמה</h1>
        <p className="text-gray-500 text-sm mb-6">נשלח לך קישור לאיפוס הסיסמה</p>

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
          {(state as any)?.error && (
            <p className="text-red-500 text-sm">{(state as any).error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {pending ? "שולח..." : "שלח קישור איפוס"}
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-gray-500">
          <Link href="/auth/login" className="text-blue-600 hover:underline">
            חזרה לכניסה
          </Link>
        </p>
      </div>
    </div>
  );
}
