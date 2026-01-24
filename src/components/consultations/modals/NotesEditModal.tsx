"use client";

import FormModal from "@/components/ui/FormModal";

interface NotesEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: string;
  setNotes: (notes: string) => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

export default function NotesEditModal({
  isOpen,
  onClose,
  notes,
  setNotes,
  onSave,
  saving,
}: NotesEditModalProps) {
  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={onSave}
      isSaving={saving}
      title="비고 수정"
      size="sm"
      showCloseButton
    >
      <textarea
        placeholder="해당 거래처의 유의사항 또는 담당자별 유의사항을 작성해주세요."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        rows={16}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
    </FormModal>
  );
}
