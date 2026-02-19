"use client";

import { useState } from "react";
import { Search, X, Filter, ChevronDown, FileText } from "lucide-react";
import type { ApprovalCategory, ApprovalFilters as FilterType } from "@/types/approval";
import HeadlessSelect from "@/components/ui/HeadlessSelect";

interface ApprovalFiltersProps {
  categories: ApprovalCategory[];
  filters: FilterType;
  onChange: (filters: FilterType) => void;
}

export default function ApprovalFilters({
  categories,
  filters,
  onChange,
}: ApprovalFiltersProps) {
  const [keyword, setKeyword] = useState(filters.keyword || "");
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = () => {
    onChange({ ...filters, keyword: keyword || undefined });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    onChange({ ...filters, category_id: categoryId || undefined });
  };

  const handleReset = () => {
    setKeyword("");
    onChange({});
  };

  const hasFilters = filters.keyword || filters.category_id;

  return (
    <div className="px-4 py-2 border-b border-slate-100">
      {/* 검색 바 */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="제목, 내용 검색..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded text-sm hover:bg-slate-200 transition-colors"
        >
          검색
        </button>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-1.5 border rounded transition-colors ${
            showFilters || hasFilters
              ? "border-sky-500 text-sky-600 bg-sky-50"
              : "border-slate-200 text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* 필터 옵션 */}
      {showFilters && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-3 flex-wrap">
            {/* 카테고리 필터 */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">문서 유형:</span>
              <div className="min-w-[120px]">
                <HeadlessSelect
                  value={filters.category_id || ""}
                  onChange={(value) => handleCategoryChange(value)}
                  options={[
                    { value: "", label: "전체" },
                    ...categories.map((category) => ({
                      value: category.id,
                      label: category.name,
                    })),
                  ]}
                  placeholder="전체"
                  icon={<FileText className="h-4 w-4" />}
                />
              </div>
            </div>

            {/* 초기화 버튼 */}
            {hasFilters && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
              >
                <X className="w-3 h-3" />
                초기화
              </button>
            )}
          </div>
        </div>
      )}

      {/* 활성 필터 표시 */}
      {hasFilters && !showFilters && (
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {filters.category_id && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-50 text-sky-700 rounded text-xs">
              {categories.find((c) => c.id === filters.category_id)?.name}
              <button
                onClick={() => handleCategoryChange("")}
                className="hover:text-sky-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.keyword && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-50 text-sky-700 rounded text-xs">
              &quot;{filters.keyword}&quot;
              <button
                onClick={() => {
                  setKeyword("");
                  onChange({ ...filters, keyword: undefined });
                }}
                className="hover:text-sky-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
