"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { DndContext, closestCorners, useDroppable } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import { useLoginUser } from "@/app/context/login";

interface AddTodoModalProps {
  onClose: () => void;
  onAdd: () => void;
  users: User[];
  login_user: User;
}

interface Todo {
  id: string;
  user_id: string;
  title: string;
  description: string;
  due_date: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  created_at: string;
  assigned_users?: User[];
  isMyTodo?: boolean;
}

interface User {
  id: string;
  name: string;
}

interface Todo {
  id: string;
  user_id: string;
  title: string;
  description: string;
  due_date: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  created_at: string;
  assigned_users?: User[];
  isMyTodo?: boolean;
}

const statuses = [
  { id: "todo", title: "할 일" },
  { id: "in_progress", title: "진행 중" },
  { id: "done", title: "완료" },
];

export default function KanbanPage() {
  const [myTodos, setMyTodos] = useState<Todo[]>([]);
  const [taggedTodos, setTaggedTodos] = useState<Todo[]>([]);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const user = useLoginUser();

  const fetchTodos = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("todos")
      .select(`*, todos_users(user_id, users(name))`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching todos:", error);
    } else {
      const myTasks = data
        .filter((todo) => todo.user_id === user.id)
        .map((todo) => ({
          ...todo,
          assigned_users: todo.todos_users.map((t: any) => ({
            id: t.user_id,
            name: t.users.name,
          })),
          isMyTodo: true,
        }));

      const taggedTasks = data
        .filter((todo) => todo.user_id !== user.id)
        .map((todo) => ({
          ...todo,
          assigned_users: todo.todos_users.map((t: any) => ({
            id: t.user_id,
            name: t.users.name,
          })),
          isMyTodo: false,
        }));

      setMyTodos(myTasks);
      setTaggedTodos(taggedTasks);
    }
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase.from("users").select("id, name");

    if (error) console.error("Error fetching users:", error);
    else setUsers(data || []);
  };

  useEffect(() => {
    fetchTodos();
    fetchUsers();
  }, [user?.id]);

  return (
    <div className="text-sm text-[#37352F]">
      <p className="mb-4 font-semibold">할일</p>
      <div className="flex mt-6">
        <div
          className="px-4 py-2 font-semibold cursor-pointer hover:bg-opacity-10 hover:bg-black hover:rounded-md"
          onClick={() => setIsAddModalOpen(true)}
        >
          <span className="mr-2">+</span>
          <span>추가</span>
        </div>
      </div>

      <DndContext
        collisionDetection={closestCorners}
        onDragEnd={() => fetchTodos()}
      >
        <div className="flex space-x-4 p-6 bg-gray-100 rounded-md">
          {statuses.map(({ id, title }) => (
            <KanbanColumn
              key={id}
              id={id}
              title={title}
              todos={myTodos.filter((t) => t.status === id)}
              onClick={setSelectedTodo}
            />
          ))}
        </div>

        <p className="my-4 font-semibold">태그된 할일</p>
        <div className="flex space-x-4 p-6 bg-gray-100 rounded-md">
          {statuses.map(({ id, title }) => (
            <KanbanColumn
              key={id}
              id={id}
              title={title}
              todos={taggedTodos.filter((t) => t.status === id)}
              onClick={setSelectedTodo}
            />
          ))}
        </div>
      </DndContext>
      {isAddModalOpen && (
        <AddTodoModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={fetchTodos}
          users={users}
          login_user={user?.id as any}
        />
      )}
      {/* {selectedTodo && (
        <EditTodoModal
          todo={selectedTodo}
          onClose={() => setSelectedTodo(null)}
          onSave={fetchTodos}
          isEditable={selectedTodo.isMyTodo} // ✅ 내 할 일만 수정 가능하도록 설정
        />
      )} */}
    </div>
  );
}

const KanbanColumn = ({
  id,
  title,
  todos,
  onClick,
}: {
  id: string;
  title: string;
  todos: Todo[];
  onClick: (todo: Todo) => void;
}) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className="w-1/3 bg-white p-4 rounded-md shadow-md">
      <h2 className="text-lg font-bold mb-2">{title}</h2>
      <SortableContext items={todos.map((todo) => todo.id)}>
        {todos.map((todo) => (
          <div
            key={todo.id}
            className="p-4 bg-gray-50 rounded-md shadow-md mb-2 hover:bg-gray-200 transition cursor-pointer"
            onClick={() => onClick(todo)}
          >
            <h3 className="font-semibold text-sm flex justify-between">
              {todo.title}{" "}
              <span className="text-gray-400">
                {todo.due_date?.slice(0, 10)}
              </span>
            </h3>
            <p className="text-sm text-gray-500">{todo.description}</p>
            <p className="text-xs text-gray-600 mt-1">
              - {todo.assigned_users?.map((user) => user.name).join(" ")}
            </p>
          </div>
        ))}
      </SortableContext>
    </div>
  );
};

