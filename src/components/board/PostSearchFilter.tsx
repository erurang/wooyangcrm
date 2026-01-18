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
    <div className="px-4 py-3">
      <div className="flex flex-wrap gap-3 items-center">
        {/* 카테고리 필터 */}
        <select
          value={selectedCategoryId}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors min-w-[120px]"
        >
          <option value="">전체 카테고리</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        {/* 검색 */}
        <div className="relative flex-1 min-w-[140px] max-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="제목 또는 내용 검색..."
            className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 초기화 버튼 */}
        {hasFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            초기화
          </button>
        )}
      </div>
    </div>
  );
}
