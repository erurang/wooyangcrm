"use client";

import type React from "react";
import CircularProgress from "@mui/material/CircularProgress";
import { Plus, CheckCircle, Circle } from "lucide-react";
import TodoItem from "./TodoItem";

interface Todo {
  id: string;
  user_id: string;
  content: string;
  is_completed: boolean;
  due_date: string | null;
  start_date: string | null;
  sort_order: number;
}

interface TodoSectionProps {
  type: "incomplete" | "complete";
  todos: Todo[];
  editingTodos: { [key: string]: string };
  hoveredTodo: string | null;
  draggedTodoId: string | null;
  deletingTodoId: string | null;
  isDragOver: boolean;
  isAdding?: boolean;
  onAddTodo?: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragStart: (todoId: string) => void;
  onDragEnd: () => void;
  onMouseEnter: (todoId: string) => void;
  onMouseLeave: () => void;
  onToggleComplete: (todoId: string, isCompleted: boolean) => void;
  onContentChange: (todoId: string, content: string) => void;
  onDelete: (todoId: string) => void;
}

export default function TodoSection({
  type,
  todos,
  editingTodos,
  hoveredTodo,
  draggedTodoId,
  deletingTodoId,
  isDragOver,
  isAdding,
  onAddTodo,
  onDragOver,
  onDragStart,
  onDragEnd,
  onMouseEnter,
  onMouseLeave,
  onToggleComplete,
  onContentChange,
  onDelete,
}: TodoSectionProps) {
  const isComplete = type === "complete";

  const headerIcon = isComplete ? (
    <CheckCircle className="h-4 w-4 text-emerald-500 mr-1" />
  ) : (
    <Circle className="h-4 w-4 text-indigo-500 mr-1" />
  );

  const headerTitle = isComplete
    ? `완료됨 (${todos.length})`
    : `진행 중 (${todos.length})`;

  const emptyMessage = isComplete
    ? "완료된 할 일이 없습니다"
    : "진행 중인 할 일이 없습니다";

  const dragOverClass = isDragOver
    ? isComplete
      ? "bg-emerald-50/30 rounded-lg"
      : "bg-indigo-50/30 rounded-lg"
    : "";

  return (
    <div
      className="border border-slate-200 rounded-md"
      onDragOver={onDragOver}
    >
      <div className="flex justify-between items-center p-3 border-b border-slate-200">
        <h3 className="text-xs font-medium text-slate-500 flex items-center">
          {headerIcon}
          {headerTitle}
        </h3>
        {!isComplete && onAddTodo && (
          <button
            onClick={onAddTodo}
            className="flex items-center px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors disabled:opacity-70"
            disabled={isAdding}
          >
            {isAdding ? (
              <CircularProgress size={12} color="inherit" className="mr-1" />
            ) : (
              <Plus className="h-3 w-3 mr-1" />
            )}
            추가
          </button>
        )}
      </div>
      <div className={`space-y-2 p-2 min-h-[200px] ${dragOverClass}`}>
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            isCompleted={isComplete}
            editingContent={editingTodos[todo.id]}
            isHovered={hoveredTodo === todo.id}
            isDragged={draggedTodoId === todo.id}
            isDeleting={deletingTodoId === todo.id}
            onDragStart={() => onDragStart(todo.id)}
            onDragEnd={onDragEnd}
            onMouseEnter={() => onMouseEnter(todo.id)}
            onMouseLeave={onMouseLeave}
            onToggleComplete={() => onToggleComplete(todo.id, todo.is_completed)}
            onContentChange={(content) => onContentChange(todo.id, content)}
            onDelete={() => onDelete(todo.id)}
          />
        ))}

        {todos.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400">
            <p>{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}
