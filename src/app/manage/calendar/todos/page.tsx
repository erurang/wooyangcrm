"use client";

import { useEffect, useRef, useState } from "react";
import "@toast-ui/calendar/dist/toastui-calendar.min.css";
import { createClient } from "@supabase/supabase-js";
import { AlertColor } from "@mui/material";
import SnackbarComponent from "@/components/Snackbar";
import { useLoginUser } from "@/context/login";

interface UserInfo {
  name: string;
  level: string;
}

interface TodoWithUser {
  id: number;
  user_id: string; // 일정 작성자 (uuid)
  content: string;
  is_completed: boolean;
  created_at: string;
  due_date: string;
  start_date: string;
  users: UserInfo; // { name, level }
  sort_order: number | null;
}

interface UserCalendar {
  id: string;
  name: string;
  backgroundColor: string;
  borderColor: string;
  isActive: boolean;
  statusFilter: "진행중" | "완료";
}

// 저장된 날짜는 UTC ISO 문자열로 되어 있으므로 브라우저는 로컬(KST) 시간으로 자동 표시합니다.
function convertToKST(dateStr: string): string {
  return dateStr;
}

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
  "#FFE8D6",
  "#FFF5BA",
  "#C1FFD7",
  "#BDE0FE",
  "#A0C4FF",
  "#FFC8DD",
  "#CAF0F8",
  "#A7BED3",
  "#E2ECE9",
];

function getMonthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
}

