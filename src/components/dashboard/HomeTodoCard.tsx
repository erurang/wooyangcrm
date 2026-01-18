"use client";

import { Circle, CheckCircle2, Calendar } from "lucide-react";
import { formatDateKST } from "@/utils/dateUtils";

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

export function HomeTodoCard({ todo, onToggleComplete }: HomeTodoCardProps) {
  const isOverdue = todo.due_date && new Date(todo.due_date) < new Date() && !todo.is_completed;

  return (
    <div
      className={`
        relative bg-white border rounded-lg p-4 cursor-pointer
        transition-all hover:shadow-md hover:border-violet-200
        ${isOverdue ? "border-red-200 bg-red-50" : "border-slate-200"}
      `}
      onClick={() => onToggleComplete(todo.id, todo.is_completed)}
    >
      <div className="flex items-start gap-3">
        <button
          className={`
            flex-shrink-0 mt-0.5 transition-colors
            ${todo.is_completed
              ? "text-green-500 hover:text-green-600"
              : isOverdue
                ? "text-red-400 hover:text-red-500"
                : "text-slate-300 hover:text-violet-500"
            }
          `}
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(todo.id, todo.is_completed);
          }}
        >
          {todo.is_completed ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <Circle className="h-5 w-5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`
            text-sm font-medium line-clamp-2
            ${todo.is_completed ? "text-slate-400 line-through" : "text-slate-700"}
          `}>
            {todo.content}
          </p>

          {todo.due_date && (
            <div className={`
              flex items-center gap-1 mt-2 text-xs
              ${isOverdue ? "text-red-500" : "text-slate-400"}
            `}>
              <Calendar className="h-3 w-3" />
              <span>{formatDateKST(todo.due_date)}</span>
              {isOverdue && <span className="font-medium">(지남)</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
