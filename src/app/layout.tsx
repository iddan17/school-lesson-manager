import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
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
        <NextTopLoader color="#2563eb" height={3} showSpinner={false} shadow="0 0 10px #2563eb,0 0 5px #2563eb" />
        {children}
      </body>
    </html>
  );
}
