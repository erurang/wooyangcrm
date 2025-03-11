"use client";

import React, { useState, useEffect, useRef } from "react";
// import dynamic from "next/dynamic";
// import "@toast-ui/calendar/dist/toastui-calendar.min.css";
// import { createSupabaseClient } from "@/utils/supabase/client";

// // Todo 타입 정의
// interface Todo {
//   id: string;
//   user_id: string;
//   content: string;
//   is_completed: boolean;
//   start_date: string | null;
//   due_date: string | null;
// }

// // Toast UI Calendar를 동적으로 불러옴 (ssr: false)
// const TuiCalendar = dynamic(
//   () =>
//     import("@toast-ui/react-calendar/ie11").then((mod) => mod.default as any),
//   { ssr: false }
// );

export default function TodosCalendarPage() {
  //   const supabase = createSupabaseClient();
  //   const [todos, setTodos] = useState<Todo[]>([]);
  //   const calendarRef = useRef<any>(null);

  //   useEffect(() => {
  //     fetchTodos();
  //     // eslint-disable-next-line react-hooks/exhaustive-deps
  //   }, []);

  //   async function fetchTodos() {
  //     const { data, error } = await supabase
  //       .from("todos")
  //       .select("*")
  //       .eq("user_id", "aff2064e-2603-48ab-81fc-f7a50921775e"); // 실제 user ID 사용
  //     if (!error && data) {
  //       setTodos(data);
  //     }
  //   }

  //   // Toast UI Calendar (v2) 형식에 맞춘 이벤트 객체들
  //   const events = todos.map((todo) => ({
  //     id: todo.id,
  //     calendarId: "Todos",
  //     title: todo.content,
  //     start: todo.start_date || "",
  //     end: todo.due_date || "",
  //     isAllday: false,
  //   }));

  return (
    <div className="p-4">
      {/* <h1 className="text-xl font-bold mb-4">할 일 + Toast UI Calendar (v2)</h1>

      <TuiCalendar
        ref={calendarRef}
        height="800px"
        view="month"
        events={events}
        useCreationPopup={true} // 일정 생성 팝업
        useDetailPopup={true} // 일정 상세 팝업
      /> */}
    </div>
  );
}
