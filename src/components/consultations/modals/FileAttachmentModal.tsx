"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Paperclip } from "lucide-react";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import FileUpload from "../FileUpload";

interface FileAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultationId: string;
  userId: string;
  consultationDate?: string;
  onFileCountChange?: (count: number) => void;
}

export default function FileAttachmentModal({
  isOpen,
  onClose,
  consultationId,
  userId,
  consultationDate,
  onFileCountChange,
}: FileAttachmentModalProps) {
  useEscapeKey(isOpen, onClose);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] min-h-[500px] overflow-hidden flex flex-col"
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-50 rounded-xl">
                  <Paperclip className="h-5 w-5 text-sky-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">첨부파일</h3>
                  {consultationDate && (
                    <p className="text-xs text-slate-400">
                      {consultationDate} 상담
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 본문 */}
            <div className="flex-1 overflow-y-auto p-5">
              <FileUpload
                consultationId={consultationId}
                userId={userId}
                onFileCountChange={onFileCountChange}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
