import useSWR, { mutate } from "swr";
import { useState } from "react";

interface Todo {
  id: string;
  content: string;
  is_completed: boolean;
  sort_order: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useTodos(userId: string) {
  const {
    data: todos,
    error,
    isLoading,
  } = useSWR(
    userId ? `/api/dashboard/todos?userId=${userId}` : null,
    fetcher
  );

  const [isAdding, setIsAdding] = useState(false);
  const [deletingTodoId, setDeletingTodoId] = useState<string | null>(null);

  // ✅ 할 일 추가 (로딩 UI 적용)
  const addTodo = async () => {
    setIsAdding(true);
    const res = await fetch("/api/dashboard/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    setIsAdding(false);
    if (res.ok) mutate(`/api/dashboard/todos?userId=${userId}`);
  };

  // ✅ 할 일 수정 (자동 저장)
  const updateTodo = async (id: string, newContent: string) => {
    await fetch("/api/dashboard/todos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, content: newContent }),
    });

    mutate(`/api/dashboard/todos?userId=${userId}`);
  };

  // ✅ 체크박스 상태 변경
  const toggleComplete = async (id: string, currentState: boolean) => {
    await fetch("/api/dashboard/todos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_completed: !currentState }),
    });

    mutate(`/api/dashboard/todos?userId=${userId}`);
  };

  // ✅ 할 일 삭제 (로딩 UI 적용)
  const deleteTodo = async (id: string) => {
    setDeletingTodoId(id);
    await fetch("/api/dashboard/todos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    setDeletingTodoId(null);
    mutate(`/api/dashboard/todos?userId=${userId}`);
  };

  const updateTodoOrder = async (newTodos: Todo[]) => {
    const orderedTodos = newTodos.map((todo, index) => ({
      id: todo.id,
      sort_order: index + 1,
    }));

    await fetch(`/api/dashboard/todos/order`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ todos: orderedTodos }),
    });

    mutate(`/api/dashboard/todos?userId=${userId}`);
  };

  return {
    todos,
    isLoading,
    isAdding,
    deletingTodoId,
    error,
    addTodo,
    updateTodo,
    toggleComplete,
    deleteTodo,
    updateTodoOrder,
  };
}
