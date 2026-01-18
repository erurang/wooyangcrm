"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Factory,
  Calendar as CalendarIcon,
  User,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle,
  Inbox,
  XCircle,
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import { supabase } from "@/lib/supabaseClient";
import useSWR from "swr";
import { useLoginUser } from "@/context/login";
import WorkOrderDetailModal from "@/components/production/work-orders/WorkOrderDetailModal";

dayjs.locale("ko");

interface WorkOrder {
  id: string;
  title: string;
  content?: string;
  deadline_type: string;
  deadline_start?: string;
  deadline_end?: string;
  status: "pending" | "in_progress" | "completed" | "canceled";
  created_at: string;
  requester?: { id: string; name: string };
  assignees?: Array<{
    id: string;
    user_id: string;
    is_completed: boolean;
    user?: { id: string; name: string };
  }>;
}

interface ProductionRecord {
  id: string;
  product_id: string;
  quantity_produced: number;
  production_date: string;
  batch_number?: string;
  status: "completed" | "canceled";
  product?: { id: string; internal_code: string; internal_name: string; unit: string };
}

type RangePosition = "single" | "start" | "middle" | "end";

type CalendarEvent =
  | { type: "work_order"; data: WorkOrder; rangePosition: RangePosition }
  | { type: "production"; data: ProductionRecord };

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function isWorkOrderOverdue(wo: WorkOrder): boolean {
  if (wo.status === "completed" || wo.status === "canceled") return false;
  if (!wo.deadline_end) return false;
  const today = dayjs().startOf("day");
  const deadline = dayjs(wo.deadline_end).startOf("day");
  return deadline.isBefore(today);
}

function getMonthDays(year: number, month: number) {
  const firstDay = dayjs(`${year}-${month + 1}-01`);
  const lastDay = firstDay.endOf("month");
  const startOfWeek = firstDay.startOf("week");
  const endOfWeek = lastDay.endOf("week");

  const days: dayjs.Dayjs[] = [];
  let current = startOfWeek;

  while (current.isBefore(endOfWeek) || current.isSame(endOfWeek, "day")) {
    days.push(current);
    current = current.add(1, "day");
  }

  return days;
}

async function fetchProductionData(year: number, month: number) {
  const startDate = dayjs(`${year}-${month + 1}-01`).startOf("month").format("YYYY-MM-DD");
  const endDate = dayjs(`${year}-${month + 1}-01`).endOf("month").format("YYYY-MM-DD");

  // Fetch work orders with deadlines in this month
  const { data: workOrders, error: woError } = await supabase
    .from("work_orders")
    .select(`
      *,
      requester:users!work_orders_requester_id_fkey(id, name),
      assignees:work_order_assignees(
        id,
        user_id,
        is_completed,
        user:users!work_order_assignees_user_id_fkey(id, name)
      )
    `)
    .or(`deadline_end.gte.${startDate},deadline_start.lte.${endDate}`)
    .not("deadline_end", "is", null)
    .order("deadline_end", { ascending: true });

  if (woError) console.error("Work orders fetch error:", woError);

  // Fetch production records for this month
  const { data: productionRecords, error: prError } = await supabase
    .from("production_records")
    .select(`
      *,
      product:products(id, internal_code, internal_name, unit)
    `)
    .gte("production_date", startDate)
    .lte("production_date", endDate)
    .order("production_date", { ascending: true });

  if (prError) console.error("Production records fetch error:", prError);

  return {
    workOrders: (workOrders || []) as WorkOrder[],
    productionRecords: (productionRecords || []) as ProductionRecord[],
  };
}

