"use client";

import { useState, useMemo } from "react";
import { DateFilterType, DateRangeState, DateRange } from "@/types/dateFilter";

export function useDateRange(): DateRangeState {
  const [dateFilter, setDateFilter] = useState<DateFilterType>("month");
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [selectedQuarter, setSelectedQuarter] = useState<number>(1);
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1
  );

  const dateRange = useMemo((): DateRange => {
    let start: string;
    let end: string;

    if (dateFilter === "year") {
      start = `${selectedYear}-01-01`;
      end = `${selectedYear}-12-31`;
    } else if (dateFilter === "quarter") {
      const startMonth = (selectedQuarter - 1) * 3 + 1;
      start = `${selectedYear}-${String(startMonth).padStart(2, "0")}-01`;
      const endMonth = startMonth + 2;
      const lastDay = new Date(selectedYear, endMonth, 0).getDate();
      end = `${selectedYear}-${String(endMonth).padStart(2, "0")}-${String(
        lastDay
      ).padStart(2, "0")}`;
    } else {
      start = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      end = `${selectedYear}-${String(selectedMonth).padStart(
        2,
        "0"
      )}-${String(lastDay).padStart(2, "0")}`;
    }

    // 타임존 고려를 위해 endDate에 하루 추가 (모든 필터 타입에 일관되게 적용)
    const endDateObj = new Date(end);
    endDateObj.setDate(endDateObj.getDate() + 1);
    end = endDateObj.toISOString().split("T")[0];

    return { startDate: start, endDate: end };
  }, [dateFilter, selectedYear, selectedQuarter, selectedMonth]);

  return {
    dateFilter,
    selectedYear,
    selectedQuarter,
    selectedMonth,
    dateRange,
    setDateFilter,
    setSelectedYear,
    setSelectedQuarter,
    setSelectedMonth,
  };
}
