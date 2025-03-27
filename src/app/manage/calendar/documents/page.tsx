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

interface DocData {
  id: number;
  user_id: string;
  date: string; // 문서 날짜 → start_date
  document_number: string;
  status: string; // pending, completed, canceled 등
  type: string; // "estimate", "order", "requestQuote" 등
  content: any;
  users: UserInfo;
}

interface DocEvent {
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

// 4. 한글 상태 변환 함수 (문서용)
function translateStatus(status: string | null): string {
  switch (status) {
    case "pending":
      return "진행 중";
    case "completed":
      return "완료";
    case "canceled":
      return "취소";
    default:
      return "";
  }
}

// 5. 문서 유형 변환 함수: "estimate" → "견적서", "order" → "발주서", "requestQuote" → "의뢰서"
function translateDocType(docType: string): string {
  switch (docType) {
    case "estimate":
      return "견적서";
    case "order":
      return "발주서";
    case "requestQuote":
      return "의뢰서";
    default:
      return "";
  }
}

// 6. 문서용 색상 팔레트
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

// 7. CalendarPageDoc 컴포넌트
export default function CalendarPageDoc() {
  const containerRef = useRef<HTMLDivElement>(null);
  const user = useLoginUser();

  // Toast UI Calendar 클래스 및 인스턴스
  const [CalendarClass, setCalendarClass] = useState<any>(null);
  const [calendar, setCalendar] = useState<any>(null);

  // 문서 이벤트와 유저 필터 상태
  const [docEvents, setDocEvents] = useState<DocEvent[]>([]);
  const [userFilters, setUserFilters] = useState<
    {
      userId: string;
      name: string;
      level: string;
      color: string;
      isDocActive: boolean;
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

  // (B) 문서 데이터 조회 및 이벤트 변환
  async function fetchDocDataForMonth(baseDate: Date) {
    const { start, end } = getMonthRange(baseDate);
    const { data, error } = await supabase
      .from("documents")
      .select("*, users(name, level)")
      .gte("date", start.toISOString())
      .lt("date", end.toISOString());
    if (error) {
      showSnackbar("문서 데이터 조회 오류: " + error.message, "error");
      return;
    }
    const events: DocEvent[] = (data || []).map((d: DocData) => {
      const docLabel = translateDocType(d.type);
      return {
        id: `doc-${d.id}`,
        user_id: d.user_id,
        // 제목에 문서 유형, 문서 번호, 진행 상태 표시
        title: `${docLabel} | ${d.document_number} | ${translateStatus(
          d.status
        )}`,
        start: convertToKST(d.date),
        end: convertToKST(d.date),
        userInfo: d.users,
        rawData: d,
      };
    });
    setDocEvents(events);
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
                <p>문서 번호: ${
                  schedule.extendedProps.rawData.document_number
                }</p>
                <p>유형: ${translateDocType(
                  schedule.extendedProps.rawData.type
                )}</p>
                <p>상태: ${translateStatus(
                  schedule.extendedProps.rawData.status
                )}</p>
                <p>내용: ${JSON.stringify(
                  schedule.extendedProps.rawData.content
                )}</p>
              </div>
            `;
          },
        },
      });
      setCalendar(cal);
      fetchDocDataForMonth(baseDate);
    } catch (err) {
      console.error("Calendar instance creation error:", err);
    }
  }, [CalendarClass, containerRef, user, currentView]);

  // (D) 문서 이벤트 변경 시, 유저 필터 구성
  useEffect(() => {
    if (!calendar) return;
    const userMap = new Map<string, UserInfo>();
    docEvents.forEach((ev) => {
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
        isDocActive: true,
      };
    });
    setUserFilters(newFilters);
  }, [docEvents, calendar]);

  // (E) 달력 이벤트 갱신 (이벤트 생성 시 category를 "allday"로 설정하여 시간표기를 없앰)
  useEffect(() => {
    if (!calendar) return;
    if (typeof calendar.clear === "function") {
      calendar.clear();
    }
    const events = docEvents.filter((ev) => {
      const uf = userFilters.find((f) => f.userId === ev.user_id);
      if (!uf) return false;
      return uf.isDocActive;
    });
    if (typeof calendar.createEvents === "function") {
      const calEvents = events.map((ev) => ({
        id: ev.id,
        calendarId: ev.user_id,
        title: ev.title,
        category: "allday", // "time" 대신 "allday"로 지정하여 시간표기 제거
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
  }, [calendar, docEvents, userFilters]);

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
    await fetchDocDataForMonth(calendar.getDate());
  }
  async function moveToNext() {
    if (!calendar?.next) return;
    calendar.next();
    await fetchDocDataForMonth(calendar.getDate());
  }
  async function moveToToday() {
    if (!calendar?.today) return;
    calendar.today();
    await fetchDocDataForMonth(calendar.getDate());
  }
  function toggleDocFilter(userId: string) {
    setUserFilters((prev) =>
      prev.map((uf) =>
        uf.userId === userId ? { ...uf, isDocActive: !uf.isDocActive } : uf
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
              onClick={() => toggleDocFilter(uf.userId)}
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
            <button
              onClick={() => toggleDocFilter(uf.userId)}
              style={{ opacity: uf.isDocActive ? 1 : 0.4 }}
            >
              문서
            </button>
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
          justifyContent: "space-between",
          marginBottom: "1rem",
        }}
      >
        {renderLegend()}
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
