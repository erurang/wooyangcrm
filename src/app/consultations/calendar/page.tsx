"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Building2,
  Clock,
  Inbox,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Video,
  MessageCircle,
  MessageSquare,
  Users,
  User,
  Paperclip,
  FileText,
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import { supabase } from "@/lib/supabaseClient";
import useSWR from "swr";

dayjs.locale("ko");

interface Consultation {
  id: string;
  date: string;
  title: string | null;
  content: string;
  contact_method: string | null;
  created_at: string;
  company_id: string;
  companies?: {
    id: string;
    name: string;
  } | null;
  users?: {
    id: string;
    name: string;
    level?: string;
  } | null;
  contacts_consultations?: {
    contacts?: {
      contact_name: string;
      level?: string;
      mobile?: string;
    };
  }[];
  file_count?: number;
}

type ContactMethodFilter = "all" | "phone" | "visit" | "email" | "video" | "message" | "other";
type UserFilter = "all" | string;

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const CONTACT_METHOD_INFO: Record<string, { label: string; color: string; bgColor: string; icon: typeof Phone }> = {
  phone: { label: "전화", color: "text-blue-700", bgColor: "bg-blue-100", icon: Phone },
  전화: { label: "전화", color: "text-blue-700", bgColor: "bg-blue-100", icon: Phone },
  visit: { label: "방문", color: "text-green-700", bgColor: "bg-green-100", icon: MapPin },
  방문: { label: "방문", color: "text-green-700", bgColor: "bg-green-100", icon: MapPin },
  email: { label: "이메일", color: "text-purple-700", bgColor: "bg-purple-100", icon: Mail },
  이메일: { label: "이메일", color: "text-purple-700", bgColor: "bg-purple-100", icon: Mail },
  video: { label: "화상", color: "text-orange-700", bgColor: "bg-orange-100", icon: Video },
  화상: { label: "화상", color: "text-orange-700", bgColor: "bg-orange-100", icon: Video },
  message: { label: "메시지", color: "text-cyan-700", bgColor: "bg-cyan-100", icon: MessageCircle },
  문자: { label: "메시지", color: "text-cyan-700", bgColor: "bg-cyan-100", icon: MessageCircle },
  메시지: { label: "메시지", color: "text-cyan-700", bgColor: "bg-cyan-100", icon: MessageCircle },
};

