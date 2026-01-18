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
      <div className="flex items-center gap-1.5 text-slate-600">
        <Calendar className="h-4 w-4" />
        <span className="text-sm font-medium">기간</span>
      </div>

      {/* 연도 */}
      <select
        className="border border-slate-300 px-2 py-1 rounded text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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

      {/* 필터 */}
      <select
        className="border border-slate-300 px-2 py-1 rounded text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        value={dateFilter}
        onChange={(e) => onDateFilterChange(e.target.value as DateFilterType)}
      >
        <option value="year">연간</option>
        <option value="quarter">분기</option>
        <option value="month">월간</option>
      </select>

      {/* 분기 */}
      {dateFilter === "quarter" && (
        <select
          className="border border-slate-300 px-2 py-1 rounded text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          value={selectedQuarter}
          onChange={(e) => onQuarterChange(Number(e.target.value))}
        >
          <option value="1">1분기</option>
          <option value="2">2분기</option>
          <option value="3">3분기</option>
          <option value="4">4분기</option>
        </select>
      )}

      {/* 월 */}
      {dateFilter === "month" && (
        <select
          className="border border-slate-300 px-2 py-1 rounded text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
