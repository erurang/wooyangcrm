"use client";

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
      <div className="text-sm text-slate-500">
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
        <select
          value={perPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
          className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
        >
          <option value="5">5개</option>
          <option value="10">10개</option>
          <option value="15">15개</option>
          <option value="20">20개</option>
        </select>
      </div>
    </div>
  );
}
