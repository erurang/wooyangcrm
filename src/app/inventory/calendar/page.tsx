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
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import { useLoginUser } from "@/context/login";
import { useUsersList } from "@/hooks/useUserList";
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

// 지연 여부 확인 함수
function isTaskOverdue(task: InventoryTask): boolean {
  if (task.status === "completed" || task.status === "canceled") return false;
  if (!task.expected_date) return false;
  const today = dayjs().startOf("day");
  const expectedDate = dayjs(task.expected_date).startOf("day");
  return expectedDate.isBefore(today);
}

// 월의 날짜 배열 생성
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

// API 호출 - 해당 월의 작업만 가져오기 (document_number 기준: WY-YYYYMMDD-XXXX)
async function fetchInventoryTasks(year: number, month: number) {
  // document_number 형식: WY-YYYYMMDD-XXXX
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
  const loginUser = useLoginUser();
  const { users } = useUsersList();

  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | "inbound" | "outbound">(
    "all"
  );
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "assigned" | "overdue" | "completed"
  >("all");

  const year = currentDate.year();
  const month = currentDate.month();

  // 데이터 조회
  const { data: tasks = [], isLoading } = useSWR(
    [`inventory-calendar`, year, month],
    () => fetchInventoryTasks(year, month),
    { revalidateOnFocus: false }
  );

  // document_number에서 날짜 추출 (WY-YYYYMMDD-XXXX 형식)
  const getDateFromDocumentNumber = (docNum: string): string | null => {
    const match = docNum.match(/WY-(\d{4})(\d{2})(\d{2})/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return null;
  };

  // 날짜별 이벤트 그룹화
  const eventsByDate = useMemo(() => {
    const map = new Map<string, InventoryTask[]>();

    tasks.forEach((task) => {
      // expected_date 우선, 없으면 document_number에서 날짜 추출
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

  // 필터링된 이벤트
  const getFilteredEvents = (date: dayjs.Dayjs) => {
    const dateKey = date.format("YYYY-MM-DD");
    let events = eventsByDate.get(dateKey) || [];

    // task_type 필터
    if (typeFilter !== "all") {
      events = events.filter((e) => e.task_type === typeFilter);
    }

    // status 필터
    if (statusFilter === "overdue") {
      events = events.filter((e) => isTaskOverdue(e));
    } else if (statusFilter !== "all") {
      events = events.filter((e) => e.status === statusFilter);
    }

    return events;
  };

  // 월 이동
  const goToPrevMonth = () => setCurrentDate(currentDate.subtract(1, "month"));
  const goToNextMonth = () => setCurrentDate(currentDate.add(1, "month"));
  const goToToday = () => {
    setCurrentDate(dayjs());
    setSelectedDate(dayjs());
  };

  // 날짜 클릭
  const handleDateClick = (date: dayjs.Dayjs) => {
    setSelectedDate(date);
  };

  // 이벤트 클릭 - 해당 페이지로 이동
  const handleEventClick = (task: InventoryTask) => {
    const page =
      task.task_type === "inbound"
        ? "/inventory/inbound"
        : "/inventory/outbound";
    router.push(`${page}?highlight=${task.id}`);
  };

  const days = getMonthDays(year, month);
  const today = dayjs().format("YYYY-MM-DD");

  // 선택된 날짜의 이벤트
  const selectedDateEvents = selectedDate
    ? getFilteredEvents(selectedDate)
    : [];

  // 필터된 태스크 (typeFilter 적용)
  const filteredTasks = useMemo(() => {
    if (typeFilter === "all") return tasks;
    return tasks.filter((t) => t.task_type === typeFilter);
  }, [tasks, typeFilter]);

  // 통계 (typeFilter 적용된 데이터 기준)
  const monthStats = useMemo(() => {
    const total = filteredTasks.length;
    const pending = filteredTasks.filter((t) => t.status === "pending").length;
    const assigned = filteredTasks.filter(
      (t) => t.status === "assigned"
    ).length;
    const completed = filteredTasks.filter(
      (t) => t.status === "completed"
    ).length;
    const canceled = filteredTasks.filter(
      (t) => t.status === "canceled"
    ).length;
    const overdue = filteredTasks.filter((t) => isTaskOverdue(t)).length;
    // 헤더 통계용 (전체 태스크 기준)
    const inboundPending = tasks.filter(
      (t) =>
        t.task_type === "inbound" &&
        t.status !== "completed" &&
        t.status !== "canceled"
    ).length;
    const outboundPending = tasks.filter(
      (t) =>
        t.task_type === "outbound" &&
        t.status !== "completed" &&
        t.status !== "canceled"
    ).length;
    const allCompleted = tasks.filter((t) => t.status === "completed").length;
    const allOverdue = tasks.filter((t) => isTaskOverdue(t)).length;
    return {
      total,
      pending,
      assigned,
      completed,
      canceled,
      overdue,
      inboundPending,
      outboundPending,
      allCompleted,
      allOverdue,
    };
  }, [filteredTasks, tasks]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto px-2 py-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 캘린더 */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              {/* 캘린더 헤더 */}
              <div className="px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={goToPrevMonth}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <h2 className="text-xl font-bold text-gray-900">
                      {currentDate.format("YYYY년 M월")}
                    </h2>
                    <button
                      onClick={goToNextMonth}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={goToToday}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      오늘
                    </button>

                    {/* 상태 필터 */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setStatusFilter("all")}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          statusFilter === "all"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        전체 ({monthStats.total})
                      </button>
                      <button
                        onClick={() => setStatusFilter("pending")}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          statusFilter === "pending"
                            ? "bg-orange-500 text-white shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        대기 ({monthStats.pending})
                      </button>
                      <button
                        onClick={() => setStatusFilter("assigned")}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          statusFilter === "assigned"
                            ? "bg-yellow-500 text-white shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        배정 ({monthStats.assigned})
                      </button>
                      <button
                        onClick={() => setStatusFilter("overdue")}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          statusFilter === "overdue"
                            ? "bg-red-500 text-white shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        지연 ({monthStats.overdue})
                      </button>
                      <button
                        onClick={() => setStatusFilter("completed")}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          statusFilter === "completed"
                            ? "bg-gray-500 text-white shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        완료 ({monthStats.completed})
                      </button>
                    </div>

                    {/* 타입 필터 */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setTypeFilter("all")}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          typeFilter === "all"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        전체
                      </button>
                      <button
                        onClick={() => setTypeFilter("inbound")}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          typeFilter === "inbound"
                            ? "bg-green-500 text-white shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        입고
                      </button>
                      <button
                        onClick={() => setTypeFilter("outbound")}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          typeFilter === "outbound"
                            ? "bg-blue-500 text-white shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        출고
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 border-b">
                {WEEKDAYS.map((day, i) => (
                  <div
                    key={day}
                    className={`py-3 text-center text-sm font-medium ${
                      i === 0
                        ? "text-red-500"
                        : i === 6
                        ? "text-blue-500"
                        : "text-gray-600"
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* 날짜 그리드 */}
              <div className="grid grid-cols-7">
                {days.map((date, i) => {
                  const dateKey = date.format("YYYY-MM-DD");
                  const isToday = dateKey === today;
                  const isCurrentMonth = date.month() === month;
                  const isSelected =
                    selectedDate?.format("YYYY-MM-DD") === dateKey;
                  const events = getFilteredEvents(date);
                  const dayOfWeek = date.day();

                  return (
                    <button
                      key={dateKey}
                      onClick={() => handleDateClick(date)}
                      className={`
                        min-h-[120px] p-2 border-b border-r text-left transition-colors relative
                        ${isCurrentMonth ? "bg-white" : "bg-gray-50"}
                        ${isSelected ? "ring-2 ring-inset ring-blue-500" : ""}
                        ${isToday ? "bg-blue-50" : ""}
                        hover:bg-gray-50
                      `}
                    >
                      <span
                        className={`
                          inline-flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full
                          ${isToday ? "bg-blue-600 text-white" : ""}
                          ${!isCurrentMonth ? "text-gray-400" : ""}
                          ${
                            dayOfWeek === 0 && isCurrentMonth
                              ? "text-red-500"
                              : ""
                          }
                          ${
                            dayOfWeek === 6 && isCurrentMonth
                              ? "text-blue-500"
                              : ""
                          }
                        `}
                      >
                        {date.date()}
                      </span>

                      {/* 이벤트 표시 - 클릭 시 날짜 선택 (사이드 패널에서 상세 확인) */}
                      <div className="mt-1 space-y-1">
                        {events.slice(0, 3).map((event) => {
                          const overdue = isTaskOverdue(event);
                          return (
                            <div
                              key={event.id}
                              className={`
                                px-1.5 py-0.5 text-xs font-medium rounded truncate
                                ${
                                  overdue
                                    ? "bg-red-500 text-white"
                                    : event.task_type === "inbound"
                                    ? event.status === "completed"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-green-500 text-white"
                                    : event.status === "completed"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-blue-500 text-white"
                                }
                              `}
                            >
                              {overdue && "⚠ "}
                              {event.task_type === "inbound" ? "입" : "출"}{" "}
                              {event.companies?.name || ""}
                            </div>
                          );
                        })}
                        {events.length > 3 && (
                          <div className="text-xs text-gray-500 pl-1">
                            +{events.length - 3}개 더
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 사이드 패널 - 선택된 날짜의 상세 */}
          <div className="lg:w-[420px] flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden sticky top-24">
              <div className="px-4 py-3 border-b bg-gradient-to-r from-gray-50 to-white">
                <h3 className="font-semibold text-gray-900">
                  {selectedDate
                    ? selectedDate.format("M월 D일 (ddd)")
                    : "날짜를 선택하세요"}
                </h3>
                {selectedDate && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    {selectedDateEvents.length}건의 일정
                  </p>
                )}
              </div>

              <div className="max-h-[600px] overflow-y-auto">
                {!selectedDate ? (
                  <div className="p-8 text-center text-gray-400">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>
                      캘린더에서 날짜를 클릭하면
                      <br />
                      일정을 확인할 수 있습니다
                    </p>
                  </div>
                ) : selectedDateEvents.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>
                      이 날짜에는 예정된
                      <br />
                      입출고가 없습니다
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {selectedDateEvents.map((event) => {
                      const items = event.document?.content?.items || [];
                      const overdue = isTaskOverdue(event);
                      return (
                        <button
                          key={event.id}
                          onClick={() => handleEventClick(event)}
                          className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                            overdue ? "bg-red-50" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`
                                p-2 rounded-lg flex-shrink-0
                                ${
                                  overdue
                                    ? "bg-red-100 text-red-600"
                                    : event.task_type === "inbound"
                                    ? "bg-green-100 text-green-600"
                                    : "bg-blue-100 text-blue-600"
                                }
                              `}
                            >
                              {overdue ? (
                                <AlertTriangle className="w-5 h-5" />
                              ) : event.task_type === "inbound" ? (
                                <ArrowDownCircle className="w-5 h-5" />
                              ) : (
                                <ArrowUpCircle className="w-5 h-5" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {overdue && (
                                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-red-100 text-red-700">
                                    지연
                                  </span>
                                )}
                                <span
                                  className={`
                                    px-2 py-0.5 text-xs font-medium rounded
                                    ${
                                      event.task_type === "inbound"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-blue-100 text-blue-700"
                                    }
                                  `}
                                >
                                  {event.task_type === "inbound"
                                    ? "입고"
                                    : "출고"}
                                </span>
                                <span
                                  className={`
                                    px-2 py-0.5 text-xs font-medium rounded
                                    ${
                                      event.status === "completed"
                                        ? "bg-gray-100 text-gray-600"
                                        : event.status === "assigned"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-orange-100 text-orange-700"
                                    }
                                  `}
                                >
                                  {event.status === "completed"
                                    ? "완료"
                                    : event.status === "assigned"
                                    ? "배정됨"
                                    : "대기"}
                                </span>
                              </div>
                              <div className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-900">
                                <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <span className="truncate">
                                  {event.companies?.name || "-"}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                                <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                                {event.document_number}
                              </div>
                              {event.assigned_user && (
                                <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                                  <User className="w-3.5 h-3.5 flex-shrink-0" />
                                  {event.assigned_user.name}{" "}
                                  {event.assigned_user.level}
                                </div>
                              )}

                              {/* 품목 정보 */}
                              {items.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-100">
                                  <div className="text-xs font-medium text-gray-600 mb-1">
                                    품목 정보
                                  </div>
                                  <div className="space-y-1">
                                    {items.slice(0, 3).map((item, idx) => (
                                      <div
                                        key={idx}
                                        className="text-xs text-gray-700 bg-gray-50 rounded px-2 py-1"
                                      >
                                        <div className="font-medium truncate">
                                          {item.name}
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-500 mt-0.5">
                                          {item.spec && (
                                            <span>규격: {item.spec}</span>
                                          )}
                                          <span>
                                            수량: {item.quantity}
                                            {item.unit || "개"}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                    {items.length > 3 && (
                                      <div className="text-xs text-gray-400 pl-2">
                                        +{items.length - 3}개 품목 더보기
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
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
