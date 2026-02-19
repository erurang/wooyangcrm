"use client";

import { Calendar } from "lucide-react";
import { DateFilterType } from "@/types/dateFilter";

interface DateFilterCardProps {
  dateFilter: DateFilterType;
  selectedYear: number;
  selectedQuarter: number;
  selectedMonth: number;
  onDateFilterChange: (filter: DateFilterType) => void;
  onYearChange: (year: number) => void;
  onQuarterChange: (quarter: number) => void;
  onMonthChange: (month: number) => void;
}

const filterOptions: { value: DateFilterType; label: string }[] = [
  { value: "year", label: "연간" },
  { value: "quarter", label: "분기" },
  { value: "month", label: "월간" },
];

export default function DateFilterCard({
  dateFilter,
  selectedYear,
  selectedQuarter,
  selectedMonth,
  onDateFilterChange,
  onYearChange,
  onQuarterChange,
  onMonthChange,
}: DateFilterCardProps) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 text-slate-500 mr-1">
        <Calendar className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wider">기간</span>
      </div>

      {/* 연도 선택 */}
      <select
        className="h-8 border border-slate-200 px-2.5 rounded-lg text-sm font-medium text-slate-700
          bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400
          transition-colors cursor-pointer appearance-none pr-7
          bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a//www.w3.org/2000/svg%22%20width%3d%2212%22%20height%3d%2212%22%20viewBox%3d%220%200%2012%2012%22%3e%3cpath%20fill%3d%22%2394a3b8%22%20d%3d%22M2.5%204.5l3.5%203.5%203.5-3.5%22/%3e%3c/svg%3e')]
          bg-[length:12px] bg-[right_8px_center] bg-no-repeat"
        value={selectedYear}
        onChange={(e) => onYearChange(Number(e.target.value))}
      >
        {Array.from({ length: currentYear - 2010 + 1 }, (_, i) => {
          const year = currentYear - i;
          return (
            <option key={year} value={year}>
              {year}년
            </option>
          );
        })}
      </select>

      {/* 필터 타입 - 세그먼트 컨트롤 */}
      <div className="flex bg-slate-100 rounded-lg p-0.5">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onDateFilterChange(opt.value)}
            className={`
              px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200
              ${dateFilter === opt.value
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
              }
            `}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 분기 선택 */}
      {dateFilter === "quarter" && (
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          {[1, 2, 3, 4].map((q) => (
            <button
              key={q}
              onClick={() => onQuarterChange(q)}
              className={`
                px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200
                ${selectedQuarter === q
                  ? "bg-white text-sky-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                }
              `}
            >
              Q{q}
            </button>
          ))}
        </div>
      )}

      {/* 월 선택 */}
      {dateFilter === "month" && (
        <select
          className="h-8 border border-slate-200 px-2.5 rounded-lg text-sm font-medium text-slate-700
            bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400
            transition-colors cursor-pointer appearance-none pr-7
            bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a//www.w3.org/2000/svg%22%20width%3d%2212%22%20height%3d%2212%22%20viewBox%3d%220%200%2012%2012%22%3e%3cpath%20fill%3d%22%2394a3b8%22%20d%3d%22M2.5%204.5l3.5%203.5%203.5-3.5%22/%3e%3c/svg%3e')]
            bg-[length:12px] bg-[right_8px_center] bg-no-repeat"
          value={selectedMonth}
          onChange={(e) => onMonthChange(Number(e.target.value))}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}월
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
