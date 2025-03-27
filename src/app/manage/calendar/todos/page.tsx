"use client";

import { useEffect, useRef, useState } from "react";
import "@toast-ui/calendar/dist/toastui-calendar.min.css";
import { AlertColor } from "@mui/material";
import SnackbarComponent from "@/components/Snackbar";
import { useLoginUser } from "@/context/login";
import { supabase } from "@/lib/supabaseClient";

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

// -----------------------------
// 3. KST 변환 함수
// -----------------------------
function convertToKST(dateStr: string): string {
  const date = new Date(dateStr);
  const kstTime = date.getTime() + 9 * 60 * 60 * 1000;
  return new Date(kstTime).toISOString();
}

// -----------------------------
// 4. 파스텔톤 색상 팔레트
// -----------------------------
const COLOR_PALETTE = [
  "#FFD3B6", // 연살구
  "#FFAAA6", // 연핑크
  "#FF8C94", // 진핑크
  "#D9B2FF", // 라일락
  "#B5EAD7", // 민트
  "#E2F0CB", // 라이트 라임
  "#FAD9C1", // 베이지톤
  "#FCB0B3", // 연빨강
  "#C7CEEA", // 연보라
  "#F1F1F2", // 연회색
  // 추가 색상들
  "#FFE8D6", // 크림 살구
  "#FFF5BA", // 연노랑
  "#C1FFD7", // 라이트 민트
  "#BDE0FE", // 파스텔 블루
  "#A0C4FF", // 연파랑
  "#FFC8DD", // 연분홍
  "#BDE0FE", // 연파랑 (중복 가능)
  "#CAF0F8", // 아주 연한 하늘
  "#A7BED3", // 그레이시 라벤더
  "#E2ECE9", // 라이트 그레이 그린
];

// -----------------------------
// 5. 달(월) 범위 구하기 (페이지네이션)
// -----------------------------
function getMonthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
}

// -----------------------------
// 6. TZDate → string 변환 (v2에서 start/end가 TZDate 가능)
// -----------------------------
function tzDateToString(tzdate: any): string {
  if (!tzdate) return new Date().toISOString();

  if (tzdate instanceof Date) {
    return tzdate.toISOString();
  } else if (typeof tzdate === "string") {
    return tzdate;
  } else if (typeof tzdate.getTime === "function") {
    const timeValue = tzdate.getTime();
    return new Date(timeValue).toISOString();
  }
  return new Date().toISOString();
}

