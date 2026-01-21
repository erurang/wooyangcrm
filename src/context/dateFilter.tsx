"use client";

import { createContext, useContext, ReactNode } from "react";
import { useDateRange } from "@/hooks/dashboard/useDateRange";
import type { DateFilterType } from "@/types/dateFilter";

interface DateFilterContextType {
  dateFilter: DateFilterType;
  selectedYear: number;
  selectedQuarter: number;
  selectedMonth: number;
  startDate: string;
  endDate: string;
  setDateFilter: (filter: DateFilterType) => void;
  setSelectedYear: (year: number) => void;
  setSelectedQuarter: (quarter: number) => void;
  setSelectedMonth: (month: number) => void;
}

const DateFilterContext = createContext<DateFilterContextType | null>(null);

export function DateFilterProvider({ children }: { children: ReactNode }) {
  const {
    dateFilter,
    selectedYear,
    selectedQuarter,
    selectedMonth,
    dateRange,
    setDateFilter,
    setSelectedYear,
    setSelectedQuarter,
    setSelectedMonth,
  } = useDateRange();

  const { startDate, endDate } = dateRange;

  return (
    <DateFilterContext.Provider
      value={{
        dateFilter,
        selectedYear,
        selectedQuarter,
        selectedMonth,
        startDate,
        endDate,
        setDateFilter,
        setSelectedYear,
        setSelectedQuarter,
        setSelectedMonth,
      }}
    >
      {children}
    </DateFilterContext.Provider>
  );
}

export function useDateFilter() {
  const context = useContext(DateFilterContext);
  if (!context) {
    throw new Error("useDateFilter must be used within DateFilterProvider");
  }
  return context;
}
