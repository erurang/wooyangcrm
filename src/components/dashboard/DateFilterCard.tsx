"use client";

import { Filter } from "lucide-react";
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
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
      <div className="flex items-center mb-4">
        <div className="bg-indigo-50 p-2 rounded-md mr-3">
          <Filter className="h-5 w-5 text-indigo-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800">
          데이터 기간 선택
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* 연도 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            연도
          </label>
          <select
            className="w-full border border-slate-300 p-2 rounded-md text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
        </div>

        {/* 필터 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            기간 단위
          </label>
          <select
            className="w-full border border-slate-300 p-2 rounded-md text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={dateFilter}
            onChange={(e) =>
              onDateFilterChange(e.target.value as DateFilterType)
            }
          >
            <option value="year">연도별</option>
            <option value="quarter">분기별</option>
            <option value="month">월별</option>
          </select>
        </div>

        {/* 분기 */}
        {dateFilter === "quarter" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              분기
            </label>
            <select
              className="w-full border border-slate-300 p-2 rounded-md text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={selectedQuarter}
              onChange={(e) => onQuarterChange(Number(e.target.value))}
            >
              <option value="1">1분기 (1~3월)</option>
              <option value="2">2분기 (4~6월)</option>
              <option value="3">3분기 (7~9월)</option>
              <option value="4">4분기 (10~12월)</option>
            </select>
          </div>
        )}

        {/* 월 */}
        {dateFilter === "month" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              월
            </label>
            <select
              className="w-full border border-slate-300 p-2 rounded-md text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={selectedMonth}
              onChange={(e) => onMonthChange(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}월
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
