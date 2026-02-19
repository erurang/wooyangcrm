"use client";

import { CheckCircle } from "lucide-react";
import TodoList from "@/components/dashboard/Todos";

interface UserTodoTabProps {
  userId: string;
}

export default function UserTodoTab({ userId }: UserTodoTabProps) {
  return (
    <div className="bg-white border border-slate-200 shadow-sm p-5 mx-5 mb-5 rounded-lg">
      <div className="flex items-center mb-6">
        <div className="bg-sky-50 p-2 rounded-md mr-3">
          <CheckCircle className="h-5 w-5 text-sky-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800">할 일 관리</h2>
      </div>

      <div className="rounded-lg">
        <TodoList userId={userId} />
      </div>
    </div>
  );
}
