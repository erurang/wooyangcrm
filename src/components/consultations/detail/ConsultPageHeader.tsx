"use client";

import { Search, Star, StarOff, Plus } from "lucide-react";

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
    <div className="bg-white shadow-sm border-b sticky top-0 z-10">
      <div className="py-3 px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">
              {companyName || "거래처 상세"}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="상담 내용 검색"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full py-1.5 pl-10 pr-4 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={onAddClick}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
            >
              <Plus size={16} />
              <span>상담 추가</span>
            </button>
            {isFavorited ? (
              <button
                onClick={() => onRemoveFavorite(companyId)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-yellow-600 bg-yellow-50 rounded-md hover:bg-yellow-100 transition-colors"
              >
                <StarOff size={16} />
                <span>즐겨찾기 삭제</span>
              </button>
            ) : (
              <button
                onClick={onAddFavorite}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                <Star size={16} />
                <span>즐겨찾기 추가</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
