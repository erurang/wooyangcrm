"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar as CalendarIcon,
  Building2,
  FileText,
  User,
  AlertTriangle,
  Clock,
  CheckCircle,
  Inbox,
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import { supabase } from "@/lib/supabaseClient";
import useSWR from "swr";

dayjs.locale("ko");

interface InventoryItem {
  name: string;
  spec?: string;
  quantity: number | string;
  unit?: string;
}

interface InventoryTask {
  id: string;
  document_id: string;
  document_number: string;
  document_type: "order" | "estimate";
  task_type: "inbound" | "outbound";
  status: "pending" | "assigned" | "completed" | "canceled";
  expected_date: string | null;
  completed_at: string | null;
  assigned_to: string | null;
  company_id: string;
  companies?: {
    name: string;
  };
  assigned_user?: {
    name: string;
    level: string;
  };
  document?: {
    content?: {
      items?: InventoryItem[];
    };
  };
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function isTaskOverdue(task: InventoryTask): boolean {
  if (task.status === "completed" || task.status === "canceled") return false;
  if (!task.expected_date) return false;
  const today = dayjs().startOf("day");
  const expectedDate = dayjs(task.expected_date).startOf("day");
  return expectedDate.isBefore(today);
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

async function fetchInventoryTasks(year: number, month: number) {
  const monthStr = String(month + 1).padStart(2, "0");
  const fromPrefix = `WY-${year}${monthStr}01`;
  const toPrefix = `WY-${year}${monthStr}31-9999`;

  const { data, error } = await supabase
    .from("inventory_tasks")
    .select(
      `
      *,
      companies(name),
      assigned_user:users!inventory_tasks_assigned_to_fkey(name, level),
      document:documents(content)
    `
    )
    .gte("document_number", fromPrefix)
    .lte("document_number", toPrefix)
    .order("expected_date", { ascending: true, nullsFirst: false })
    .limit(5000);

  if (error) throw error;
  return data as InventoryTask[];
}

export default function InventoryCalendarPage() {
  const router = useRouter();

  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | "inbound" | "outbound">("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "assigned" | "overdue" | "completed"
  >("all");

  const year = currentDate.year();
  const month = currentDate.month();

  const { data: tasks = [], isLoading } = useSWR(
    [`inventory-calendar`, year, month],
    () => fetchInventoryTasks(year, month),
    { revalidateOnFocus: false }
  );

  const getDateFromDocumentNumber = (docNum: string): string | null => {
    const match = docNum.match(/WY-(\d{4})(\d{2})(\d{2})/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return null;
  };

  const eventsByDate = useMemo(() => {
    const map = new Map<string, InventoryTask[]>();

    tasks.forEach((task) => {
      let dateKey: string | null = null;

      if (task.expected_date) {
        dateKey = dayjs(task.expected_date).format("YYYY-MM-DD");
      } else if (task.document_number) {
        dateKey = getDateFromDocumentNumber(task.document_number);
      }

      if (dateKey) {
        if (!map.has(dateKey)) map.set(dateKey, []);
        map.get(dateKey)!.push(task);
      }
    });

    return map;
  }, [tasks]);

  const getFilteredEvents = (date: dayjs.Dayjs) => {
    const dateKey = date.format("YYYY-MM-DD");
    let events = eventsByDate.get(dateKey) || [];

    if (typeFilter !== "all") {
      events = events.filter((e) => e.task_type === typeFilter);
    }

    if (statusFilter === "overdue") {
      events = events.filter((e) => isTaskOverdue(e));
    } else if (statusFilter !== "all") {
      events = events.filter((e) => e.status === statusFilter);
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

  const handleEventClick = (task: InventoryTask) => {
    const page =
      task.task_type === "inbound"
        ? "/inventory/inbound"
        : "/inventory/outbound";
    router.push(`${page}?highlight=${task.id}`);
  };

  const days = getMonthDays(year, month);
  const today = dayjs().format("YYYY-MM-DD");

  const selectedDateEvents = selectedDate ? getFilteredEvents(selectedDate) : [];

  const stats = useMemo(() => {
    const inboundPending = tasks.filter(
      (t) => t.task_type === "inbound" && t.status !== "completed" && t.status !== "canceled"
    ).length;
    const outboundPending = tasks.filter(
      (t) => t.task_type === "outbound" && t.status !== "completed" && t.status !== "canceled"
    ).length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const overdue = tasks.filter((t) => isTaskOverdue(t)).length;
    return { inboundPending, outboundPending, completed, overdue };
  }, [tasks]);

  const filteredStats = useMemo(() => {
    let filtered = tasks;
    if (typeFilter !== "all") {
      filtered = filtered.filter((t) => t.task_type === typeFilter);
    }
    return {
      total: filtered.length,
      pending: filtered.filter((t) => t.status === "pending").length,
      assigned: filtered.filter((t) => t.status === "assigned").length,
      completed: filtered.filter((t) => t.status === "completed").length,
      overdue: filtered.filter((t) => isTaskOverdue(t)).length,
    };
  }, [tasks, typeFilter]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          {/* KPI 카드 */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
              <div className="flex items-center gap-2 text-emerald-600 text-xs font-medium mb-1">
                <ArrowDownCircle className="h-3.5 w-3.5" />
                입고 대기
              </div>
              <p className="text-2xl font-bold text-emerald-700">{stats.inboundPending}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <div className="flex items-center gap-2 text-blue-600 text-xs font-medium mb-1">
                <ArrowUpCircle className="h-3.5 w-3.5" />
                출고 대기
              </div>
              <p className="text-2xl font-bold text-blue-700">{stats.outboundPending}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div className="flex items-center gap-2 text-slate-600 text-xs font-medium mb-1">
                <CheckCircle className="h-3.5 w-3.5" />
                이번 달 완료
              </div>
              <p className="text-2xl font-bold text-slate-700">{stats.completed}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 border border-red-100">
              <div className="flex items-center gap-2 text-red-600 text-xs font-medium mb-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                지연
              </div>
              <p className="text-2xl font-bold text-red-700">{stats.overdue}</p>
            </div>
          </div>

          {/* 컨트롤 영역 */}
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
              {/* 타입 필터 */}
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
                  onClick={() => setTypeFilter("inbound")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    typeFilter === "inbound"
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  입고
                </button>
                <button
                  onClick={() => setTypeFilter("outbound")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    typeFilter === "outbound"
                      ? "bg-blue-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  출고
                </button>
              </div>

              {/* 상태 필터 */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === "all"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  전체 ({filteredStats.total})
                </button>
                <button
                  onClick={() => setStatusFilter("pending")}
                  className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === "pending"
                      ? "bg-amber-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  대기 ({filteredStats.pending})
                </button>
                <button
                  onClick={() => setStatusFilter("assigned")}
                  className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === "assigned"
                      ? "bg-yellow-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  배정 ({filteredStats.assigned})
                </button>
                <button
                  onClick={() => setStatusFilter("overdue")}
                  className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === "overdue"
                      ? "bg-red-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  지연 ({filteredStats.overdue})
                </button>
                <button
                  onClick={() => setStatusFilter("completed")}
                  className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === "completed"
                      ? "bg-slate-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  완료 ({filteredStats.completed})
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="p-4">
        {/* Legend */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3 mb-4">
          <div className="flex items-center gap-6 flex-wrap">
            <span className="text-xs font-medium text-slate-600">색상 안내:</span>
            <div className="flex items-center gap-4 flex-wrap">
              {/* 타입 */}
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500"></span>
                <span className="text-xs text-slate-600">입고</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-blue-500"></span>
                <span className="text-xs text-slate-600">출고</span>
              </div>
              <div className="w-px h-4 bg-slate-200"></div>
              {/* 상태 */}
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300"></span>
                <span className="text-xs text-slate-600">입고 완료</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-blue-100 border border-blue-300"></span>
                <span className="text-xs text-slate-600">출고 완료</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-red-500"></span>
                <span className="text-xs text-slate-600">지연</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          {/* 캘린더 */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              {/* 요일 헤더 */}
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

              {/* 날짜 그리드 */}
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
                        ${isSelected ? "ring-2 ring-inset ring-blue-500" : ""}
                        ${isToday ? "bg-blue-50/50" : ""}
                        hover:bg-slate-50
                      `}
                    >
                      <span
                        className={`
                          inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full
                          ${isToday ? "bg-blue-600 text-white" : ""}
                          ${!isCurrentMonth ? "text-slate-300" : ""}
                          ${dayOfWeek === 0 && isCurrentMonth && !isToday ? "text-red-500" : ""}
                          ${dayOfWeek === 6 && isCurrentMonth && !isToday ? "text-blue-500" : ""}
                        `}
                      >
                        {date.date()}
                      </span>

                      <div className="mt-1 space-y-0.5">
                        {events.slice(0, 3).map((event) => {
                          const overdue = isTaskOverdue(event);
                          return (
                            <div
                              key={event.id}
                              className={`
                                px-1 py-0.5 text-[10px] font-medium rounded truncate
                                ${
                                  overdue
                                    ? "bg-red-500 text-white"
                                    : event.task_type === "inbound"
                                    ? event.status === "completed"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-emerald-500 text-white"
                                    : event.status === "completed"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-blue-500 text-white"
                                }
                              `}
                            >
                              {event.task_type === "inbound" ? "입" : "출"} {event.companies?.name || ""}
                            </div>
                          );
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

          {/* 사이드 패널 */}
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
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">예정된 입출고가 없습니다</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {selectedDateEvents.map((event) => {
                      const items = event.document?.content?.items || [];
                      const overdue = isTaskOverdue(event);
                      return (
                        <button
                          key={event.id}
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
                                    : event.task_type === "inbound"
                                    ? "bg-emerald-100 text-emerald-600"
                                    : "bg-blue-100 text-blue-600"
                                }
                              `}
                            >
                              {overdue ? (
                                <AlertTriangle className="w-4 h-4" />
                              ) : event.task_type === "inbound" ? (
                                <ArrowDownCircle className="w-4 h-4" />
                              ) : (
                                <ArrowUpCircle className="w-4 h-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 flex-wrap">
                                {overdue && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-red-100 text-red-700">
                                    지연
                                  </span>
                                )}
                                <span
                                  className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                                    event.task_type === "inbound"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-blue-100 text-blue-700"
                                  }`}
                                >
                                  {event.task_type === "inbound" ? "입고" : "출고"}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                                    event.status === "completed"
                                      ? "bg-slate-100 text-slate-600"
                                      : event.status === "assigned"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-amber-100 text-amber-700"
                                  }`}
                                >
                                  {event.status === "completed"
                                    ? "완료"
                                    : event.status === "assigned"
                                    ? "배정"
                                    : "대기"}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center gap-1 text-sm font-medium text-slate-800">
                                <Building2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                <span className="truncate">{event.companies?.name || "-"}</span>
                              </div>
                              <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                                <FileText className="w-3 h-3 flex-shrink-0" />
                                {event.document_number}
                              </div>
                              {event.assigned_user && (
                                <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                                  <User className="w-3 h-3 flex-shrink-0" />
                                  {event.assigned_user.name} {event.assigned_user.level}
                                </div>
                              )}

                              {items.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-slate-100">
                                  <div className="text-[10px] font-medium text-slate-500 mb-1">품목</div>
                                  <div className="space-y-1">
                                    {items.slice(0, 2).map((item, idx) => (
                                      <div key={idx} className="text-xs text-slate-600 bg-slate-50 rounded px-1.5 py-1">
                                        <span className="font-medium">{item.name}</span>
                                        <span className="text-slate-400 ml-1">x{item.quantity}</span>
                                      </div>
                                    ))}
                                    {items.length > 2 && (
                                      <div className="text-[10px] text-slate-400">+{items.length - 2}개</div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
