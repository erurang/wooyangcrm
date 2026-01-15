"use client";

import { CheckCircle } from "lucide-react";
import { useDashboard } from "@/context/dashboard";
import TodoList from "@/components/dashboard/Todos";

export default function DashboardTodoPage() {
  const { userId } = useDashboard();

  return (
    <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-lg">
      <div className="flex items-center mb-6">
        <div className="bg-indigo-50 p-2 rounded-md mr-3">
          <CheckCircle className="h-5 w-5 text-indigo-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800">할 일 관리</h2>
      </div>

      <div className="rounded-lg">
        <TodoList userId={userId} />
      </div>
    </div>
  );
}
