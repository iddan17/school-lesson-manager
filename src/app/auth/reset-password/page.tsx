import { createClient } from "@/lib/supabase/server";
import ResetPasswordForm from "./ResetPasswordForm";
import Link from "next/link";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm text-center">
          <p className="text-red-500 mb-4">קישור לא תקין או שפג תוקפו.</p>
          <Link href="/auth/forgot-password" className="text-blue-600 hover:underline text-sm">
            בקש קישור חדש
          </Link>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm text-center">
          <p className="text-red-500 mb-4">הקישור פג תוקף. אנא בקש קישור חדש.</p>
          <Link href="/auth/forgot-password" className="text-blue-600 hover:underline text-sm">
            בקש קישור חדש
          </Link>
        </div>
      </div>
    );
  }

  return <ResetPasswordForm />;
}
