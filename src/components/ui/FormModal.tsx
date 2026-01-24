"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CircularProgress } from "@mui/material";
import { X } from "lucide-react";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useEffect } from "react";

type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

interface FormModalProps {
  /** 모달 모드 (add/edit) */
  mode?: "add" | "edit";
  /** 모달 열림 상태 */
  isOpen: boolean;
  /** 모달 닫기 핸들러 */
  onClose: () => void;
  /** 저장 핸들러 */
  onSave?: () => void;
  /** 저장 중 상태 */
  isSaving?: boolean;
  /** 모달 제목 (문자열 또는 mode별 객체) */
  title: string | { add: string; edit: string };
  /** 모달 본문 컨텐츠 */
  children: React.ReactNode;
  /** 모달 크기 */
  size?: ModalSize;
  /** 저장 버튼 텍스트 */
  saveText?: string;
  /** 취소 버튼 텍스트 */
  cancelText?: string;
  /** 저장 버튼 숨김 */
  hideSaveButton?: boolean;
  /** 취소 버튼 숨김 */
  hideCancelButton?: boolean;
  /** 푸터 커스텀 */
  footer?: React.ReactNode;
  /** 헤더에 닫기 버튼 표시 */
  showCloseButton?: boolean;
  /** 저장 버튼 비활성화 */
  saveDisabled?: boolean;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "sm:w-96 sm:max-w-md",
  md: "sm:w-11/12 md:w-2/3 lg:max-w-2xl",
  lg: "sm:w-11/12 md:w-3/4 lg:max-w-4xl",
  xl: "sm:w-11/12 md:w-5/6 lg:max-w-6xl",
  full: "sm:w-11/12 md:w-11/12 lg:w-11/12",
};

export default function FormModal({
  mode = "add",
  isOpen,
  onClose,
  onSave,
  isSaving = false,
  title,
  children,
  size = "md",
  saveText = "저장",
  cancelText = "취소",
  hideSaveButton = false,
  hideCancelButton = false,
  footer,
  showCloseButton = false,
  saveDisabled = false,
}: FormModalProps) {
  // ESC 키로 모달 닫기
  useEscapeKey(isOpen, onClose);

  // 모달 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // 제목 결정
  const modalTitle = typeof title === "string" ? title : title[mode];

  // 기본 푸터 렌더링
  const renderFooter = () => {
    if (footer) return footer;

    return (
      <div className="flex gap-2 p-4 sm:p-6 pt-0 sm:pt-0 bg-white border-t sm:border-none shrink-0">
        {!hideCancelButton && (
          <button
            onClick={onClose}
            className={`flex-1 sm:flex-none bg-gray-500 text-white px-4 py-2.5 sm:py-2 rounded-md text-sm active:bg-gray-600 ${
              isSaving ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isSaving}
          >
            {cancelText}
          </button>
        )}
        {!hideSaveButton && onSave && (
          <button
            onClick={onSave}
            className={`flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2.5 sm:py-2 rounded-md text-sm flex items-center justify-center ${
              isSaving || saveDisabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isSaving || saveDisabled}
          >
            {saveText}
            {isSaving && <CircularProgress size={18} className="ml-2" />}
          </button>
        )}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex justify-center items-center bg-black/50 z-50 sm:px-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className={`bg-white w-full h-full sm:h-auto sm:rounded-lg ${sizeClasses[size]} sm:max-h-[85vh] overflow-hidden flex flex-col`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b bg-white shrink-0">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                {modalTitle}
              </h3>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {children}
            </div>

            {/* Footer */}
            {renderFooter()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
