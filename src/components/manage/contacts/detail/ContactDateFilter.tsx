"use client";

import { Calendar } from "lucide-react";

interface ContactDateFilterProps {
  dateFilter: "year" | "quarter" | "month";
  selectedYear: number;
  selectedQuarter: number;
  selectedMonth: number;
  startDate: string;
  endDate: string;
  onDateFilterChange: (filter: "year" | "quarter" | "month") => void;
  onYearChange: (year: number) => void;
  onQuarterChange: (quarter: number) => void;
  onMonthChange: (month: number) => void;
}

export default function ContactDateFilter({
  dateFilter,
  selectedYear,
  selectedQuarter,
  selectedMonth,
  startDate,
  endDate,
  onDateFilterChange,
  onYearChange,
  onQuarterChange,
  onMonthChange,
}: ContactDateFilterProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
      <div className="flex items-center mb-4">
        <Calendar className="h-5 w-5 text-indigo-600 mr-2" />
        <h2 className="text-lg font-semibold text-slate-800">
          데이터 기간 선택
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            연도
          </label>
          <select
            className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
          >
            {Array.from(
              { length: new Date().getFullYear() - 2010 + 1 },
              (_, i) => (
                <option key={i} value={new Date().getFullYear() - i}>
                  {new Date().getFullYear() - i}년
                </option>
              )
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            기간 단위
          </label>
          <select
            className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={dateFilter}
            onChange={(e) =>
              onDateFilterChange(e.target.value as "year" | "quarter" | "month")
            }
          >
            <option value="year">연도별</option>
            <option value="quarter">분기별</option>
            <option value="month">월별</option>
          </select>
        </div>

        {dateFilter === "quarter" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              분기
            </label>
            <select
              className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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

        {dateFilter === "month" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              월
            </label>
            <select
              className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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

        <div className="flex items-end">
          <span className="text-sm text-slate-600 mb-2">
            {startDate} ~ {endDate}
          </span>
        </div>
      </div>
    </div>
  );
}
