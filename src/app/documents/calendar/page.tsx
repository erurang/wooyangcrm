"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  Building2,
  AlertTriangle,
  Clock,
  CheckCircle,
  Inbox,
  ExternalLink,
  FileQuestion,
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import { supabase } from "@/lib/supabaseClient";
import useSWR from "swr";

dayjs.locale("ko");

interface Document {
  id: string;
  document_number: string;
  type: "estimate" | "order" | "requestQuote";
  status: string;
  created_at: string;
  valid_until?: string; // 견적서 유효기간
  delivery_date?: string; // 발주서 납기일
  company_id: string;
  content?: {
    company_name?: string;
    total_amount?: number;
    items?: Array<{ name: string; quantity: number }>;
  };
  companies?: {
    name: string;
  };
}

type DocumentType = "all" | "estimate" | "order" | "requestQuote";
type StatusFilter = "all" | "upcoming" | "expired" | "today" | "completed";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const DOC_TYPE_LABELS: Record<string, { label: string; color: string; bgColor: string }> = {
  estimate: { label: "견적", color: "text-green-700", bgColor: "bg-green-100" },
  order: { label: "발주", color: "text-purple-700", bgColor: "bg-purple-100" },
  requestQuote: { label: "의뢰", color: "text-orange-700", bgColor: "bg-orange-100" },
};

function getDaysRemaining(dateStr: string | undefined): number | null {
  if (!dateStr) return null;
  const today = dayjs().startOf("day");
  const target = dayjs(dateStr).startOf("day");
  return target.diff(today, "day");
}

function isDocumentExpired(doc: Document): boolean {
  const targetDate = doc.type === "estimate" ? doc.valid_until : doc.delivery_date;
  const days = getDaysRemaining(targetDate);
  return days !== null && days < 0;
}

function isDocumentToday(doc: Document): boolean {
  const targetDate = doc.type === "estimate" ? doc.valid_until : doc.delivery_date;
  const days = getDaysRemaining(targetDate);
  return days === 0;
}

function isDocumentUpcoming(doc: Document): boolean {
  const targetDate = doc.type === "estimate" ? doc.valid_until : doc.delivery_date;
  const days = getDaysRemaining(targetDate);
  return days !== null && days > 0 && days <= 7;
}

