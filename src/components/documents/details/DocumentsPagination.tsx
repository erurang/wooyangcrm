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
    <div className="flex justify-center mt-6">
      <nav className="flex items-center space-x-1">
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className={`p-2 rounded-md ${
            currentPage === 1
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <ChevronLeft size={18} />
        </button>

        {paginationNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => {
              if (typeof page === "number") {
                onPageChange(page);
              }
            }}
            className={`px-3 py-1.5 rounded-md ${
              currentPage === page
                ? "bg-blue-600 text-white font-medium"
                : page === "..."
                ? "text-gray-500 cursor-default"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-md ${
            currentPage === totalPages
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <ChevronRight size={18} />
        </button>
      </nav>
    </div>
  );
}
