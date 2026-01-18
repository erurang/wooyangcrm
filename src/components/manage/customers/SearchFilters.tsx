"use client";

import type React from "react";
import { Plus, RefreshCw, Building, MapPin, User } from "lucide-react";

interface SearchFiltersProps {
  searchTerm: string;
  addressTerm: string;
  contactTerm: string;
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
  onSearchChange,
  onAddressChange,
  onContactChange,
  onResetFilters,
  onAddCompany,
  onKeyPress,
}: SearchFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
        {/* 거래처명 */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600 flex items-center">
            <Building className="w-3 h-3 mr-1 text-gray-400" />
            거래처명
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={onKeyPress}
            placeholder="거래처명"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* 주소 */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600 flex items-center">
            <MapPin className="w-3 h-3 mr-1 text-gray-400" />
            주소
          </label>
          <input
            type="text"
            value={addressTerm}
            onChange={(e) => onAddressChange(e.target.value)}
            onKeyDown={onKeyPress}
            placeholder="주소"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* 담당자 */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600 flex items-center">
            <User className="w-3 h-3 mr-1 text-gray-400" />
            담당자
          </label>
          <input
            type="text"
            value={contactTerm}
            onChange={(e) => onContactChange(e.target.value)}
            onKeyPress={onKeyPress}
            placeholder="담당자"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* 필터 초기화 */}
        <div>
          <button
            onClick={onResetFilters}
            className="w-full px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors flex items-center justify-center"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            초기화
          </button>
        </div>

        {/* 거래처 추가 */}
        <div>
          <button
            onClick={onAddCompany}
            className="w-full px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center justify-center"
          >
            <Plus className="w-3 h-3 mr-1" />
            거래처 추가
          </button>
        </div>
      </div>
    </div>
  );
}
