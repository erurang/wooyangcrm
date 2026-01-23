"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  Users,
  ClipboardList,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Edit3,
  Trash2,
  Upload,
  Download,
  FileText,
  Loader2,
  Bell,
  MessageCircle,
  Send,
  MoreVertical,
  AtSign,
  Paperclip,
} from "lucide-react";
import dayjs from "dayjs";
import { useUsersList } from "@/hooks/useUserList";
import { useWorkOrder, useWorkOrderLogs } from "@/hooks/production/useWorkOrder";
import { useWorkOrderComments } from "@/hooks/production/useWorkOrderComments";
import {
  uploadWorkOrderFile,
  fetchWorkOrderFiles,
  deleteWorkOrderFile,
  type WorkOrderFile,
} from "@/lib/workOrderFiles";
import {
  uploadWorkOrderCommentFile,
  fetchFilesForComments,
  type WorkOrderCommentFile,
} from "@/lib/workOrderCommentFiles";
import type { WorkOrder, WorkOrderStatus } from "@/types/production";

interface WorkOrderDetailModalProps {
  isOpen: boolean;
  workOrderId: string | null;
  currentUserId: string;
  onClose: () => void;
  onUpdate?: () => void;
  onDelete?: () => void;
}

type ViewMode = "view" | "edit";

const statusLabels: Record<WorkOrderStatus, string> = {
  pending: "대기",
  in_progress: "진행중",
  completed: "완료",
  canceled: "취소됨",
};

const statusColors: Record<WorkOrderStatus, string> = {
  pending: "bg-slate-100 text-slate-600",
  in_progress: "bg-blue-100 text-blue-600",
  completed: "bg-green-100 text-green-600",
  canceled: "bg-red-100 text-red-600",
};

