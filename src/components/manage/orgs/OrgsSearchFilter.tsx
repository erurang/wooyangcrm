"use client";

import { Building, X } from "lucide-react";

interface OrgsSearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onReset: () => void;
}

export default function OrgsSearchFilter({
  searchTerm,
  onSearchChange,
  onReset,
}: OrgsSearchFilterProps) {
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      // search on enter
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 기관명 */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            기관명
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="기관명 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <Building
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
          </div>
        </div>
      </div>

      {/* Filter Actions */}
      <div className="flex justify-end mt-4">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          <X size={16} />
          <span>필터 초기화</span>
        </button>
      </div>
    </div>
  );
}
