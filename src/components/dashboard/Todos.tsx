"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Skeleton } from "@mui/material";
import { useTodos } from "@/hooks/dashboard/useTodos";
import { TodoSection } from "./todo-components";

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

  const [editingTodos, setEditingTodos] = useState<{ [key: string]: string }>({});
  const debouncedContent = useDebounce(editingTodos, 300);
  const [hoveredTodo, setHoveredTodo] = useState<string | null>(null);
  const [localTodos, setLocalTodos] = useState<Todo[]>([]);

  const [draggedTodoId, setDraggedTodoId] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<
    "incomplete" | "complete" | null
  >(null);

  useEffect(() => {
    if (todos) {
      const sortedTodos = [...todos].sort((a, b) => a.sort_order - b.sort_order);
      setLocalTodos(sortedTodos);
    }
  }, [todos]);

  useEffect(() => {
    for (const id in debouncedContent) {
      updateTodo(id, debouncedContent[id]);
    }
  }, [debouncedContent, updateTodo]);

  const handleContentChange = (id: string, newContent: string) => {
    setEditingTodos((prev) => ({ ...prev, [id]: newContent }));
  };

  const handleDragStart = (todoId: string) => {
    setDraggedTodoId(todoId);
  };

  const handleDragEnd = () => {
    if (draggedTodoId && dragOverSection) {
      const todo = localTodos.find((t) => t.id === draggedTodoId);
      if (todo) {
        if (
          (todo.is_completed && dragOverSection === "incomplete") ||
          (!todo.is_completed && dragOverSection === "complete")
        ) {
          toggleComplete(todo.id, todo.is_completed);

          const updatedTodos = localTodos.map((t) =>
            t.id === todo.id ? { ...t, is_completed: !t.is_completed } : t
          );

          const reorderedTodos = updateSortOrder(updatedTodos);
          setLocalTodos(reorderedTodos);
          updateTodoOrder(reorderedTodos);
        }
      }
    }

    setDraggedTodoId(null);
    setDragOverSection(null);
  };

  const handleDragOver = (section: "incomplete" | "complete", e: React.DragEvent) => {
    e.preventDefault();
    setDragOverSection(section);
  };

  const updateSortOrder = (todos: Todo[]): Todo[] => {
    const incompleteTodos = todos.filter((todo) => !todo.is_completed);
    const completedTodos = todos.filter((todo) => todo.is_completed);

    const updatedIncompleteTodos = incompleteTodos.map((todo, index) => ({
      ...todo,
      sort_order: index + 1,
    }));

    const updatedCompletedTodos = completedTodos.map((todo, index) => ({
      ...todo,
      sort_order: index + 1 + updatedIncompleteTodos.length,
    }));

    return [...updatedIncompleteTodos, ...updatedCompletedTodos];
  };

  const completedTodos = localTodos?.filter((todo) => todo.is_completed) || [];
  const incompleteTodos = localTodos?.filter((todo) => !todo.is_completed) || [];

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <TodoSection
        type="incomplete"
        todos={incompleteTodos}
        editingTodos={editingTodos}
        hoveredTodo={hoveredTodo}
        draggedTodoId={draggedTodoId}
        deletingTodoId={deletingTodoId}
        isDragOver={dragOverSection === "incomplete"}
        isAdding={isAdding}
        onAddTodo={addTodo}
        onDragOver={(e: React.DragEvent) => handleDragOver("incomplete", e)}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onMouseEnter={setHoveredTodo}
        onMouseLeave={() => setHoveredTodo(null)}
        onToggleComplete={toggleComplete}
        onContentChange={handleContentChange}
        onDelete={deleteTodo}
      />

      <TodoSection
        type="complete"
        todos={completedTodos}
        editingTodos={editingTodos}
        hoveredTodo={hoveredTodo}
        draggedTodoId={draggedTodoId}
        deletingTodoId={deletingTodoId}
        isDragOver={dragOverSection === "complete"}
        onDragOver={(e: React.DragEvent) => handleDragOver("complete", e)}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onMouseEnter={setHoveredTodo}
        onMouseLeave={() => setHoveredTodo(null)}
        onToggleComplete={toggleComplete}
        onContentChange={handleContentChange}
        onDelete={deleteTodo}
      />
    </div>
  );
}
