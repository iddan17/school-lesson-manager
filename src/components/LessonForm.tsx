"use client";

import { useState } from "react";
import type { Subject, Room, Lesson } from "@/lib/types";
import {
  createSubjectInline, updateSubjectInline, deleteSubjectInline,
  createRoomInline, updateRoomInline, deleteRoomInline,
} from "@/app/actions";

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

export default function LessonForm({ subjects: init_s, rooms: init_r, lesson, action, submitLabel, isAdmin }: Props) {
  const [subjects, setSubjects] = useState<Subject[]>(init_s);
  const [rooms, setRooms] = useState<Room[]>(init_r);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(lesson?.subjects?.map((s) => s.id) ?? []);
  const [hasMaterials, setHasMaterials] = useState(lesson?.has_materials ?? false);
  const [hasEquipment, setHasEquipment] = useState(lesson?.has_equipment ?? false);

  // manage subjects panel
  const [showSubjectPanel, setShowSubjectPanel] = useState(false);
  const [editingSubject, setEditingSubject] = useState<{ id: string; name: string; color: string } | null>(null);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectColor, setNewSubjectColor] = useState("#3b82f6");
  const [showNewSubject, setShowNewSubject] = useState(false);
  const [subjectBusy, setSubjectBusy] = useState(false);

  // manage rooms panel
  const [showRoomPanel, setShowRoomPanel] = useState(false);
  const [editingRoom, setEditingRoom] = useState<{ id: string; name: string; capacity: string } | null>(null);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomCapacity, setNewRoomCapacity] = useState("");
  const [showNewRoom, setShowNewRoom] = useState(false);
  const [roomBusy, setRoomBusy] = useState(false);

  function toggleSubject(id: string) {
    setSelectedSubjects((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    selectedSubjects.forEach((id) => formData.append("subject_ids", id));
    formData.set("has_materials", hasMaterials.toString());
    formData.set("has_equipment", hasEquipment.toString());
    action(formData);
  }

  // ── Subjects ──
  async function handleAddSubject() {
    if (!newSubjectName.trim()) return;
    setSubjectBusy(true);
    const fd = new FormData();
    fd.set("name", newSubjectName.trim());
    fd.set("color", newSubjectColor);
    const res = await createSubjectInline(fd);
    setSubjectBusy(false);
    if ((res as any).subject) {
      setSubjects((p) => [...p, (res as any).subject]);
      setNewSubjectName(""); setNewSubjectColor("#3b82f6"); setShowNewSubject(false);
    }
  }

  async function handleUpdateSubject() {
    if (!editingSubject || !editingSubject.name.trim()) return;
    setSubjectBusy(true);
    const fd = new FormData();
    fd.set("name", editingSubject.name.trim());
    fd.set("color", editingSubject.color);
    await updateSubjectInline(editingSubject.id, fd);
    setSubjectBusy(false);
    setSubjects((p) => p.map((s) => s.id === editingSubject.id ? { ...s, name: editingSubject.name, color: editingSubject.color } : s));
    setEditingSubject(null);
  }

  async function handleDeleteSubject(id: string) {
    if (!confirm("למחוק קטגוריה זו?")) return;
    setSubjectBusy(true);
    await deleteSubjectInline(id);
    setSubjectBusy(false);
    setSubjects((p) => p.filter((s) => s.id !== id));
    setSelectedSubjects((p) => p.filter((sid) => sid !== id));
  }

  // ── Rooms ──
  async function handleAddRoom() {
    if (!newRoomName.trim()) return;
    setRoomBusy(true);
    const fd = new FormData();
    fd.set("name", newRoomName.trim());
    if (newRoomCapacity) fd.set("capacity", newRoomCapacity);
    const res = await createRoomInline(fd);
    setRoomBusy(false);
    if ((res as any).room) {
      setRooms((p) => [...p, (res as any).room]);
      setNewRoomName(""); setNewRoomCapacity(""); setShowNewRoom(false);
    }
  }

  async function handleUpdateRoom() {
    if (!editingRoom || !editingRoom.name.trim()) return;
    setRoomBusy(true);
    const fd = new FormData();
    fd.set("name", editingRoom.name.trim());
    if (editingRoom.capacity) fd.set("capacity", editingRoom.capacity);
    await updateRoomInline(editingRoom.id, fd);
    setRoomBusy(false);
    setRooms((p) => p.map((r) => r.id === editingRoom.id
      ? { ...r, name: editingRoom.name, capacity: editingRoom.capacity ? parseInt(editingRoom.capacity) : null }
      : r
    ));
    setEditingRoom(null);
  }

  async function handleDeleteRoom(id: string) {
    if (!confirm("למחוק חדר זה?")) return;
    setRoomBusy(true);
    await deleteRoomInline(id);
    setRoomBusy(false);
    setRooms((p) => p.filter((r) => r.id !== id));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
      {/* כותרת */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">כותרת השיעור *</label>
        <input name="title" defaultValue={lesson?.title} required
          placeholder="לדוג׳: אלגברה — משוואות ריבועיות"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* תיאור */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
        <textarea name="description" defaultValue={lesson?.description ?? ""} rows={2}
          placeholder="תיאור קצר של תוכן השיעור..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>

      {/* קטגוריות */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">קטגוריות</label>
          {isAdmin && (
            <button type="button" onClick={() => setShowSubjectPanel((v) => !v)}
              className="text-xs text-blue-600 hover:underline">
              {showSubjectPanel ? "סגור ניהול" : "⚙️ נהל קטגוריות"}
            </button>
          )}
        </div>

        {/* tag selection */}
        <div className="flex flex-wrap gap-2">
          {subjects.map((s) => (
            <button key={s.id} type="button" onClick={() => toggleSubject(s.id)}
              className={`px-3 py-1 rounded-full text-sm border transition-all ${
                selectedSubjects.includes(s.id) ? "text-white border-transparent" : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
              }`}
              style={selectedSubjects.includes(s.id) ? { backgroundColor: s.color, borderColor: s.color } : {}}>
              {s.name}
            </button>
          ))}
        </div>

        {/* admin panel */}
        {isAdmin && showSubjectPanel && (
          <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600 border-b border-gray-200">ניהול קטגוריות</div>
            <div className="divide-y divide-gray-100">
              {subjects.map((s) => (
                <div key={s.id} className="px-3 py-2">
                  {editingSubject?.id === s.id ? (
                    <div className="space-y-2">
                      <input value={editingSubject.name} onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm" />
                      <div className="flex gap-1.5 flex-wrap">
                        {PRESET_COLORS.map((c) => (
                          <button key={c} type="button" onClick={() => setEditingSubject({ ...editingSubject, color: c })}
                            className={`w-6 h-6 rounded-full border-2 ${editingSubject.color === c ? "border-gray-800 scale-110" : "border-transparent"}`}
                            style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={handleUpdateSubject} disabled={subjectBusy}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs disabled:opacity-50">שמור</button>
                        <button type="button" onClick={() => setEditingSubject(null)}
                          className="text-gray-500 px-3 py-1 rounded text-xs hover:bg-gray-100">ביטול</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="text-sm">{s.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setEditingSubject({ id: s.id, name: s.name, color: s.color })}
                          className="text-xs text-blue-500 hover:underline">ערוך</button>
                        <button type="button" onClick={() => handleDeleteSubject(s.id)} disabled={subjectBusy}
                          className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50">מחק</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {showNewSubject ? (
              <div className="p-3 bg-blue-50 border-t border-gray-200 space-y-2">
                <input value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="שם הקטגוריה"
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
                <div className="flex gap-1.5 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setNewSubjectColor(c)}
                      className={`w-6 h-6 rounded-full border-2 ${newSubjectColor === c ? "border-gray-800 scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={handleAddSubject} disabled={subjectBusy || !newSubjectName.trim()}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-xs disabled:opacity-50">
                    {subjectBusy ? "מוסיף..." : "הוסף"}
                  </button>
                  <button type="button" onClick={() => setShowNewSubject(false)}
                    className="text-gray-500 px-3 py-1 rounded text-xs hover:bg-gray-100">ביטול</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setShowNewSubject(true)}
                className="w-full text-right px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 border-t border-gray-100">
                + קטגוריה חדשה
              </button>
            )}
          </div>
        )}
      </div>

      {/* חדר מועדף */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700">חדר/מקום מועדף</label>
          {isAdmin && (
            <button type="button" onClick={() => setShowRoomPanel((v) => !v)}
              className="text-xs text-blue-600 hover:underline">
              {showRoomPanel ? "סגור ניהול" : "⚙️ נהל חדרים"}
            </button>
          )}
        </div>
        <select name="preferred_room_id" defaultValue={lesson?.preferred_room_id ?? ""}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">ללא העדפה</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>{r.name}{r.capacity ? ` (${r.capacity})` : ""}</option>
          ))}
        </select>

        {isAdmin && showRoomPanel && (
          <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600 border-b border-gray-200">ניהול חדרים</div>
            <div className="divide-y divide-gray-100">
              {rooms.map((r) => (
                <div key={r.id} className="px-3 py-2">
                  {editingRoom?.id === r.id ? (
                    <div className="space-y-2">
                      <input value={editingRoom.name} onChange={(e) => setEditingRoom({ ...editingRoom, name: e.target.value })}
                        placeholder="שם החדר"
                        className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm" />
                      <input type="number" value={editingRoom.capacity} onChange={(e) => setEditingRoom({ ...editingRoom, capacity: e.target.value })}
                        placeholder="קיבולת" min={1}
                        className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm" />
                      <div className="flex gap-2">
                        <button type="button" onClick={handleUpdateRoom} disabled={roomBusy}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs disabled:opacity-50">שמור</button>
                        <button type="button" onClick={() => setEditingRoom(null)}
                          className="text-gray-500 px-3 py-1 rounded text-xs hover:bg-gray-100">ביטול</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm">{r.name}{r.capacity ? ` (${r.capacity})` : ""}</span>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setEditingRoom({ id: r.id, name: r.name, capacity: r.capacity ? String(r.capacity) : "" })}
                          className="text-xs text-blue-500 hover:underline">ערוך</button>
                        <button type="button" onClick={() => handleDeleteRoom(r.id)} disabled={roomBusy}
                          className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50">מחק</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {showNewRoom ? (
              <div className="p-3 bg-blue-50 border-t border-gray-200 space-y-2">
                <input value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="שם החדר (מעבדה, אולם...)"
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
                <input type="number" value={newRoomCapacity} onChange={(e) => setNewRoomCapacity(e.target.value)}
                  placeholder="קיבולת (אופציונלי)" min={1}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
                <div className="flex gap-2">
                  <button type="button" onClick={handleAddRoom} disabled={roomBusy || !newRoomName.trim()}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-xs disabled:opacity-50">
                    {roomBusy ? "מוסיף..." : "הוסף"}
                  </button>
                  <button type="button" onClick={() => setShowNewRoom(false)}
                    className="text-gray-500 px-3 py-1 rounded text-xs hover:bg-gray-100">ביטול</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setShowNewRoom(true)}
                className="w-full text-right px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 border-t border-gray-100">
                + חדר חדש
              </button>
            )}
          </div>
        )}
      </div>

      {/* מצרכים וציוד */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">צרכים מיוחדים</p>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={hasMaterials} onChange={(e) => setHasMaterials(e.target.checked)} className="mt-0.5" />
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-800">מצרכים</span>
            {hasMaterials && (
              <textarea name="materials_notes" defaultValue={lesson?.materials_notes ?? ""} rows={2}
                placeholder="פרט את המצרכים הנדרשים..."
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            )}
          </div>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={hasEquipment} onChange={(e) => setHasEquipment(e.target.checked)} className="mt-0.5" />
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-800">ציוד</span>
            {hasEquipment && (
              <textarea name="equipment_notes" defaultValue={lesson?.equipment_notes ?? ""} rows={2}
                placeholder="פרט את הציוד הנדרש..."
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            )}
          </div>
        </label>
      </div>

      {/* הערות כלליות */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">הערות כלליות</label>
        <textarea name="general_notes" defaultValue={lesson?.general_notes ?? ""} rows={2}
          placeholder="הערות נוספות..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>

      <button type="submit"
        className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
        {submitLabel}
      </button>
    </form>
  );
}
