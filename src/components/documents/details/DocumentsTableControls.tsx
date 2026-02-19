"use client";

import { RotateCcw } from "lucide-react";
import HeadlessSelect from "@/components/ui/HeadlessSelect";

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
            총 <span className="font-semibold text-sky-600">{total}</span>개 문서
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500">표시:</span>
        <HeadlessSelect
          value={String(documentsPerPage)}
          onChange={(val) => onPerPageChange(Number(val))}
          options={[
            { value: "10", label: "10개" },
            { value: "20", label: "20개" },
            { value: "30", label: "30개" },
            { value: "50", label: "50개" },
          ]}
          placeholder="20개"
          className="min-w-[80px]"
          focusClass="focus:ring-sky-500"
        />

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
