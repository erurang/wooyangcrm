"use client";

import type React from "react";
import { Plus, RotateCcw, Building2, MapPin, User, Search, FlaskConical } from "lucide-react";
import Link from "next/link";

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
    <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-10">
      <div className="px-3 sm:px-5 py-3.5">
        {/* 상단 타이틀 및 추가 버튼 */}
        <div className="flex items-center justify-between mb-3.5 sm:mb-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 bg-sky-50 rounded-xl">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-sky-600" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-800">거래처 관리</h1>
              <p className="text-[10px] sm:text-xs text-slate-400">
                총 <span className="font-bold text-sky-600 tabular-nums">{total.toLocaleString()}</span>개 거래처
              </p>
            </div>
          </div>
          <button
            onClick={onAddCompany}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-xl transition-all duration-200 shadow-sm shadow-sky-200 hover:shadow-md hover:shadow-sky-200"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">거래처 추가</span>
            <span className="sm:hidden">추가</span>
          </button>
        </div>

        {/* 검색 필터 영역 */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5 sm:flex-wrap">
          {/* 거래처명 검색 */}
          <div className="relative col-span-2 sm:col-span-1 sm:flex-1 sm:min-w-[180px] sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={onKeyPress}
              placeholder="거래처명 검색..."
              className="w-full pl-9 pr-3 py-2.5 sm:py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 bg-slate-50/50 hover:bg-white transition-all duration-200 placeholder:text-slate-300"
            />
          </div>

          {/* 주소 검색 */}
          <div className="relative sm:flex-1 sm:min-w-[150px] sm:max-w-xs">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <input
              type="text"
              value={addressTerm}
              onChange={(e) => onAddressChange(e.target.value)}
              onKeyDown={onKeyPress}
              placeholder="주소..."
              className="w-full pl-9 pr-3 py-2.5 sm:py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 bg-slate-50/50 hover:bg-white transition-all duration-200 placeholder:text-slate-300"
            />
          </div>

          {/* 담당자 검색 */}
          <div className="relative sm:flex-1 sm:min-w-[150px] sm:max-w-xs">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <input
              type="text"
              value={contactTerm}
              onChange={(e) => onContactChange(e.target.value)}
              onKeyDown={onKeyPress}
              placeholder="담당자..."
              className="w-full pl-9 pr-3 py-2.5 sm:py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 bg-slate-50/50 hover:bg-white transition-all duration-200 placeholder:text-slate-300"
            />
          </div>

          {/* 실험실 바로가기 */}
          <Link
            href="/consultations/1ef367e7-2807-491a-8852-183b392fa3e7"
            className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-xl transition-all duration-200 shadow-sm shadow-purple-200"
          >
            <FlaskConical className="h-4 w-4" />
            <span className="hidden sm:inline">실험실</span>
            <span className="sm:hidden">Lab</span>
          </Link>

          {/* 필터 초기화 */}
          {hasFilters && (
            <button
              onClick={onResetFilters}
              className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 rounded-xl transition-all duration-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              초기화
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
