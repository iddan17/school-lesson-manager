"use client";

import { useState } from "react";
import type { Subject, Room, Lesson } from "@/lib/types";
import { createSubjectInline, createRoomInline } from "@/app/actions";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
  "#64748b", "#14b8a6",
];

interface Props {
  subjects: Subject[];
  rooms: Room[];
  lesson?: Lesson;
  action: (formData: FormData) => Promise<any>;
  submitLabel: string;
  isAdmin?: boolean;
}

export default function LessonForm({ subjects: initialSubjects, rooms: initialRooms, lesson, action, submitLabel, isAdmin }: Props) {
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    lesson?.subjects?.map((s) => s.id) ?? []
  );
  const [hasMaterials, setHasMaterials] = useState(lesson?.has_materials ?? false);
  const [hasEquipment, setHasEquipment] = useState(lesson?.has_equipment ?? false);

  // Inline add subject
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectColor, setNewSubjectColor] = useState("#3b82f6");
  const [addingSubject, setAddingSubject] = useState(false);

  // Inline add room
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomCapacity, setNewRoomCapacity] = useState("");
  const [addingRoom, setAddingRoom] = useState(false);

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

  async function handleAddSubject() {
    if (!newSubjectName.trim()) return;
    setAddingSubject(true);
    const fd = new FormData();
    fd.set("name", newSubjectName.trim());
    fd.set("color", newSubjectColor);
    const result = await createSubjectInline(fd);
    setAddingSubject(false);
    if ((result as any).subject) {
      setSubjects((prev) => [...prev, (result as any).subject]);
      setSelectedSubjects((prev) => [...prev, (result as any).subject.id]);
      setNewSubjectName("");
      setNewSubjectColor("#3b82f6");
      setShowAddSubject(false);
    }
  }

  async function handleAddRoom() {
    if (!newRoomName.trim()) return;
    setAddingRoom(true);
    const fd = new FormData();
    fd.set("name", newRoomName.trim());
    if (newRoomCapacity) fd.set("capacity", newRoomCapacity);
    const result = await createRoomInline(fd);
    setAddingRoom(false);
    if ((result as any).room) {
      setRooms((prev) => [...prev, (result as any).room]);
      setNewRoomName("");
      setNewRoomCapacity("");
      setShowAddRoom(false);
    }
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
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">קטגוריות</label>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowAddSubject((v) => !v)}
              className="text-xs text-blue-600 hover:underline"
            >
              {showAddSubject ? "ביטול" : "+ קטגוריה חדשה"}
            </button>
          )}
        </div>
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
        {isAdmin && showAddSubject && (
          <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
            <input
              type="text"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              placeholder="שם הקטגוריה"
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            />
            <div className="flex gap-1.5 flex-wrap">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewSubjectColor(color)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    newSubjectColor === color ? "border-gray-800 scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddSubject}
              disabled={addingSubject || !newSubjectName.trim()}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {addingSubject ? "מוסיף..." : "הוסף קטגוריה"}
            </button>
          </div>
        )}
      </div>

      {/* חדר מועדף */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700">חדר/מקום מועדף</label>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowAddRoom((v) => !v)}
              className="text-xs text-blue-600 hover:underline"
            >
              {showAddRoom ? "ביטול" : "+ חדר חדש"}
            </button>
          )}
        </div>
        <select
          name="preferred_room_id"
          defaultValue={lesson?.preferred_room_id ?? ""}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">ללא העדפה</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>{r.name}{r.capacity ? ` (${r.capacity})` : ""}</option>
          ))}
        </select>
        {isAdmin && showAddRoom && (
          <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="שם החדר (מעבדה, אולם...)"
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            />
            <input
              type="number"
              value={newRoomCapacity}
              onChange={(e) => setNewRoomCapacity(e.target.value)}
              placeholder="קיבולת (אופציונלי)"
              min={1}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={handleAddRoom}
              disabled={addingRoom || !newRoomName.trim()}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {addingRoom ? "מוסיף..." : "הוסף חדר"}
            </button>
          </div>
        )}
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