function AddTodoModal({
  onClose,
  onAdd,
  users,
  login_user,
}: AddTodoModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const handleAdd = async () => {
    if (!title.trim()) {
      alert("제목을 입력하세요!");
      return;
    }

    // ✅ user_id를 현재 로그인한 사용자로 설정
    const { data, error } = await supabase
      .from("todos")
      .insert([
        {
          title,
          description,
          due_date: dueDate,
          priority,
          status: "todo",
          user_id: login_user.id,
        },
      ])
      .select("*")
      .single();

    if (error) {
      console.error("Error adding todo:", error);
      return;
    }

    // ✅ 태그된 유저를 따로 todos_users 테이블에 저장
    if (selectedUsers.length > 0) {
      await supabase.from("todos_users").insert(
        selectedUsers.map((userId) => ({
          todo_id: data.id,
          user_id: userId, // ❗ 여기에 태그한 유저 ID 저장
        }))
      );
    }

    onAdd();
    onClose();
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-md w-1/3 shadow-lg">
        <h2 className="text-xl font-bold mb-4">할 일 추가</h2>

        {/* 제목 입력 */}
        <label className="block mb-1 font-semibold">제목</label>
        <motion.input
          whileFocus={{
            scale: 1.05,
            boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
          }}
          className="w-full p-2 border border-gray-300 rounded-md mb-2"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* 설명 입력 */}
        <label className="block mb-1 font-semibold">내용</label>
        <motion.textarea
          whileFocus={{
            scale: 1.02,
            boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
          }}
          className="w-full p-2 border border-gray-300 rounded-md mb-2 resize-none"
          placeholder="설명을 입력하세요"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        {/* 유저 선택 */}
        <label className="block mb-1 font-semibold">유저 선택</label>
        <div className="border p-2 rounded-md mb-2 max-h-32 overflow-y-auto">
          {users.length > 0 ? (
            users.map((user) => (
              <label key={user.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  value={user.id}
                  checked={selectedUsers.includes(user.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsers([...selectedUsers, user.id]);
                    } else {
                      setSelectedUsers(
                        selectedUsers.filter((id) => id !== user.id)
                      );
                    }
                  }}
                />
                <span>{user.name}</span>
              </label>
            ))
          ) : (
            <p className="text-gray-500 text-sm">추가할 유저가 없습니다.</p>
          )}
        </div>

        {/* 중요도 선택 */}
        <label className="block mb-1 font-semibold">중요도</label>
        <motion.select
          whileFocus={{
            scale: 1.02,
            boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
          }}
          className="w-full p-2 border border-gray-300 rounded-md mb-2"
          value={priority}
          onChange={(e) =>
            setPriority(e.target.value as "low" | "medium" | "high")
          }
        >
          <option value="low">낮음</option>
          <option value="medium">보통</option>
          <option value="high">높음</option>
        </motion.select>

        {/* 마감일 선택 */}
        <label className="block mb-1 font-semibold">마감일</label>
        <motion.input
          type="date"
          whileFocus={{
            scale: 1.05,
            boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
          }}
          className="w-full p-2 border border-gray-300 rounded-md mb-4"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        {/* 버튼 */}
        <div className="flex justify-between">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-md"
            onClick={handleAdd}
          >
            추가
          </button>
          <button
            className="px-4 py-2 bg-gray-500 text-white rounded-md"
            onClick={onClose}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

function EditTodoModal({
  todo,
  onClose,
  onSave,
  isEditable,
}: {
  todo: Todo;
  onClose: () => void;
  onSave: () => void;
  isEditable: boolean;
}) {
  const [title, setTitle] = useState(todo.title);
  const [description, setDescription] = useState(todo.description);
  const [dueDate, setDueDate] = useState(todo.due_date);
  const [priority, setPriority] = useState<"low" | "medium" | "high">(
    todo.priority
  );

  const handleSave = async () => {
    if (!isEditable) return; // ✅ 태그된 유저는 수정 불가능

    const { error } = await supabase
      .from("todos")
      .update({ title, description, due_date: dueDate, priority })
      .eq("id", todo.id);

    if (error) {
      console.error("Error updating todo:", error);
      return;
    }

    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-md w-1/3 shadow-lg">
        <h2 className="text-xl font-bold mb-4">할 일 수정</h2>

        <label className="block mb-1">제목</label>
        <motion.input
          whileFocus={{
            scale: 1.05,
            boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
          }}
          className="w-full p-2 border border-gray-300 rounded-md mb-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!isEditable} // ✅ 수정 가능 여부 체크
        />

        <label className="block mb-1">내용</label>
        <motion.textarea
          whileFocus={{
            scale: 1.02,
            boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
          }}
          className="w-full p-2 border border-gray-300 rounded-md mb-2 resize-none"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          disabled={!isEditable}
        />

        <label className="block mb-1">마감일</label>
        <motion.input
          type="date"
          whileFocus={{
            scale: 1.05,
            boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
          }}
          className="w-full p-2 border border-gray-300 rounded-md mb-2"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          disabled={!isEditable}
        />

        <div className="flex justify-between mt-4">
          {isEditable ? (
            <>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md"
                onClick={handleSave}
              >
                저장
              </button>
              <button
                className="px-4 py-2 bg-gray-500 text-white rounded-md"
                onClick={onClose}
              >
                닫기
              </button>
            </>
          ) : (
            <button
              className="px-4 py-2 bg-gray-500 text-white rounded-md w-full"
              onClick={onClose}
            >
              닫기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
