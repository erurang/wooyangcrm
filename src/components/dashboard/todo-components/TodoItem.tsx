"use client";

import CircularProgress from "@mui/material/CircularProgress";
import { Trash2, CheckCircle, Circle, GripVertical } from "lucide-react";

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
      ? "border-indigo-400 shadow-md opacity-50"
      : "border-slate-200 hover:border-indigo-300";

  const hoverColor = isCompleted ? "hover:text-emerald-500" : "hover:text-indigo-500";
  const ringColor = isCompleted ? "focus:ring-emerald-300" : "focus:ring-indigo-300";
  const textStyle = isCompleted ? "text-slate-500 line-through" : "text-slate-700";

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
          isCompleted ? "" : "text-slate-400 hover:text-indigo-600 transition-colors"
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

      {/* 삭제 버튼 */}
      <button
        onClick={onDelete}
        className={`ml-2 p-1.5 rounded-full ${
          isHovered || isDragged ? "opacity-100" : "opacity-0"
        } hover:bg-red-100 text-red-500 transition-all duration-200`}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <CircularProgress size={16} color="inherit" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