function isDocumentCompleted(doc: Document): boolean {
  return doc.status === "completed";
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

function formatAmount(amount: number | undefined) {
  if (!amount) return "-";
  if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}억`;
  if (amount >= 10000) return `${Math.floor(amount / 10000)}만`;
  return amount.toLocaleString();
}

interface RawDocument {
  id: string;
  document_number: string;
  type: string;
  status: string;
  created_at: string;
  valid_until?: string;
  delivery_date?: string;
  company_id: string;
  content?: unknown;
  companies?: { name: string } | { name: string }[] | null;
}

function normalizeDocument(raw: RawDocument): Document {
  const companies = raw.companies;
  const normalizedCompanies = Array.isArray(companies)
    ? companies[0]
    : companies || undefined;

  return {
    id: raw.id,
    document_number: raw.document_number,
    type: raw.type as Document["type"],
    status: raw.status,
    created_at: raw.created_at,
    valid_until: raw.valid_until,
    delivery_date: raw.delivery_date,
    company_id: raw.company_id,
    content: raw.content as Document["content"],
    companies: normalizedCompanies,
  };
}

async function fetchDocuments(year: number, month: number) {
  const startDate = dayjs(`${year}-${month + 1}-01`).startOf("month").format("YYYY-MM-DD");
  const endDate = dayjs(`${year}-${month + 1}-01`).endOf("month").format("YYYY-MM-DD");

  // Fetch estimates with valid_until in this month
  const { data: estimates, error: estError } = await supabase
    .from("documents")
    .select(`
      id,
      document_number,
      type,
      status,
      created_at,
      valid_until,
      company_id,
      content,
      companies(name)
    `)
    .eq("type", "estimate")
    .gte("valid_until", startDate)
    .lte("valid_until", endDate)
    .order("valid_until", { ascending: true });

  if (estError) console.error("Estimates fetch error:", estError);

  // Fetch orders with delivery_date in this month
  const { data: orders, error: ordError } = await supabase
    .from("documents")
    .select(`
      id,
      document_number,
      type,
      status,
      created_at,
      delivery_date,
      company_id,
      content,
      companies(name)
    `)
    .eq("type", "order")
    .gte("delivery_date", startDate)
    .lte("delivery_date", endDate)
    .order("delivery_date", { ascending: true });

  if (ordError) console.error("Orders fetch error:", ordError);

  // Fetch requestQuotes - use created_at as reference date
  const { data: requests, error: reqError } = await supabase
    .from("documents")
    .select(`
      id,
      document_number,
      type,
      status,
      created_at,
      company_id,
      content,
      companies(name)
    `)
    .eq("type", "requestQuote")
    .gte("created_at", startDate)
    .lte("created_at", endDate + "T23:59:59")
    .order("created_at", { ascending: true });

  if (reqError) console.error("Requests fetch error:", reqError);

  const rawDocs = [
    ...(estimates || []),
    ...(orders || []),
    ...(requests || []),
  ] as RawDocument[];

  return rawDocs.map(normalizeDocument);
}

export default function DocumentCalendarPage() {
  const router = useRouter();

  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [typeFilter, setTypeFilter] = useState<DocumentType>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const year = currentDate.year();
  const month = currentDate.month();

  const { data: documents = [], isLoading } = useSWR(
    [`document-calendar`, year, month],
    () => fetchDocuments(year, month),
    { revalidateOnFocus: false }
  );

  // Build events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, Document[]>();

    documents.forEach((doc) => {
      let dateKey: string | null = null;

      if (doc.type === "estimate" && doc.valid_until) {
        dateKey = dayjs(doc.valid_until).format("YYYY-MM-DD");
      } else if (doc.type === "order" && doc.delivery_date) {
        dateKey = dayjs(doc.delivery_date).format("YYYY-MM-DD");
      } else if (doc.type === "requestQuote" && doc.created_at) {
        dateKey = dayjs(doc.created_at).format("YYYY-MM-DD");
      }

      if (dateKey) {
        if (!map.has(dateKey)) map.set(dateKey, []);
        map.get(dateKey)!.push(doc);
      }
    });

    return map;
  }, [documents]);

  const getFilteredEvents = (date: dayjs.Dayjs) => {
    const dateKey = date.format("YYYY-MM-DD");
    let events = eventsByDate.get(dateKey) || [];

    // Type filter
    if (typeFilter !== "all") {
      events = events.filter((e) => e.type === typeFilter);
    }

    // Status filter
    if (statusFilter === "expired") {
      events = events.filter((e) => isDocumentExpired(e));
    } else if (statusFilter === "today") {
      events = events.filter((e) => isDocumentToday(e));
    } else if (statusFilter === "upcoming") {
      events = events.filter((e) => isDocumentUpcoming(e));
    } else if (statusFilter === "completed") {
      events = events.filter((e) => isDocumentCompleted(e));
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

  const handleDocumentClick = (doc: Document) => {
    router.push(`/documents/review?highlight=${doc.id}`);
  };

  const days = getMonthDays(year, month);
  const today = dayjs().format("YYYY-MM-DD");

  const selectedDateEvents = selectedDate ? getFilteredEvents(selectedDate) : [];

  // Stats
  const stats = useMemo(() => {
    const estimateCount = documents.filter((d) => d.type === "estimate").length;
    const orderCount = documents.filter((d) => d.type === "order").length;
    const requestCount = documents.filter((d) => d.type === "requestQuote").length;
    const expiredCount = documents.filter((d) => isDocumentExpired(d) && !isDocumentCompleted(d)).length;
    const upcomingCount = documents.filter((d) => isDocumentUpcoming(d) && !isDocumentCompleted(d)).length;
    const todayCount = documents.filter((d) => isDocumentToday(d) && !isDocumentCompleted(d)).length;
    const completedCount = documents.filter((d) => isDocumentCompleted(d)).length;

    return { estimateCount, orderCount, requestCount, expiredCount, upcomingCount, todayCount, completedCount };
  }, [documents]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white border-b border-slate-200 sticky top-0 z-10"
      >
        <div className="px-4 py-3">
          {/* Stats */}
          <div className="grid grid-cols-7 gap-3 mb-4">
            <div className="bg-green-50 rounded-lg p-3 border border-green-100">
              <div className="flex items-center gap-2 text-green-600 text-xs font-medium mb-1">
                <TrendingUp className="h-3.5 w-3.5" />
                견적서
              </div>
              <p className="text-2xl font-bold text-green-700">{stats.estimateCount}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
              <div className="flex items-center gap-2 text-purple-600 text-xs font-medium mb-1">
                <TrendingDown className="h-3.5 w-3.5" />
                발주서
              </div>
              <p className="text-2xl font-bold text-purple-700">{stats.orderCount}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
              <div className="flex items-center gap-2 text-orange-600 text-xs font-medium mb-1">
                <FileQuestion className="h-3.5 w-3.5" />
                의뢰서
              </div>
              <p className="text-2xl font-bold text-orange-700">{stats.requestCount}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
              <div className="flex items-center gap-2 text-amber-600 text-xs font-medium mb-1">
                <Clock className="h-3.5 w-3.5" />
                임박 (7일내)
              </div>
              <p className="text-2xl font-bold text-amber-700">{stats.upcomingCount}</p>
            </div>
            <div className="bg-sky-50 rounded-lg p-3 border border-sky-100">
              <div className="flex items-center gap-2 text-sky-600 text-xs font-medium mb-1">
                <CalendarIcon className="h-3.5 w-3.5" />
                오늘
              </div>
              <p className="text-2xl font-bold text-sky-700">{stats.todayCount}</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
              <div className="flex items-center gap-2 text-emerald-600 text-xs font-medium mb-1">
                <CheckCircle className="h-3.5 w-3.5" />
                완료
              </div>
              <p className="text-2xl font-bold text-emerald-700">{stats.completedCount}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 border border-red-100">
              <div className="flex items-center gap-2 text-red-600 text-xs font-medium mb-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                만료
              </div>
              <p className="text-2xl font-bold text-red-700">{stats.expiredCount}</p>
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
                  onClick={() => setTypeFilter("estimate")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    typeFilter === "estimate"
                      ? "bg-green-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  견적서
                </button>
                <button
                  onClick={() => setTypeFilter("order")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    typeFilter === "order"
                      ? "bg-purple-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  발주서
                </button>
                <button
                  onClick={() => setTypeFilter("requestQuote")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    typeFilter === "requestQuote"
                      ? "bg-orange-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  의뢰서
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
                  onClick={() => setStatusFilter("upcoming")}
                  className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === "upcoming"
                      ? "bg-amber-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  임박
                </button>
                <button
                  onClick={() => setStatusFilter("today")}
                  className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === "today"
                      ? "bg-sky-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  오늘
                </button>
                <button
                  onClick={() => setStatusFilter("expired")}
                  className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === "expired"
                      ? "bg-red-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  만료
                </button>
                <button
                  onClick={() => setStatusFilter("completed")}
                  className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === "completed"
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  완료
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="p-4">
        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-lg border border-slate-200 shadow-sm p-3 mb-4"
        >
          <div className="flex items-center gap-6 flex-wrap">
            <span className="text-xs font-medium text-slate-600">색상 안내:</span>
            <div className="flex items-center gap-4 flex-wrap">
              {/* 문서 타입 */}
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-green-500"></span>
                <span className="text-xs text-slate-600">견적서 (유효기간)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-purple-500"></span>
                <span className="text-xs text-slate-600">발주서 (납기일)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-orange-500"></span>
                <span className="text-xs text-slate-600">의뢰서 (작성일)</span>
              </div>
              <div className="w-px h-4 bg-slate-200"></div>
              {/* 상태 */}
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-sky-500"></span>
                <span className="text-xs text-slate-600">오늘 기한</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-red-500"></span>
                <span className="text-xs text-slate-600">만료됨</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-400"></span>
                <span className="text-xs text-slate-600">완료됨</span>
              </div>
            </div>
          </div>
        </motion.div>

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
                      i === 0 ? "text-red-500" : i === 6 ? "text-sky-500" : "text-slate-600"
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
                        ${isSelected ? "ring-2 ring-inset ring-sky-500" : ""}
                        ${isToday ? "bg-sky-50/50" : ""}
                        hover:bg-slate-50
                      `}
                    >
                      <span
                        className={`
                          inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full
                          ${isToday ? "bg-sky-600 text-white" : ""}
                          ${!isCurrentMonth ? "text-slate-300" : ""}
                          ${dayOfWeek === 0 && isCurrentMonth && !isToday ? "text-red-500" : ""}
                          ${dayOfWeek === 6 && isCurrentMonth && !isToday ? "text-sky-500" : ""}
                        `}
                      >
                        {date.date()}
                      </span>

                      <div className="mt-1 space-y-0.5">
                        {events.slice(0, 3).map((doc) => {
                          const expired = isDocumentExpired(doc);
                          const isDocToday = isDocumentToday(doc);
                          const completed = isDocumentCompleted(doc);
                          const typeInfo = DOC_TYPE_LABELS[doc.type] || {
                            label: "문서",
                            color: "text-slate-700",
                            bgColor: "bg-slate-100",
                          };

                          // 완료된 문서는 연한 색상 + 테두리로 표시
                          const colorStyle = completed
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                            : expired
                            ? "bg-red-500 text-white"
                            : isDocToday
                            ? "bg-sky-500 text-white"
                            : doc.type === "estimate"
                            ? "bg-green-500 text-white"
                            : doc.type === "order"
                            ? "bg-purple-500 text-white"
                            : "bg-orange-500 text-white";

                          return (
                            <div
                              key={doc.id}
                              className={`
                                px-1 py-0.5 text-[10px] font-medium rounded truncate
                                ${colorStyle}
                              `}
                              title={`${typeInfo.label} - ${doc.companies?.name || doc.content?.company_name}`}
                            >
                              {typeInfo.label.charAt(0)} {doc.companies?.name || doc.content?.company_name || ""}
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
                    {selectedDateEvents.length}건의 문서
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
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">해당 날짜에 문서가 없습니다</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {selectedDateEvents.map((doc, index) => {
                      const expired = isDocumentExpired(doc);
                      const isDocToday = isDocumentToday(doc);
                      const completed = isDocumentCompleted(doc);
                      const typeInfo = DOC_TYPE_LABELS[doc.type] || {
                        label: "문서",
                        color: "text-slate-700",
                        bgColor: "bg-slate-100",
                      };
                      const targetDate =
                        doc.type === "estimate"
                          ? doc.valid_until
                          : doc.type === "order"
                          ? doc.delivery_date
                          : doc.created_at;
                      const dateLabel =
                        doc.type === "estimate"
                          ? "유효기간"
                          : doc.type === "order"
                          ? "납기일"
                          : "작성일";
                      const daysRemaining = getDaysRemaining(targetDate);

                      return (
                        <motion.button
                          key={doc.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleDocumentClick(doc)}
                          className={`w-full p-3 text-left hover:bg-slate-50 transition-colors ${
                            completed ? "bg-emerald-50/50" : expired ? "bg-red-50/50" : isDocToday ? "bg-sky-50/50" : ""
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div
                              className={`
                                p-1.5 rounded-lg flex-shrink-0
                                ${
                                  completed
                                    ? "bg-emerald-100 text-emerald-600"
                                    : expired
                                    ? "bg-red-100 text-red-600"
                                    : isDocToday
                                    ? "bg-sky-100 text-sky-600"
                                    : doc.type === "estimate"
                                    ? "bg-green-100 text-green-600"
                                    : doc.type === "order"
                                    ? "bg-purple-100 text-purple-600"
                                    : "bg-orange-100 text-orange-600"
                                }
                              `}
                            >
                              {completed ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : expired ? (
                                <AlertTriangle className="w-4 h-4" />
                              ) : doc.type === "estimate" ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : doc.type === "order" ? (
                                <TrendingDown className="w-4 h-4" />
                              ) : (
                                <FileQuestion className="w-4 h-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${typeInfo.bgColor} ${typeInfo.color}`}>
                                  {typeInfo.label}
                                </span>
                                {completed && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-100 text-emerald-700">
                                    완료
                                  </span>
                                )}
                                {expired && !completed && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-red-100 text-red-700">
                                    만료
                                  </span>
                                )}
                                {isDocToday && !completed && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-sky-100 text-sky-700">
                                    D-Day
                                  </span>
                                )}
                                {daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 3 && !completed && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-100 text-amber-700">
                                    D-{daysRemaining}
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 flex items-center gap-1 text-sm font-medium text-slate-800">
                                <Building2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                <span className="truncate">
                                  {doc.companies?.name || doc.content?.company_name || "-"}
                                </span>
                              </div>
                              <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                                <FileText className="w-3 h-3 flex-shrink-0" />
                                {doc.document_number}
                              </div>
                              <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                                <span>
                                  {dateLabel}: {targetDate ? dayjs(targetDate).format("YYYY.MM.DD") : "-"}
                                </span>
                                {doc.content?.total_amount && (
                                  <span className="text-sky-600 font-medium">
                                    {formatAmount(doc.content.total_amount)}원
                                  </span>
                                )}
                              </div>

                              {doc.content?.items && doc.content.items.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-slate-100">
                                  <div className="text-[10px] font-medium text-slate-500 mb-1">품목</div>
                                  <div className="space-y-1">
                                    {doc.content.items.slice(0, 2).map((item, idx) => (
                                      <div key={idx} className="text-xs text-slate-600 bg-slate-50 rounded px-1.5 py-1">
                                        <span className="font-medium">{item.name}</span>
                                        <span className="text-slate-400 ml-1">x{item.quantity}</span>
                                      </div>
                                    ))}
                                    {doc.content.items.length > 2 && (
                                      <div className="text-[10px] text-slate-400">
                                        +{doc.content.items.length - 2}개
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            <ExternalLink className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
                          </div>
                        </motion.button>
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
