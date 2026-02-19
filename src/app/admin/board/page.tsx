"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Newspaper,
  Search,
  Trash2,
  Eye,
  EyeOff,
  Pin,
  PinOff,
  User,
  Calendar,
  ChevronDown,
} from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useRouter } from "next/navigation";
import { useGlobalToast } from "@/context/toast";
import { useAllAnnouncements, type Announcement } from "@/hooks/useAnnouncements";
import { useUsersList } from "@/hooks/useUserList";

export default function BoardManagePage() {
  const loginUser = useLoginUser();
  const router = useRouter();
  const toast = useGlobalToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState<string>("");
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);

  // 검색어 디바운스
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 관리자 권한 체크
  useEffect(() => {
    if (loginUser && loginUser.role !== "admin") {
      router.push("/dashboard");
    }
  }, [loginUser, router]);

  // 데이터 조회
  const {
    announcements,
    isLoading,
    togglePin,
    toggleActive,
    deleteAnnouncement,
    refresh,
  } = useAllAnnouncements({
    search: debouncedSearch || undefined,
    authorId: selectedAuthor || undefined,
  });

  const { users } = useUsersList();

  // 전체 사용자 목록
  const allUsers = useMemo(() => {
    return (users as { id: string; name: string }[]) || [];
  }, [users]);

  const handleTogglePin = async (post: Announcement) => {
    await togglePin(post.id, post.is_pinned || false);
    toast.success(
      `게시물이 ${post.is_pinned ? "고정 해제" : "고정"} 되었습니다.`
    );
    refresh();
  };

  const handleToggleActive = async (post: Announcement) => {
    await toggleActive(post.id, post.is_active);
    toast.success(
      `게시물이 ${post.is_active ? "숨김" : "공개"} 처리되었습니다.`
    );
    refresh();
  };

  const handleDelete = async (postId: string) => {
    const confirm = window.confirm("이 게시물을 삭제하시겠습니까?");
    if (!confirm) return;

    await deleteAnnouncement(postId);
    toast.success("게시물이 삭제되었습니다.");
    refresh();
  };

  const handleBulkAction = async (action: "hide" | "show" | "delete") => {
    if (selectedPosts.length === 0) {
      toast.error("선택된 게시물이 없습니다.");
      return;
    }

    if (action === "delete") {
      const confirm = window.confirm(
        `${selectedPosts.length}개의 게시물을 삭제하시겠습니까?`
      );
      if (!confirm) return;

      for (const id of selectedPosts) {
        await deleteAnnouncement(id);
      }
      toast.success("게시물이 삭제되었습니다.");
    } else {
      for (const id of selectedPosts) {
        const post = announcements.find((p) => p.id === id);
        if (post) {
          await toggleActive(id, action === "hide" ? true : false);
        }
      }
      toast.success(
        `${selectedPosts.length}개의 게시물이 ${
          action === "hide" ? "숨김" : "공개"
        } 처리되었습니다.`
      );
    }
    setSelectedPosts([]);
    refresh();
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-700";
      case "high":
        return "bg-orange-100 text-orange-700";
      case "normal":
        return "bg-sky-100 text-sky-700";
      case "low":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "긴급";
      case "high":
        return "높음";
      case "normal":
        return "보통";
      case "low":
        return "낮음";
      default:
        return "보통";
    }
  };

  if (isLoading || !loginUser) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-48"></div>
            <div className="h-64 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (loginUser?.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Newspaper className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">게시판 관리</h1>
              <p className="text-slate-500">공지사항 관리</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <p className="text-2xl font-bold text-slate-800">{announcements.length}개</p>
            <p className="text-sm text-slate-500 mt-1">전체 게시물</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <p className="text-2xl font-bold text-slate-800">
              {announcements.filter((p) => p.is_pinned).length}개
            </p>
            <p className="text-sm text-slate-500 mt-1">고정된 게시물</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <p className="text-2xl font-bold text-slate-800">
              {announcements.filter((p) => !p.is_active).length}개
            </p>
            <p className="text-sm text-slate-500 mt-1">숨김 게시물</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <p className="text-2xl font-bold text-emerald-600">
              {announcements.filter((p) => p.is_active).length}개
            </p>
            <p className="text-sm text-slate-500 mt-1">공개 게시물</p>
          </motion.div>
        </div>

        {/* Filters & Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-4 shadow-sm border border-slate-200"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* 제목 검색 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="제목 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* 작성자 필터 */}
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={selectedAuthor}
                  onChange={(e) => setSelectedAuthor(e.target.value)}
                  className="appearance-none pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                >
                  <option value="">전체 작성자</option>
                  {allUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {selectedPosts.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">
                  {selectedPosts.length}개 선택
                </span>
                <button
                  onClick={() => handleBulkAction("hide")}
                  className="px-3 py-1.5 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  숨기기
                </button>
                <button
                  onClick={() => handleBulkAction("show")}
                  className="px-3 py-1.5 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  공개
                </button>
                <button
                  onClick={() => handleBulkAction("delete")}
                  className="px-3 py-1.5 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Posts Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={
                        selectedPosts.length === announcements.length &&
                        announcements.length > 0
                      }
                      onChange={(e) =>
                        setSelectedPosts(
                          e.target.checked
                            ? announcements.map((p) => p.id)
                            : []
                        )
                      }
                      className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                    제목
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                    우선순위
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                    작성자
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                    작성일
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                    상태
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {announcements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      게시물이 없습니다
                    </td>
                  </tr>
                ) : (
                  announcements.map((post) => (
                    <tr
                      key={post.id}
                      className={`hover:bg-slate-50 ${
                        !post.is_active ? "opacity-60" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedPosts.includes(post.id)}
                          onChange={(e) =>
                            setSelectedPosts(
                              e.target.checked
                                ? [...selectedPosts, post.id]
                                : selectedPosts.filter((id) => id !== post.id)
                            )
                          }
                          className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {post.is_pinned && (
                            <Pin className="w-4 h-4 text-amber-500" />
                          )}
                          <span
                            className={`text-sm ${
                              !post.is_active
                                ? "text-slate-400"
                                : "text-slate-700"
                            }`}
                          >
                            {post.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${getPriorityBadge(
                            post.priority
                          )}`}
                        >
                          {getPriorityText(post.priority)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <User className="w-3 h-3" />
                          {post.author_name || "알 수 없음"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Calendar className="w-3 h-3" />
                          {new Date(post.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {!post.is_active ? (
                            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                              숨김
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                              공개
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleTogglePin(post)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              post.is_pinned
                                ? "text-amber-500 bg-amber-50"
                                : "text-slate-400 hover:text-amber-500 hover:bg-amber-50"
                            }`}
                            title={post.is_pinned ? "고정 해제" : "고정"}
                          >
                            {post.is_pinned ? (
                              <PinOff className="w-4 h-4" />
                            ) : (
                              <Pin className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleToggleActive(post)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              !post.is_active
                                ? "text-slate-500 bg-slate-50"
                                : "text-slate-400 hover:text-slate-500 hover:bg-slate-50"
                            }`}
                            title={post.is_active ? "숨기기" : "공개"}
                          >
                            {!post.is_active ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
