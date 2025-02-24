import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import CircularProgress from "@mui/material/CircularProgress"; // ✅ MUI 로딩 추가
import { useTodos } from "@/hooks/dashboard/useTodos";
import { Skeleton } from "@mui/material";

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
  } = useTodos(userId);

  const [editingTodos, setEditingTodos] = useState<{ [key: string]: string }>(
    {}
  );
  const debouncedContent = useDebounce(editingTodos, 300);

  // ✅ 자동 저장 (useDebounce 적용)
  useEffect(() => {
    for (const id in debouncedContent) {
      updateTodo(id, debouncedContent[id]);
    }
  }, [debouncedContent]);

  const handleContentChange = (id: string, newContent: string) => {
    setEditingTodos((prev) => ({ ...prev, [id]: newContent }));
  };

  if (isLoading) return <Skeleton style={{ height: "16rem", width: "100%" }} />;

  return (
    <div className="p-4 rounded-md border bg-[#FBFBFB]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-md">할 일 체크리스트</h2>

        {/* ✅ 추가 버튼 클릭 시 로딩 UI */}
        <button
          onClick={addTodo}
          className="text-blue-500 font-semibold text-sm flex items-center"
          disabled={isAdding}
        >
          {isAdding ? (
            <CircularProgress size={16} color="inherit" className="mr-2" />
          ) : null}
          + 추가
        </button>
      </div>

      <ul className="space-y-2">
        {todos?.map((todo: any, index: any) => (
          <li
            key={todo.id}
            className={`flex justify-between items-center pb-2 ${
              index !== todos.length - 1 ? "border-b" : ""
            }`}
          >
            {/* ✅ 체크박스 */}
            <input
              type="checkbox"
              checked={todo.is_completed}
              onChange={() => toggleComplete(todo.id, todo.is_completed)}
              className="w-5 h-5"
            />

            {/* 📝 입력창 (자동 저장) */}
            <input
              type="text"
              value={editingTodos[todo.id] ?? todo.content}
              placeholder="할 일을 입력하세요..."
              onChange={(e) => handleContentChange(todo.id, e.target.value)}
              className="border-none focus:outline-none w-full bg-transparent pl-2"
            />

            {/* ✅ 삭제 버튼 클릭 시 로딩 UI */}
            <button
              onClick={() => deleteTodo(todo.id)}
              className="text-red-500 text-sm w-8 ml-4 flex justify-center items-center"
              disabled={deletingTodoId === todo.id}
            >
              {deletingTodoId === todo.id ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                "삭제"
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
