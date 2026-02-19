"use client";

import { Search, Calendar, X } from "lucide-react";

interface BrndsSearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onReset: () => void;
}

export default function BrndsSearchFilter({
  searchTerm,
  onSearchChange,
  onReset,
}: BrndsSearchFilterProps) {
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      onSearchChange(searchTerm);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 사업명 */}
        <div className="relative">
          <label className="block text-sm font-medium text-slate-600 mb-1">
            사업명
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="사업명 검색..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
            />
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
          </div>
        </div>

        {/* 수행날짜 시작 */}
        <div className="relative">
          <label className="block text-sm font-medium text-slate-600 mb-1">
            수행기간 (시작)
          </label>
          <div className="relative">
            <input
              type="date"
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
            />
            <Calendar
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
          </div>
        </div>

        {/* 수행날짜 종료 */}
        <div className="relative">
          <label className="block text-sm font-medium text-slate-600 mb-1">
            수행기간 (종료)
          </label>
          <div className="relative">
            <input
              type="date"
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
            />
            <Calendar
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
          </div>
        </div>
      </div>

      {/* Filter Actions */}
      <div className="flex justify-end mt-4">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-colors"
        >
          <X size={16} />
          <span>필터 초기화</span>
        </button>
      </div>
    </div>
  );
}
