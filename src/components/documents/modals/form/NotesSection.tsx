"use client";

import { Info } from "lucide-react";

interface NotesSectionProps {
  notes: string;
  onChange: (value: string) => void;
  iconColor: string;
  focusClass: string;
}

export default function NotesSection({
  notes,
  onChange,
  iconColor,
  focusClass,
}: NotesSectionProps) {
  return (
    <div className="bg-gray-50 p-5 rounded-xl">
      <div className="flex items-center gap-2 mb-4 text-gray-800">
        <Info className={`h-5 w-5 ${iconColor}`} />
        <h4 className="text-lg font-semibold">특기사항</h4>
      </div>
      <textarea
        value={notes}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full p-3 border border-gray-300 rounded-lg text-sm ${focusClass} focus:border-transparent`}
        rows={3}
        placeholder="특기사항을 입력하세요..."
      />
    </div>
  );
}
