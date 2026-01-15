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
    <div className="flex justify-between items-center mb-4">
      <div className="text-gray-500">
        {isLoading ? (
          <span>로딩 중...</span>
        ) : (
          <span>
            총 {totalPages > 0 ? (currentPage - 1) * perPage + 1 : 0} -{" "}
            {Math.min(currentPage * perPage, totalPages * perPage)} /{" "}
            {totalPages * perPage} 건
          </span>
        )}
      </div>
      <div className="flex items-center">
        <label className="mr-2 text-sm text-gray-600">표시 개수:</label>
        <select
          value={perPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
          className="border border-gray-300 p-2 rounded-md text-sm"
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
