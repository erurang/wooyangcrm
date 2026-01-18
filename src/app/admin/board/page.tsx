"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Newspaper,
  Search,
  Trash2,
  Eye,
  EyeOff,
  Pin,
  PinOff,
  Filter,
  Flag,
  MessageSquare,
  User,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useRouter } from "next/navigation";
import { useGlobalToast } from "@/context/toast";

interface BoardPost {
  id: string;
  title: string;
  category: string;
  author: string;
  createdAt: string;
  viewCount: number;
  commentCount: number;
  isHidden: boolean;
  isPinned: boolean;
  reportCount: number;
}

export default function BoardManagePage() {
  const loginUser = useLoginUser();
  const router = useRouter();
  const toast = useGlobalToast();
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);

  useEffect(() => {
    if (loginUser && loginUser.role !== "admin") {
      router.push("/dashboard");
    }
  }, [loginUser, router]);

  useEffect(() => {
    const loadPosts = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));

      setPosts([
        {
          id: "1",
          title: "[공지] 2025년 1분기 영업 목표 안내",
          category: "공지사항",
          author: "관리자",
          createdAt: "2025-01-15",
          viewCount: 245,
          commentCount: 12,
          isHidden: false,
          isPinned: true,
          reportCount: 0,
        },
        {
          id: "2",
          title: "신년 인사드립니다",
          category: "자유게시판",
          author: "김영업",
          createdAt: "2025-01-02",
          viewCount: 89,
          commentCount: 8,
          isHidden: false,
          isPinned: false,
          reportCount: 0,
        },
        {
          id: "3",
          title: "2024년 제품 카탈로그",
          category: "자료실",
          author: "이기술",
          createdAt: "2024-12-20",
          viewCount: 156,
          commentCount: 3,
          isHidden: false,
          isPinned: false,
          reportCount: 0,
        },
        {
          id: "4",
          title: "부적절한 내용 포함된 게시물",
          category: "자유게시판",
          author: "테스트유저",
          createdAt: "2025-01-17",
          viewCount: 45,
          commentCount: 1,
          isHidden: true,
          isPinned: false,
          reportCount: 5,
        },
        {
          id: "5",
          title: "[공지] 시스템 점검 안내",
          category: "공지사항",
          author: "관리자",
          createdAt: "2025-01-18",
          viewCount: 120,
          commentCount: 2,
          isHidden: false,
          isPinned: true,
          reportCount: 0,
        },
        {
          id: "6",
          title: "영업 팁 공유합니다",
          category: "자유게시판",
          author: "박관리",
          createdAt: "2025-01-10",
          viewCount: 78,
          commentCount: 15,
          isHidden: false,
          isPinned: false,
          reportCount: 1,
        },
      ]);

      setIsLoading(false);
    };

    loadPosts();
  }, []);

  const handleToggleHide = (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    setPosts(
      posts.map((p) =>
        p.id === postId ? { ...p, isHidden: !p.isHidden } : p
      )
    );
    toast.success(
      `게시물이 ${post?.isHidden ? "공개" : "숨김"} 처리되었습니다.`
    );
  };

  const handleTogglePin = (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    setPosts(
      posts.map((p) =>
        p.id === postId ? { ...p, isPinned: !p.isPinned } : p
      )
    );
    toast.success(
      `게시물이 ${post?.isPinned ? "고정 해제" : "고정"} 되었습니다.`
    );
  };

  const handleDelete = (postId: string) => {
    const confirm = window.confirm("이 게시물을 삭제하시겠습니까?");
    if (!confirm) return;

    setPosts(posts.filter((p) => p.id !== postId));
    toast.success("게시물이 삭제되었습니다.");
  };

  const handleBulkAction = (action: "hide" | "show" | "delete") => {
    if (selectedPosts.length === 0) {
      toast.error("선택된 게시물이 없습니다.");
      return;
    }

    if (action === "delete") {
      const confirm = window.confirm(
        `${selectedPosts.length}개의 게시물을 삭제하시겠습니까?`
      );
      if (!confirm) return;
      setPosts(posts.filter((p) => !selectedPosts.includes(p.id)));
      toast.success("게시물이 삭제되었습니다.");
    } else {
      setPosts(
        posts.map((p) =>
          selectedPosts.includes(p.id)
            ? { ...p, isHidden: action === "hide" }
            : p
        )
      );
      toast.success(
        `${selectedPosts.length}개의 게시물이 ${
          action === "hide" ? "숨김" : "공개"
        } 처리되었습니다.`
      );
    }
    setSelectedPosts([]);
  };

  const filteredPosts = posts.filter((post) => {
    if (
      searchQuery &&
      !post.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !post.author.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (filterCategory !== "all" && post.category !== filterCategory) {
      return false;
    }
    return true;
  });

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
              <p className="text-slate-500">게시물 관리 및 모더레이션</p>
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
            <p className="text-2xl font-bold text-slate-800">{posts.length}개</p>
            <p className="text-sm text-slate-500 mt-1">전체 게시물</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <p className="text-2xl font-bold text-slate-800">
              {posts.filter((p) => p.isPinned).length}개
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
              {posts.filter((p) => p.isHidden).length}개
            </p>
            <p className="text-sm text-slate-500 mt-1">숨김 게시물</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <p className="text-2xl font-bold text-red-600">
              {posts.filter((p) => p.reportCount > 0).length}개
            </p>
            <p className="text-sm text-slate-500 mt-1">신고된 게시물</p>
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="제목 또는 작성자 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="all">전체 카테고리</option>
                  <option value="공지사항">공지사항</option>
                  <option value="자유게시판">자유게시판</option>
                  <option value="자료실">자료실</option>
                </select>
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
                        selectedPosts.length === filteredPosts.length &&
                        filteredPosts.length > 0
                      }
                      onChange={(e) =>
                        setSelectedPosts(
                          e.target.checked
                            ? filteredPosts.map((p) => p.id)
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
                    카테고리
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                    작성자
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                    통계
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
                {filteredPosts.map((post) => (
                  <tr
                    key={post.id}
                    className={`hover:bg-slate-50 ${
                      post.isHidden ? "opacity-60" : ""
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
                        {post.isPinned && (
                          <Pin className="w-4 h-4 text-amber-500" />
                        )}
                        <span
                          className={`text-sm ${
                            post.isHidden
                              ? "text-slate-400"
                              : "text-slate-700"
                          }`}
                        >
                          {post.title}
                        </span>
                        {post.reportCount > 0 && (
                          <span className="flex items-center gap-1 text-xs text-red-500">
                            <Flag className="w-3 h-3" />
                            {post.reportCount}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          post.category === "공지사항"
                            ? "bg-blue-100 text-blue-700"
                            : post.category === "자유게시판"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-violet-100 text-violet-700"
                        }`}
                      >
                        {post.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <User className="w-3 h-3" />
                        {post.author}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {post.viewCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {post.commentCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {post.isHidden ? (
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
                          onClick={() => handleTogglePin(post.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            post.isPinned
                              ? "text-amber-500 bg-amber-50"
                              : "text-slate-400 hover:text-amber-500 hover:bg-amber-50"
                          }`}
                          title={post.isPinned ? "고정 해제" : "고정"}
                        >
                          {post.isPinned ? (
                            <PinOff className="w-4 h-4" />
                          ) : (
                            <Pin className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleToggleHide(post.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            post.isHidden
                              ? "text-slate-500 bg-slate-50"
                              : "text-slate-400 hover:text-slate-500 hover:bg-slate-50"
                          }`}
                          title={post.isHidden ? "공개" : "숨기기"}
                        >
                          {post.isHidden ? (
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
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Warning for reported posts */}
        {posts.filter((p) => p.reportCount > 0).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-red-50 rounded-xl p-4 border border-red-200"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">신고된 게시물 확인 필요</p>
                <p className="text-sm text-red-600 mt-1">
                  {posts.filter((p) => p.reportCount > 0).length}개의 게시물이 사용자에 의해 신고되었습니다.
                  내용을 확인하고 적절한 조치를 취해주세요.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
