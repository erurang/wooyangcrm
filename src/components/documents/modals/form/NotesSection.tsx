"use client";

import { useState } from "react";
import { Info, FolderOpen } from "lucide-react";
import NotesTemplateModal from "../NotesTemplateModal";

interface NotesSectionProps {
  notes: string;
  onChange: (value: string) => void;
  iconColor: string;
  focusClass: string;
  userId?: string;
}

export default function NotesSection({
  notes,
  onChange,
  iconColor,
  focusClass,
  userId,
}: NotesSectionProps) {
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  const handleTemplateSelect = (content: string) => {
    onChange(content);
  };

  return (
    <>
      <div className="bg-gray-50 p-5 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-gray-800">
            <Info className={`h-5 w-5 ${iconColor}`} />
            <h4 className="text-lg font-semibold">특기사항</h4>
          </div>
          <button
            type="button"
            onClick={() => setIsTemplateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FolderOpen size={16} />
            템플릿 관리
          </button>
        </div>
        <textarea
          value={notes}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full p-3 border border-gray-300 rounded-lg text-sm ${focusClass} focus:border-transparent`}
          rows={3}
          placeholder="특기사항을 입력하세요..."
        />
      </div>

      <NotesTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelect={handleTemplateSelect}
        userId={userId}
      />
    </>
  );
}
