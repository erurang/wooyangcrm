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
        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 bg-slate-50/50 hover:bg-white transition-all duration-200 resize-none placeholder:text-slate-300 leading-relaxed"
        rows={16}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
    </FormModal>
  );
}
