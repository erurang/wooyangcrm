"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  User,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Edit2,
  Trash2,
  UserPlus,
  Check,
  X,
  History,
  FileText,
} from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useWorkOrder, useWorkOrderLogs } from "@/hooks/production/useWorkOrder";
import { useUsersList } from "@/hooks/useUserList";
import WorkOrderFormModal from "@/components/production/work-orders/WorkOrderFormModal";
import type { WorkOrderCreateRequest } from "@/types/production";

const statusConfig = {
  pending: { label: "대기", color: "bg-slate-100 text-slate-700 border-slate-200", icon: Clock },
  in_progress: { label: "진행중", color: "bg-sky-100 text-sky-700 border-sky-200", icon: AlertCircle },
  completed: { label: "완료", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
  canceled: { label: "취소됨", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
};

const actionLabels: Record<string, string> = {
  created: "작업지시 생성",
  edited: "내용 수정",
  status_changed: "상태 변경",
  assignee_added: "담당자 추가",
  assignee_removed: "담당자 제거",
  assignee_completed: "담당자 완료",
  file_added: "파일 추가",
  canceled: "작업지시 취소",
};

export default function WorkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const user = useLoginUser();
  const { users } = useUsersList();

  const {
    workOrder,
    isLoading,
    updateWorkOrder,
    deleteWorkOrder,
    addAssignee,
    removeAssignee,
    completeAssignee,
    cancelWorkOrder,
    refresh,
  } = useWorkOrder(id);

  const { logs } = useWorkOrderLogs(id);

  // UI States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddAssigneeOpen, setIsAddAssigneeOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-slate-500">작업지시를 찾을 수 없습니다</p>
        <button
          onClick={() => router.push("/production/work-orders")}
          className="text-purple-600 hover:underline"
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const status = statusConfig[workOrder.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const isMyWorkOrder = workOrder.assignees?.some((a) => a.user_id === user?.id);
  const myAssignment = workOrder.assignees?.find((a) => a.user_id === user?.id);
  const isRequester = workOrder.requester_id === user?.id;
  const canEdit = isRequester && workOrder.status !== "completed" && workOrder.status !== "canceled";


  // Handlers
  const handleUpdate = async (data: WorkOrderCreateRequest) => {
    setIsSubmitting(true);
    try {
      await updateWorkOrder({
        title: data.title,
        content: data.content,
        deadline_type: data.deadline_type,
        deadline_start: data.deadline_start,
        deadline_end: data.deadline_end,
        completion_type: data.completion_type,
        completion_threshold: data.completion_threshold,
        updated_by: user?.id,
      });
      setIsEditModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!user?.id) return;
    setIsSubmitting(true);
    try {
      await completeAssignee(user.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAssignee = async (userId: string) => {
    setIsSubmitting(true);
    try {
      await addAssignee(userId, user?.id);
      setIsAddAssigneeOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAssignee = async (userId: string) => {
    if (!confirm("담당자를 제거하시겠습니까?")) return;
    setIsSubmitting(true);
    try {
      await removeAssignee(userId);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!user?.id) return;
    setIsSubmitting(true);
    try {
      await cancelWorkOrder(user.id, cancelReason);
      setIsCancelModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("작업지시를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    setIsSubmitting(true);
    try {
      await deleteWorkOrder();
      router.push("/production/work-orders");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Available users for adding (not already assigned)
  const availableUsers = users.filter(
    (u: { id: string }) => !workOrder.assignees?.some((a) => a.user_id === u.id)
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/production/work-orders")}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>목록으로</span>
            </button>
            {canEdit && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setIsCancelModalOpen(true)}
                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                >
                  <XCircle className="h-5 w-5" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-4"
        >
          {/* Status Bar */}
          <div className={`h-2 ${
            workOrder.status === "completed" ? "bg-green-500" :
            workOrder.status === "in_progress" ? "bg-sky-500" :
            workOrder.status === "canceled" ? "bg-red-500" : "bg-slate-300"
          }`} />

          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-3 py-1 text-sm font-medium rounded-lg border ${status.color}`}>
                    <StatusIcon className="inline h-4 w-4 mr-1" />
                    {status.label}
                  </span>
                  {workOrder.deadline_type !== "none" && (
                    <span className="px-3 py-1 text-sm font-medium rounded-lg bg-slate-100 text-slate-600">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      {workOrder.deadline_end
                        ? new Date(workOrder.deadline_end).toLocaleDateString("ko-KR")
                        : workOrder.deadline_type}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-slate-800">{workOrder.title}</h1>
              </div>
            </div>

            {/* Requester & Date */}
            <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                요청자: {workOrder.requester?.name || "알 수 없음"}
              </span>
              <span>
                {new Date(workOrder.created_at).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {/* Content */}
            {workOrder.content && (
              <div className="bg-slate-50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <FileText className="h-4 w-4" />
                  내용
                </div>
                <p className="text-slate-600 whitespace-pre-wrap">{workOrder.content}</p>
              </div>
            )}

            {/* My Complete Button */}
            {isMyWorkOrder && !myAssignment?.is_completed && workOrder.status !== "completed" && workOrder.status !== "canceled" && (
              <button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check className="h-5 w-5" />
                내 작업 완료하기
              </button>
            )}
          </div>
        </motion.div>

        {/* Assignees Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-slate-200 p-6 mb-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              담당자
            </h2>
            {canEdit && (
              <button
                onClick={() => setIsAddAssigneeOpen(!isAddAssigneeOpen)}
                className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
              >
                <UserPlus className="h-4 w-4" />
                담당자 추가
              </button>
            )}
          </div>

          {/* Add Assignee Dropdown */}
          {isAddAssigneeOpen && (
            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-2">추가할 담당자를 선택하세요</p>
              <div className="flex flex-wrap gap-2">
                {availableUsers.length === 0 ? (
                  <p className="text-sm text-slate-400">추가 가능한 사용자가 없습니다</p>
                ) : (
                  availableUsers.map((u: { id: string; name: string }) => (
                    <button
                      key={u.id}
                      onClick={() => handleAddAssignee(u.id)}
                      className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-full hover:border-purple-300 hover:bg-purple-50 transition-colors"
                    >
                      {u.name}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Assignees List */}
          <div className="space-y-2">
            {workOrder.assignees?.map((assignee) => (
              <div
                key={assignee.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  assignee.is_completed
                    ? "bg-green-50 border-green-200"
                    : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    assignee.is_completed ? "bg-green-500" : "bg-slate-200"
                  }`}>
                    {assignee.is_completed ? (
                      <Check className="h-4 w-4 text-white" />
                    ) : (
                      <User className="h-4 w-4 text-slate-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{assignee.user?.name || "알 수 없음"}</p>
                    {assignee.is_completed && assignee.completed_at && (
                      <p className="text-xs text-green-600">
                        {new Date(assignee.completed_at).toLocaleDateString("ko-KR")} 완료
                      </p>
                    )}
                  </div>
                </div>
                {canEdit && !assignee.is_completed && (
                  <button
                    onClick={() => handleRemoveAssignee(assignee.user_id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Activity Log Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <History className="h-5 w-5 text-purple-600" />
            활동 기록
          </h2>

          {logs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">활동 기록이 없습니다</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-3 text-sm">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                  <div>
                    <p className="text-slate-700">
                      <span className="font-medium">{log.user?.name || "시스템"}</span>
                      {" - "}
                      {actionLabels[log.action] || log.action}
                      {log.description && `: ${log.description}`}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(log.created_at).toLocaleString("ko-KR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Edit Modal */}
      <WorkOrderFormModal
        isOpen={isEditModalOpen}
        workOrder={workOrder}
        requesterId={user?.id || ""}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdate}
        isLoading={isSubmitting}
      />

      {/* Cancel Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsCancelModalOpen(false)} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6"
          >
            <h3 className="text-lg font-semibold text-slate-800 mb-4">작업지시 취소</h3>
            <p className="text-sm text-slate-600 mb-4">이 작업지시를 취소하시겠습니까?</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="취소 사유 (선택사항)"
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4 resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
              >
                닫기
              </button>
              <button
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {isSubmitting ? "처리 중..." : "취소하기"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
