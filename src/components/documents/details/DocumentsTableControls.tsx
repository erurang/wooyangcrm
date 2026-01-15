"use client";

import { X } from "lucide-react";

interface DocumentsTableControlsProps {
  total: number;
  isLoading: boolean;
  documentsPerPage: number;
  onPerPageChange: (value: number) => void;
  onResetFilters: () => void;
}

export default function DocumentsTableControls({
  total,
  isLoading,
  documentsPerPage,
  onPerPageChange,
  onResetFilters,
}: DocumentsTableControlsProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="text-sm text-gray-600">
        {isLoading ? (
          <span>로딩 중...</span>
        ) : (
          <span>
            총 <span className="font-semibold text-blue-600">{total}</span>개
            문서
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600">표시 개수:</label>
        <select
          value={documentsPerPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
          className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="10">10개</option>
          <option value="20">20개</option>
          <option value="30">30개</option>
          <option value="50">50개</option>
        </select>

        <button
          onClick={onResetFilters}
          className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          <X size={14} />
          <span className="text-sm">필터 초기화</span>
        </button>
      </div>
    </div>
  );
}
