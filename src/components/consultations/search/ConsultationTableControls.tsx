"use client";

interface ConsultationTableControlsProps {
  isLoading: boolean;
  totalPages: number;
  perPage: number;
  onPerPageChange: (value: number) => void;
}

export default function ConsultationTableControls({
  isLoading,
  totalPages,
  perPage,
  onPerPageChange,
}: ConsultationTableControlsProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="text-sm text-gray-600">
        {isLoading ? (
          <span>로딩 중...</span>
        ) : (
          <span>
            총{" "}
            <span className="font-semibold text-blue-600">
              {totalPages * perPage}
            </span>
            개 상담 내역
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">표시 개수:</label>
        <select
          value={perPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
          className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="10">10개</option>
          <option value="20">20개</option>
          <option value="30">30개</option>
          <option value="50">50개</option>
        </select>
      </div>
    </div>
  );
}