// -----------------------------
// 7. CalendarPage
// -----------------------------
export default function CalendarPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  // 로그인 사용자 (예: { id: string; ... })
  const user = useLoginUser();

  // Toast UI Calendar 클래스 (v2)
  const [CalendarClass, setCalendarClass] = useState<any>(null);

  // Calendar 인스턴스
  const [calendar, setCalendar] = useState<any>(null);

  // DB에서 가져온 todos
  const [todos, setTodos] = useState<TodoWithUser[]>([]);

  // 사용자별 달력(Calendars) 정보
  const [userCalendars, setUserCalendars] = useState<UserCalendar[]>([]);

  // **기본 뷰를 month로 설정**
  const [currentView, setCurrentView] = useState<"day" | "week" | "month">(
    "month"
  );

  // Snackbar
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>("info");

  // ---------------------------
  // (A) 클라이언트에서만 @toast-ui/calendar 모듈 로드
  // ---------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const mod = require("@toast-ui/calendar");
      console.log("Loaded calendar mod:", mod);
      setCalendarClass(() => mod);
    } catch (err) {
      console.error("Calendar module load error:", err);
    }
  }, []);

  // ---------------------------
  // (B) 특정 달의 todos + users(name, level) 조인
  // ---------------------------
  async function fetchTodosForMonth(baseDate: Date) {
    const { start, end } = getMonthRange(baseDate);

    const { data, error } = await supabase
      .from("todos")
      .select("*, users(name, level)")
      .gte("start_date", start.toISOString())
      .lt("start_date", end.toISOString());

    if (error) {
      showSnackbar("데이터 가져오기 오류: " + error.message, "error");
      return;
    }
    if (!data) return;

    setTodos(data as TodoWithUser[]);
  }

  // ---------------------------
  // (C) Calendar 인스턴스 생성
  // ---------------------------
  useEffect(() => {
    if (!CalendarClass || !containerRef.current || !user?.id) return;

    if (calendar) {
      calendar.destroy();
    }

    try {
      const baseDate = new Date();

      const cal = new CalendarClass(containerRef.current, {
        defaultView: currentView,
        useFormPopup: true,
        useDetailPopup: true,
      });
      console.log("Created cal instance with user:", user.id);

      // --- 일정 생성 ---
      cal.on("beforeCreateEvent", async (eventData: any) => {
        try {
          if (!user?.id) {
            showSnackbar("로그인한 사용자만 일정 생성 가능", "error");
            return;
          }
          const startStr = tzDateToString(eventData.start);
          const endStr = tzDateToString(eventData.end);

          const { error } = await supabase.from("todos").insert({
            content: eventData.title,
            user_id: user.id,
            is_completed: false,
            start_date: new Date(new Date(startStr).getTime()).toISOString(),
            due_date: new Date(new Date(endStr).getTime()).toISOString(),
          });
          if (error) throw error;

          showSnackbar("일정이 생성되었습니다.", "success");
          await fetchTodosForMonth(cal.getDate());
        } catch (err: any) {
          showSnackbar("일정 생성 오류: " + err.message, "error");
        }
      });

      // --- 일정 수정 ---
      cal.on("beforeUpdateEvent", async ({ event, changes }: any) => {
        try {
          const todoId = Number(event.id);
          const scheduleOwner = event.calendarId;
          if (!user?.id || user.id !== scheduleOwner) {
            showSnackbar("본인 일정만 수정할 수 있습니다.", "error");
            return;
          }
          const newTitle = changes.title ?? event.title;
          const newStart = tzDateToString(changes.start ?? event.start);
          const newEnd = tzDateToString(changes.end ?? event.end);

          const { error } = await supabase
            .from("todos")
            .update({
              content: newTitle,
              start_date: new Date(new Date(newStart).getTime()).toISOString(),
              due_date: new Date(new Date(newEnd).getTime()).toISOString(),
            })
            .eq("id", todoId);
          if (error) throw error;

          showSnackbar("일정이 수정되었습니다.", "success");
          await fetchTodosForMonth(cal.getDate());
        } catch (err: any) {
          showSnackbar("일정 수정 오류: " + err.message, "error");
        }
      });

      // --- 일정 삭제 ---
      cal.on("beforeDeleteEvent", async (eventData: any) => {
        try {
          const todoId = Number(eventData.id);
          const scheduleOwner = eventData.calendarId;
          if (!user?.id || user.id !== scheduleOwner) {
            showSnackbar("본인 일정만 삭제할 수 있습니다.", "error");
            return;
          }
          const { error } = await supabase
            .from("todos")
            .delete()
            .eq("id", todoId);
          if (error) throw error;

          showSnackbar("일정이 삭제되었습니다.", "success");
          await fetchTodosForMonth(cal.getDate());
        } catch (err: any) {
          showSnackbar("일정 삭제 오류: " + err.message, "error");
        }
      });

      setCalendar(cal);
      fetchTodosForMonth(baseDate);
    } catch (err) {
      console.error("Calendar instance creation error:", err);
    }
  }, [CalendarClass, containerRef, user, currentView]);

  // ---------------------------
  // (D) todos 변경 시 userCalendars 구성
  // ---------------------------
  useEffect(() => {
    if (!calendar) return;

    const userMap = new Map<string, UserInfo>();
    todos.forEach((t) => {
      userMap.set(t.user_id, t.users);
    });

    let colorIndex = 0;
    const newCals: UserCalendar[] = Array.from(userMap.entries()).map(
      ([userId, user]) => {
        const color = COLOR_PALETTE[colorIndex % COLOR_PALETTE.length];
        colorIndex += 1;
        return {
          id: userId,
          name: `${user.name} ${user.level}`,
          backgroundColor: color,
          borderColor: color,
          isActive: true,
          statusFilter: "진행중",
        };
      }
    );

    setUserCalendars(newCals);
  }, [todos, calendar]);

  // ---------------------------
  // (E) todos, userCalendars 변경 시 달력 이벤트 업데이트
  // ---------------------------
  useEffect(() => {
    if (!calendar) return;

    if (typeof calendar.clear === "function") {
      calendar.clear();
    }

    // 활성 사용자 및 필터 상태 가져오기
    const activeUserFilters = userCalendars
      .filter((cal) => cal.isActive)
      .reduce((acc, cal) => {
        acc[cal.id] = cal.statusFilter;
        return acc;
      }, {} as Record<string, "진행중" | "완료">);

    const events = todos
      .filter((todo) => {
        // 활성 사용자인지 체크
        if (!activeUserFilters[todo.user_id]) return false;
        // 필터 상태에 따라 is_completed를 확인 (진행중이면 false, 완료면 true)
        if (activeUserFilters[todo.user_id] === "진행중") {
          return !todo.is_completed;
        } else if (activeUserFilters[todo.user_id] === "완료") {
          return todo.is_completed;
        }
        return true;
      })
      .map((todo) => {
        const start = convertToKST(todo.start_date);
        const end = convertToKST(todo.due_date);
        return {
          id: String(todo.id),
          calendarId: todo.user_id,
          title: todo.content,
          category: "time",
          start,
          end,
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
  }, [calendar, todos, userCalendars]);

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

  function toggleUserCalendar(userId: string) {
    setUserCalendars((prev) =>
      prev.map((cal) =>
        cal.id === userId ? { ...cal, isActive: !cal.isActive } : cal
      )
    );
  }

  function handleStatusChange(userId: string, newStatus: "진행중" | "완료") {
    setUserCalendars((prev) =>
      prev.map((cal) =>
        cal.id === userId ? { ...cal, statusFilter: newStatus } : cal
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
      <div style={{ display: "flex", gap: "1rem", marginBottom: "0.5rem" }}>
        {userCalendars.map((cal) => (
          <div
            key={cal.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              cursor: "pointer",
              opacity: cal.isActive ? 1 : 0.4,
            }}
            onClick={() => toggleUserCalendar(cal.id)}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: cal.backgroundColor,
              }}
            />
            <span>{cal.name}</span>
            <select
              onClick={(e) => e.stopPropagation()}
              value={cal.statusFilter}
              onChange={(e) =>
                handleStatusChange(cal.id, e.target.value as "진행중" | "완료")
              }
            >
              <option value="진행중">진행중</option>
              <option value="완료">완료</option>
            </select>
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
