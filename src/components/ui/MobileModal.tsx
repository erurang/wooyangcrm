"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { useEscapeKey } from "@/hooks/useEscapeKey";

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

/**
 * 모바일 친화적 모달 컴포넌트
 * - 모바일: 전체 화면 또는 바텀시트 스타일
 * - 데스크탑: 중앙 모달
 */
export default function MobileModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "lg",
}: MobileModalProps) {
  // ESC 키로 닫기
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

  const sizeClasses = {
    sm: "sm:max-w-md",
    md: "sm:max-w-lg",
    lg: "sm:max-w-2xl",
    xl: "sm:max-w-4xl",
    full: "sm:max-w-6xl",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 bg-black/50"
          onClick={onClose}
        >
          {/* 모바일: 전체화면, 데스크탑: 중앙 모달 */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className={`
              fixed inset-0 bg-white flex flex-col
              sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
              sm:rounded-xl sm:shadow-2xl sm:w-[calc(100%-2rem)] ${sizeClasses[size]}
              sm:max-h-[90vh]
            `}
          >
            {/* 헤더 - 고정 */}
            <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 border-b bg-white shrink-0">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate pr-4">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 컨텐츠 - 스크롤 */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="px-4 py-4 sm:px-5 sm:py-5">
                {children}
              </div>
            </div>

            {/* 푸터 - 고정 */}
            {footer && (
              <div className="px-4 py-3 sm:px-5 sm:py-4 border-t bg-gray-50 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
