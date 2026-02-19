"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { useEscapeKey } from "@/hooks/useEscapeKey";

interface CompanyDeleteModalProps {
  isOpen: boolean;
  companyName: string;
  deleteReason: string;
  setDeleteReason: (reason: string) => void;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function CompanyDeleteModal({
  isOpen,
  companyName,
  deleteReason,
  setDeleteReason,
  onClose,
  onConfirm,
}: CompanyDeleteModalProps) {
  // ESC 키로 모달 닫기
  useEscapeKey(isOpen, onClose);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
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
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-slate-800">
                      거래처 삭제 요청
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-slate-400">
                        <span className="font-semibold text-slate-600">
                          {companyName}
                        </span>{" "}
                        거래처를 삭제 요청하시겠습니까? 이 작업은 관리자 승인
                        후 완료됩니다.
                      </p>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-600 mb-1">
                          삭제 사유 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={deleteReason}
                          onChange={(e) => setDeleteReason(e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="삭제 사유를 입력해주세요."
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={!deleteReason}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm ${
                    !deleteReason ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  삭제 요청
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  취소
                </button>
              </div>
            </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
