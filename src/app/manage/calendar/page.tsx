"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic"; // ✅ 동적 import
import { supabase } from "@/lib/supabaseClient";
import { useLoginUser } from "@/context/login";
import dayjs from "dayjs";
import "@toast-ui/calendar/dist/toastui-calendar.min.css";

// ✅ `TUI Calendar`를 `dynamic import`로 불러오기
// const ToastUICalendar = dynamic(() => import("@toast-ui/react-calendar"), {
//   ssr: false,
// });

interface Event {
  id: string;
  title: string;
  start: string;
  end?: string;
  category: "todo" | "estimate" | "order" | "requestQuote" | "consultation";
  bgColor: string;
}

export default function CalendarPage() {
  // const [events, setEvents] = useState<Event[]>([]);
  // const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  // const user = useLoginUser();

  // const fetchEvents = async () => {
  //   if (!user?.id) return;

  //   try {
  //     const [todos, documents, consultations] = await Promise.all([
  //       supabase.from("todos").select("*").eq("user_id", user.id),
  //       supabase.from("documents").select("*").eq("user_id", user.id),
  //       supabase.from("consultations").select("*").eq("user_id", user.id),
  //     ]);

  //     if (todos.error || documents.error || consultations.error) {
  //       console.error(
  //         "Error fetching data:",
  //         todos.error,
  //         documents.error,
  //         consultations.error
  //       );
  //       return;
  //     }

  //     const todoEvents = (todos.data || []).map((todo) => ({
  //       id: todo.id,
  //       title: `📝 ${todo.title}`,
  //       start: todo.due_date,
  //       category: "todo",
  //       bgColor: "#f87171", // 빨강 (할 일)
  //     }));

  //     const documentEvents = (documents.data || []).map((doc) => ({
  //       id: doc.id,
  //       title: `📄 ${doc.type.toUpperCase()} - ${doc.document_number}`,
  //       start: doc.created_at,
  //       category: doc.type as "estimate" | "order" | "requestQuote",
  //       bgColor:
  //         doc.type === "estimate"
  //           ? "#34d399"
  //           : doc.type === "order"
  //           ? "#60a5fa"
  //           : "#fbbf24",
  //     }));

  //     const consultationEvents = (consultations.data || []).map((consult) => ({
  //       id: consult.id,
  //       title: `🗣 상담 - ${consult.content}`,
  //       start: consult.date,
  //       category: "consultation",
  //       bgColor: "#a78bfa",
  //     }));

  //     setEvents([...todoEvents, ...documentEvents, ...consultationEvents]);
  //   } catch (error) {
  //     console.error("Error fetching events:", error);
  //   }
  // };

  // useEffect(() => {
  //   fetchEvents();
  // }, [user?.id]);

  return (
    <div className="p-6">
      {/* <h1 className="text-2xl font-bold mb-4">📅 일정 관리 (TUI Calendar)</h1>

      
      <ToastUICalendar
        height="800px"
        view="month"
        events={events.map((event) => ({
          id: event.id,
          calendarId: event.category,
          title: event.title,
          category: "time",
          start: event.start,
          backgroundColor: event.bgColor,
        }))}
        useDetailPopup={true}
        useFormPopup={false}
        onClickEvent={(e) => setSelectedEvent(e.event)}
      />

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )} */}
    </div>
  );
}

/* 📌 이벤트 상세 보기 모달 */
function EventModal({ event, onClose }: { event: Event; onClose: () => void }) {
  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-md w-1/3 shadow-lg">
        <h2 className="text-xl font-bold mb-4">{event.title}</h2>
        <p className="text-gray-700 mb-2">
          📅 날짜: {dayjs(event.start).format("YYYY-MM-DD")}
        </p>

        {event.category === "todo" && (
          <a href={`/todos/${event.id}`} className="text-blue-500">
            할 일 보기
          </a>
        )}
        {event.category === "estimate" && (
          <a href={`/documents/견적서/${event.id}`} className="text-blue-500">
            견적서 보기
          </a>
        )}
        {event.category === "order" && (
          <a href={`/documents/발주서/${event.id}`} className="text-blue-500">
            발주서 보기
          </a>
        )}
        {event.category === "requestQuote" && (
          <a href={`/documents/의뢰서/${event.id}`} className="text-blue-500">
            의뢰서 보기
          </a>
        )}
        {event.category === "consultation" && (
          <a href={`/consultations/${event.id}`} className="text-blue-500">
            상담 보기
          </a>
        )}

        <div className="flex justify-end mt-4">
          <button
            className="px-4 py-2 bg-gray-500 text-white rounded-md"
            onClick={onClose}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
