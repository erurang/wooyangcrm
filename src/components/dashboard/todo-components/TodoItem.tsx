"use client";

import { Trash2, CheckCircle, Circle, GripVertical, Calendar, AlertCircle, Loader2 } from "lucide-react";

// 마감일까지 남은 일수 계산
function getDueDateStatus(dueDate: string | null): { daysLeft: number; status: "overdue" | "urgent" | "soon" | "normal" | null } {
  if (!dueDate) return { daysLeft: 0, status: null };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) return { daysLeft, status: "overdue" };
  if (daysLeft === 0) return { daysLeft, status: "urgent" };
  if (daysLeft <= 3) return { daysLeft, status: "soon" };
  return { daysLeft, status: "normal" };
}

// 마감일 포맷팅
function formatDueDate(dueDate: string): string {
  const date = new Date(dueDate);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

interface Todo {
  id: string;
  user_id: string;
  content: string;
  is_completed: boolean;
  due_date: string | null;
  start_date: string | null;
  sort_order: number;
}

interface TodoItemProps {
  todo: Todo;
  isCompleted: boolean;
  editingContent?: string;
  isHovered: boolean;
  isDragged: boolean;
  isDeleting: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onToggleComplete: () => void;
  onContentChange: (content: string) => void;
  onDelete: () => void;
}

export default function TodoItem({
  todo,
  isCompleted,
  editingContent,
  isHovered,
  isDragged,
  isDeleting,
  onDragStart,
  onDragEnd,
  onMouseEnter,
  onMouseLeave,
  onToggleComplete,
  onContentChange,
  onDelete,
}: TodoItemProps) {
  const borderColor = isCompleted
    ? isDragged
      ? "border-emerald-400 shadow-md opacity-50"
      : "border-slate-200 hover:border-emerald-300"
    : isDragged
      ? "border-sky-400 shadow-md opacity-50"
      : "border-slate-200 hover:border-sky-300";

  const hoverColor = isCompleted ? "hover:text-emerald-500" : "hover:text-sky-500";
  const ringColor = isCompleted ? "focus:ring-emerald-300" : "focus:ring-sky-300";
  const textStyle = isCompleted ? "text-slate-500 line-through" : "text-slate-700";

  // 마감일 상태 계산
  const { daysLeft, status: dueDateStatus } = getDueDateStatus(todo.due_date);

  // 마감일 배지 색상
  const getDueDateBadgeStyle = () => {
    if (isCompleted) return "bg-slate-100 text-slate-400";
    switch (dueDateStatus) {
      case "overdue":
        return "bg-red-100 text-red-600";
      case "urgent":
        return "bg-orange-100 text-orange-600";
      case "soon":
        return "bg-amber-100 text-amber-600";
      default:
        return "bg-slate-100 text-slate-500";
    }
  };

  // 마감일 텍스트
  const getDueDateText = () => {
    if (!todo.due_date) return null;
    if (dueDateStatus === "overdue") return `${Math.abs(daysLeft)}일 지남`;
    if (dueDateStatus === "urgent") return "오늘";
    if (dueDateStatus === "soon") return `${daysLeft}일 남음`;
    return formatDueDate(todo.due_date);
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`flex items-center p-3 bg-white rounded-lg border ${borderColor} transition-all duration-200`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* 드래그 핸들 */}
      <div className={`flex-shrink-0 mr-2 cursor-grab text-slate-400 ${hoverColor}`}>
        <GripVertical className="h-5 w-5" />
      </div>

      {/* 체크박스 */}
      <button
        onClick={onToggleComplete}
        className={`flex-shrink-0 mr-3 ${
          isCompleted ? "" : "text-slate-400 hover:text-sky-600 transition-colors"
        }`}
      >
        {isCompleted ? (
          <CheckCircle className="h-5 w-5 text-emerald-500" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>

      {/* 입력창 */}
      <input
        type="text"
        value={editingContent !== undefined ? editingContent : todo.content}
        placeholder="할 일을 입력하세요..."
        onChange={(e) => onContentChange(e.target.value)}
        className={`flex-grow px-2 py-1 bg-transparent border-none focus:outline-none focus:ring-2 ${ringColor} rounded-md ${textStyle}`}
      />

      {/* 마감일 배지 */}
      {todo.due_date && (
        <div
          className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md ml-2 ${getDueDateBadgeStyle()}`}
          title={`마감일: ${todo.due_date}`}
        >
          {dueDateStatus === "overdue" ? (
            <AlertCircle className="h-3 w-3" />
          ) : (
            <Calendar className="h-3 w-3" />
          )}
          <span>{getDueDateText()}</span>
        </div>
      )}

      {/* 삭제 버튼 */}
      <button
        onClick={onDelete}
        className={`ml-2 p-1.5 rounded-full ${
          isHovered || isDragged ? "opacity-100" : "opacity-0"
        } hover:bg-red-100 text-red-500 transition-all duration-200`}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
