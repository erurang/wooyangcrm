"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface DocumentsPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function DocumentsPagination({
  currentPage,
  totalPages,
  onPageChange,
}: DocumentsPaginationProps) {
  if (totalPages <= 1) return null;

  const paginationNumbers = () => {
    const numbers: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 2 && i <= currentPage + 2)
      ) {
        numbers.push(i);
      } else if (i === currentPage - 3 || i === currentPage + 3) {
        numbers.push("...");
      }
    }
    return numbers;
  };

  return (
    <div className="flex justify-center px-4 pb-4">
      <nav className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg transition-colors ${
            currentPage === 1
              ? "text-slate-300 cursor-not-allowed"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {paginationNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => {
              if (typeof page === "number") {
                onPageChange(page);
              }
            }}
            className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors ${
              currentPage === page
                ? "bg-indigo-600 text-white"
                : page === "..."
                ? "text-slate-400 cursor-default"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg transition-colors ${
            currentPage === totalPages
              ? "text-slate-300 cursor-not-allowed"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
}
