"use client";

import { cn } from "@/lib/utils";

interface PageLoadingProps {
  message?: string;
  className?: string;
  fullScreen?: boolean;
}

/**
 * 페이지 로딩 인디케이터
 * - 페이지 전환 시 또는 데이터 로딩 시 사용
 * - fullScreen: true일 경우 전체 화면 오버레이
 *
 * @example
 * if (isLoading) {
 *   return <PageLoading message="데이터를 불러오는 중입니다..." />;
 * }
 */
export default function PageLoading({
  message = "로딩 중...",
  className = "",
  fullScreen = false,
}: PageLoadingProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative">
        <div className="w-10 h-10 border-3 border-slate-200 rounded-full" />
        <div className="absolute inset-0 w-10 h-10 border-3 border-transparent border-t-blue-600 rounded-full animate-spin" />
      </div>
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center py-20", className)}>
      {content}
    </div>
  );
}