function tzDateToString(tzdate: any): string {
  if (!tzdate) return new Date().toISOString();
  if (tzdate instanceof Date) return tzdate.toISOString();
  if (typeof tzdate === "string") return tzdate;
  if (typeof tzdate.getTime === "function") {
    return new Date(tzdate.getTime()).toISOString();
  }
  return new Date().toISOString();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function CalendarPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const user = useLoginUser();
  const baseDate = new Date();

  // todos 상태
  const [todos, setTodos] = useState<TodoWithUser[]>([]);
  // 캘린더 관련 상태
  const [CalendarClass, setCalendarClass] = useState<any>(null);
  const [calendar, setCalendar] = useState<any>(null);
  // 유저별 달력(유저 리스트) 정보 (토글 상태 포함)
  const [userCalendars, setUserCalendars] = useState<UserCalendar[]>([]);
  // 글로벌 필터: "전체", "진행", "완료"
  const [globalFilter, setGlobalFilter] = useState<"전체" | "진행" | "완료">(
    "전체"
  );
  // 기본 뷰
  const [currentView, setCurrentView] = useState<"day" | "week" | "month">(
    "month"
  );
  // Snackbar 상태
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>("info");

  // (A) 클라이언트에서만 캘린더 모듈 로드
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const mod = require("@toast-ui/calendar");
      setCalendarClass(() => mod);
    } catch (err) {
      console.error("Calendar module load error:", err);
    }
  }, []);

  // (B) 특정 달의 todos 조회 (로그인한 사용자의 todos만 조회)
  async function fetchTodosForMonth(baseDate: Date) {
    const { start, end } = getMonthRange(baseDate);
    const { data, error } = await supabase
      .from("todos")
      .select("*, users(name, level)")
      .gte("start_date", start.toISOString())
      .lt("start_date", end.toISOString())
      .eq("user_id", user?.id);
    if (error) {
      showSnackbar("데이터 가져오기 오류: " + error.message, "error");
      return;
    }
    if (!data) return;
    setTodos(data as TodoWithUser[]);
  }

  // (C) Calendar 인스턴스 생성 (읽기 전용)
  useEffect(() => {
    if (!CalendarClass || !containerRef.current || !user?.id) return;
    if (calendar) {
      calendar.destroy();
    }
    try {
      const cal = new CalendarClass(containerRef.current, {
        defaultView: currentView,
        readOnly: true, // 읽기 전용: 편집/삭제 UI 제거
        useFormPopup: true,
        useDetailPopup: true,
        template: {
          // popupEdit 템플릿: schedule?.title이 없으면 빈 문자열 사용
          popupEdit: function (schedule: any) {
            return `
              <div class="tui-full-calendar-popup-edit">
                <div class="tui-full-calendar-popup-content">
                  <input type="text" class="tui-full-calendar-popup-title" value="${
                    schedule?.title || ""
                  }" placeholder="일정 제목" />
                </div>
                <div class="tui-full-calendar-popup-buttons">
                  <button class="tui-full-calendar-popup-save-btn">저장</button>
                  <button class="tui-full-calendar-popup-cancel-btn">취소</button>
                </div>
              </div>
            `;
          },
        },
      });
      setCalendar(cal);
      fetchTodosForMonth(new Date());
    } catch (err) {
      console.error("Calendar instance creation error:", err);
    }
  }, [CalendarClass, containerRef, user?.id, currentView]);

  // (D1) todos가 변경될 때 유저별 달력(유저 리스트) 정보 계산
  useEffect(() => {
    if (!todos) return;
    const userMap = new Map<string, UserInfo>();
    todos.forEach((t) => {
      userMap.set(t.user_id, t.users);
    });
    let colorIndex = 0;
    const newCals: UserCalendar[] = Array.from(userMap.entries()).map(
      ([userId, info]) => {
        const color = COLOR_PALETTE[colorIndex % COLOR_PALETTE.length];
        colorIndex++;
        return {
          id: userId,
          name: `${info.name} ${info.level}`,
          backgroundColor: color,
          borderColor: color,
          isActive: true,
          statusFilter: "진행중",
        };
      }
    );
    setUserCalendars(newCals);
  }, [todos]);

  // (D2) todos, 글로벌 필터, userCalendars 변경 시 달력 이벤트 갱신
  useEffect(() => {
    if (!calendar || !todos) return;
    if (typeof calendar.clear === "function") {
      calendar.clear();
    }
    const activeUserIds = userCalendars
      .filter((uc) => uc.isActive)
      .map((uc) => uc.id);
    let filteredTodos = todos.filter((todo) =>
      activeUserIds.includes(todo.user_id)
    );
    if (globalFilter === "진행") {
      filteredTodos = filteredTodos.filter((todo) => !todo.is_completed);
    } else if (globalFilter === "완료") {
      filteredTodos = filteredTodos.filter((todo) => todo.is_completed);
    }
    const events = filteredTodos.map((todo) => {
      return {
        id: String(todo.id),
        calendarId: todo.user_id,
        title: todo.is_completed ? `[완료] ${todo.content}` : todo.content,
        category: "time",
        start: todo.start_date,
        end: todo.due_date,
      };
    });
    if (typeof calendar.createEvents === "function") {
      calendar.createEvents(events);
    }
    if (typeof calendar.setCalendars === "function") {
      calendar.setCalendars(
        userCalendars.map((uc) => ({
          id: uc.id,
          name: uc.name,
          backgroundColor: uc.backgroundColor,
          borderColor: uc.borderColor,
        }))
      );
    }
  }, [calendar, todos, globalFilter, userCalendars]);

  // (E) 뷰 전환 / 이전/오늘/다음
  async function changeView(view: "day" | "week" | "month") {
    if (calendar?.changeView) {
      calendar.changeView(view);
    }
    setCurrentView(view);
  }
  async function moveToPrev() {
    if (!calendar?.prev) return;
    calendar.prev();
    await fetchTodosForMonth(calendar.getDate());
  }
  async function moveToNext() {
    if (!calendar?.next) return;
    calendar.next();
    await fetchTodosForMonth(calendar.getDate());
  }
  async function moveToToday() {
    if (!calendar?.today) return;
    calendar.today();
    await fetchTodosForMonth(calendar.getDate());
  }

  // (F) Snackbar 처리
  function showSnackbar(message: string, severity: AlertColor = "info") {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
  }
  function handleSnackbarClose() {
    setSnackbarMessage(null);
  }

  // (G) 사이드바 UI: 글로벌 필터 및 유저 리스트
  const renderSidebar = () => {
    return (
      <div className="h-full p-4 border-r border-gray-300 overflow-y-auto">
        {/* 글로벌 필터 버튼 */}
        <div className="mb-4 flex justify-around">
          <button
            onClick={() => setGlobalFilter("전체")}
            className={`hover:underline ${
              globalFilter === "전체" ? "font-bold" : ""
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setGlobalFilter("진행")}
            className={`hover:underline ${
              globalFilter === "진행" ? "font-bold" : ""
            }`}
          >
            진행
          </button>
          <button
            onClick={() => setGlobalFilter("완료")}
            className={`hover:underline ${
              globalFilter === "완료" ? "font-bold" : ""
            }`}
          >
            완료
          </button>
        </div>
        {/* 유저 리스트 */}
        <div className="grid grid-cols-1 gap-2">
          {userCalendars.map((uc) => (
            <div
              key={uc.id}
              className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:opacity-100 ${
                uc.isActive ? "opacity-100" : "opacity-50"
              }`}
              onClick={() =>
                setUserCalendars((prev) =>
                  prev.map((c) =>
                    c.id === uc.id ? { ...c, isActive: !c.isActive } : c
                  )
                )
              }
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: uc.backgroundColor }}
              />
              <span className="text-sm">{uc.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // (H) 우측 상단 버튼 영역
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

  // (I) 최종 렌더링: 좌측 사이드바 + 우측 메인 영역
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "end",
          marginBottom: "1rem",
        }}
      >
        {/* 좌측 사이드바: 1/10 */}
        {/* <div className="col-span-1">{renderSidebar()}</div> */}
        {/* 우측 메인 영역: 9/10 */}
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
