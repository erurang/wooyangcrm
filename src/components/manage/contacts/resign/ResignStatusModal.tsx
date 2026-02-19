"use client";

import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw, Loader2 } from "lucide-react";
import { useEscapeKey } from "@/hooks/useEscapeKey";

interface Contact {
  id: string;
  contact_name: string;
}

interface ResignStatusModalProps {
  isOpen: boolean;
  contact: Contact | null;
  saving: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ResignStatusModal({
  isOpen,
  contact,
  saving,
  onConfirm,
  onCancel,
}: ResignStatusModalProps) {
  // ESC 키로 모달 닫기
  useEscapeKey(isOpen && !!contact, onCancel);

  if (!isOpen || !contact) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      >
        <motion.div
          className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                  <RefreshCw className="h-6 w-6 text-green-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-slate-800">
                    퇴사 상태 변경
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-slate-400">
                      <span className="font-semibold text-slate-600">
                        {contact.contact_name}
                      </span>{" "}
                      담당자를 재직 상태로 변경하시겠습니까?
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                onClick={onConfirm}
                disabled={saving}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    변경 중...
                  </>
                ) : (
                  "재직으로 변경"
                )}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={saving}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                취소
              </button>
            </div>
          </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
