"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import CircularProgress from "@mui/material/CircularProgress";
import { useTodos } from "@/hooks/dashboard/useTodos";
import { Skeleton } from "@mui/material";
import { Plus, Trash2, CheckCircle, Circle, GripVertical } from "lucide-react";

// 타입 정의
interface Todo {
  id: string;
  user_id: string;
  content: string;
  is_completed: boolean;
  due_date: string | null;
  start_date: string | null;
  sort_order: number;
}

export default function TodoList({ userId }: { userId: string }) {
  const {
    todos,
    isLoading,
    isAdding,
    deletingTodoId,
    addTodo,
    updateTodo,
    toggleComplete,
    deleteTodo,
    updateTodoOrder,
  } = useTodos(userId);

  const [editingTodos, setEditingTodos] = useState<{ [key: string]: string }>(
    {}
  );
  const debouncedContent = useDebounce(editingTodos, 300);
  const [hoveredTodo, setHoveredTodo] = useState<string | null>(null);
  const [localTodos, setLocalTodos] = useState<Todo[]>([]);

  // 드래그 중인 항목 상태
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTodoId, setDraggedTodoId] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<
    "incomplete" | "complete" | null
  >(null);

  // 로컬 상태 초기화
  useEffect(() => {
    if (todos) {
      // sort_order에 따라 정렬
      const sortedTodos = [...todos].sort(
        (a, b) => a.sort_order - b.sort_order
      );
      setLocalTodos(sortedTodos);
    }
  }, [todos]);

  // 자동 저장 (useDebounce 적용)
  useEffect(() => {
    for (const id in debouncedContent) {
      updateTodo(id, debouncedContent[id]);
    }
  }, [debouncedContent, updateTodo]);

  const handleContentChange = (id: string, newContent: string) => {
    setEditingTodos((prev) => ({ ...prev, [id]: newContent }));
  };

  // 드래그 시작 핸들러
  const handleDragStart = (todoId: string) => {
    setIsDragging(true);
    setDraggedTodoId(todoId);
  };

  // 드래그 종료 핸들러
  const handleDragEnd = () => {
    if (draggedTodoId && dragOverSection) {
      const todo = localTodos.find((t) => t.id === draggedTodoId);
      if (todo) {
        // 섹션 간 이동 시 완료 상태 변경
        if (
          (todo.is_completed && dragOverSection === "incomplete") ||
          (!todo.is_completed && dragOverSection === "complete")
        ) {
          toggleComplete(todo.id, todo.is_completed);

          // 로컬 상태 업데이트
          const updatedTodos = localTodos.map((t) =>
            t.id === todo.id ? { ...t, is_completed: !t.is_completed } : t
          );

          // 순서 업데이트
          const reorderedTodos = updateSortOrder(updatedTodos);
          setLocalTodos(reorderedTodos);

          // API 호출로 순서 업데이트
          updateTodoOrder(reorderedTodos);
        }
      }
    }

    // 상태 초기화
    setIsDragging(false);
    setDraggedTodoId(null);
    setDragOverSection(null);
  };

  // 드래그 오버 핸들러
  const handleDragOver = (
    section: "incomplete" | "complete",
    e: React.DragEvent
  ) => {
    e.preventDefault();
    setDragOverSection(section);
  };

  // 순서 업데이트 함수
  const updateSortOrder = (todos: Todo[]): Todo[] => {
    // 진행 중인 할 일과 완료된 할 일 분리
    const incompleteTodos = todos.filter((todo) => !todo.is_completed);
    const completedTodos = todos.filter((todo) => todo.is_completed);

    // 각 그룹 내에서 순서 재할당
    const updatedIncompleteTodos = incompleteTodos.map((todo, index) => ({
      ...todo,
      sort_order: index + 1,
    }));

    const updatedCompletedTodos = completedTodos.map((todo, index) => ({
      ...todo,
      sort_order: index + 1 + updatedIncompleteTodos.length, // 진행 중인 할 일 다음부터 순서 시작
    }));

    // 두 그룹 합치기
    return [...updatedIncompleteTodos, ...updatedCompletedTodos];
  };

  // 완료된 할 일과 진행 중인 할 일 분리
  const completedTodos = localTodos?.filter((todo) => todo.is_completed) || [];
  const incompleteTodos =
    localTodos?.filter((todo) => !todo.is_completed) || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton variant="text" width={150} height={30} />
          <Skeleton variant="text" width={80} height={30} />
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rounded" height={50} />
        ))}
      </div>
    );
  }

  // 할 일이 없을 때
  if (!localTodos || localTodos.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 진행 중인 할 일 (비어있음) */}
        <div
          className="border border-slate-200 rounded-md"
          onDragOver={(e) => handleDragOver("incomplete", e)}
        >
          <div className="flex justify-between items-center p-3 border-b border-slate-200">
            <h3 className="text-xs font-medium text-slate-500 flex items-center">
              <Circle className="h-4 w-4 text-indigo-500 mr-1" />
              진행 중 (0)
            </h3>
            <button
              onClick={addTodo}
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
          </div>
          <div className="flex flex-col items-center justify-center h-32 text-slate-400">
            <p>진행 중인 할 일이 없습니다</p>
          </div>
        </div>

        {/* 완료된 할 일 (비어있음) */}
        <div
          className="border border-slate-200 rounded-md"
          onDragOver={(e) => handleDragOver("complete", e)}
        >
          <div className="p-3 border-b border-slate-200">
            <h3 className="text-xs font-medium text-slate-500 flex items-center">
              <CheckCircle className="h-4 w-4 text-emerald-500 mr-1" />
              완료됨 (0)
            </h3>
          </div>
          <div className="flex flex-col items-center justify-center h-32 text-slate-400">
            <p>완료된 할 일이 없습니다</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 진행 중인 할 일 */}
      <div
        className="border border-slate-200 rounded-md"
        onDragOver={(e) => handleDragOver("incomplete", e)}
      >
        <div className="flex justify-between items-center p-3 border-b border-slate-200">
          <h3 className="text-xs font-medium text-slate-500 flex items-center">
            <Circle className="h-4 w-4 text-indigo-500 mr-1" />
            진행 중 ({incompleteTodos.length})
          </h3>
          <button
            onClick={addTodo}
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
        </div>
        <div
          className={`space-y-2 p-2 min-h-[200px] ${
            dragOverSection === "incomplete" ? "bg-indigo-50/30 rounded-lg" : ""
          }`}
        >
          {incompleteTodos.map((todo) => (
            <div
              key={todo.id}
              draggable
              onDragStart={() => handleDragStart(todo.id)}
              onDragEnd={handleDragEnd}
              className={`flex items-center p-3 bg-white rounded-lg border ${
                draggedTodoId === todo.id
                  ? "border-indigo-400 shadow-md opacity-50"
                  : "border-slate-200 hover:border-indigo-300"
              } transition-all duration-200`}
              onMouseEnter={() => setHoveredTodo(todo.id)}
              onMouseLeave={() => setHoveredTodo(null)}
            >
              {/* 드래그 핸들 */}
              <div className="flex-shrink-0 mr-2 cursor-grab text-slate-400 hover:text-indigo-500">
                <GripVertical className="h-5 w-5" />
              </div>

              {/* 체크박스 */}
              <button
                onClick={() => toggleComplete(todo.id, todo.is_completed)}
                className="flex-shrink-0 mr-3 text-slate-400 hover:text-indigo-600 transition-colors"
              >
                <Circle className="h-5 w-5" />
              </button>

              {/* 입력창 */}
              <input
                type="text"
                value={
                  editingTodos[todo.id] !== undefined
                    ? editingTodos[todo.id]
                    : todo.content
                }
                placeholder="할 일을 입력하세요..."
                onChange={(e) => handleContentChange(todo.id, e.target.value)}
                className="flex-grow px-2 py-1 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-indigo-300 rounded-md text-slate-700"
              />

              {/* 삭제 버튼 */}
              <button
                onClick={() => deleteTodo(todo.id)}
                className={`ml-2 p-1.5 rounded-full ${
                  hoveredTodo === todo.id || draggedTodoId === todo.id
                    ? "opacity-100"
                    : "opacity-0"
                } hover:bg-red-100 text-red-500 transition-all duration-200`}
                disabled={deletingTodoId === todo.id}
              >
                {deletingTodoId === todo.id ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}

          {incompleteTodos.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400">
              <p>진행 중인 할 일이 없습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* 완료된 할 일 */}
      <div
        className="border border-slate-200 rounded-md"
        onDragOver={(e) => handleDragOver("complete", e)}
      >
        <div className="p-3 border-b border-slate-200">
          <h3 className="text-xs font-medium text-slate-500 flex items-center">
            <CheckCircle className="h-4 w-4 text-emerald-500 mr-1" />
            완료됨 ({completedTodos.length})
          </h3>
        </div>
        <div
          className={`space-y-2 p-2 min-h-[200px] ${
            dragOverSection === "complete" ? "bg-emerald-50/30 rounded-lg" : ""
          }`}
        >
          {completedTodos.map((todo) => (
            <div
              key={todo.id}
              draggable
              onDragStart={() => handleDragStart(todo.id)}
              onDragEnd={handleDragEnd}
              className={`flex items-center p-3 bg-white rounded-lg border ${
                draggedTodoId === todo.id
                  ? "border-emerald-400 shadow-md opacity-50"
                  : "border-slate-200 hover:border-emerald-300"
              } transition-all duration-200`}
              onMouseEnter={() => setHoveredTodo(todo.id)}
              onMouseLeave={() => setHoveredTodo(null)}
            >
              {/* 드래그 핸들 */}
              <div className="flex-shrink-0 mr-2 cursor-grab text-slate-400 hover:text-emerald-500">
                <GripVertical className="h-5 w-5" />
              </div>

              {/* 체크박스 */}
              <button
                onClick={() => toggleComplete(todo.id, todo.is_completed)}
                className="flex-shrink-0 mr-3"
              >
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </button>

              {/* 입력창 */}
              <input
                type="text"
                value={
                  editingTodos[todo.id] !== undefined
                    ? editingTodos[todo.id]
                    : todo.content
                }
                placeholder="할 일을 입력하세요..."
                onChange={(e) => handleContentChange(todo.id, e.target.value)}
                className="flex-grow px-2 py-1 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-emerald-300 rounded-md text-slate-500 line-through"
              />

              {/* 삭제 버튼 */}
              <button
                onClick={() => deleteTodo(todo.id)}
                className={`ml-2 p-1.5 rounded-full ${
                  hoveredTodo === todo.id || draggedTodoId === todo.id
                    ? "opacity-100"
                    : "opacity-0"
                } hover:bg-red-100 text-red-500 transition-all duration-200`}
                disabled={deletingTodoId === todo.id}
              >
                {deletingTodoId === todo.id ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}

          {completedTodos.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400">
              <p>완료된 할 일이 없습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
