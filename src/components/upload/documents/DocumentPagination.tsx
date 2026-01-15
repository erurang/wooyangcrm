"use client";

interface DocumentPaginationProps {
  totalPages: number;
  currentIndex: number;
  onSelectIndex: (idx: number) => void;
}

export default function DocumentPagination({
  totalPages,
  currentIndex,
  onSelectIndex,
}: DocumentPaginationProps) {
  if (totalPages === 0) return null;

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <div className="flex space-x-2 mb-4">
      {pageNumbers.map((idx) => (
        <button
          key={idx}
          onClick={() => onSelectIndex(idx)}
          className={`px-3 py-1 border rounded ${
            idx === currentIndex ? "bg-blue-500 text-white" : "bg-white"
          }`}
        >
          {idx + 1}
        </button>
      ))}
    </div>
  );
}
