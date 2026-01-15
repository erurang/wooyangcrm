"use client";

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-md w-1/3">
        <h2 className="text-xl font-bold mb-4">비고 추가/수정</h2>
        <textarea
          className="w-full min-h-80 p-2 border border-gray-300 rounded-md"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
        />
        <div className="flex justify-end mt-4">
          <button
            className="px-4 py-2 bg-gray-500 text-white rounded-md mr-2"
            onClick={onClose}
          >
            취소
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-md"
            onClick={onSave}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
