"use client";

import { List } from "lucide-react";
import HeadlessSelect from "@/components/ui/HeadlessSelect";

interface RecentTableControlsProps {
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  perPage: number;
  onPerPageChange: (value: number) => void;
}

export default function RecentTableControls({
  isLoading,
  currentPage,
  totalPages,
  perPage,
  onPerPageChange,
}: RecentTableControlsProps) {
  return (
    <div className="flex justify-between items-center px-4 py-3">
      <div className="text-xs font-medium text-slate-400 tabular-nums">
        {isLoading ? (
          <span>로딩 중...</span>
        ) : (
          <span>
            {currentPage} / {totalPages} 페이지
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500">표시:</span>
        <div className="w-[100px]">
          <HeadlessSelect
            value={perPage.toString()}
            onChange={(val) => onPerPageChange(Number(val))}
            options={[
              { value: "5", label: "5개" },
              { value: "10", label: "10개" },
              { value: "15", label: "15개" },
              { value: "20", label: "20개" },
            ]}
            placeholder="10개"
            icon={<List className="h-4 w-4" />}
            focusClass="focus:ring-sky-500"
          />
        </div>
      </div>
    </div>
  );
}
