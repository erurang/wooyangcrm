"use client";

import { Search, X } from "lucide-react";
import { ShippingMethodType, SHIPPING_METHOD_LABELS } from "@/types/overseas";
import { useOverseasCompanies } from "@/hooks/overseas";

interface CustomsCostFiltersProps {
  year: string;
  month: string;
  companyId: string;
  shippingMethod: ShippingMethodType | "";
  forwarder: string;
  onYearChange: (year: string) => void;
  onMonthChange: (month: string) => void;
  onCompanyIdChange: (companyId: string) => void;
  onShippingMethodChange: (method: ShippingMethodType | "") => void;
  onForwarderChange: (forwarder: string) => void;
  onReset: () => void;
}

export default function CustomsCostFilters({
  year,
  month,
  companyId,
  shippingMethod,
  forwarder,
  onYearChange,
  onMonthChange,
  onCompanyIdChange,
  onShippingMethodChange,
  onForwarderChange,
  onReset,
}: CustomsCostFiltersProps) {
  const { companies } = useOverseasCompanies({ limit: 100 });
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const hasActiveFilters =
    companyId || shippingMethod || forwarder || month;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        {/* 연도 */}
        <div className="flex-shrink-0">
          <label className="block text-xs text-gray-500 mb-1">연도</label>
          <select
            value={year}
            onChange={(e) => onYearChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {years.map((y) => (
              <option key={y} value={y.toString()}>
                {y}년
              </option>
            ))}
          </select>
        </div>

        {/* 월 */}
        <div className="flex-shrink-0">
          <label className="block text-xs text-gray-500 mb-1">월</label>
          <select
            value={month}
            onChange={(e) => onMonthChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">전체</option>
            {months.map((m) => (
              <option key={m} value={m.toString()}>
                {m}월
              </option>
            ))}
          </select>
        </div>

        {/* 거래처 */}
        <div className="flex-shrink-0 min-w-[150px]">
          <label className="block text-xs text-gray-500 mb-1">거래처</label>
          <select
            value={companyId}
            onChange={(e) => onCompanyIdChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">전체</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        {/* 운송방법 */}
        <div className="flex-shrink-0">
          <label className="block text-xs text-gray-500 mb-1">운송방법</label>
          <select
            value={shippingMethod}
            onChange={(e) =>
              onShippingMethodChange(e.target.value as ShippingMethodType | "")
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">전체</option>
            {Object.entries(SHIPPING_METHOD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* 포워더 검색 */}
        <div className="flex-grow min-w-[150px]">
          <label className="block text-xs text-gray-500 mb-1">포워더/관세사</label>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={forwarder}
              onChange={(e) => onForwarderChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="포워더 검색"
            />
          </div>
        </div>

        {/* 초기화 버튼 */}
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X size={14} />
            초기화
          </button>
        )}
      </div>
    </div>
  );
}
