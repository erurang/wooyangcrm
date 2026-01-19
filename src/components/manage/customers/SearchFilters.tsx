"use client";

import type React from "react";
import { Plus, RotateCcw, Building2, MapPin, User, Search } from "lucide-react";

interface SearchFiltersProps {
  searchTerm: string;
  addressTerm: string;
  contactTerm: string;
  total?: number;
  onSearchChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onContactChange: (value: string) => void;
  onResetFilters: () => void;
  onAddCompany: () => void;
  onKeyPress: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

export default function SearchFilters({
  searchTerm,
  addressTerm,
  contactTerm,
  total = 0,
  onSearchChange,
  onAddressChange,
  onContactChange,
  onResetFilters,
  onAddCompany,
  onKeyPress,
}: SearchFiltersProps) {
  const hasFilters = searchTerm || addressTerm || contactTerm;

  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="px-3 sm:px-4 py-3">
        {/* 상단 타이틀 및 추가 버튼 */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-800">거래처 관리</h1>
              <p className="text-[10px] sm:text-xs text-slate-500">
                총 <span className="font-semibold text-blue-600">{total.toLocaleString()}</span>개 거래처
              </p>
            </div>
          </div>
          <button
            onClick={onAddCompany}
            className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">거래처 추가</span>
            <span className="sm:hidden">추가</span>
          </button>
        </div>

        {/* 검색 필터 영역 - 모바일에서 그리드 레이아웃 */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 sm:flex-wrap">
          {/* 거래처명 검색 */}
          <div className="relative col-span-2 sm:col-span-1 sm:flex-1 sm:min-w-[180px] sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={onKeyPress}
              placeholder="거래처명 검색..."
              className="w-full pl-9 pr-3 py-2.5 sm:py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
            />
          </div>

          {/* 주소 검색 */}
          <div className="relative sm:flex-1 sm:min-w-[150px] sm:max-w-xs">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={addressTerm}
              onChange={(e) => onAddressChange(e.target.value)}
              onKeyDown={onKeyPress}
              placeholder="주소..."
              className="w-full pl-9 pr-3 py-2.5 sm:py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
            />
          </div>

          {/* 담당자 검색 */}
          <div className="relative sm:flex-1 sm:min-w-[150px] sm:max-w-xs">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={contactTerm}
              onChange={(e) => onContactChange(e.target.value)}
              onKeyDown={onKeyPress}
              placeholder="담당자..."
              className="w-full pl-9 pr-3 py-2.5 sm:py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
            />
          </div>

          {/* 필터 초기화 */}
          {hasFilters && (
            <button
              onClick={onResetFilters}
              className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              초기화
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
