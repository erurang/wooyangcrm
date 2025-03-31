"use client";

import { useEffect, useRef, useState } from "react";
import "@toast-ui/calendar/dist/toastui-calendar.min.css";
import { AlertColor } from "@mui/material";
import SnackbarComponent from "@/components/Snackbar";
import { useLoginUser } from "@/context/login";
import { supabase } from "@/lib/supabaseClient";

// 1. 타입 정의
interface UserInfo {
  name: string;
  level: string;
}

interface ConsultData {
  id: number;
  user_id: string;
  content: string; // 상담 내용
  date: string; // 상담 날짜 → start_date
  follow_up_date: string | null; // 후속 날짜 (nullable)
  users: UserInfo;
  companies: { name: string };
}

interface ConsultEvent {
  id: string;
  user_id: string;
  title: string;
  start: string;
  end: string;
  userInfo: UserInfo;
  rawData?: any;
}

// 2. KST 변환 함수 (날짜만 사용하므로 로컬 자정으로 설정)
function convertToKST(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  // "YYYY-MM-DD" 형식의 날짜를 로컬 자정으로 처리
  const [year, month, day] = dateStr.split("-").map(Number);
  const localDate = new Date(year, month - 1, day, 0, 0, 0);
  return localDate.toISOString();
}

// 3. 달 범위 구하기 (페이지네이션)
function getMonthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
}

// 4. 상담용 색상 팔레트
const COLOR_PALETTE = [
  "#FFD3B6",
  "#FFAAA6",
  "#FF8C94",
  "#D9B2FF",
  "#B5EAD7",
  "#E2F0CB",
  "#FAD9C1",
  "#FCB0B3",
  "#C7CEEA",
  "#F1F1F2",
];

