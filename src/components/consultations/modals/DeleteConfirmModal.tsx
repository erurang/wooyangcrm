"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, AlertTriangle, X } from "lucide-react";
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
          className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-xl">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">삭제 요청</h3>
                  <p className="text-xs text-slate-400">삭제 사유를 입력해주세요</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              <p className="mb-3 text-sm text-slate-500">
                상담 내역을 삭제하시려면 삭제 사유를 입력해주세요.
              </p>
              <textarea
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 bg-slate-50/50 hover:bg-white transition-all duration-200 resize-none placeholder:text-slate-300"
                placeholder="삭제 사유를 입력해주세요."
                rows={5}
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end items-center gap-2.5 px-5 py-3.5 bg-slate-50/50 border-t border-slate-200/60">
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                disabled={saving}
              >
                취소
              </button>
              <button
                onClick={onConfirm}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-sm shadow-red-200 hover:shadow-md hover:shadow-red-200 disabled:opacity-50"
                disabled={saving || !deleteReason.trim()}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
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
