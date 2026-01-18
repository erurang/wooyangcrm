"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CircularProgress } from "@mui/material";
import { useEscapeKey } from "@/hooks/useEscapeKey";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  deleteReason: string;
  setDeleteReason: (reason: string) => void;
  saving: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  deleteReason,
  setDeleteReason,
  saving,
}: DeleteConfirmModalProps) {
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
            className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-5 border-b">
              <h3 className="text-lg font-semibold text-gray-900">삭제 요청</h3>
            </div>

            <div className="p-5">
              <p className="mb-4 text-sm text-gray-600">
                상담 내역을 삭제하시려면 삭제 사유를 입력해주세요.
              </p>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="삭제 사유를 입력해주세요."
                rows={5}
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end items-center gap-3 px-5 py-4 bg-gray-50 border-t">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={saving}
              >
                취소
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={saving || !deleteReason.trim()}
              >
                {saving ? (
                  <>
                    <CircularProgress size={16} className="mr-2" />
                    처리 중...
                  </>
                ) : (
                  "삭제 요청"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
