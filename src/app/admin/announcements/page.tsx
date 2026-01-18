"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Megaphone,
  AlertTriangle,
  ArrowUp,
  Minus,
  ArrowDown,
  Eye,
  EyeOff,
  Calendar,
  Loader2,
} from "lucide-react";
import { useAllAnnouncements, type Announcement } from "@/hooks/useAnnouncements";
import { useLoginUser } from "@/context/login";

const priorityLabels = {
  urgent: { label: "긴급", color: "bg-red-100 text-red-700", icon: AlertTriangle },
  high: { label: "높음", color: "bg-orange-100 text-orange-700", icon: ArrowUp },
  normal: { label: "보통", color: "bg-blue-100 text-blue-700", icon: Minus },
  low: { label: "낮음", color: "bg-slate-100 text-slate-600", icon: ArrowDown },
};

export default function AnnouncementsPage() {
  const loginUser = useLoginUser();
  const {
    announcements,
    isLoading,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
  } = useAllAnnouncements();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "normal" as Announcement["priority"],
    is_active: true,
    start_date: "",
    end_date: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: "",
      content: "",
      priority: "normal",
      is_active: true,
      start_date: "",
      end_date: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      is_active: announcement.is_active,
      start_date: announcement.start_date || "",
      end_date: announcement.end_date || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (editingAnnouncement) {
        await updateAnnouncement(editingAnnouncement.id, {
          ...formData,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
        });
      } else {
        await createAnnouncement({
          ...formData,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          created_by: loginUser?.id || null,
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("공지사항 저장 실패:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 이 공지사항을 삭제하시겠습니까?")) return;
    setDeletingId(id);
    try {
      await deleteAnnouncement(id);
    } catch (error) {
      console.error("공지사항 삭제 실패:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleActive = async (announcement: Announcement) => {
    await updateAnnouncement(announcement.id, { is_active: !announcement.is_active });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Megaphone className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">공지사항 관리</h1>
              <p className="text-slate-500">공지사항 생성 및 관리</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 text-sm font-medium bg-purple-100 text-purple-700 rounded-full">
              총 {announcements.length}개
            </span>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              새 공지사항
            </button>
          </div>
        </div>

        {/* 공지사항 목록 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Megaphone className="h-10 w-10 mb-3" />
              <p>등록된 공지사항이 없습니다</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 w-16">상태</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 w-20">우선순위</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">제목</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 w-32">기간</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 w-28">생성일</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 w-24">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {announcements.map((announcement) => {
                  const priorityInfo = priorityLabels[announcement.priority];
                  const PriorityIcon = priorityInfo.icon;

                  return (
                    <tr key={announcement.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActive(announcement)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            announcement.is_active
                              ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          }`}
                          title={announcement.is_active ? "활성화됨" : "비활성화됨"}
                        >
                          {announcement.is_active ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${priorityInfo.color}`}>
                          <PriorityIcon className="h-3 w-3" />
                          {priorityInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-700 truncate max-w-md">
                          {announcement.title}
                        </p>
                        <p className="text-xs text-slate-500 truncate max-w-md mt-0.5">
                          {announcement.content.substring(0, 50)}
                          {announcement.content.length > 50 && "..."}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {announcement.start_date || announcement.end_date ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {announcement.start_date && formatDate(announcement.start_date)}
                            {announcement.start_date && announcement.end_date && " ~ "}
                            {announcement.end_date && formatDate(announcement.end_date)}
                          </div>
                        ) : (
                          <span className="text-slate-400">상시</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {formatDate(announcement.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(announcement)}
                            className="p-1.5 rounded-lg hover:bg-blue-100 text-slate-400 hover:text-blue-600 transition-colors"
                            title="수정"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(announcement.id)}
                            disabled={deletingId === announcement.id}
                            className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                            title="삭제"
                          >
                            {deletingId === announcement.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 생성/수정 모달 */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 z-[1000] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsModalOpen(false)} />

            <motion.div
              className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800">
                  {editingAnnouncement ? "공지사항 수정" : "새 공지사항"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    제목 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="공지사항 제목"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    내용 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[120px]"
                    placeholder="공지사항 내용"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">우선순위</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as Announcement["priority"] })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="urgent">긴급</option>
                      <option value="high">높음</option>
                      <option value="normal">보통</option>
                      <option value="low">낮음</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="is_active" className="text-sm text-slate-700">
                      활성화 (로그인 시 표시)
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">시작일 (선택)</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">종료일 (선택)</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {editingAnnouncement ? "수정" : "생성"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
