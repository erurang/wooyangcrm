"use client";

import { Circle, CheckCircle2, Calendar, AlertCircle, Clock } from "lucide-react";

interface Todo {
  id: string;
  user_id: string;
  content: string;
  is_completed: boolean;
  due_date: string | null;
  start_date: string | null;
  sort_order: number;
}

interface HomeTodoCardProps {
  todo: Todo;
  onToggleComplete: (id: string, isCompleted: boolean) => void;
}

function getDueDateInfo(dueDate: string | null): {
  text: string;
  color: string;
  bgColor: string;
  borderColor: string;
  isOverdue: boolean;
  isDueToday: boolean;
  isDueSoon: boolean;
  icon: typeof AlertCircle | typeof Clock | typeof Calendar;
} | null {
  if (!dueDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      text: `${Math.abs(diffDays)}일 지남`,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      isOverdue: true,
      isDueToday: false,
      isDueSoon: false,
      icon: AlertCircle,
    };
  } else if (diffDays === 0) {
    return {
      text: "오늘",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      isOverdue: false,
      isDueToday: true,
      isDueSoon: false,
      icon: Clock,
    };
  } else if (diffDays <= 3) {
    return {
      text: `D-${diffDays}`,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      isOverdue: false,
      isDueToday: false,
      isDueSoon: true,
      icon: Calendar,
    };
  } else {
    return {
      text: `D-${diffDays}`,
      color: "text-slate-500",
      bgColor: "bg-slate-50",
      borderColor: "border-slate-200",
      isOverdue: false,
      isDueToday: false,
      isDueSoon: false,
      icon: Calendar,
    };
  }
}

function formatShortDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function HomeTodoCard({ todo, onToggleComplete }: HomeTodoCardProps) {
  const dueDateInfo = getDueDateInfo(todo.due_date);
  const IconComponent = dueDateInfo?.icon || Calendar;

  return (
    <div
      className={`
        relative rounded-xl p-3 cursor-pointer
        transition-all duration-200 hover:shadow-md group
        ${dueDateInfo?.isOverdue
          ? `${dueDateInfo.bgColor} ${dueDateInfo.borderColor} border-2 shadow-sm`
          : dueDateInfo?.isDueToday
          ? `${dueDateInfo.bgColor} ${dueDateInfo.borderColor} border-2 shadow-sm`
          : dueDateInfo?.isDueSoon
          ? `${dueDateInfo.bgColor} ${dueDateInfo.borderColor} border`
          : "bg-slate-50/80 border border-slate-200/60 hover:border-violet-200"
        }
      `}
      onClick={() => onToggleComplete(todo.id, todo.is_completed)}
    >
      {/* 긴급/오늘 마크 */}
      {(dueDateInfo?.isOverdue || dueDateInfo?.isDueToday) && (
        <div className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-sm ${dueDateInfo.isOverdue ? 'bg-red-500' : 'bg-orange-500'}`}>
          <IconComponent className="h-3 w-3 text-white" />
        </div>
      )}

      <div className="flex items-start gap-2">
        {/* 체크박스 */}
        <button
          className={`
            flex-shrink-0 mt-0.5 transition-all duration-200
            ${todo.is_completed
              ? "text-emerald-500 hover:text-emerald-600"
              : dueDateInfo?.isOverdue
                ? "text-red-400 hover:text-red-500"
                : dueDateInfo?.isDueToday
                  ? "text-orange-400 hover:text-orange-500"
                  : "text-slate-300 hover:text-violet-500"
            }
          `}
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(todo.id, todo.is_completed);
          }}
        >
          {todo.is_completed ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Circle className="h-4 w-4" />
          )}
        </button>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <p className={`
            text-sm leading-tight line-clamp-2
            ${todo.is_completed
              ? "text-slate-400 line-through"
              : dueDateInfo?.isOverdue
                ? "text-red-700 font-semibold"
                : dueDateInfo?.isDueToday
                  ? "text-orange-700 font-semibold"
                  : "text-slate-700"
            }
          `}>
            {todo.content || "내용 없음"}
          </p>

          {/* 기한 정보 */}
          {dueDateInfo && !todo.is_completed && (
            <div className="flex items-center gap-1 mt-1.5">
              <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-md ${dueDateInfo.bgColor} ${dueDateInfo.color}`}>
                <IconComponent className="h-3 w-3" />
                {dueDateInfo.text}
              </span>
              <span className="text-[10px] text-slate-400 tabular-nums">
                {formatShortDate(todo.due_date)}
              </span>
            </div>
          )}

          {/* 기한 없음 표시 */}
          {!todo.due_date && !todo.is_completed && (
            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-400">
              <Calendar className="h-3 w-3" />
              <span>기한 없음</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
