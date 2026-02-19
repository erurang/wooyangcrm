"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEscapeKey } from "@/hooks/useEscapeKey";

interface Document {
  id: string;
  document_number: string;
}

interface DocDeleteModalProps {
  isOpen: boolean;
  document: Document | null;
  deleteReason: string;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DocDeleteModal({
  isOpen,
  document,
  deleteReason,
  onReasonChange,
  onConfirm,
  onCancel,
}: DocDeleteModalProps) {
  // ESC 키로 모달 닫기
  useEscapeKey(isOpen && !!document, onCancel);

  if (!isOpen || !document) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 flex justify-center items-center bg-black/40 backdrop-blur-sm z-50"
      >
        <div className="bg-white p-6 rounded-md w-1/3">
          <h3 className="text-xl font-semibold mb-4">삭제 요청</h3>
          <textarea
            className="w-full border rounded-md p-4 h-48"
            placeholder="삭제 사유를 입력해주세요."
            value={deleteReason}
            onChange={(e) => onReasonChange(e.target.value)}
          />

          <div className="flex justify-end space-x-4">
            <button
              onClick={onCancel}
              className="bg-slate-500 text-white px-4 py-2 rounded-md"
            >
              취소
            </button>
            <button
              onClick={onConfirm}
              className="bg-red-500 text-white px-4 py-2 rounded-md"
            >
              삭제
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
