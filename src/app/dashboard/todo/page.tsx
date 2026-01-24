"use client";

import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { useDashboard } from "@/context/dashboard";
import TodoList from "@/components/dashboard/Todos";

export default function DashboardTodoPage() {
  const { userId } = useDashboard();

  return (
    <motion.div
      className="bg-white border border-slate-200 shadow-sm p-5 rounded-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="flex items-center mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <div className="bg-indigo-50 p-2 rounded-md mr-3">
          <CheckCircle className="h-5 w-5 text-indigo-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800">할 일 관리</h2>
      </motion.div>

      <motion.div
        className="rounded-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <TodoList userId={userId} />
      </motion.div>
    </motion.div>
  );
}
