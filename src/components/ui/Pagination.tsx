"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  variant?: "default" | "compact";
  showPageNumbers?: boolean;
  maxPageButtons?: number;
}

/**
 * 재사용 가능한 페이지네이션 컴포넌트
 *
 * @example
 * <Pagination
 *   currentPage={currentPage}
 *   totalPages={10}
 *   onPageChange={setCurrentPage}
 * />
 */
export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  variant = "default",
  showPageNumbers = true,
  maxPageButtons = 5,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // 표시할 페이지 번호 계산
  const getPageNumbers = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];
    const halfButtons = Math.floor(maxPageButtons / 2);

    let startPage = Math.max(1, currentPage - halfButtons);
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

    // 끝에 가까울 때 시작점 조정
    if (endPage - startPage < maxPageButtons - 1) {
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }

    // 첫 페이지와 말줄임표
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push("...");
    }

    // 중간 페이지들
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // 마지막 페이지와 말줄임표
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm text-slate-600">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <nav className={cn("flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-1 shadow-sm", className)}>
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="이전 페이지"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {showPageNumbers && (
        <div className="flex gap-1">
          {getPageNumbers().map((page, index) =>
            page === "..." ? (
              <span
                key={`ellipsis-${index}`}
                className="px-2 py-1.5 text-slate-400"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={cn(
                  "min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors",
                  currentPage === page
                    ? "bg-teal-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                {page}
              </button>
            )
          )}
        </div>
      )}

      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="다음 페이지"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}

// 페이지 정보 표시 컴포넌트
interface PageInfoProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  className?: string;
}

export function PageInfo({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  className,
}: PageInfoProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={cn("text-sm text-slate-500", className)}>
      총 <span className="font-medium text-slate-700">{totalItems.toLocaleString()}</span>개 중{" "}
      <span className="font-medium text-slate-700">{startItem.toLocaleString()}</span>-
      <span className="font-medium text-slate-700">{endItem.toLocaleString()}</span>개 표시
    </div>
  );
}

// 페이지 크기 선택 컴포넌트
interface PageSizeSelectorProps {
  value: number;
  onChange: (size: number) => void;
  options?: number[];
  className?: string;
}

export function PageSizeSelector({
  value,
  onChange,
  options = [10, 20, 30, 50],
  className,
}: PageSizeSelectorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-sm text-slate-600">표시:</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}개
          </option>
        ))}
      </select>
    </div>
  );
}
