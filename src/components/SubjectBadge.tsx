import type { Subject } from "@/lib/types";

export default function SubjectBadge({ subject }: { subject: Subject }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: subject.color }}
    >
      {subject.name}
    </span>
  );
}
