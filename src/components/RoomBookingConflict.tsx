"use client";

import { DAY_NAMES } from "@/lib/types";
import type { DayOfWeek } from "@/lib/types";

interface ConflictInfo {
  teacher_name: string;
  class_name: string;
  lesson_title: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
}

interface AlternativeSlot {
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
}

interface Props {
  conflict: ConflictInfo;
  alternatives: AlternativeSlot[];
  roomName: string;
  onSelectAlternative: (slot: AlternativeSlot) => void;
  onIgnore: () => void;
  onCancel: () => void;
}

export default function RoomBookingConflict({
  conflict,
  alternatives,
  roomName,
  onSelectAlternative,
  onIgnore,
  onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">⚠️</span>
          <div>
            <h2 className="text-lg font-bold text-gray-900">החדר תפוס!</h2>
            <p className="text-sm text-gray-500">{roomName}</p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm">
          <p className="font-medium text-red-800">
            {DAY_NAMES[conflict.day_of_week]}{" "}
            {conflict.start_time.slice(0, 5)}–{conflict.end_time.slice(0, 5)}
          </p>
          <p className="text-red-700 mt-0.5">
            {conflict.teacher_name} — {conflict.lesson_title} ({conflict.class_name})
          </p>
        </div>

        {alternatives.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              החריצים הפנויים הקרובים (כשאתה מלמד את הכיתה הזו):
            </p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {alternatives.map((slot, i) => (
                <button
                  key={i}
                  onClick={() => onSelectAlternative(slot)}
                  className="w-full text-right bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg px-3 py-2 text-sm transition-colors"
                >
                  <span className="font-medium text-green-800">
                    {DAY_NAMES[slot.day_of_week as DayOfWeek]}{" "}
                    {slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)}
                  </span>
                  <span className="text-green-600 mr-2">← שריין</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {alternatives.length === 0 && (
          <p className="text-sm text-gray-500 mb-4">
            לא נמצאו חריצי זמן חלופיים פנויים לחדר זה בכיתה הנבחרת.
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onIgnore}
            className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50"
          >
            שבץ בכל זאת
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-100 text-gray-600 rounded-lg py-2 text-sm hover:bg-gray-200"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}
