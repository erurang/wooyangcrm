"use client";

import { Filter, RefreshCw, Loader2 } from "lucide-react";

interface SearchResultsHeaderProps {
  total: number;
  activeFilters?: number;
  isLoading?: boolean;
  isDebouncing?: boolean;
  onReset?: () => void;
  label?: string;
  className?: string;
}

/**
 * 검색 결과 헤더 컴포넌트
 * - 총 N건 표시
 * - 활성 필터 개수 배지
 * - 디바운스 중 로딩 표시
 * - 필터 초기화 버튼
 *
 * @example
 * <SearchResultsHeader
 *   total={documents.length}
 *   activeFilters={3}
 *   isLoading={isLoading}
 *   onReset={handleResetFilters}
 * />
 */
export default function SearchResultsHeader({
  total,
  activeFilters = 0,
  isLoading = false,
  isDebouncing = false,
  onReset,
  label = "검색 결과",
  className = "",
}: SearchResultsHeaderProps) {
  return (
    <div
      className={`flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg ${className}`}
    >
      <div className="flex items-center gap-3">
        {/* 총 건수 */}
        <div className="flex items-center gap-2">
          {(isLoading || isDebouncing) && (
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
          )}
          <span className="text-sm text-gray-600">
            {label}:{" "}
            <span className="font-semibold text-gray-900">
              {isLoading ? "..." : `${total.toLocaleString()}건`}
            </span>
          </span>
        </div>

        {/* 활성 필터 배지 */}
        {activeFilters > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            <Filter className="h-3 w-3" />
            필터 {activeFilters}개 적용
          </div>
        )}
      </div>

      {/* 필터 초기화 버튼 */}
      {onReset && activeFilters > 0 && (
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          필터 초기화
        </button>
      )}
    </div>
  );
}
