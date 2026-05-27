"use client";

export default function FilterSelect({
  name,
  value,
  label,
  action,
  children,
}: {
  name: string;
  value: string;
  label: string;
  action: string;
  children: React.ReactNode;
}) {
  return (
    <form method="get" action={action}>
      <select
        name={name}
        defaultValue={value}
        onChange={(e) => (e.target.form as HTMLFormElement).submit()}
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={label}
      >
        {children}
      </select>
    </form>
  );
}
