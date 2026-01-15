"use client";

import { createContext, useContext, ReactNode } from "react";
import { useToast } from "@/hooks/useToast";
import { ToastContainer, ToastMessage, ToastType } from "@/components/ui/Toast";

interface ToastContextValue {
  toasts: ToastMessage[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

interface ToastProviderProps {
  children: ReactNode;
}

/**
 * 글로벌 Toast Provider
 * - 앱 전체에서 Toast 알림 사용 가능
 * - 스택 알림 지원
 * - 중요도별 지속 시간
 *
 * @example
 * // layout.tsx에서 Provider 설정
 * <ToastProvider>
 *   {children}
 * </ToastProvider>
 *
 * // 컴포넌트에서 사용
 * const { success, error } = useGlobalToast();
 * success("저장되었습니다.");
 * error("오류가 발생했습니다.");
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const toast = useToast();

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * 글로벌 Toast 훅
 * ToastProvider 내에서만 사용 가능
 */
export function useGlobalToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useGlobalToast must be used within a ToastProvider");
  }
  return context;
}

export default ToastProvider;
