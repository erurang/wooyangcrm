"use client";

import { useRouter } from "next/navigation";
import { useUnreadCount } from "@/hooks/chat";

interface ChatBellProps {
  userId: string | null;
}

export default function ChatBell({ userId }: ChatBellProps) {
  const router = useRouter();
  const { totalUnread, isLoading } = useUnreadCount({ userId });

  const handleClick = () => {
    router.push("/chat");
  };

  return (
    <button
      onClick={handleClick}
      className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
      title="메신저"
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>

      {/* 안읽은 메시지 배지 */}
      {totalUnread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {totalUnread > 99 ? "99+" : totalUnread}
        </span>
      )}
    </button>
  );
}
