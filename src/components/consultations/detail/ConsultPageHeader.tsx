"use client";

import { Search, Star, StarOff, Plus, Building2, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Favorite {
  name: string;
}

interface ConsultPageHeaderProps {
  companyName: string;
  companyId: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddClick: () => void;
  favorites: Favorite[];
  onAddFavorite: () => void;
  onRemoveFavorite: (companyId: string) => void;
}

export default function ConsultPageHeader({
  companyName,
  companyId,
  searchTerm,
  onSearchChange,
  onAddClick,
  favorites,
  onAddFavorite,
  onRemoveFavorite,
}: ConsultPageHeaderProps) {
  const isFavorited = favorites.some((fav) => fav.name === companyName);

  return (
    <div className="bg-white border-b sticky top-0 z-10">
      <div className="px-4 py-3">
        {/* 상단: 브레드크럼 + 액션 버튼들 */}
        <div className="flex items-center justify-between gap-4">
          {/* 좌측: 브레드크럼 스타일 회사명 */}
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href="/consultations"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors shrink-0"
            >
              거래처
            </Link>
            <ChevronRight size={14} className="text-gray-400 shrink-0" />
            <div className="flex items-center gap-2 min-w-0">
              <Building2 size={18} className="text-blue-600 shrink-0" />
              <h1 className="text-lg font-bold text-gray-900 truncate">
                {companyName || "거래처 상세"}
              </h1>
              {/* 즐겨찾기 토글 */}
              <button
                onClick={isFavorited ? () => onRemoveFavorite(companyId) : onAddFavorite}
                className={`p-1 rounded transition-colors shrink-0 ${
                  isFavorited
                    ? "text-yellow-500 hover:text-yellow-600"
                    : "text-gray-300 hover:text-yellow-500"
                }`}
                title={isFavorited ? "즐겨찾기 해제" : "즐겨찾기 추가"}
              >
                <Star size={18} fill={isFavorited ? "currentColor" : "none"} />
              </button>
            </div>
          </div>

          {/* 우측: 검색 + 상담 추가 */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="검색 (콤마로 AND)"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-48 py-1.5 pl-8 pr-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
            <button
              onClick={onAddClick}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">상담 추가</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
