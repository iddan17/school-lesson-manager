"use client";

import { useActionState, useState } from "react";
import type { Subject, Room, Lesson } from "@/lib/types";
import {
  createSubjectInline, updateSubjectInline, deleteSubjectInline,
  createRoomInline, updateRoomInline, deleteRoomInline,
} from "@/app/actions";

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
  const [isPublic, setIsPublic] = useState(lesson?.is_public ?? false);

  // Wrap the server action so a returned error is shown instead of silently
  // bouncing back to the form. On success the action redirects, so state stays null.
  const [formState, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) =>
      (await action(formData)) ?? null,
    null
  );

  function toggleSubject(id: string) {
    setSelectedSubjects((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  }

  return (
    <div className="space-y-5 max-w-xl">

      {/* ── Admin management panels — completely outside the <form> ── */}
      {isAdmin && (
        <SubjectManager subjects={subjects} setSubjects={setSubjects} />
      )}
      {isAdmin && (
        <RoomManager rooms={rooms} setRooms={setRooms} />
      )}

      {/* ── Main form — uses form action (Next.js 16 official pattern) ── */}
      <form action={formAction} className="space-y-5">

        {/* Hidden inputs for controlled state — read by server actions */}
        {selectedSubjects.map((id) => (
          <input key={id} type="hidden" name="subject_ids" value={id} />
        ))}
        <input type="hidden" name="has_materials" value={hasMaterials.toString()} />
        <input type="hidden" name="has_equipment" value={hasEquipment.toString()} />
        <input type="hidden" name="is_public" value={isPublic.toString()} />

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

        {/* בחירת קטגוריות — type="button" so they never submit the form */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">קטגוריות</label>
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <button key={s.id} type="button" onClick={() => toggleSubject(s.id)}
                className={`px-3 py-1 rounded-full text-sm border transition-all ${
                  selectedSubjects.includes(s.id)
                    ? "text-white border-transparent"
                    : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                }`}
                style={selectedSubjects.includes(s.id) ? { backgroundColor: s.color, borderColor: s.color } : {}}>
                {s.name}
              </button>
            ))}
            {subjects.length === 0 && (
              <p className="text-sm text-gray-400">אין קטגוריות — הוסף דרך הפאנל למעלה</p>
            )}
          </div>
        </div>

        {/* חדר מועדף */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">חדר/מקום מועדף</label>
          <select name="preferred_room_id" defaultValue={lesson?.preferred_room_id ?? ""}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
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

        {/* נראות — רק אדמין יכול לסמן ציבורי */}
        {isAdmin ? (
          <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
            <button
              type="button"
              dir="ltr"
              onClick={() => setIsPublic((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${isPublic ? "bg-green-500" : "bg-gray-300"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isPublic ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <div>
              <p className="text-sm font-medium text-gray-800">
                {isPublic ? "שיעור ציבורי" : "שיעור פרטי"}
              </p>
              <p className="text-xs text-gray-500">
                {isPublic ? "גלוי לכל המורים בבנק השיעורים" : "גלוי רק לך"}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400">שיעורים שתיצור יהיו פרטיים — גלויים רק לך</p>
        )}

        {formState?.error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            שמירה נכשלה: {formState.error}
          </p>
        )}

        <button type="submit" disabled={isPending}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
          {isPending ? "שומר..." : submitLabel}
        </button>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────
// SubjectManager — rendered outside the form
// ─────────────────────────────────────────────
function SubjectManager({ subjects, setSubjects }: { subjects: Subject[]; setSubjects: (fn: (p: Subject[]) => Subject[]) => void }) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#3b82f6");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [showAdd, setShowAdd] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleAdd() {
    if (!newName.trim()) return;
    setBusy(true);
    const fd = new FormData(); fd.set("name", newName.trim()); fd.set("color", newColor);
    const res = await createSubjectInline(fd);
    setBusy(false);
    if ((res as any).subject) {
      setSubjects((p) => [...p, (res as any).subject]);
      setNewName(""); setNewColor("#3b82f6"); setShowAdd(false);
    }
  }

  async function handleUpdate() {
    if (!editId || !editName.trim()) return;
    setBusy(true);
    const fd = new FormData(); fd.set("name", editName.trim()); fd.set("color", editColor);
    await updateSubjectInline(editId, fd);
    setBusy(false);
    setSubjects((p) => p.map((s) => s.id === editId ? { ...s, name: editName, color: editColor } : s));
    setEditId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("למחוק קטגוריה זו?")) return;
    setBusy(true);
    await deleteSubjectInline(id);
    setBusy(false);
    setSubjects((p) => p.filter((s) => s.id !== id));
  }

  return (
    <div className="border border-blue-200 rounded-xl overflow-hidden">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors">
        <span>⚙️ ניהול קטגוריות ({subjects.length})</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="bg-white">
          {subjects.map((s) => (
            <div key={s.id} className="px-4 py-2 border-b border-gray-100">
              {editId === s.id ? (
                <div className="space-y-2">
                  <input value={editName} onChange={(e) => setEditName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm" />
                  <div className="flex items-center gap-2">
                    <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)}
                      className="w-9 h-9 rounded cursor-pointer border border-gray-300 p-0.5" />
                    <span className="text-xs text-gray-500">בחר צבע</span>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={handleUpdate} disabled={busy}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-xs disabled:opacity-50">שמור</button>
                    <button type="button" onClick={() => setEditId(null)}
                      className="text-gray-500 px-3 py-1 rounded text-xs hover:bg-gray-100">ביטול</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-sm">{s.name}</span>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => { setEditId(s.id); setEditName(s.name); setEditColor(s.color); }}
                      className="text-xs text-blue-500 hover:underline">ערוך</button>
                    <button type="button" onClick={() => handleDelete(s.id)} disabled={busy}
                      className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50">מחק</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {showAdd ? (
            <div className="px-4 py-3 bg-blue-50 space-y-2">
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="שם הקטגוריה"
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
              <div className="flex items-center gap-2">
                <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)}
                  className="w-9 h-9 rounded cursor-pointer border border-gray-300 p-0.5" />
                <span className="text-xs text-gray-500">בחר צבע</span>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={handleAdd} disabled={busy || !newName.trim()}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-xs disabled:opacity-50">
                  {busy ? "מוסיף..." : "הוסף"}
                </button>
                <button type="button" onClick={() => setShowAdd(false)}
                  className="text-gray-500 px-3 py-1 rounded text-xs hover:bg-gray-100">ביטול</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setShowAdd(true)}
              className="w-full text-right px-4 py-2.5 text-xs text-blue-600 hover:bg-blue-50 transition-colors">
              + קטגוריה חדשה
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// RoomManager — rendered outside the form
// ─────────────────────────────────────────────
function RoomManager({ rooms, setRooms }: { rooms: Room[]; setRooms: (fn: (p: Room[]) => Room[]) => void }) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleAdd() {
    if (!newName.trim()) return;
    setBusy(true);
    const fd = new FormData(); fd.set("name", newName.trim());
    const res = await createRoomInline(fd);
    setBusy(false);
    if ((res as any).room) {
      setRooms((p) => [...p, (res as any).room]);
      setNewName(""); setShowAdd(false);
    }
  }

  async function handleUpdate() {
    if (!editId || !editName.trim()) return;
    setBusy(true);
    const fd = new FormData(); fd.set("name", editName.trim());
    await updateRoomInline(editId, fd);
    setBusy(false);
    setRooms((p) => p.map((r) => r.id === editId ? { ...r, name: editName } : r));
    setEditId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("למחוק חדר זה?")) return;
    setBusy(true);
    await deleteRoomInline(id);
    setBusy(false);
    setRooms((p) => p.filter((r) => r.id !== id));
  }

  return (
    <div className="border border-green-200 rounded-xl overflow-hidden">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100 transition-colors">
        <span>🏠 ניהול חדרים ({rooms.length})</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="bg-white">
          {rooms.map((r) => (
            <div key={r.id} className="px-4 py-2 border-b border-gray-100">
              {editId === r.id ? (
                <div className="space-y-2">
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="שם החדר"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm" />
                  <div className="flex gap-2">
                    <button type="button" onClick={handleUpdate} disabled={busy}
                      className="bg-green-600 text-white px-3 py-1 rounded text-xs disabled:opacity-50">שמור</button>
                    <button type="button" onClick={() => setEditId(null)}
                      className="text-gray-500 px-3 py-1 rounded text-xs hover:bg-gray-100">ביטול</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm">{r.name}</span>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => { setEditId(r.id); setEditName(r.name); }}
                      className="text-xs text-blue-500 hover:underline">ערוך</button>
                    <button type="button" onClick={() => handleDelete(r.id)} disabled={busy}
                      className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50">מחק</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {showAdd ? (
            <div className="px-4 py-3 bg-green-50 space-y-2">
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="שם החדר (מעבדה, אולם...)"
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
              <div className="flex gap-2">
                <button type="button" onClick={handleAdd} disabled={busy || !newName.trim()}
                  className="bg-green-600 text-white px-3 py-1 rounded text-xs disabled:opacity-50">
                  {busy ? "מוסיף..." : "הוסף"}
                </button>
                <button type="button" onClick={() => setShowAdd(false)}
                  className="text-gray-500 px-3 py-1 rounded text-xs hover:bg-gray-100">ביטול</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setShowAdd(true)}
              className="w-full text-right px-4 py-2.5 text-xs text-green-600 hover:bg-green-50 transition-colors">
              + חדר חדש
            </button>
          )}
        </div>
      )}
    </div>
  );
}