export default function WorkOrderDetailModal({
  isOpen,
  workOrderId,
  currentUserId,
  onClose,
  onUpdate,
  onDelete,
}: WorkOrderDetailModalProps) {
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
  } = useWorkOrder(workOrderId || undefined);
  const { logs, refresh: refreshLogs } = useWorkOrderLogs(workOrderId || undefined);
  const { comments, addComment, updateComment, deleteComment } = useWorkOrderComments(workOrderId);

  // State
  const [viewMode, setViewMode] = useState<ViewMode>("view");
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [openCommentMenu, setOpenCommentMenu] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [deadlineStart, setDeadlineStart] = useState("");
  const [deadlineEnd, setDeadlineEnd] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedRequester, setSelectedRequester] = useState("");
  const [files, setFiles] = useState<WorkOrderFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const commentFileInputRef = useRef<HTMLInputElement>(null);

  // 댓글 파일 관련 상태
  const [pendingCommentFiles, setPendingCommentFiles] = useState<File[]>([]);
  const [commentFilesMap, setCommentFilesMap] = useState<Record<string, WorkOrderCommentFile[]>>({});
  const [uploadingCommentFile, setUploadingCommentFile] = useState(false);

  // 멘션 관련 상태
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const justSelectedMention = useRef(false);

  // 드래그 앤 드롭 상태
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isDraggingCommentFile, setIsDraggingCommentFile] = useState(false);

  // 필터링된 사용자 목록 (멘션용)
  const filteredMentionUsers = users.filter((user: { id: string; name: string }) =>
    user.name?.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  // 파일 아이콘 함수
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) return "🖼️";
    if (["pdf"].includes(ext || "")) return "📄";
    if (["doc", "docx"].includes(ext || "")) return "📝";
    if (["xls", "xlsx"].includes(ext || "")) return "📊";
    if (["ppt", "pptx"].includes(ext || "")) return "📽️";
    if (["zip", "rar", "7z"].includes(ext || "")) return "🗜️";
    return "📎";
  };

  // Load work order data into form
  useEffect(() => {
    if (workOrder) {
      setTitle(workOrder.title);
      setContent(workOrder.content || "");
      setDeadlineStart(workOrder.deadline_start || "");
      setDeadlineEnd(workOrder.deadline_end || "");
      setSelectedAssignees(workOrder.assignees?.map((a) => a.user_id) || []);
      setSelectedRequester(workOrder.requester_id);
    }
  }, [workOrder]);

  // Load files
  useEffect(() => {
    if (workOrderId && isOpen) {
      loadFiles();
    }
  }, [workOrderId, isOpen]);

  const loadFiles = async () => {
    if (!workOrderId) return;
    const loadedFiles = await fetchWorkOrderFiles(workOrderId);
    setFiles(loadedFiles);
  };

  // 댓글 파일 로드
  useEffect(() => {
    const loadCommentFiles = async () => {
      if (comments.length > 0) {
        const commentIds = comments.map((c) => c.id);
        const filesMap = await fetchFilesForComments(commentIds);
        setCommentFilesMap(filesMap);
      }
    };
    loadCommentFiles();
  }, [comments]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setViewMode("view");
      setError("");
      setShowDeleteConfirm(false);
      setShowCancelConfirm(false);
      setCancelReason("");
      setNewComment("");
      setEditingCommentId(null);
      setEditingCommentContent("");
      setOpenCommentMenu(null);
      setPendingCommentFiles([]);
      setCommentFilesMap({});
    }
  }, [isOpen]);

  const handleAddComment = async () => {
    if ((!newComment.trim() && pendingCommentFiles.length === 0) || commentSubmitting) return;
    setCommentSubmitting(true);
    const result = await addComment(currentUserId, newComment || "(파일 첨부)");
    if (!result.error && result.comment) {
      // 파일 업로드
      if (pendingCommentFiles.length > 0) {
        setUploadingCommentFile(true);
        for (const file of pendingCommentFiles) {
          await uploadWorkOrderCommentFile(file, result.comment.id, currentUserId);
        }
        setPendingCommentFiles([]);
        setUploadingCommentFile(false);
        // 파일 맵 새로고침
        const commentIds = [...comments.map((c) => c.id), result.comment.id];
        const filesMap = await fetchFilesForComments(commentIds);
        setCommentFilesMap(filesMap);
      }
      setNewComment("");
      refreshLogs();
    }
    setCommentSubmitting(false);
  };

  // 댓글 파일 선택 핸들러
  const handleCommentFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    setPendingCommentFiles((prev) => [...prev, ...Array.from(selectedFiles)]);
    if (commentFileInputRef.current) {
      commentFileInputRef.current.value = "";
    }
  };

  // 대기 중인 파일 제거
  const removePendingFile = (index: number) => {
    setPendingCommentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 작업지시 파일 드래그 앤 드롭 핸들러
  const handleFileDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleFileDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingFile(false);
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);

    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles || droppedFiles.length === 0 || !workOrderId || !workOrder) return;

    setUploading(true);
    for (const file of Array.from(droppedFiles)) {
      const result = await uploadWorkOrderFile(file, workOrderId, currentUserId);
      if (result) {
        await loadFiles();
        await sendFileNotification("upload", file.name);
      }
    }
    setUploading(false);
    refreshLogs();
  };

  // 댓글 파일 드래그 앤 드롭 핸들러
  const handleCommentFileDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleCommentFileDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingCommentFile(true);
  };

  const handleCommentFileDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingCommentFile(false);
  };

  const handleCommentFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingCommentFile(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      setPendingCommentFiles((prev) => [...prev, ...Array.from(droppedFiles)]);
    }
  };

  // 댓글 파일 다운로드
  const handleCommentFileDownload = async (file: WorkOrderCommentFile) => {
    if (!file.signedUrl) return;

    // 다운로드 기록 저장
    await fetch("/api/file-downloads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file_id: file.id,
        file_type: "work_order_comment",
        file_name: file.file_name,
        user_id: currentUserId,
        related_id: file.comment_id,
      }),
    });

    const response = await fetch(file.signedUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.file_name;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editingCommentContent.trim() || commentSubmitting) return;
    setCommentSubmitting(true);
    const result = await updateComment(commentId, currentUserId, editingCommentContent);
    if (!result.error) {
      setEditingCommentId(null);
      setEditingCommentContent("");
      refreshLogs();
    }
    setCommentSubmitting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    setCommentSubmitting(true);
    await deleteComment(commentId, currentUserId);
    refreshLogs();
    setCommentSubmitting(false);
    setOpenCommentMenu(null);
  };

  const startEditComment = (commentId: string, content: string) => {
    setEditingCommentId(commentId);
    setEditingCommentContent(content);
    setOpenCommentMenu(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || !workOrderId || !workOrder) return;

    setUploading(true);
    for (const file of Array.from(selectedFiles)) {
      const result = await uploadWorkOrderFile(file, workOrderId, currentUserId);
      if (result) {
        await loadFiles();
        // 파일 업로드 알림 발송
        await sendFileNotification("upload", file.name);
      }
    }
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    refreshLogs();
  };

  const handleFileDelete = async (file: WorkOrderFile) => {
    if (!confirm(`"${file.file_name}" 파일을 삭제하시겠습니까?`)) return;
    const success = await deleteWorkOrderFile(file.id, file.file_url);
    if (success) {
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      // 파일 삭제 알림 발송
      await sendFileNotification("delete", file.file_name);
      refreshLogs();
    }
  };

  const sendFileNotification = async (action: "upload" | "delete", fileName: string) => {
    if (!workOrder) return;

    // 알림 대상: 지시자 + 모든 담당자 (본인 제외)
    const notificationTargets = new Set<string>();

    if (workOrder.requester_id && workOrder.requester_id !== currentUserId) {
      notificationTargets.add(workOrder.requester_id);
    }

    workOrder.assignees?.forEach((a) => {
      if (a.user_id !== currentUserId) {
        notificationTargets.add(a.user_id);
      }
    });

    if (notificationTargets.size === 0) return;

    const currentUserName = users.find((u: { id: string }) => u.id === currentUserId)?.name || "알 수 없음";
    const actionText = action === "upload" ? "파일을 추가" : "파일을 삭제";

    for (const targetUserId of notificationTargets) {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: targetUserId,
          type: "work_order_file",
          title: `작업지시 ${action === "upload" ? "파일 추가" : "파일 삭제"}`,
          message: `${currentUserName}님이 "${workOrder.title}"에서 ${actionText}했습니다: ${fileName}`,
          related_id: workOrder.id,
          related_type: "work_order",
        }),
      });
    }
  };

  const handleDownload = async (file: WorkOrderFile) => {
    if (!file.public_url) return;

    // 다운로드 기록 저장
    if (workOrderId) {
      await fetch("/api/file-downloads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_id: file.id,
          file_type: "work_order",
          file_name: file.file_name,
          user_id: currentUserId,
          related_id: workOrderId,
        }),
      });
    }

    const response = await fetch(file.public_url);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.file_name;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleSave = async () => {
    if (!workOrder) return;
    setError("");
    setIsSubmitting(true);

    try {
      // 기존 담당자와 비교
      const currentAssigneeIds = workOrder.assignees?.map((a) => a.user_id) || [];
      const addedAssignees = selectedAssignees.filter((id) => !currentAssigneeIds.includes(id));
      const removedAssignees = currentAssigneeIds.filter((id) => !selectedAssignees.includes(id));

      // 작업지시 정보 업데이트
      await updateWorkOrder({
        title,
        content: content || undefined,
        deadline_start: deadlineStart || undefined,
        deadline_end: deadlineEnd || undefined,
        requester_id: selectedRequester || undefined,
        updated_by: currentUserId,
      });

      // 담당자 추가
      if (addedAssignees.length > 0) {
        await addAssignee(addedAssignees[0], currentUserId);
        for (let i = 1; i < addedAssignees.length; i++) {
          await addAssignee(addedAssignees[i], currentUserId);
        }
      }

      // 담당자 제거
      for (const userId of removedAssignees) {
        await removeAssignee(userId);
      }

      // 날짜 변경 시 알림 발송
      if (deadlineStart !== workOrder.deadline_start || deadlineEnd !== workOrder.deadline_end) {
        await sendDateChangeNotifications();
      }

      await refresh();
      refreshLogs();
      setViewMode("view");
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 중 오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendDateChangeNotifications = async () => {
    if (!workOrder?.assignees) return;

    for (const assignee of workOrder.assignees) {
      if (assignee.user_id !== currentUserId) {
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: assignee.user_id,
            type: "work_order_update",
            title: "작업지시 일정 변경",
            message: `"${workOrder.title}" 작업지시의 일정이 변경되었습니다.`,
            related_id: workOrder.id,
            related_type: "work_order",
          }),
        });
      }
    }
  };

  const handleComplete = async () => {
    if (!workOrder) return;
    setIsSubmitting(true);
    try {
      await completeAssignee(currentUserId);
      await refresh();
      refreshLogs();
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "완료 처리 실패");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!workOrder) return;
    setIsSubmitting(true);
    try {
      await cancelWorkOrder(currentUserId, cancelReason);
      await refresh();
      refreshLogs();
      setShowCancelConfirm(false);
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "취소 처리 실패");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!workOrder) return;
    setIsSubmitting(true);
    try {
      await deleteWorkOrder();
      onDelete?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 실패");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAssignee = (userId: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const isMyAssignment = workOrder?.assignees?.some((a) => a.user_id === currentUserId);
  const myAssigneeStatus = workOrder?.assignees?.find((a) => a.user_id === currentUserId);
  const isRequester = workOrder?.requester_id === currentUserId;
  const canEdit = isRequester || isMyAssignment;
  const canDelete = isRequester;
  const canComplete = isMyAssignment && !myAssigneeStatus?.is_completed && workOrder?.status !== "completed" && workOrder?.status !== "canceled";

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

        {/* Modal - 좌우 분할 레이아웃 */}
        <motion.div
          className="relative bg-white rounded-xl shadow-2xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden flex flex-col"
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
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {viewMode === "edit" ? "작업지시 수정" : "작업지시 상세"}
                </h2>
                {workOrder && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[workOrder.status]}`}>
                    {statusLabels[workOrder.status]}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {viewMode === "view" && canEdit && (
                <>
                  <button
                    onClick={() => setViewMode("edit")}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                    title="수정"
                  >
                    <Edit3 className="h-4 w-4" />
                    수정
                  </button>
                  {canDelete && workOrder?.status !== "completed" && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                      삭제
                    </button>
                  )}
                </>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Content - 좌우 분할 레이아웃 */}
          <div className="flex-1 flex overflow-hidden">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : !workOrder ? (
              <div className="flex-1 text-center py-12 text-slate-500">
                작업지시를 찾을 수 없습니다
              </div>
            ) : (
              <>
              {/* 왼쪽 패널: 작업지시 정보 */}
              <div className="flex-1 overflow-y-auto p-6 border-r border-slate-200">
              <div className="space-y-6">
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                {/* 제목 */}
                {viewMode === "edit" ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      제목 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                ) : (
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{workOrder.title}</h3>
                  </div>
                )}

                {/* 내용 */}
                {viewMode === "edit" ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">내용</label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                  </div>
                ) : workOrder.content ? (
                  <div>
                    <p className="text-slate-600 whitespace-pre-wrap">{workOrder.content}</p>
                  </div>
                ) : null}

                {/* 정보 그리드 */}
                <div className="grid grid-cols-2 gap-4">
                  {/* 지시자 */}
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                      <User className="h-4 w-4" />
                      지시자
                    </div>
                    {viewMode === "edit" ? (
                      <select
                        value={selectedRequester}
                        onChange={(e) => setSelectedRequester(e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                      >
                        {users.map((user: { id: string; name: string }) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="font-medium text-slate-800">
                        {workOrder.requester?.name || "알 수 없음"}
                      </p>
                    )}
                  </div>

                  {/* 기한 */}
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                      <Calendar className="h-4 w-4" />
                      기한
                    </div>
                    {viewMode === "edit" ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={deadlineStart}
                          onChange={(e) => setDeadlineStart(e.target.value)}
                          className="px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                        <span className="text-slate-400">~</span>
                        <input
                          type="date"
                          value={deadlineEnd}
                          onChange={(e) => setDeadlineEnd(e.target.value)}
                          className="px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    ) : (
                      <p className="font-medium text-slate-800">
                        {workOrder.deadline_start
                          ? `${dayjs(workOrder.deadline_start).format("YYYY.MM.DD")} ~ ${dayjs(workOrder.deadline_end).format("YYYY.MM.DD")}`
                          : "기한 없음"}
                      </p>
                    )}
                  </div>
                </div>

                {/* 담당자 */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <Users className="h-4 w-4" />
                    담당자
                  </div>
                  {viewMode === "edit" ? (
                    <div className="border border-slate-200 rounded-lg p-3 max-h-40 overflow-y-auto">
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
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {workOrder.assignees?.map((assignee) => (
                        <div
                          key={assignee.id}
                          className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-purple-600">
                                {assignee.user?.name?.charAt(0)}
                              </span>
                            </div>
                            <span className="font-medium text-slate-700">{assignee.user?.name}</span>
                          </div>
                          {assignee.is_completed ? (
                            <span className="flex items-center gap-1 text-green-600 text-sm">
                              <CheckCircle className="h-4 w-4" />
                              완료
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-slate-400 text-sm">
                              <Clock className="h-4 w-4" />
                              진행중
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 첨부파일 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <FileText className="h-4 w-4" />
                      첨부파일 ({files.length})
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>
                  {/* 드래그 앤 드롭 영역 */}
                  <div
                    onDragOver={handleFileDragOver}
                    onDragEnter={handleFileDragEnter}
                    onDragLeave={handleFileDragLeave}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
                      isDraggingFile
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                    }`}
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2 text-gray-500">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <p className="text-sm">업로드 중...</p>
                      </div>
                    ) : isDraggingFile ? (
                      <div className="flex flex-col items-center gap-2 text-blue-600">
                        <Upload className="h-8 w-8" />
                        <p className="text-sm font-medium">파일을 여기에 놓으세요</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-gray-500">
                        <FileText className="h-6 w-6" />
                        <p className="text-sm">
                          <span className="font-medium text-blue-600">파일 선택</span>
                          <span className="hidden sm:inline"> 또는 드래그 앤 드롭</span>
                        </p>
                      </div>
                    )}
                  </div>
                  {files.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto mt-3">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-lg flex-shrink-0">{getFileIcon(file.file_name)}</span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-700 truncate">
                                {file.file_name}
                              </p>
                              <p className="text-xs text-slate-400">
                                {file.user?.name} · {dayjs(file.created_at).format("MM/DD HH:mm")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(file);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="다운로드"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            {file.user_id === currentUserId && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFileDelete(file);
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                title="삭제"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 활동 로그 */}
                {viewMode === "view" && logs.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                      <Bell className="h-4 w-4" />
                      활동 내역
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {logs.slice(0, 5).map((log) => (
                        <div key={log.id} className="text-sm text-slate-500">
                          <span className="font-medium text-slate-600">{log.user?.name}</span>
                          {" · "}
                          {log.description}
                          <span className="text-slate-400 ml-2">
                            {dayjs(log.created_at).format("MM/DD HH:mm")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              </div>

              {/* 오른쪽 패널: 댓글 섹션 */}
              <div className="flex-1 flex flex-col bg-slate-50/50">
                {/* 댓글 헤더 */}
                <div className="px-4 py-3 border-b border-slate-200 bg-white">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <MessageCircle className="h-4 w-4" />
                    댓글 ({comments.length})
                  </div>
                </div>

                {/* 댓글 목록 */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-white rounded-lg p-3 shadow-sm"
                      >
                        {editingCommentId === comment.id ? (
                          <div className="flex flex-col gap-2">
                            <textarea
                              value={editingCommentContent}
                              onChange={(e) => setEditingCommentContent(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleUpdateComment(comment.id);
                                }
                                if (e.key === "Escape") {
                                  setEditingCommentId(null);
                                  setEditingCommentContent("");
                                }
                              }}
                              rows={2}
                              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                              autoFocus
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingCommentId(null);
                                  setEditingCommentContent("");
                                }}
                                className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                              >
                                취소
                              </button>
                              <button
                                onClick={() => handleUpdateComment(comment.id)}
                                disabled={commentSubmitting}
                                className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                              >
                                저장
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium text-purple-600">
                                    {comment.user?.name?.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-slate-700">
                                    {comment.user?.name}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-slate-400">
                                      {dayjs(comment.created_at).format("MM/DD HH:mm")}
                                    </span>
                                    {comment.updated_at !== comment.created_at && (
                                      <span className="text-xs text-slate-400">(수정됨)</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {comment.user_id === currentUserId && (
                                <div className="relative">
                                  <button
                                    onClick={() => setOpenCommentMenu(openCommentMenu === comment.id ? null : comment.id)}
                                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </button>
                                  {openCommentMenu === comment.id && (
                                    <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1 min-w-[80px]">
                                      <button
                                        onClick={() => startEditComment(comment.id, comment.content)}
                                        className="w-full px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 text-left"
                                      >
                                        수정
                                      </button>
                                      <button
                                        onClick={() => handleDeleteComment(comment.id)}
                                        className="w-full px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 text-left"
                                      >
                                        삭제
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 whitespace-pre-wrap break-words">
                              {comment.content.split(/(@\S+)/g).map((part, i) =>
                                part.startsWith("@") ? (
                                  <span key={i} className="text-purple-600 font-medium">{part}</span>
                                ) : (
                                  part
                                )
                              )}
                            </p>
                            {/* 댓글 첨부 파일 */}
                            {commentFilesMap[comment.id] && commentFilesMap[comment.id].length > 0 && (
                              <div className="mt-2 space-y-1">
                                {commentFilesMap[comment.id].map((file) => (
                                  <div
                                    key={file.id}
                                    className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg text-xs"
                                  >
                                    <Paperclip className="h-3 w-3 text-slate-400 flex-shrink-0" />
                                    <span className="text-slate-600 truncate flex-1">
                                      {file.file_name}
                                    </span>
                                    <button
                                      onClick={() => handleCommentFileDownload(file)}
                                      className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                                      title="다운로드"
                                    >
                                      <Download className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">아직 댓글이 없습니다</p>
                      <p className="text-xs">첫 댓글을 남겨보세요!</p>
                    </div>
                  )}
                </div>

                {/* 댓글 입력 영역 */}
                <div
                  className={`p-4 border-t transition-colors ${
                    isDraggingCommentFile
                      ? "border-purple-500 bg-purple-50"
                      : "border-slate-200 bg-white"
                  }`}
                  onDragOver={handleCommentFileDragOver}
                  onDragEnter={handleCommentFileDragEnter}
                  onDragLeave={handleCommentFileDragLeave}
                  onDrop={handleCommentFileDrop}
                >
                  {/* 드래그 중 오버레이 */}
                  {isDraggingCommentFile && (
                    <div className="mb-2 p-3 border-2 border-dashed border-purple-400 rounded-lg bg-purple-100 text-center">
                      <Upload className="h-6 w-6 mx-auto text-purple-600 mb-1" />
                      <p className="text-xs font-medium text-purple-700">파일을 여기에 놓으세요</p>
                    </div>
                  )}
                  {/* 대기 중인 파일 표시 */}
                  {pendingCommentFiles.length > 0 && (
                    <div className="mb-2 space-y-1">
                      {pendingCommentFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg text-xs"
                        >
                          <Paperclip className="h-3 w-3 text-purple-500 flex-shrink-0" />
                          <span className="text-purple-700 truncate flex-1">{file.name}</span>
                          <button
                            onClick={() => removePendingFile(index)}
                            className="p-0.5 text-purple-400 hover:text-red-500 rounded transition-colors"
                            title="파일 제거"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="relative">
                    <input
                      ref={commentFileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleCommentFileSelect}
                    />
                    <textarea
                      ref={commentInputRef}
                      value={newComment}
                      onChange={(e) => {
                        const value = e.target.value;
                        const pos = e.target.selectionStart;
                        setNewComment(value);
                        setCursorPosition(pos);

                        // @ 입력 감지
                        const textBeforeCursor = value.slice(0, pos);
                        const atMatch = textBeforeCursor.match(/@([^\s@]*)$/);
                        if (atMatch) {
                          setMentionSearch(atMatch[1]);
                          setShowMentions(true);
                          setMentionIndex(0);
                        } else {
                          setShowMentions(false);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (showMentions && filteredMentionUsers.length > 0) {
                          switch (e.key) {
                            case "ArrowDown":
                              e.preventDefault();
                              setMentionIndex((prev) =>
                                prev < filteredMentionUsers.length - 1 ? prev + 1 : 0
                              );
                              return;
                            case "ArrowUp":
                              e.preventDefault();
                              setMentionIndex((prev) =>
                                prev > 0 ? prev - 1 : filteredMentionUsers.length - 1
                              );
                              return;
                            case "Enter":
                              e.preventDefault();
                              e.stopPropagation();
                              const selectedUser = filteredMentionUsers[mentionIndex];
                              if (selectedUser) {
                                justSelectedMention.current = true;
                                const textBeforeCursor = newComment.slice(0, cursorPosition);
                                const textAfterCursor = newComment.slice(cursorPosition);
                                const atIndex = textBeforeCursor.lastIndexOf("@");
                                const updatedComment =
                                  textBeforeCursor.slice(0, atIndex) + `@${selectedUser.name} ` + textAfterCursor;
                                setNewComment(updatedComment);
                                setShowMentions(false);
                                setTimeout(() => {
                                  justSelectedMention.current = false;
                                  if (commentInputRef.current) {
                                    const newPos = atIndex + selectedUser.name.length + 2;
                                    commentInputRef.current.focus();
                                    commentInputRef.current.setSelectionRange(newPos, newPos);
                                  }
                                }, 50);
                              }
                              return;
                            case "Escape":
                              setShowMentions(false);
                              return;
                          }
                        }
                        if (e.key === "Enter" && !e.shiftKey && !showMentions && !justSelectedMention.current) {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                      placeholder="댓글을 입력하세요... (@로 멘션)"
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none pr-20"
                    />

                    {/* 멘션 드롭다운 */}
                    {showMentions && filteredMentionUsers.length > 0 && (
                      <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto">
                        <div className="px-2 py-1.5 text-xs text-slate-500 border-b bg-slate-50">
                          멘션할 사용자 선택
                        </div>
                        {filteredMentionUsers.slice(0, 5).map((user: { id: string; name: string }, index: number) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => {
                              const textBeforeCursor = newComment.slice(0, cursorPosition);
                              const textAfterCursor = newComment.slice(cursorPosition);
                              const atIndex = textBeforeCursor.lastIndexOf("@");
                              const updatedComment =
                                textBeforeCursor.slice(0, atIndex) + `@${user.name} ` + textAfterCursor;
                              setNewComment(updatedComment);
                              setShowMentions(false);
                              setTimeout(() => {
                                if (commentInputRef.current) {
                                  const newPos = atIndex + user.name.length + 2;
                                  commentInputRef.current.focus();
                                  commentInputRef.current.setSelectionRange(newPos, newPos);
                                }
                              }, 0);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-50 ${
                              index === mentionIndex ? "bg-purple-50 text-purple-700" : ""
                            }`}
                          >
                            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-medium shrink-0">
                              {user.name.charAt(0)}
                            </div>
                            <span className="truncate">{user.name}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* 버튼 영역 */}
                    <div className="absolute right-2 bottom-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => commentFileInputRef.current?.click()}
                        disabled={uploadingCommentFile}
                        className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors disabled:opacity-50"
                        title="파일 첨부"
                      >
                        {uploadingCommentFile ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Paperclip className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const pos = commentInputRef.current?.selectionStart || newComment.length;
                          const updated = newComment.slice(0, pos) + "@" + newComment.slice(pos);
                          setNewComment(updated);
                          setCursorPosition(pos + 1);
                          setMentionSearch("");
                          setShowMentions(true);
                          setMentionIndex(0);
                          setTimeout(() => {
                            commentInputRef.current?.focus();
                            commentInputRef.current?.setSelectionRange(pos + 1, pos + 1);
                          }, 0);
                        }}
                        className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                        title="멘션"
                      >
                        <AtSign className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleAddComment}
                        disabled={(!newComment.trim() && pendingCommentFiles.length === 0) || commentSubmitting}
                        className="p-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="댓글 등록"
                      >
                        {commentSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              </>
            )}
          </div>

          {/* Footer */}
          {workOrder && (
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
              {viewMode === "edit" ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => setViewMode("view")}
                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-white transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "저장 중..." : "저장"}
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-white transition-colors"
                  >
                    닫기
                  </button>
                  {canComplete && (
                    <button
                      onClick={handleComplete}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {isSubmitting ? "처리 중..." : "완료 처리"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Delete Confirm Modal */}
          {showDeleteConfirm && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <div className="bg-white rounded-xl p-6 max-w-sm mx-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">작업지시 삭제</h3>
                <p className="text-slate-600 mb-4">
                  이 작업지시를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {isSubmitting ? "삭제 중..." : "삭제"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cancel Confirm Modal */}
          {showCancelConfirm && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <div className="bg-white rounded-xl p-6 max-w-sm mx-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">작업지시 취소</h3>
                <p className="text-slate-600 mb-4">
                  이 작업지시를 취소하시겠습니까?
                </p>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="취소 사유 (선택사항)"
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none mb-4"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCancelConfirm(false)}
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
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
