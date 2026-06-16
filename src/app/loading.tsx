// Shown instantly on navigation (via Suspense) while the destination page
// renders on the server — so a click gives immediate feedback instead of freezing.
export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
    </div>
  );
}
