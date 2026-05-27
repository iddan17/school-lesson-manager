"use client";

import { useState } from "react";
import type { Subject, Room, Lesson } from "@/lib/types";

interface Props {
  subjects: Subject[];
  rooms: Room[];
  lesson?: Lesson;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: (formData: FormData) => Promise<any>;
  submitLabel: string;
}

export default function LessonForm({ subjects, rooms, lesson, action, submitLabel }: Props) {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    lesson?.subjects?.map((s) => s.id) ?? []
  );
  const [hasMaterials, setHasMaterials] = useState(lesson?.has_materials ?? false);
  const [hasEquipment, setHasEquipment] = useState(lesson?.has_equipment ?? false);

  function toggleSubject(id: string) {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  async function handleSubmit(formData: FormData) {
    selectedSubjects.forEach((id) => formData.append("subject_ids", id));
    formData.set("has_materials", hasMaterials.toString());
    formData.set("has_equipment", hasEquipment.toString());
    await action(formData);
  }

  return (
    <form action={handleSubmit} className="space-y-5 max-w-xl">
      {/* כותרת */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">כותרת השיעור *</label>
        <input
          name="title"
          defaultValue={lesson?.title}
          required
          placeholder="לדוג׳: אלגברה — משוואות ריבועיות"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* תיאור */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
        <textarea
          name="description"
          defaultValue={lesson?.description ?? ""}
          rows={2}
          placeholder="תיאור קצר של תוכן השיעור..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* קטגוריות */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">קטגוריות</label>
        <div className="flex flex-wrap gap-2">
          {subjects.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggleSubject(s.id)}
              className={`px-3 py-1 rounded-full text-sm border transition-all ${
                selectedSubjects.includes(s.id)
                  ? "text-white border-transparent"
                  : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
              }`}
              style={selectedSubjects.includes(s.id) ? { backgroundColor: s.color, borderColor: s.color } : {}}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* חדר מועדף */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">חדר/מקום מועדף</label>
        <select
          name="preferred_room_id"
          defaultValue={lesson?.preferred_room_id ?? ""}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">ללא העדפה</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      {/* מצרכים וציוד */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">צרכים מיוחדים</p>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={hasMaterials}
            onChange={(e) => setHasMaterials(e.target.checked)}
            className="mt-0.5"
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-800">מצרכים</span>
            {hasMaterials && (
              <textarea
                name="materials_notes"
                defaultValue={lesson?.materials_notes ?? ""}
                rows={2}
                placeholder="פרט את המצרכים הנדרשים..."
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            )}
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={hasEquipment}
            onChange={(e) => setHasEquipment(e.target.checked)}
            className="mt-0.5"
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-800">ציוד</span>
            {hasEquipment && (
              <textarea
                name="equipment_notes"
                defaultValue={lesson?.equipment_notes ?? ""}
                rows={2}
                placeholder="פרט את הציוד הנדרש..."
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            )}
          </div>
        </label>
      </div>

      {/* הערות כלליות */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">הערות כלליות</label>
        <textarea
          name="general_notes"
          defaultValue={lesson?.general_notes ?? ""}
          rows={2}
          placeholder="הערות נוספות..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        {submitLabel}
      </button>
    </form>
  );
}
