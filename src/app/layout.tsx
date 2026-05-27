import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "מערכת שיעורים",
  description: "ניהול מערך שיעורים לבית ספר",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className="h-full">
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
