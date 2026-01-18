"use client";

import { RotateCcw } from "lucide-react";

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
    <div className="flex justify-between items-center px-4 py-3">
      <div className="text-sm text-slate-500">
        {isLoading ? (
          <span>로딩 중...</span>
        ) : (
          <span>
            총 <span className="font-semibold text-indigo-600">{total}</span>개 문서
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500">표시:</span>
        <select
          value={documentsPerPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
          className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
        >
          <option value="10">10개</option>
          <option value="20">20개</option>
          <option value="30">30개</option>
          <option value="50">50개</option>
        </select>

        <button
          onClick={onResetFilters}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          초기화
        </button>
      </div>
    </div>
  );
}
