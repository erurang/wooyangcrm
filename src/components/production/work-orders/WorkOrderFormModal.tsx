"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Users, ClipboardList, AlertCircle, User } from "lucide-react";
import HeadlessSelect from "@/components/ui/HeadlessSelect";
import { useUsersList } from "@/hooks/useUserList";
import type { WorkOrder, WorkOrderCreateRequest } from "@/types/production";

interface WorkOrderFormModalProps {
  isOpen: boolean;
  workOrder?: WorkOrder | null;
  requesterId: string;
  onClose: () => void;
  onSubmit: (data: WorkOrderCreateRequest) => Promise<void>;
  isLoading?: boolean;
}

type DeadlineType = "none" | "today" | "tomorrow" | "this_week" | "custom";
type CompletionType = "any" | "all" | "threshold";

export default function WorkOrderFormModal({
  isOpen,
  workOrder,
  requesterId,
  onClose,
  onSubmit,
  isLoading = false,
}: WorkOrderFormModalProps) {
  const { users } = useUsersList();
  const isEditing = !!workOrder;

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedRequester, setSelectedRequester] = useState(requesterId);
  const [deadlineType, setDeadlineType] = useState<DeadlineType>("none");
  const [deadlineStart, setDeadlineStart] = useState("");
  const [deadlineEnd, setDeadlineEnd] = useState("");
  const [completionType, setCompletionType] = useState<CompletionType>("any");
  const [completionThreshold, setCompletionThreshold] = useState(1);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [error, setError] = useState("");

  // Reset form when modal opens/closes or workOrder changes
  useEffect(() => {
    if (isOpen) {
      if (workOrder) {
        setTitle(workOrder.title);
        setContent(workOrder.content || "");
        setSelectedRequester(workOrder.requester_id);
        setDeadlineType((workOrder.deadline_type as DeadlineType) || "none");
        setDeadlineStart(workOrder.deadline_start || "");
        setDeadlineEnd(workOrder.deadline_end || "");
        setCompletionType((workOrder.completion_type as CompletionType) || "any");
        setCompletionThreshold(workOrder.completion_threshold || 1);
        setSelectedAssignees(workOrder.assignees?.map((a) => a.user_id) || []);
      } else {
        setTitle("");
        setContent("");
        setSelectedRequester(requesterId);
        setDeadlineType("none");
        setDeadlineStart("");
        setDeadlineEnd("");
        setCompletionType("any");
        setCompletionThreshold(1);
        setSelectedAssignees([]);
      }
      setError("");
    }
  }, [isOpen, workOrder, requesterId]);

  // Calculate deadline dates based on type
  const getDeadlineDates = () => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    switch (deadlineType) {
      case "today":
        return { start: formatDate(today), end: formatDate(today) };
      case "tomorrow":
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return { start: formatDate(tomorrow), end: formatDate(tomorrow) };
      case "this_week":
        const endOfWeek = new Date(today);
        const dayOfWeek = today.getDay();
        const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 0;
        endOfWeek.setDate(today.getDate() + daysUntilFriday);
        return { start: formatDate(today), end: formatDate(endOfWeek) };
      case "custom":
        return { start: deadlineStart, end: deadlineEnd };
      default:
        return { start: null, end: null };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("제목을 입력해주세요");
      return;
    }

    if (selectedAssignees.length === 0) {
      setError("최소 1명의 담당자를 선택해주세요");
      return;
    }

    if (deadlineType === "custom" && (!deadlineStart || !deadlineEnd)) {
      setError("기한을 설정해주세요");
      return;
    }

    const { start, end } = getDeadlineDates();

    const data: WorkOrderCreateRequest = {
      title: title.trim(),
      content: content.trim() || undefined,
      deadline_type: deadlineType,
      deadline_start: start || undefined,
      deadline_end: end || undefined,
      requester_id: selectedRequester,
      completion_type: completionType,
      completion_threshold: completionType === "threshold" ? completionThreshold : undefined,
      assignee_ids: selectedAssignees,
    };

    try {
      await onSubmit(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    }
  };

  const toggleAssignee = (userId: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <motion.div
          className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ClipboardList className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">
                {isEditing ? "작업지시 수정" : "새 작업지시"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* 제목 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="작업지시 제목을 입력하세요"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* 내용 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">내용</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="상세 내용을 입력하세요"
                rows={4}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            {/* 지시자 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                지시자
              </label>
              <HeadlessSelect
                value={selectedRequester}
                onChange={(val) => setSelectedRequester(val)}
                options={users.map((user: { id: string; name: string }) => ({
                  value: user.id,
                  label: `${user.name}${user.id === requesterId ? " (나)" : ""}`,
                }))}
                placeholder="지시자 선택"
                icon={<User className="h-4 w-4" />}
                focusClass="focus:ring-purple-500"
              />
              <p className="mt-1 text-xs text-slate-400">
                작업지시를 내리는 사람을 선택합니다. 기본값은 로그인한 사용자입니다.
              </p>
            </div>

            {/* 기한 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                기한
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {[
                  { value: "none", label: "없음" },
                  { value: "today", label: "오늘" },
                  { value: "tomorrow", label: "내일" },
                  { value: "this_week", label: "이번주" },
                  { value: "custom", label: "직접 설정" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDeadlineType(option.value as DeadlineType)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      deadlineType === option.value
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-purple-300"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {deadlineType === "custom" && (
                <div className="flex gap-2 items-center">
                  <input
                    type="date"
                    value={deadlineStart}
                    onChange={(e) => setDeadlineStart(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-slate-400">~</span>
                  <input
                    type="date"
                    value={deadlineEnd}
                    onChange={(e) => setDeadlineEnd(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}
            </div>

            {/* 담당자 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Users className="inline h-4 w-4 mr-1" />
                담당자 <span className="text-red-500">*</span>
              </label>
              <div className="border border-slate-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                {users.length === 0 ? (
                  <p className="text-sm text-slate-400">사용자 목록을 불러오는 중...</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {users.map((user: { id: string; name: string }) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => toggleAssignee(user.id)}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                          selectedAssignees.includes(user.id)
                            ? "bg-purple-600 text-white border-purple-600"
                            : "bg-white text-slate-600 border-slate-200 hover:border-purple-300"
                        }`}
                      >
                        {user.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {selectedAssignees.length}명 선택됨
              </p>
            </div>

            {/* 완료 조건 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">완료 조건</label>
              <div className="space-y-2">
                {[
                  { value: "any", label: "1명이라도 완료하면", desc: "빠른 처리가 필요한 경우" },
                  { value: "all", label: "모든 담당자가 완료해야", desc: "모두의 확인이 필요한 경우" },
                  { value: "threshold", label: "특정 인원 이상 완료", desc: "일정 수 이상의 확인이 필요한 경우" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      completionType === option.value
                        ? "border-purple-500 bg-purple-50"
                        : "border-slate-200 hover:border-purple-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="completionType"
                      value={option.value}
                      checked={completionType === option.value}
                      onChange={(e) => setCompletionType(e.target.value as CompletionType)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-slate-700">{option.label}</div>
                      <div className="text-xs text-slate-400">{option.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
              {completionType === "threshold" && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={selectedAssignees.length || 1}
                    value={completionThreshold}
                    onChange={(e) => setCompletionThreshold(Number(e.target.value))}
                    className="w-20 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-sm text-slate-600">명 이상 완료 시</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? "저장 중..." : isEditing ? "수정" : "등록"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
