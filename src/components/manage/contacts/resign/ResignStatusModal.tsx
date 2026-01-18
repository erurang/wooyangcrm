"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CircularProgress } from "@mui/material";
import { RefreshCw } from "lucide-react";
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
        className="fixed inset-0 z-50 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" aria-hidden="true">
            <div className="absolute inset-0 bg-black/50"></div>
          </div>

          <motion.div
            className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-50"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                  <RefreshCw className="h-6 w-6 text-green-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    퇴사 상태 변경
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      <span className="font-semibold text-gray-700">
                        {contact.contact_name}
                      </span>{" "}
                      담당자를 재직 상태로 변경하시겠습니까?
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                onClick={onConfirm}
                disabled={saving}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                {saving ? (
                  <>
                    <CircularProgress size={18} className="mr-2" />
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
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                취소
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
