"use client";

import FormModal from "@/components/ui/FormModal";

interface RnDNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  notes: string;
  onNotesChange: (notes: string) => void;
}

export default function RnDNotesModal({
  isOpen,
  onClose,
  onSave,
  notes,
  onNotesChange,
}: RnDNotesModalProps) {
  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={onSave}
      title="비고 추가/수정"
      size="sm"
    >
      <textarea
        className="w-full min-h-80 p-2 border border-slate-300 rounded-md"
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
      />
    </FormModal>
  );
}
