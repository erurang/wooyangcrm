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
    <div className="px-4 py-3">
      <div className="flex flex-wrap gap-3 items-center">
        {/* 연도 */}
        <select
          value={year}
          onChange={(e) => onYearChange(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
        >
          {years.map((y) => (
            <option key={y} value={y.toString()}>
              {y}년
            </option>
          ))}
        </select>

        {/* 월 */}
        <select
          value={month}
          onChange={(e) => onMonthChange(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
        >
          <option value="">전체 월</option>
          {months.map((m) => (
            <option key={m} value={m.toString()}>
              {m}월
            </option>
          ))}
        </select>

        {/* 거래처 */}
        <select
          value={companyId}
          onChange={(e) => onCompanyIdChange(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors min-w-[140px]"
        >
          <option value="">전체 거래처</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>

        {/* 운송방법 */}
        <select
          value={shippingMethod}
          onChange={(e) =>
            onShippingMethodChange(e.target.value as ShippingMethodType | "")
          }
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
        >
          <option value="">전체 운송</option>
          {Object.entries(SHIPPING_METHOD_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        {/* 포워더 검색 */}
        <div className="relative flex-1 min-w-[140px] max-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={forwarder}
            onChange={(e) => onForwarderChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
            placeholder="포워더..."
          />
        </div>

        {/* 초기화 버튼 */}
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={14} />
            초기화
          </button>
        )}
      </div>
    </div>
  );
}
