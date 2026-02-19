"use client";

import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface ErrorFallbackProps {
  error?: Error | null;
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
}

export default function ErrorFallback({
  error,
  title = "오류가 발생했습니다",
  message = "데이터를 불러오는 중 문제가 발생했습니다.",
  onRetry,
  showHomeButton = false,
}: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="bg-red-50 rounded-full p-4 mb-4">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 mb-4 max-w-md">{message}</p>
      {error && process.env.NODE_ENV === "development" && (
        <div className="mb-4 p-3 bg-slate-100 rounded-md max-w-md overflow-auto">
          <p className="text-xs font-mono text-slate-600 break-all">
            {error.message}
          </p>
        </div>
      )}
      <div className="flex gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-md hover:bg-sky-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            다시 시도
          </button>
        )}
        {showHomeButton && (
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 text-sm font-medium rounded-md hover:bg-slate-200 transition-colors"
          >
            <Home className="h-4 w-4" />
            홈으로
          </Link>
        )}
      </div>
    </div>
  );
}