// 5. CalendarPageConsult 컴포넌트
export default function CalendarPageConsult() {
  const containerRef = useRef<HTMLDivElement>(null);
  const user = useLoginUser();

  // Toast UI Calendar 클래스 및 인스턴스
  const [CalendarClass, setCalendarClass] = useState<any>(null);
  const [calendar, setCalendar] = useState<any>(null);

  // 상담 이벤트와 유저 필터 상태
  const [consultEvents, setConsultEvents] = useState<ConsultEvent[]>([]);
  const [userFilters, setUserFilters] = useState<
    {
      userId: string;
      name: string;
      level: string;
      color: string;
      isConsultActive: boolean;
    }[]
  >([]);
  const [currentView, setCurrentView] = useState<"day" | "week" | "month">(
    "month"
  );
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>("info");

  // (A) Calendar 모듈 로드
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const mod = require("@toast-ui/calendar");
      setCalendarClass(() => mod);
    } catch (err) {
      console.error("Calendar module load error:", err);
    }
  }, []);

  // (B) 상담 데이터 조회 및 이벤트 변환
  async function fetchConsultDataForMonth(baseDate: Date) {
    const { start, end } = getMonthRange(baseDate);
    const { data, error } = await supabase
      .from("consultations")
      .select("*, users(name, level), companies(name)")
      .gte("date", start.toISOString())
      .lt("date", end.toISOString())
      .eq("user_id", user?.id);
    if (error) {
      showSnackbar("상담 데이터 조회 오류: " + error.message, "error");
      return;
    }
    const events: ConsultEvent[] = (data || []).map((c: ConsultData) => ({
      id: `consult-${c.id}`,
      user_id: c.user_id,
      title: `${c.companies?.name || ""} | ${c.content}`,
      start: convertToKST(c.date),
      end: c.follow_up_date
        ? convertToKST(c.follow_up_date)
        : convertToKST(c.date),
      userInfo: c.users,
      rawData: c,
    }));
    setConsultEvents(events);
  }

  // (C) Calendar 인스턴스 생성
  useEffect(() => {
    if (!CalendarClass || !containerRef.current || !user?.id) return;
    if (calendar) {
      calendar.destroy();
    }
    try {
      const baseDate = new Date();
      const cal = new CalendarClass(containerRef.current, {
        defaultView: currentView,
        readOnly: true,
        useFormPopup: false,
        useDetailPopup: true,
        template: {
          detail: function (schedule: any) {
            return `
              <div>
                <h3>${schedule.title}</h3>
                <p>상담 내용: ${schedule.extendedProps.rawData.content}</p>
              </div>
            `;
          },
        },
      });
      setCalendar(cal);
      fetchConsultDataForMonth(baseDate);
    } catch (err) {
      console.error("Calendar instance creation error:", err);
    }
  }, [CalendarClass, containerRef, user, currentView]);

  // (D) 상담 이벤트 변경 시, 유저 필터 구성
  useEffect(() => {
    if (!calendar) return;
    const userMap = new Map<string, UserInfo>();
    consultEvents.forEach((ev) => {
      userMap.set(ev.user_id, ev.userInfo);
    });
    let colorIndex = 0;
    const newFilters = Array.from(userMap.entries()).map(([userId, info]) => {
      const color = COLOR_PALETTE[colorIndex % COLOR_PALETTE.length];
      colorIndex++;
      return {
        userId,
        name: info.name,
        level: info.level,
        color,
        isConsultActive: true,
      };
    });
    setUserFilters(newFilters);
  }, [consultEvents, calendar]);

  // (E) 달력 이벤트 갱신
  useEffect(() => {
    if (!calendar) return;
    if (typeof calendar.clear === "function") {
      calendar.clear();
    }
    const events = consultEvents.filter((ev) => {
      const uf = userFilters.find((f) => f.userId === ev.user_id);
      if (!uf) return false;
      return uf.isConsultActive;
    });
    if (typeof calendar.createEvents === "function") {
      const calEvents = events.map((ev) => ({
        id: ev.id,
        calendarId: ev.user_id,
        title: ev.title,
        category: "allday",
        start: ev.start,
        end: ev.end,
        extendedProps: { rawData: ev.rawData },
      }));
      calendar.createEvents(calEvents);
    }
    if (typeof calendar.setCalendars === "function") {
      const cals = userFilters.map((uf) => ({
        id: uf.userId,
        name: `${uf.name} ${uf.level}`,
        backgroundColor: uf.color,
        borderColor: uf.color,
      }));
      calendar.setCalendars(cals);
    }
  }, [calendar, consultEvents, userFilters]);

  // (F) 뷰 전환 / 이전/오늘/다음
  async function changeView(view: "day" | "week" | "month") {
    if (calendar?.changeView) {
      calendar.changeView(view);
    }
    setCurrentView(view);
  }
  async function moveToPrev() {
    if (!calendar?.prev) return;
    calendar.prev();
    await fetchConsultDataForMonth(calendar.getDate());
  }
  async function moveToNext() {
    if (!calendar?.next) return;
    calendar.next();
    await fetchConsultDataForMonth(calendar.getDate());
  }
  async function moveToToday() {
    if (!calendar?.today) return;
    calendar.today();
    await fetchConsultDataForMonth(calendar.getDate());
  }
  function toggleConsultFilter(userId: string) {
    setUserFilters((prev) =>
      prev.map((uf) =>
        uf.userId === userId
          ? { ...uf, isConsultActive: !uf.isConsultActive }
          : uf
      )
    );
  }
  function showSnackbar(message: string, severity: AlertColor = "info") {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
  }
  function handleSnackbarClose() {
    setSnackbarMessage(null);
  }
  function renderLegend() {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {userFilters.map((uf) => (
          <div
            key={uf.userId}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                cursor: "pointer",
              }}
              onClick={() => toggleConsultFilter(uf.userId)}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: uf.color,
                }}
              />
              <span>
                {uf.name} {uf.level}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }
  function renderButtons() {
    return (
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button onClick={() => changeView("day")}>DAY</button>
        <button onClick={() => changeView("week")}>WEEK</button>
        <button onClick={() => changeView("month")}>MONTH</button>
        <button onClick={moveToPrev}>이전</button>
        <button onClick={moveToToday}>오늘</button>
        <button onClick={moveToNext}>다음</button>
      </div>
    );
  }
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "end",
          marginBottom: "1rem",
        }}
      >
        {/* {renderLegend()} */}
        {renderButtons()}
      </div>
      <div
        ref={containerRef}
        style={{ height: "800px", border: "1px solid #ccc" }}
      />
      <SnackbarComponent
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={handleSnackbarClose}
      />
    </div>
  );
}
