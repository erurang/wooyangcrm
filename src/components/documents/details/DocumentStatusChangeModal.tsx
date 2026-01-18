"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Zap } from "lucide-react";
import { useEscapeKey } from "@/hooks/useEscapeKey";

// 자주 사용하는 사유 프리셋
const QUICK_REASONS = {
  completed: [
    "발주처리",
    "계약 완료",
    "납품 완료",
    "결제 완료",
    "수주",
  ],
  canceled: [
    "단가 조율 중",
    "경쟁사 선정",
    "프로젝트 취소",
    "고객 사정",
    "견적 재발행",
  ],
};

interface StatusReason {
  canceled: { reason: string; amount: number };
  completed: { reason: string; amount: number };
}

interface Document {
  id: string;
  document_number: string;
  content: {
    items?: any[];
  };
  company_name: string;
}

interface DocumentStatusChangeModalProps {
  isOpen: boolean;
  document: Document | null;
  changedStatus: string;
  statusReason: StatusReason;
  isMutating: boolean;
  onStatusReasonChange: (status: "canceled" | "completed", reason: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export default function DocumentStatusChangeModal({
  isOpen,
  document,
  changedStatus,
  statusReason,
  isMutating,
  onStatusReasonChange,
  onConfirm,
  onClose,
}: DocumentStatusChangeModalProps) {
  // ESC 키로 모달 닫기
  useEscapeKey(isOpen && !!document, onClose);

  if (!isOpen || !document) return null;

  const currentReason =
    statusReason[changedStatus as "canceled" | "completed"]?.reason || "";

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[1000] overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div
          className="fixed inset-0 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/50"></div>
        </div>

        <div className="relative z-[1001] flex items-center justify-center min-h-screen p-4">
          <motion.div
            className="bg-white rounded-lg overflow-hidden shadow-xl w-full max-w-md mx-auto"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* 모달 헤더 */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {changedStatus === "completed"
                    ? "문서 완료 처리"
                    : "문서 취소 처리"}
                </h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* 모달 본문 */}
            <div className="px-6 py-4">
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    문서 번호:
                  </span>
                  <span className="ml-2 text-sm text-gray-900">
                    {document.document_number}
                  </span>
                </div>
                <div className="flex items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    거래처:
                  </span>
                  <span className="ml-2 text-sm text-gray-900">
                    {document.company_name}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700">
                    변경할 상태:
                  </span>
                  <span
                    className={`ml-2 text-sm font-medium px-2 py-0.5 rounded-full ${
                      changedStatus === "completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {changedStatus === "completed" ? "완료" : "취소"}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="status-reason"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {changedStatus === "completed" ? "완료 사유" : "취소 사유"}
                </label>

                {/* 빠른 선택 버튼 */}
                <div className="mb-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap size={14} className="text-blue-500" />
                    <span className="text-xs text-gray-500">빠른 선택</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_REASONS[changedStatus as "canceled" | "completed"]?.map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                          currentReason === reason
                            ? changedStatus === "completed"
                              ? "bg-green-100 border-green-400 text-green-700"
                              : "bg-red-100 border-red-400 text-red-700"
                            : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                        }`}
                        onClick={() =>
                          onStatusReasonChange(
                            changedStatus as "canceled" | "completed",
                            reason
                          )
                        }
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  id="status-reason"
                  placeholder={
                    changedStatus === "completed"
                      ? "위 버튼을 클릭하거나 직접 입력하세요"
                      : "위 버튼을 클릭하거나 직접 입력하세요"
                  }
                  className="w-full min-h-[80px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  value={currentReason}
                  onChange={(e) =>
                    onStatusReasonChange(
                      changedStatus as "canceled" | "completed",
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={onClose}
              >
                취소
              </button>
              <button
                type="button"
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  changedStatus === "completed"
                    ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                    : "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                } ${!currentReason.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={onConfirm}
                disabled={!currentReason.trim()}
              >
                {isMutating ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    처리 중...
                  </span>
                ) : (
                  `${changedStatus === "completed" ? "완료" : "취소"} 처리`
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
