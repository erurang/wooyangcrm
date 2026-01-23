"use client";

import { useState, useCallback } from "react";
import {
  BarChart3,
  Building2,
  Users,
  FileText,
  Calendar,
  Factory,
} from "lucide-react";
import HeadlessSelect from "@/components/ui/HeadlessSelect";
import StatisticsTab from "@/components/reports/tabs/StatisticsTab";
import CompaniesTab from "@/components/reports/tabs/CompaniesTab";
import EmployeesTab from "@/components/reports/tabs/EmployeesTab";
import DailyReportsTab from "@/components/reports/tabs/DailyReportsTab";
import ProductionPerformanceTab from "@/components/reports/tabs/ProductionPerformanceTab";
import { useReportStatistics } from "@/hooks/reports/useReportStatistics";
import type { ReportTabType, DateFilterType } from "@/types/reports";

const TABS: { id: ReportTabType; label: string; icon: React.ElementType }[] = [
  { id: "statistics", label: "매출/매입 통계", icon: BarChart3 },
  { id: "companies", label: "거래처별 실적", icon: Building2 },
  { id: "employees", label: "직원별 실적", icon: Users },
  { id: "production", label: "생산팀 실적", icon: Factory },
  { id: "daily", label: "일보/월보", icon: FileText },
];

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
const QUARTERS = [1, 2, 3, 4];
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function ReportsPage() {
  // 탭 상태
  const [activeTab, setActiveTab] = useState<ReportTabType>("statistics");

  // 필터 상태
  const [dateFilter, setDateFilter] = useState<DateFilterType>("year");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState(
    Math.ceil((new Date().getMonth() + 1) / 3)
  );
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // 통계 데이터 훅
  const { monthlyStats, previousYearStats, isLoading } = useReportStatistics(
    selectedYear,
    dateFilter,
    selectedQuarter,
    selectedMonth
  );

  // 필터 변경 핸들러
  const handleDateFilterChange = useCallback((filter: DateFilterType) => {
    setDateFilter(filter);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          {/* 탭 네비게이션 */}
          <div className="flex items-center gap-1 mb-3">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* 필터 영역 */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* 기간 유형 선택 */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
              {(["year", "quarter", "month"] as DateFilterType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleDateFilterChange(type)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    dateFilter === type
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {type === "year" ? "연간" : type === "quarter" ? "분기" : "월간"}
                </button>
              ))}
            </div>

            {/* 연도 선택 */}
            <HeadlessSelect
              value={String(selectedYear)}
              onChange={(val) => setSelectedYear(Number(val))}
              options={YEARS.map((year) => ({
                value: String(year),
                label: `${year}년`,
              }))}
              placeholder="연도 선택"
              className="w-28"
            />

            {/* 분기 선택 (분기 필터일 때만) */}
            {dateFilter === "quarter" && (
              <HeadlessSelect
                value={String(selectedQuarter)}
                onChange={(val) => setSelectedQuarter(Number(val))}
                options={QUARTERS.map((q) => ({
                  value: String(q),
                  label: `${q}분기`,
                }))}
                placeholder="분기 선택"
                className="w-24"
              />
            )}

            {/* 월 선택 (월간 필터일 때만) */}
            {dateFilter === "month" && (
              <HeadlessSelect
                value={String(selectedMonth)}
                onChange={(val) => setSelectedMonth(Number(val))}
                options={MONTHS.map((m) => ({
                  value: String(m),
                  label: `${m}월`,
                }))}
                placeholder="월 선택"
                className="w-24"
              />
            )}

            {/* 현재 기간 표시 */}
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <Calendar className="h-4 w-4" />
              <span>
                {dateFilter === "year"
                  ? `${selectedYear}년 전체`
                  : dateFilter === "quarter"
                  ? `${selectedYear}년 ${selectedQuarter}분기`
                  : `${selectedYear}년 ${selectedMonth}월`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="p-4">
        {activeTab === "statistics" && (
          <StatisticsTab
            year={selectedYear}
            dateFilter={dateFilter}
            quarter={selectedQuarter}
            month={selectedMonth}
            monthlyStats={monthlyStats}
            previousYearStats={previousYearStats}
            isLoading={isLoading}
          />
        )}
        {activeTab === "companies" && (
          <CompaniesTab
            year={selectedYear}
            dateFilter={dateFilter}
            quarter={selectedQuarter}
            month={selectedMonth}
          />
        )}
        {activeTab === "employees" && (
          <EmployeesTab
            year={selectedYear}
            dateFilter={dateFilter}
            quarter={selectedQuarter}
            month={selectedMonth}
          />
        )}
        {activeTab === "production" && (
          <ProductionPerformanceTab
            year={selectedYear}
            dateFilter={dateFilter}
            quarter={selectedQuarter}
            month={selectedMonth}
          />
        )}
        {activeTab === "daily" && (
          <DailyReportsTab
            year={selectedYear}
            month={selectedMonth}
          />
        )}
      </div>
    </div>
  );
}
