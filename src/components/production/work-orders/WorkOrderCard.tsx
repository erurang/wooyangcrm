"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  User,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ChevronRight
} from "lucide-react";
import type { WorkOrder } from "@/types/production";

interface WorkOrderCardProps {
  workOrder: WorkOrder;
  onClick: () => void;
  currentUserId?: string;
}

const statusConfig = {
  pending: { label: "대기", color: "bg-slate-100 text-slate-600", icon: Clock },
  in_progress: { label: "진행중", color: "bg-blue-100 text-blue-600", icon: AlertCircle },
  completed: { label: "완료", color: "bg-green-100 text-green-600", icon: CheckCircle2 },
  canceled: { label: "취소됨", color: "bg-red-100 text-red-600", icon: XCircle },
};

const deadlineLabels: Record<string, string> = {
  none: "기한 없음",
  today: "오늘까지",
  tomorrow: "내일까지",
  this_week: "이번주까지",
  custom: "기한 설정됨",
};

export default function WorkOrderCard({ workOrder, onClick, currentUserId }: WorkOrderCardProps) {
  const status = statusConfig[workOrder.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const totalAssignees = workOrder.assignees?.length || 0;

  // 현재 사용자가 담당자인지 확인
  const isAssignee = workOrder.assignees?.some((a) => a.user_id === currentUserId);
  const myAssignment = workOrder.assignees?.find((a) => a.user_id === currentUserId);

  // 기한 표시
  const getDeadlineDisplay = () => {
    if (workOrder.deadline_type === "none") return null;
    if (workOrder.deadline_type === "custom" && workOrder.deadline_end) {
      const endDate = new Date(workOrder.deadline_end);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return { text: "기한 초과", isOverdue: true };
      if (diffDays === 0) return { text: "오늘까지", isUrgent: true };
      if (diffDays === 1) return { text: "내일까지", isUrgent: true };
      return { text: `D-${diffDays}`, isUrgent: false };
    }
    return { text: deadlineLabels[workOrder.deadline_type], isUrgent: workOrder.deadline_type === "today" };
  };

  const deadline = getDeadlineDisplay();

  return (
    <motion.div
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-purple-200 transition-all cursor-pointer"
      whileHover={{ y: -2 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${status.color}`}>
              <StatusIcon className="inline h-3 w-3 mr-1" />
              {status.label}
            </span>
            {deadline && (
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                deadline.isOverdue ? "bg-red-100 text-red-600" :
                deadline.isUrgent ? "bg-orange-100 text-orange-600" :
                "bg-slate-100 text-slate-600"
              }`}>
                <Calendar className="inline h-3 w-3 mr-1" />
                {deadline.text}
              </span>
            )}
            {isAssignee && (
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                myAssignment?.is_completed ? "bg-green-100 text-green-600" : "bg-purple-100 text-purple-600"
              }`}>
                {myAssignment?.is_completed ? "완료함" : "담당중"}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-slate-800 line-clamp-1">{workOrder.title}</h3>
        </div>
        <ChevronRight className="h-5 w-5 text-slate-300" />
      </div>

      {/* Content preview */}
      {workOrder.content && (
        <p className="text-sm text-slate-500 line-clamp-2 mb-3">{workOrder.content}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {workOrder.requester?.name || "알 수 없음"}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {totalAssignees}명
          </span>
        </div>
        <span>
          {new Date(workOrder.created_at).toLocaleDateString("ko-KR")}
        </span>
      </div>
    </motion.div>
  );
}
