"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/app/actions";

const navLinks = [
  { href: "/dashboard", label: "ראשי" },
  { href: "/lessons", label: "בנק שיעורים" },
  { href: "/schedule", label: "מערכת שעות" },
  { href: "/schedule/plan", label: "תכנון שנתי" },
];

const adminLinks = [
  { href: "/admin", label: "ניהול" },
  { href: "/admin/subjects", label: "קטגוריות" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { profile, isAdmin } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-4 sticky top-0 z-30">
      <div className="flex items-center gap-1 flex-wrap">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === link.href
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {link.label}
          </Link>
        ))}
        {isAdmin &&
          adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "bg-orange-50 text-orange-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
      </div>

      <div className="flex items-center gap-3">
        {profile && (
          <span className="text-sm text-gray-600">
            {profile.full_name}
            {isAdmin && (
              <span className="mr-1 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                מנהל
              </span>
            )}
          </span>
        )}
        <form action={logout}>
          <button
            type="submit"
            className="text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2 py-1 rounded"
          >
            יציאה
          </button>
        </form>
      </div>
    </nav>
  );
}
