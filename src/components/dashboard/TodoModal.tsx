"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Circle,
  CheckCircle2,
  Calendar,
  Loader2,
  Clock,
  AlertCircle,
  CalendarClock,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";

interface Todo {
  id: string;
  user_id: string;
  content: string;
  is_completed: boolean;
  due_date: string | null;
  start_date: string | null;
  sort_order: number;
}

interface TodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  todos: Todo[];
  isLoading: boolean;
  isAdding: boolean;
  deletingTodoId: string | null;
  onAddTodo: () => Promise<void>;
  onUpdateTodo: (id: string, content: string, dueDate?: string | null) => Promise<void>;
  onToggleComplete: (id: string, currentState: boolean) => Promise<void>;
  onDeleteTodo: (id: string) => Promise<void>;
  onUpdateOrder: (newTodos: Todo[]) => Promise<void>;
}

// D-day 계산 및 스타일
function getDueDateInfo(dueDate: string | null): {
  text: string;
  color: string;
  bgColor: string;
  isOverdue: boolean;
  isDueToday: boolean;
  isDueSoon: boolean;
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
      color: "text-red-700",
      bgColor: "bg-red-100",
      isOverdue: true,
      isDueToday: false,
      isDueSoon: false,
    };
  } else if (diffDays === 0) {
    return {
      text: "오늘",
      color: "text-orange-700",
      bgColor: "bg-orange-100",
      isOverdue: false,
      isDueToday: true,
      isDueSoon: false,
    };
  } else if (diffDays <= 3) {
    return {
      text: `D-${diffDays}`,
      color: "text-amber-700",
      bgColor: "bg-amber-100",
      isOverdue: false,
      isDueToday: false,
      isDueSoon: true,
    };
  } else {
    return {
      text: `D-${diffDays}`,
      color: "text-slate-600",
      bgColor: "bg-slate-100",
      isOverdue: false,
      isDueToday: false,
      isDueSoon: false,
    };
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export default function TodoModal({
  isOpen,
  onClose,
  todos,
  isLoading,
  isAdding,
  deletingTodoId,
  onAddTodo,
  onUpdateTodo,
  onToggleComplete,
  onDeleteTodo,
  onUpdateOrder,
}: TodoModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editDueDate, setEditDueDate] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // 미완료/완료 분리 + 정렬 (기한 임박 순)
  const incompleteTodos = (todos || [])
    .filter((t) => !t.is_completed)
    .sort((a, b) => {
      // 기한 있는 것 우선, 기한 임박 순
      if (a.due_date && !b.due_date) return -1;
      if (!a.due_date && b.due_date) return 1;
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      return a.sort_order - b.sort_order;
    });
  const completedTodos = (todos || []).filter((t) => t.is_completed);

  // 긴급/오늘/임박 카운트
  const overdueCount = incompleteTodos.filter(t => getDueDateInfo(t.due_date)?.isOverdue).length;
  const dueTodayCount = incompleteTodos.filter(t => getDueDateInfo(t.due_date)?.isDueToday).length;
  const dueSoonCount = incompleteTodos.filter(t => getDueDateInfo(t.due_date)?.isDueSoon).length;

  // 편집 시작
  const startEditing = (todo: Todo) => {
    setEditingId(todo.id);
    setEditContent(todo.content);
    setEditDueDate(todo.due_date || "");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // 편집 완료
  const saveEdit = async () => {
    if (editingId) {
      await onUpdateTodo(editingId, editContent.trim(), editDueDate || null);
    }
    setEditingId(null);
    setEditContent("");
    setEditDueDate("");
    setShowDatePicker(null);
  };

  // 기한 설정
  const setDueDate = async (todoId: string, date: string | null) => {
    const todo = todos.find(t => t.id === todoId);
    if (todo) {
      await onUpdateTodo(todoId, todo.content, date);
    }
    setShowDatePicker(null);
  };

  // 순서 이동 (위/아래)
  const moveItem = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= incompleteTodos.length) return;

    const newTodos = [...incompleteTodos];
    [newTodos[index], newTodos[newIndex]] = [newTodos[newIndex], newTodos[index]];
    await onUpdateOrder(newTodos);
  };

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editingId) {
          setEditingId(null);
          setEditContent("");
          setEditDueDate("");
        } else if (showDatePicker) {
          setShowDatePicker(null);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, editingId, showDatePicker, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[1000] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <motion.div
          className="relative bg-white rounded-xl shadow-2xl w-full max-w-6xl mx-4 max-h-[90vh] flex flex-col"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-violet-600" />
              <h2 className="text-lg font-semibold text-slate-800">할 일 관리</h2>
              {/* 상태 배지 */}
              <div className="flex items-center gap-2">
                {overdueCount > 0 && (
                  <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                    <AlertCircle className="h-3 w-3" />
                    {overdueCount}
                  </span>
                )}
                {dueTodayCount > 0 && (
                  <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                    <Clock className="h-3 w-3" />
                    {dueTodayCount}
                  </span>
                )}
                {dueSoonCount > 0 && (
                  <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                    <CalendarClock className="h-3 w-3" />
                    {dueSoonCount}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          {/* Content - Split View */}
          <div className="flex-1 overflow-hidden grid grid-cols-2 divide-x divide-slate-200">
            {/* Left: 진행중 */}
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-3 bg-violet-50 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Circle className="h-4 w-4 text-violet-600" />
                  <h3 className="text-sm font-semibold text-violet-800">진행중</h3>
                  <span className="px-1.5 py-0.5 text-xs font-medium bg-violet-100 text-violet-700 rounded-full">
                    {incompleteTodos.length}
                  </span>
                </div>
                <button
                  onClick={onAddTodo}
                  disabled={isAdding}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white rounded-lg transition-colors"
                >
                  {isAdding ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Plus className="h-3 w-3" />
                  )}
                  추가
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 text-violet-600 animate-spin mb-3" />
                    <p className="text-sm text-slate-500">로딩 중...</p>
                  </div>
                ) : incompleteTodos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                    <CheckCircle2 className="h-8 w-8 mb-2 text-emerald-400" />
                    <p className="text-sm">모든 할 일을 완료했습니다!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {incompleteTodos.map((todo, index) => {
                      const dueDateInfo = getDueDateInfo(todo.due_date);
                      const isEditing = editingId === todo.id;

                      return (
                        <div
                          key={todo.id}
                          className={`group flex items-start gap-2 p-3 rounded-lg border transition-all ${
                            isEditing
                              ? "border-violet-300 bg-violet-50"
                              : dueDateInfo?.isOverdue
                              ? "border-red-200 bg-red-50/50"
                              : dueDateInfo?.isDueToday
                              ? "border-orange-200 bg-orange-50/50"
                              : "border-slate-200 hover:border-violet-200 hover:bg-slate-50"
                          }`}
                        >
                          {/* 순서 조절 */}
                          <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                            <button
                              onClick={() => moveItem(index, "up")}
                              disabled={index === 0}
                              className="p-0.5 rounded hover:bg-violet-100 disabled:opacity-30"
                            >
                              <ChevronUp className="h-3 w-3 text-slate-500" />
                            </button>
                            <button
                              onClick={() => moveItem(index, "down")}
                              disabled={index === incompleteTodos.length - 1}
                              className="p-0.5 rounded hover:bg-violet-100 disabled:opacity-30"
                            >
                              <ChevronDown className="h-3 w-3 text-slate-500" />
                            </button>
                          </div>

                          {/* 체크박스 */}
                          <button
                            onClick={() => onToggleComplete(todo.id, todo.is_completed)}
                            className="mt-0.5 p-1 rounded-full hover:bg-violet-100 transition-colors"
                          >
                            <Circle className="h-4 w-4 text-slate-400 hover:text-violet-600" />
                          </button>

                          {/* 내용 + 기한 */}
                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <div className="space-y-2">
                                <input
                                  ref={inputRef}
                                  type="text"
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveEdit();
                                    if (e.key === "Escape") {
                                      setEditingId(null);
                                      setEditContent("");
                                      setEditDueDate("");
                                    }
                                  }}
                                  className="w-full px-2 py-1 text-sm bg-white border border-violet-200 rounded outline-none focus:ring-1 focus:ring-violet-300"
                                  placeholder="할 일을 입력하세요"
                                />
                                <div className="flex items-center gap-2">
                                  <input
                                    type="date"
                                    value={editDueDate}
                                    onChange={(e) => setEditDueDate(e.target.value)}
                                    className="px-2 py-1 text-xs bg-white border border-slate-200 rounded outline-none focus:ring-1 focus:ring-violet-300"
                                  />
                                  <button
                                    onClick={saveEdit}
                                    className="px-2 py-1 text-xs font-medium bg-violet-600 text-white rounded hover:bg-violet-700"
                                  >
                                    저장
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingId(null);
                                      setEditContent("");
                                      setEditDueDate("");
                                    }}
                                    className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
                                  >
                                    취소
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div onClick={() => startEditing(todo)} className="cursor-text">
                                <p className={`text-sm ${todo.content ? "text-slate-700" : "text-slate-400 italic"}`}>
                                  {todo.content || "내용을 입력하세요"}
                                </p>
                                {dueDateInfo && (
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <Calendar className={`h-3 w-3 ${dueDateInfo.color}`} />
                                    <span className={`text-xs ${dueDateInfo.color}`}>
                                      {formatDate(todo.due_date)} ({dueDateInfo.text})
                                    </span>
                                  </div>
                                )}
                                {!todo.due_date && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowDatePicker(todo.id);
                                    }}
                                    className="flex items-center gap-1 mt-1 text-xs text-slate-400 hover:text-violet-600"
                                  >
                                    <Calendar className="h-3 w-3" />
                                    기한 설정
                                  </button>
                                )}
                              </div>
                            )}

                            {/* 날짜 선택 팝업 */}
                            {showDatePicker === todo.id && !isEditing && (
                              <div className="mt-2 p-2 bg-white border border-slate-200 rounded-lg shadow-lg">
                                <input
                                  ref={dateInputRef}
                                  type="date"
                                  className="px-2 py-1 text-xs border border-slate-200 rounded"
                                  onChange={(e) => setDueDate(todo.id, e.target.value)}
                                  autoFocus
                                />
                                <button
                                  onClick={() => setShowDatePicker(null)}
                                  className="ml-2 px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
                                >
                                  취소
                                </button>
                              </div>
                            )}
                          </div>

                          {/* 완료로 이동 */}
                          <button
                            onClick={() => onToggleComplete(todo.id, todo.is_completed)}
                            className="mt-0.5 p-1.5 rounded-lg hover:bg-emerald-100 bg-emerald-50 text-emerald-500 hover:text-emerald-600 transition-all"
                            title="완료로 이동"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </button>

                          {/* 삭제 */}
                          <button
                            onClick={() => onDeleteTodo(todo.id)}
                            disabled={deletingTodoId === todo.id}
                            className="mt-0.5 p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500 transition-all disabled:opacity-50"
                          >
                            {deletingTodoId === todo.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: 완료됨 */}
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border-b border-slate-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-emerald-800">완료됨</h3>
                <span className="px-1.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                  {completedTodos.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {completedTodos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                    <Circle className="h-8 w-8 mb-2" />
                    <p className="text-sm">완료된 할 일이 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {completedTodos.map((todo) => (
                      <div
                        key={todo.id}
                        className="group flex items-center gap-2 p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:border-slate-200 transition-all"
                      >
                        {/* 진행중으로 이동 */}
                        <button
                          onClick={() => onToggleComplete(todo.id, todo.is_completed)}
                          className="p-1.5 rounded-lg hover:bg-violet-100 bg-violet-50 text-violet-500 hover:text-violet-600 transition-all"
                          title="진행중으로 이동"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>

                        {/* 체크 아이콘 */}
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />

                        {/* 내용 */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-400 line-through truncate">
                            {todo.content}
                          </p>
                          {todo.due_date && (
                            <span className="text-xs text-slate-400">
                              {formatDate(todo.due_date)}
                            </span>
                          )}
                        </div>

                        {/* 삭제 */}
                        <button
                          onClick={() => onDeleteTodo(todo.id)}
                          disabled={deletingTodoId === todo.id}
                          className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500 transition-all disabled:opacity-50"
                        >
                          {deletingTodoId === todo.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 text-center">
            클릭하여 수정 • 화살표로 상태 이동 • 기한 설정으로 우선순위 관리
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