export default function ProductionCalendarPage() {
  const user = useLoginUser();

  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | "work_order" | "production">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "in_progress" | "completed" | "overdue">("all");
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null);

  const year = currentDate.year();
  const month = currentDate.month();

  const { data, isLoading } = useSWR(
    [`production-calendar`, year, month],
    () => fetchProductionData(year, month),
    { revalidateOnFocus: false }
  );

  const { workOrders = [], productionRecords = [] } = data || {};

  // Build events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();

    // Add work orders for each day in their date range
    workOrders.forEach((wo) => {
      const startDate = wo.deadline_start ? dayjs(wo.deadline_start) : null;
      const endDate = wo.deadline_end ? dayjs(wo.deadline_end) : null;

      if (!endDate) return; // Skip if no end date

      const effectiveStart = startDate || endDate;
      const isSingleDay = effectiveStart.isSame(endDate, "day");

      if (isSingleDay) {
        // Single day event
        const dateKey = endDate.format("YYYY-MM-DD");
        if (!map.has(dateKey)) map.set(dateKey, []);
        map.get(dateKey)!.push({ type: "work_order", data: wo, rangePosition: "single" });
      } else {
        // Multi-day event - add to each day in range
        let current = effectiveStart;
        while (current.isBefore(endDate) || current.isSame(endDate, "day")) {
          const dateKey = current.format("YYYY-MM-DD");
          let rangePosition: RangePosition;

          if (current.isSame(effectiveStart, "day")) {
            rangePosition = "start";
          } else if (current.isSame(endDate, "day")) {
            rangePosition = "end";
          } else {
            rangePosition = "middle";
          }

          if (!map.has(dateKey)) map.set(dateKey, []);
          map.get(dateKey)!.push({ type: "work_order", data: wo, rangePosition });

          current = current.add(1, "day");
        }
      }
    });

    // Add production records by production_date
    productionRecords.forEach((pr) => {
      const dateKey = dayjs(pr.production_date).format("YYYY-MM-DD");
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push({ type: "production", data: pr });
    });

    return map;
  }, [workOrders, productionRecords]);

  const getFilteredEvents = (date: dayjs.Dayjs) => {
    const dateKey = date.format("YYYY-MM-DD");
    let events = eventsByDate.get(dateKey) || [];

    // Type filter
    if (typeFilter !== "all") {
      events = events.filter((e) => e.type === typeFilter);
    }

    // Status filter (only for work orders)
    if (statusFilter === "overdue") {
      events = events.filter(
        (e) => e.type === "work_order" && isWorkOrderOverdue(e.data as WorkOrder)
      );
    } else if (statusFilter !== "all") {
      events = events.filter(
        (e) =>
          e.type === "production" ||
          (e.type === "work_order" && (e.data as WorkOrder).status === statusFilter)
      );
    }

    return events;
  };

  const goToPrevMonth = () => setCurrentDate(currentDate.subtract(1, "month"));
  const goToNextMonth = () => setCurrentDate(currentDate.add(1, "month"));
  const goToToday = () => {
    setCurrentDate(dayjs());
    setSelectedDate(dayjs());
  };

  const handleDateClick = (date: dayjs.Dayjs) => {
    setSelectedDate(date);
  };

  const handleEventClick = (event: CalendarEvent) => {
    if (event.type === "work_order") {
      setSelectedWorkOrderId(event.data.id);
    }
    // Production records stay on the records page (optional navigation)
  };

  const days = getMonthDays(year, month);
  const today = dayjs().format("YYYY-MM-DD");

  const selectedDateEvents = selectedDate ? getFilteredEvents(selectedDate) : [];

  // Stats
  const stats = useMemo(() => {
    const pendingWO = workOrders.filter((wo) => wo.status === "pending").length;
    const inProgressWO = workOrders.filter((wo) => wo.status === "in_progress").length;
    const completedWO = workOrders.filter((wo) => wo.status === "completed").length;
    const overdueWO = workOrders.filter((wo) => isWorkOrderOverdue(wo)).length;
    const totalProduction = productionRecords.filter((pr) => pr.status === "completed").length;

    return { pendingWO, inProgressWO, completedWO, overdueWO, totalProduction };
  }, [workOrders, productionRecords]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          {/* Stats */}
          <div className="grid grid-cols-5 gap-3 mb-4">
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div className="flex items-center gap-2 text-slate-600 text-xs font-medium mb-1">
                <Clock className="h-3.5 w-3.5" />
                작업 대기
              </div>
              <p className="text-2xl font-bold text-slate-700">{stats.pendingWO}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <div className="flex items-center gap-2 text-blue-600 text-xs font-medium mb-1">
                <ClipboardList className="h-3.5 w-3.5" />
                진행중
              </div>
              <p className="text-2xl font-bold text-blue-700">{stats.inProgressWO}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-100">
              <div className="flex items-center gap-2 text-green-600 text-xs font-medium mb-1">
                <CheckCircle className="h-3.5 w-3.5" />
                완료
              </div>
              <p className="text-2xl font-bold text-green-700">{stats.completedWO}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 border border-red-100">
              <div className="flex items-center gap-2 text-red-600 text-xs font-medium mb-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                지연
              </div>
              <p className="text-2xl font-bold text-red-700">{stats.overdueWO}</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
              <div className="flex items-center gap-2 text-emerald-600 text-xs font-medium mb-1">
                <Factory className="h-3.5 w-3.5" />
                생산 기록
              </div>
              <p className="text-2xl font-bold text-emerald-700">{stats.totalProduction}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={goToPrevMonth}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <h2 className="text-lg font-bold text-slate-800 min-w-[120px] text-center">
                {currentDate.format("YYYY년 M월")}
              </h2>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                오늘
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Type filter */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setTypeFilter("all")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    typeFilter === "all"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => setTypeFilter("work_order")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    typeFilter === "work_order"
                      ? "bg-purple-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  작업지시
                </button>
                <button
                  onClick={() => setTypeFilter("production")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    typeFilter === "production"
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  생산기록
                </button>
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === "all"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => setStatusFilter("pending")}
                  className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === "pending"
                      ? "bg-slate-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  대기
                </button>
                <button
                  onClick={() => setStatusFilter("in_progress")}
                  className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === "in_progress"
                      ? "bg-blue-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  진행중
                </button>
                <button
                  onClick={() => setStatusFilter("overdue")}
                  className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === "overdue"
                      ? "bg-red-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  지연
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        <div className="flex gap-4">
          {/* Calendar */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              {/* Weekday Header */}
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                {WEEKDAYS.map((day, i) => (
                  <div
                    key={day}
                    className={`py-2.5 text-center text-xs font-medium ${
                      i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-slate-600"
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7">
                {days.map((date) => {
                  const dateKey = date.format("YYYY-MM-DD");
                  const isToday = dateKey === today;
                  const isCurrentMonth = date.month() === month;
                  const isSelected = selectedDate?.format("YYYY-MM-DD") === dateKey;
                  const events = getFilteredEvents(date);
                  const dayOfWeek = date.day();

                  return (
                    <button
                      key={dateKey}
                      onClick={() => handleDateClick(date)}
                      className={`
                        min-h-[100px] p-1.5 border-b border-r border-slate-100 text-left transition-colors relative
                        ${isCurrentMonth ? "bg-white" : "bg-slate-50/50"}
                        ${isSelected ? "ring-2 ring-inset ring-purple-500" : ""}
                        ${isToday ? "bg-purple-50/50" : ""}
                        hover:bg-slate-50
                      `}
                    >
                      <span
                        className={`
                          inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full
                          ${isToday ? "bg-purple-600 text-white" : ""}
                          ${!isCurrentMonth ? "text-slate-300" : ""}
                          ${dayOfWeek === 0 && isCurrentMonth && !isToday ? "text-red-500" : ""}
                          ${dayOfWeek === 6 && isCurrentMonth && !isToday ? "text-blue-500" : ""}
                        `}
                      >
                        {date.date()}
                      </span>

                      <div className="mt-1 space-y-0.5">
                        {events.slice(0, 3).map((event) => {
                          if (event.type === "work_order") {
                            const wo = event.data as WorkOrder;
                            const overdue = isWorkOrderOverdue(wo);
                            const pos = event.rangePosition;

                            // Range position styles for bar effect
                            const positionStyle =
                              pos === "start"
                                ? "rounded-l ml-0 mr-[-6px] pr-2"
                                : pos === "end"
                                ? "rounded-r ml-[-6px] mr-0 pl-2"
                                : pos === "middle"
                                ? "rounded-none mx-[-6px] px-2"
                                : "rounded mx-0"; // single

                            const colorStyle = overdue
                              ? "bg-red-500 text-white"
                              : wo.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : wo.status === "in_progress"
                              ? "bg-blue-500 text-white"
                              : "bg-purple-500 text-white";

                            // Show title only on start or single
                            const showTitle = pos === "start" || pos === "single";

                            return (
                              <div
                                key={`wo-${wo.id}-${pos}`}
                                className={`
                                  py-0.5 text-[10px] font-medium truncate cursor-pointer hover:opacity-80
                                  ${positionStyle}
                                  ${colorStyle}
                                `}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedWorkOrderId(wo.id);
                                }}
                                title={wo.title}
                              >
                                {showTitle ? `작 ${wo.title.slice(0, 8)}` : ""}
                              </div>
                            );
                          } else {
                            const pr = event.data as ProductionRecord;
                            return (
                              <div
                                key={`pr-${pr.id}`}
                                className={`
                                  px-1 py-0.5 text-[10px] font-medium rounded truncate
                                  ${pr.status === "canceled" ? "bg-red-100 text-red-700" : "bg-emerald-500 text-white"}
                                `}
                              >
                                생 {pr.product?.internal_name?.slice(0, 8) || ""}
                              </div>
                            );
                          }
                        })}
                        {events.length > 3 && (
                          <div className="text-[10px] text-slate-400 pl-1">
                            +{events.length - 3}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="w-[380px] flex-shrink-0">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden sticky top-[180px]">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-slate-500" />
                  <h3 className="font-semibold text-slate-800">
                    {selectedDate ? selectedDate.format("M월 D일 (ddd)") : "날짜 선택"}
                  </h3>
                </div>
                {selectedDate && (
                  <p className="text-xs text-slate-500 mt-1 ml-6">
                    {selectedDateEvents.length}건의 일정
                  </p>
                )}
              </div>

              <div className="max-h-[500px] overflow-y-auto">
                {!selectedDate ? (
                  <div className="p-8 text-center text-slate-400">
                    <Inbox className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">캘린더에서 날짜를 선택하세요</p>
                  </div>
                ) : selectedDateEvents.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">예정된 일정이 없습니다</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {selectedDateEvents.map((event) => {
                      if (event.type === "work_order") {
                        const wo = event.data as WorkOrder;
                        const overdue = isWorkOrderOverdue(wo);

                        return (
                          <button
                            key={`wo-${wo.id}`}
                            onClick={() => handleEventClick(event)}
                            className={`w-full p-3 text-left hover:bg-slate-50 transition-colors ${
                              overdue ? "bg-red-50/50" : ""
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div
                                className={`
                                  p-1.5 rounded-lg flex-shrink-0
                                  ${
                                    overdue
                                      ? "bg-red-100 text-red-600"
                                      : wo.status === "completed"
                                      ? "bg-green-100 text-green-600"
                                      : "bg-purple-100 text-purple-600"
                                  }
                                `}
                              >
                                {overdue ? (
                                  <AlertTriangle className="w-4 h-4" />
                                ) : wo.status === "completed" ? (
                                  <CheckCircle className="w-4 h-4" />
                                ) : (
                                  <ClipboardList className="w-4 h-4" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-purple-100 text-purple-700">
                                    작업지시
                                  </span>
                                  {overdue && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-red-100 text-red-700">
                                      지연
                                    </span>
                                  )}
                                  <span
                                    className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                                      wo.status === "completed"
                                        ? "bg-green-100 text-green-700"
                                        : wo.status === "in_progress"
                                        ? "bg-blue-100 text-blue-700"
                                        : wo.status === "canceled"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    {wo.status === "completed"
                                      ? "완료"
                                      : wo.status === "in_progress"
                                      ? "진행중"
                                      : wo.status === "canceled"
                                      ? "취소됨"
                                      : "대기"}
                                  </span>
                                </div>
                                <p className="mt-1 font-medium text-slate-800 truncate">
                                  {wo.title}
                                </p>
                                <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                                  <User className="w-3 h-3 flex-shrink-0" />
                                  {wo.requester?.name || "알 수 없음"}
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
                            </div>
                          </button>
                        );
                      } else {
                        const pr = event.data as ProductionRecord;
                        return (
                          <button
                            key={`pr-${pr.id}`}
                            onClick={() => handleEventClick(event)}
                            className="w-full p-3 text-left hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-start gap-2.5">
                              <div
                                className={`p-1.5 rounded-lg flex-shrink-0 ${
                                  pr.status === "canceled"
                                    ? "bg-red-100 text-red-600"
                                    : "bg-emerald-100 text-emerald-600"
                                }`}
                              >
                                {pr.status === "canceled" ? (
                                  <XCircle className="w-4 h-4" />
                                ) : (
                                  <Factory className="w-4 h-4" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-100 text-emerald-700">
                                    생산기록
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                                      pr.status === "canceled"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-green-100 text-green-700"
                                    }`}
                                  >
                                    {pr.status === "canceled" ? "취소됨" : "완료"}
                                  </span>
                                </div>
                                <p className="mt-1 font-medium text-slate-800 truncate">
                                  {pr.product?.internal_name || "알 수 없음"}
                                </p>
                                <div className="mt-0.5 text-xs text-slate-500">
                                  {pr.quantity_produced.toLocaleString()} {pr.product?.unit} 생산
                                </div>
                                {pr.batch_number && (
                                  <div className="mt-0.5 text-xs text-slate-400">
                                    배치: {pr.batch_number}
                                  </div>
                                )}
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
                            </div>
                          </button>
                        );
                      }
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Work Order Detail Modal */}
      <WorkOrderDetailModal
        isOpen={!!selectedWorkOrderId}
        workOrderId={selectedWorkOrderId}
        currentUserId={user?.id || ""}
        onClose={() => setSelectedWorkOrderId(null)}
        onUpdate={() => {
          // Trigger refetch
          setSelectedWorkOrderId(null);
        }}
        onDelete={() => {
          setSelectedWorkOrderId(null);
        }}
      />
    </div>
  );
}
