"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, FileText } from "lucide-react";
import { useEscapeKey } from "@/hooks/useEscapeKey";

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
  // ESC 키로 모달 닫기
  useEscapeKey(isOpen, onClose);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  비고 수정
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <textarea
                placeholder="해당 거래처의 유의사항 또는 담당자별 유의사항을 작성해주세요."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={16}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end items-center gap-3 px-4 py-3 bg-gray-50 border-t">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={saving}
              >
                취소
              </button>
              <button
                onClick={onSave}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    저장 중...
                  </>
                ) : (
                  "저장"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
