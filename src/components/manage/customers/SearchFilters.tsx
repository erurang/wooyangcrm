"use client";

import type React from "react";
import {
  Plus,
  X,
  Building,
  MapPin,
  User,
} from "lucide-react";

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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Company Name */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            거래처명
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={onKeyPress}
              placeholder="거래처명 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <Building
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
          </div>
        </div>

        {/* Address */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            주소
          </label>
          <div className="relative">
            <input
              type="text"
              value={addressTerm}
              onChange={(e) => onAddressChange(e.target.value)}
              onKeyDown={onKeyPress}
              placeholder="주소 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <MapPin
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
          </div>
        </div>

        {/* Contact Person */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            담당자
          </label>
          <div className="relative">
            <input
              type="text"
              value={contactTerm}
              onChange={(e) => onContactChange(e.target.value)}
              onKeyDown={onKeyPress}
              placeholder="담당자 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <User
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
          </div>
        </div>

      </div>

      {/* Filter Actions */}
      <div className="flex justify-end mt-4 gap-4">
        <button
          onClick={onResetFilters}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          <X size={16} />
          <span>필터 초기화</span>
        </button>
        <button
          onClick={onAddCompany}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span>거래처 추가</span>
        </button>
      </div>
    </div>
  );
}
