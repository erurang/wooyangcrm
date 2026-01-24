"use client";

import { ReactNode } from "react";
import { AlertCircle, RefreshCw, WifiOff, ServerCrash, Lock, FileWarning } from "lucide-react";

type ErrorType = "default" | "network" | "server" | "auth" | "notFound" | "permission";

interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  icon?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  isRetrying?: boolean;
  className?: string;
  compact?: boolean;
}

const defaultConfig: Record<ErrorType, { icon: ReactNode; title: string; message: string }> = {
  default: {
    icon: <AlertCircle className="h-12 w-12 text-red-400" />,
    title: "오류가 발생했습니다",
    message: "잠시 후 다시 시도해주세요.",
  },
  network: {
    icon: <WifiOff className="h-12 w-12 text-orange-400" />,
    title: "네트워크 연결 오류",
    message: "인터넷 연결을 확인하고 다시 시도해주세요.",
  },
  server: {
    icon: <ServerCrash className="h-12 w-12 text-red-400" />,
    title: "서버 오류",
    message: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
  },
  auth: {
    icon: <Lock className="h-12 w-12 text-yellow-500" />,
    title: "인증이 필요합니다",
    message: "다시 로그인해주세요.",
  },
  notFound: {
    icon: <FileWarning className="h-12 w-12 text-slate-400" />,
    title: "찾을 수 없습니다",
    message: "요청하신 데이터를 찾을 수 없습니다.",
  },
  permission: {
    icon: <Lock className="h-12 w-12 text-orange-400" />,
    title: "접근 권한이 없습니다",
    message: "이 페이지에 접근할 권한이 없습니다.",
  },
};

/**
 * Error State 컴포넌트
 * - API 오류, 네트워크 오류 등 다양한 에러 상황 표시
 * - 재시도 버튼 지원
 * - 로딩 상태 지원
 *
 * @example
 * // 기본 사용
 * <ErrorState onRetry={refetch} />
 *
 * // 네트워크 오류
 * <ErrorState type="network" onRetry={refetch} />
 *
 * // 커스텀 메시지
 * <ErrorState
 *   title="데이터를 불러올 수 없습니다"
 *   message="잠시 후 다시 시도해주세요."
 *   onRetry={handleRetry}
 *   isRetrying={isLoading}
 * />
 */
export default function ErrorState({
  type = "default",
  title,
  message,
  icon,
  onRetry,
  retryLabel = "다시 시도",
  isRetrying = false,
  className = "",
  compact = false,
}: ErrorStateProps) {
  const config = defaultConfig[type];
  const displayTitle = title || config.title;
  const displayMessage = message || config.message;

  return (
    <div
      className={`flex flex-col items-center justify-center ${
        compact ? "py-8 px-4" : "py-16 px-4"
      } ${className}`}
    >
      <div className={compact ? "mb-3" : "mb-4"}>
        {icon || config.icon}
      </div>
      <h3 className={`font-medium text-slate-800 ${compact ? "text-base mb-1" : "text-lg mb-2"}`}>
        {displayTitle}
      </h3>
      <p className={`text-slate-500 text-center max-w-sm ${compact ? "text-xs mb-4" : "text-sm mb-6"}`}>
        {displayMessage}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className={`inline-flex items-center gap-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            compact ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm"
          }`}
        >
          <RefreshCw className={`${compact ? "h-3 w-3" : "h-4 w-4"} ${isRetrying ? "animate-spin" : ""}`} />
          {isRetrying ? "다시 시도 중..." : retryLabel}
        </button>
      )}
    </div>
  );
}

/**
 * 에러 타입 판별 헬퍼
 */
export function getErrorType(error: Error | null): ErrorType {
  if (!error) return "default";

  const message = error.message.toLowerCase();

  if (message.includes("network") || message.includes("fetch")) {
    return "network";
  }
  if (message.includes("500") || message.includes("server")) {
    return "server";
  }
  if (message.includes("401") || message.includes("unauthorized") || message.includes("authentication")) {
    return "auth";
  }
  if (message.includes("404") || message.includes("not found")) {
    return "notFound";
  }
  if (message.includes("403") || message.includes("forbidden") || message.includes("permission")) {
    return "permission";
  }

  return "default";
}

/**
 * 인라인 에러 메시지 (카드/섹션 내부에서 사용)
 */
export function InlineError({
  message,
  onRetry,
  isRetrying = false,
  className = "",
}: {
  message: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm ${className}`}>
      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
      <span className="text-red-700 flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isRetrying ? "animate-spin" : ""}`} />
          재시도
        </button>
      )}
    </div>
  );
}
