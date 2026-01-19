"use client";

import { cn } from "@/lib/utils";

interface ButtonSpinnerProps {
  size?: "xs" | "sm" | "md";
  className?: string;
  color?: "white" | "blue" | "gray";
}

/**
 * 버튼 내부 로딩 스피너
 * - 버튼의 disabled 상태와 함께 사용
 * - 기본 색상은 white (어두운 버튼용)
 *
 * @example
 * <button disabled={isLoading}>
 *   {isLoading && <ButtonSpinner />}
 *   {isLoading ? "저장 중..." : "저장"}
 * </button>
 */
export default function ButtonSpinner({
  size = "sm",
  className = "",
  color = "white",
}: ButtonSpinnerProps) {
  const sizeClasses = {
    xs: "w-3 h-3 border",
    sm: "w-4 h-4 border-2",
    md: "w-5 h-5 border-2",
  };

  const colorClasses = {
    white: "border-white/30 border-t-white",
    blue: "border-blue-200 border-t-blue-600",
    gray: "border-gray-200 border-t-gray-600",
  };

  return (
    <div
      className={cn(
        "rounded-full animate-spin",
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    />
  );
}
