"use client";

interface TypingIndicatorProps {
  users: Array<{ user_id: string; name: string }>;
}

export default function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const text =
    users.length === 1
      ? `${users[0].name}님이 입력 중...`
      : users.length === 2
      ? `${users[0].name}님, ${users[1].name}님이 입력 중...`
      : `${users[0].name}님 외 ${users.length - 1}명이 입력 중...`;

  return (
    <div className="flex items-center gap-2 ml-10 mb-2">
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-2xl rounded-bl-md">
        {/* 애니메이션 점 */}
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
      <span className="text-xs text-gray-500">{text}</span>
    </div>
  );
}
