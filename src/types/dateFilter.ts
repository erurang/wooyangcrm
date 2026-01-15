/**
 * 날짜 필터 관련 공통 타입
 */

export type DateFilterType = "year" | "quarter" | "month";

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface DateRangeState {
  dateFilter: DateFilterType;
  selectedYear: number;
  selectedQuarter: number;
  selectedMonth: number;
  dateRange: DateRange;
  setDateFilter: (filter: DateFilterType) => void;
  setSelectedYear: (year: number) => void;
  setSelectedQuarter: (quarter: number) => void;
  setSelectedMonth: (month: number) => void;
}