function getContactMethodInfo(method: string | null) {
  if (!method) return { label: "기타", color: "text-slate-700", bgColor: "bg-slate-100", icon: MessageSquare };
  return CONTACT_METHOD_INFO[method.toLowerCase()] || CONTACT_METHOD_INFO[method] || { label: method, color: "text-slate-700", bgColor: "bg-slate-100", icon: MessageSquare };
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

interface RawConsultation {
  id: string;
  date: string;
  title: string | null;
  content: string;
  contact_method: string | null;
  created_at: string;
  company_id: string;
  companies?: { id: string; name: string } | { id: string; name: string }[] | null;
  users?: { id: string; name: string; level?: string } | { id: string; name: string; level?: string }[] | null;
  contacts_consultations?: { contacts?: { contact_name: string; level?: string; mobile?: string } | { contact_name: string; level?: string; mobile?: string }[] }[];
}

function normalizeConsultation(raw: RawConsultation): Consultation {
  const companies = raw.companies;
  const normalizedCompanies = Array.isArray(companies) ? companies[0] : companies || undefined;

  const users = raw.users;
  const normalizedUsers = Array.isArray(users) ? users[0] : users || undefined;

  // Normalize contacts_consultations
  const normalizedContactsConsultations = raw.contacts_consultations?.map((cc) => {
    const contacts = cc.contacts;
    const normalizedContacts = Array.isArray(contacts) ? contacts[0] : contacts || undefined;
    return { contacts: normalizedContacts };
  });

  return {
    ...raw,
    companies: normalizedCompanies,
    users: normalizedUsers,
    contacts_consultations: normalizedContactsConsultations,
  };
}

async function fetchConsultations(year: number, month: number) {
  const startDate = dayjs(`${year}-${month + 1}-01`).startOf("month").format("YYYY-MM-DD");
  const endDate = dayjs(`${year}-${month + 1}-01`).endOf("month").format("YYYY-MM-DD");

  const { data, error } = await supabase
    .from("consultations")
    .select(`
      id,
      date,
      title,
      content,
      contact_method,
      created_at,
      company_id,
      companies(id, name),
      users(id, name, level),
      contacts_consultations(contacts(contact_name, level, mobile))
    `)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (error) {
    console.error("Consultations fetch error:", error);
    return [];
  }

  // 파일 개수 조회
  const consultationIds = data?.map((c) => c.id) || [];
  let fileCounts: Record<string, number> = {};

  if (consultationIds.length > 0) {
    const { data: fileData } = await supabase
      .from("consultation_files")
      .select("consultation_id")
      .in("consultation_id", consultationIds);

    fileData?.forEach((file: { consultation_id: string }) => {
      fileCounts[file.consultation_id] = (fileCounts[file.consultation_id] || 0) + 1;
    });
  }

  return (data as unknown as RawConsultation[]).map((raw) => ({
    ...normalizeConsultation(raw),
    file_count: fileCounts[raw.id] || 0,
  }));
}

async function fetchUsers() {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, level")
    .order("name");

  if (error) {
    console.error("Users fetch error:", error);
    return [];
  }

  return data || [];
}

export default function ConsultationCalendarPage() {
  const router = useRouter();

  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [methodFilter, setMethodFilter] = useState<ContactMethodFilter>("all");
  const [userFilter, setUserFilter] = useState<UserFilter>("all");

  const year = currentDate.year();
  const month = currentDate.month();

  const { data: consultations = [], isLoading } = useSWR(
    [`consultation-calendar`, year, month],
    () => fetchConsultations(year, month),
    { revalidateOnFocus: false }
  );

  const { data: users = [] } = useSWR(
    "users-list",
    () => fetchUsers(),
    { revalidateOnFocus: false }
  );

  // Build events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, Consultation[]>();

    consultations.forEach((c) => {
      const dateKey = c.date;
      if (dateKey) {
        if (!map.has(dateKey)) map.set(dateKey, []);
        map.get(dateKey)!.push(c);
      }
    });

    return map;
  }, [consultations]);

  const getFilteredEvents = (date: dayjs.Dayjs) => {
    const dateKey = date.format("YYYY-MM-DD");
    let events = eventsByDate.get(dateKey) || [];

    // Method filter
    if (methodFilter !== "all") {
      events = events.filter((c) => {
        const method = c.contact_method?.toLowerCase() || "";
        if (methodFilter === "phone") return ["phone", "전화"].includes(method);
        if (methodFilter === "visit") return ["visit", "방문"].includes(method);
        if (methodFilter === "email") return ["email", "이메일"].includes(method);
        if (methodFilter === "video") return ["video", "화상"].includes(method);
        if (methodFilter === "message") return ["message", "문자", "메시지"].includes(method);
        if (methodFilter === "other") {
          const knownMethods = ["phone", "전화", "visit", "방문", "email", "이메일", "video", "화상", "message", "문자", "메시지"];
          return !knownMethods.includes(method);
        }
        return true;
      });
    }

    // User filter
    if (userFilter !== "all") {
      events = events.filter((c) => c.users?.id === userFilter);
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

  const handleConsultationClick = (consultation: Consultation) => {
    if (consultation.company_id) {
      router.push(`/consultations/${consultation.company_id}?highlight=${consultation.id}`);
    }
  };

  const days = getMonthDays(year, month);
  const today = dayjs().format("YYYY-MM-DD");

  const selectedDateEvents = selectedDate ? getFilteredEvents(selectedDate) : [];

  // Stats
  const stats = useMemo(() => {
    const total = consultations.length;
    const phoneCount = consultations.filter((c) => ["phone", "전화"].includes(c.contact_method?.toLowerCase() || "")).length;
    const visitCount = consultations.filter((c) => ["visit", "방문"].includes(c.contact_method?.toLowerCase() || "")).length;
    const emailCount = consultations.filter((c) => ["email", "이메일"].includes(c.contact_method?.toLowerCase() || "")).length;
    const videoCount = consultations.filter((c) => ["video", "화상"].includes(c.contact_method?.toLowerCase() || "")).length;
    const messageCount = consultations.filter((c) => ["message", "문자", "메시지"].includes(c.contact_method?.toLowerCase() || "")).length;
    const otherCount = total - phoneCount - visitCount - emailCount - videoCount - messageCount;

    return { total, phoneCount, visitCount, emailCount, videoCount, messageCount, otherCount };
  }, [consultations]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          {/* Stats */}
          <div className="grid grid-cols-7 gap-3 mb-4">
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <div className="flex items-center gap-2 text-slate-600 text-xs font-medium mb-1">
                <CalendarIcon className="h-3.5 w-3.5" />
                전체
              </div>
              <p className="text-2xl font-bold text-slate-700">{stats.total}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <div className="flex items-center gap-2 text-blue-600 text-xs font-medium mb-1">
                <Phone className="h-3.5 w-3.5" />
                전화
              </div>
              <p className="text-2xl font-bold text-blue-700">{stats.phoneCount}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-100">
              <div className="flex items-center gap-2 text-green-600 text-xs font-medium mb-1">
                <MapPin className="h-3.5 w-3.5" />
                방문
              </div>
              <p className="text-2xl font-bold text-green-700">{stats.visitCount}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
              <div className="flex items-center gap-2 text-purple-600 text-xs font-medium mb-1">
                <Mail className="h-3.5 w-3.5" />
                이메일
              </div>
              <p className="text-2xl font-bold text-purple-700">{stats.emailCount}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
              <div className="flex items-center gap-2 text-orange-600 text-xs font-medium mb-1">
                <Video className="h-3.5 w-3.5" />
                화상
              </div>
              <p className="text-2xl font-bold text-orange-700">{stats.videoCount}</p>
            </div>
            <div className="bg-cyan-50 rounded-lg p-3 border border-cyan-100">
              <div className="flex items-center gap-2 text-cyan-600 text-xs font-medium mb-1">
                <MessageCircle className="h-3.5 w-3.5" />
                메시지
              </div>
              <p className="text-2xl font-bold text-cyan-700">{stats.messageCount}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 text-gray-600 text-xs font-medium mb-1">
                <MessageSquare className="h-3.5 w-3.5" />
                기타
              </div>
              <p className="text-2xl font-bold text-gray-700">{stats.otherCount}</p>
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
              {/* Method filter */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setMethodFilter("all")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    methodFilter === "all"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => setMethodFilter("phone")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    methodFilter === "phone"
                      ? "bg-blue-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  전화
                </button>
                <button
                  onClick={() => setMethodFilter("visit")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    methodFilter === "visit"
                      ? "bg-green-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  방문
                </button>
                <button
                  onClick={() => setMethodFilter("email")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    methodFilter === "email"
                      ? "bg-purple-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  이메일
                </button>
                <button
                  onClick={() => setMethodFilter("video")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    methodFilter === "video"
                      ? "bg-orange-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  화상
                </button>
                <button
                  onClick={() => setMethodFilter("message")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    methodFilter === "message"
                      ? "bg-cyan-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  메시지
                </button>
              </div>

              {/* User filter */}
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="all">담당자 전체</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {/* Legend */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3 mb-4">
          <div className="flex items-center gap-6 flex-wrap">
            <span className="text-xs font-medium text-slate-600">색상 안내:</span>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-blue-500"></span>
                <span className="text-xs text-slate-600">전화</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-green-500"></span>
                <span className="text-xs text-slate-600">방문</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-purple-500"></span>
                <span className="text-xs text-slate-600">이메일</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-orange-500"></span>
                <span className="text-xs text-slate-600">화상</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-cyan-500"></span>
                <span className="text-xs text-slate-600">메시지</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-400"></span>
                <span className="text-xs text-slate-600">기타</span>
              </div>
            </div>
          </div>
        </div>

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
              {isLoading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="animate-pulse text-slate-400">로딩 중...</div>
                </div>
              ) : (
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
                          ${isSelected ? "ring-2 ring-inset ring-cyan-500" : ""}
                          ${isToday ? "bg-cyan-50/50" : ""}
                          hover:bg-slate-50
                        `}
                      >
                        <span
                          className={`
                            inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full
                            ${isToday ? "bg-cyan-600 text-white" : ""}
                            ${!isCurrentMonth ? "text-slate-300" : ""}
                            ${dayOfWeek === 0 && isCurrentMonth && !isToday ? "text-red-500" : ""}
                            ${dayOfWeek === 6 && isCurrentMonth && !isToday ? "text-blue-500" : ""}
                          `}
                        >
                          {date.date()}
                        </span>

                        <div className="mt-1 space-y-0.5">
                          {events.slice(0, 3).map((c) => {
                            const methodInfo = getContactMethodInfo(c.contact_method);
                            const colorClass =
                              ["phone", "전화"].includes(c.contact_method?.toLowerCase() || "") ? "bg-blue-500 text-white" :
                              ["visit", "방문"].includes(c.contact_method?.toLowerCase() || "") ? "bg-green-500 text-white" :
                              ["email", "이메일"].includes(c.contact_method?.toLowerCase() || "") ? "bg-purple-500 text-white" :
                              ["video", "화상"].includes(c.contact_method?.toLowerCase() || "") ? "bg-orange-500 text-white" :
                              ["message", "문자", "메시지"].includes(c.contact_method?.toLowerCase() || "") ? "bg-cyan-500 text-white" :
                              "bg-slate-400 text-white";

                            return (
                              <div
                                key={c.id}
                                className={`
                                  px-1 py-0.5 text-[10px] font-medium rounded truncate
                                  ${colorClass}
                                `}
                                title={`${methodInfo.label} - ${c.companies?.name || "미지정"}`}
                              >
                                {methodInfo.label.charAt(0)} {c.companies?.name || "미지정"}
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
              )}
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
                    {selectedDateEvents.length}건의 상담
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
                    <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">해당 날짜에 상담이 없습니다</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {selectedDateEvents.map((c) => {
                      const methodInfo = getContactMethodInfo(c.contact_method);
                      const MethodIcon = methodInfo.icon;
                      const contactInfo = c.contacts_consultations?.[0]?.contacts;

                      return (
                        <button
                          key={c.id}
                          onClick={() => handleConsultationClick(c)}
                          className="w-full p-3 text-left hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-start gap-2.5">
                            <div
                              className={`p-1.5 rounded-lg flex-shrink-0 ${methodInfo.bgColor}`}
                            >
                              <MethodIcon className={`w-4 h-4 ${methodInfo.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${methodInfo.bgColor} ${methodInfo.color}`}>
                                  {methodInfo.label}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center gap-1 text-sm font-medium text-slate-800">
                                <Building2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                <span className="truncate">
                                  {c.companies?.name || "미지정 거래처"}
                                </span>
                              </div>
                              {contactInfo && (
                                <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                                  <User className="w-3 h-3 flex-shrink-0" />
                                  {contactInfo.contact_name}
                                  {contactInfo.level && ` ${contactInfo.level}`}
                                </div>
                              )}

                              <div className="mt-1.5 text-xs text-slate-600 line-clamp-2">
                                {c.content}
                              </div>

                              <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  <span>{c.users?.name || "미지정"}</span>
                                </div>
                                {c.file_count && c.file_count > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Paperclip className="w-3 h-3" />
                                    <span>{c.file_count}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{dayjs(c.created_at).format("HH:mm")}</span>
                                </div>
                              </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
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
