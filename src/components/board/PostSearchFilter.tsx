"use client";

import { Search, Filter, X } from "lucide-react";
import type { PostCategory } from "@/types/post";

interface PostSearchFilterProps {
  categories: PostCategory[];
  selectedCategoryId: string;
  searchTerm: string;
  onCategoryChange: (categoryId: string) => void;
  onSearchChange: (value: string) => void;
  onReset: () => void;
}

export default function PostSearchFilter({
  categories,
  selectedCategoryId,
  searchTerm,
  onCategoryChange,
  onSearchChange,
  onReset,
}: PostSearchFilterProps) {
  const hasFilters = selectedCategoryId || searchTerm;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        {/* 카테고리 필터 */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 whitespace-nowrap">카테고리</label>
          <select
            value={selectedCategoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* 검색 */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="제목 또는 내용 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 초기화 버튼 */}
        {hasFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            <Filter className="w-4 h-4" />
            필터 초기화
          </button>
        )}
      </div>
    </div>
  );
}
