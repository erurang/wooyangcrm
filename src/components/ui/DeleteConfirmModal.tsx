"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { cn } from "@/lib/utils";

interface DeleteConfirmModalProps {
  /** 모달 열림 상태 */
  isOpen: boolean;
  /** 모달 닫기 핸들러 */
  onClose: () => void;
  /** 삭제 확인 핸들러 - reason이 필요한 경우 reason 전달 */
  onConfirm: (reason?: string) => void | Promise<void>;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 삭제 대상 이름 (표시용) */
  itemName?: string;
  /** 삭제 대상 타입명 (예: "게시글", "거래처", "문서") */
  itemType?: string;
  /** 모달 제목 (기본: "삭제 요청") */
  title?: string;
  /** 설명 메시지 */
  description?: string;
  /** 삭제 사유 입력 필요 여부 */
  requireReason?: boolean;
  /** 외부에서 관리하는 reason 상태 */
  reason?: string;
  /** 외부 reason 상태 변경 핸들러 */
  onReasonChange?: (reason: string) => void;
  /** 확인 버튼 텍스트 (기본: "삭제 요청") */
  confirmText?: string;
  /** 취소 버튼 텍스트 (기본: "취소") */
  cancelText?: string;
  /** 컬러 테마 (기본: "red") */
  variant?: "red" | "orange";
}

/**
 * 범용 삭제 확인 모달 컴포넌트
 *
 * @example
 * // 기본 사용
 * <DeleteConfirmModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onConfirm={handleDelete}
 *   itemName="테스트 항목"
 *   itemType="게시글"
 * />
 *
 * @example
 * // 사유 필수 입력
 * <DeleteConfirmModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onConfirm={(reason) => handleDelete(reason)}
 *   requireReason
 *   itemType="거래처"
 *   isLoading={isDeleting}
 * />
 *
 * @example
 * // 외부 상태 관리
 * <DeleteConfirmModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onConfirm={handleDelete}
 *   requireReason
 *   reason={deleteReason}
 *   onReasonChange={setDeleteReason}
 * />
 */
export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  itemName,
  itemType = "항목",
  title = "삭제 요청",
  description,
  requireReason = false,
  reason: externalReason,
  onReasonChange,
  confirmText = "삭제 요청",
  cancelText = "취소",
  variant = "red",
}: DeleteConfirmModalProps) {
  // 내부 reason 상태 (외부 관리 없을 때 사용)
  const [internalReason, setInternalReason] = useState("");

  // 외부/내부 상태 결정
  const reason = externalReason !== undefined ? externalReason : internalReason;
  const handleReasonChange = onReasonChange || setInternalReason;

  // ESC 키로 모달 닫기
  useEscapeKey(isOpen, onClose);

  // 모달 닫힐 때 내부 reason 초기화
  useEffect(() => {
    if (!isOpen && externalReason === undefined) {
      setInternalReason("");
    }
  }, [isOpen, externalReason]);

  const handleConfirm = async () => {
    if (requireReason && !reason.trim()) return;
    await onConfirm(requireReason ? reason.trim() : undefined);
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  // 컬러 테마 설정
  const colors = {
    red: {
      icon: "bg-red-100 text-red-600",
      header: "text-red-600",
      button: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
      focus: "focus:ring-red-500",
    },
    orange: {
      icon: "bg-orange-100 text-orange-600",
      header: "text-orange-600",
      button: "bg-orange-600 hover:bg-orange-700 focus:ring-orange-500",
      focus: "focus:ring-orange-500",
    },
  }[variant];

  const defaultDescription = description || (
    requireReason
      ? `${itemType}을(를) 삭제하시려면 삭제 사유를 입력해주세요.`
      : `정말 ${itemType}을(를) 삭제하시겠습니까?`
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-full", colors.icon)}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h2 className={cn("text-lg font-semibold", colors.header)}>
                  {title}
                </h2>
              </div>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 내용 */}
            <div className="p-5 space-y-4">
              <div>
                {itemName && (
                  <p className="text-gray-700 mb-2">
                    <strong className="text-gray-900">"{itemName}"</strong>
                  </p>
                )}
                <p className="text-sm text-gray-600">{defaultDescription}</p>
                <p className="mt-1 text-xs text-gray-500">
                  관리자 승인 후 삭제됩니다.
                </p>
              </div>

              {requireReason && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    삭제 사유 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => handleReasonChange(e.target.value)}
                    placeholder="삭제 사유를 입력해주세요."
                    rows={4}
                    disabled={isLoading}
                    className={cn(
                      "w-full px-3 py-2 border border-gray-300 rounded-md text-sm",
                      "focus:outline-none focus:ring-2",
                      colors.focus,
                      "focus:border-transparent resize-none",
                      "disabled:bg-gray-50 disabled:cursor-not-allowed"
                    )}
                  />
                </div>
              )}
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-2 px-5 py-4 bg-gray-50 border-t">
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading || (requireReason && !reason.trim())}
                className={cn(
                  "px-4 py-2 text-sm font-medium text-white rounded-md transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-offset-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "flex items-center gap-2",
                  colors.button
                )}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLoading ? "처리 중..." : confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
