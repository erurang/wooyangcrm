"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Paperclip,
  Search,
  Download,
  ExternalLink,
  FileText,
  MessageSquare,
  Calendar,
  Filter,
} from "lucide-react";
import dayjs from "dayjs";
import { useLoginUser } from "@/context/login";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useDebounce } from "@/hooks/useDebounce";
import { motion } from "framer-motion";

type SourceType = "all" | "consultation" | "post" | "comment";

interface MyFile {
  id: string;
  file_name: string;
  file_url: string;
  created_at: string;
  source_type: "consultation" | "post" | "comment";
  source_id: string;
  source_title?: string;
}

interface FilesResponse {
  files: MyFile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const sourceTypeLabels: Record<SourceType, string> = {
  all: "전체",
  consultation: "상담",
  post: "게시글",
  comment: "댓글",
};

const sourceTypeColors: Record<string, string> = {
  consultation: "bg-emerald-100 text-emerald-700",
  post: "bg-blue-100 text-blue-700",
  comment: "bg-amber-100 text-amber-700",
};

export default function MyFilesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useLoginUser();

  // URL 파라미터 값
  const urlPage = Number(searchParams.get("page") || "1");
  const urlSearch = searchParams.get("search") || "";
  const urlType = (searchParams.get("type") as SourceType) || "all";
  const highlightId = searchParams.get("highlight");

  // 하이라이트 ref
  const highlightRef = useRef<HTMLDivElement>(null);

  // 상태
  const [currentPage, setCurrentPage] = useState(urlPage);
  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [sourceType, setSourceType] = useState<SourceType>(urlType);
  const [filesPerPage] = useState(20);

  // 디바운스
  const debouncedSearch = useDebounce(searchTerm, 300);

  // URL 파라미터 변경 시 상태 동기화
  useEffect(() => {
    setCurrentPage(urlPage);
    setSearchTerm(urlSearch);
    setSourceType(urlType);
  }, [urlPage, urlSearch, urlType]);

  // 파일 조회
  const { data, isLoading } = useSWR<FilesResponse>(
    user?.id
      ? `/api/my/files?userId=${user.id}&page=${currentPage}&limit=${filesPerPage}&type=${sourceType}&search=${debouncedSearch}`
      : null,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    { revalidateOnFocus: false }
  );

  // 하이라이트된 항목으로 스크롤
  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightId, data]);

  // URL 업데이트
  const updateUrl = (params: {
    page?: number;
    search?: string;
    type?: SourceType;
  }) => {
    const urlParams = new URLSearchParams();
    const page = params.page ?? currentPage;
    const search = params.search ?? searchTerm;
    const type = params.type ?? sourceType;

    if (type !== "all") urlParams.set("type", type);
    if (page > 1) urlParams.set("page", page.toString());
    if (search) urlParams.set("search", search);

    const newUrl = `/profile/files${urlParams.toString() ? `?${urlParams.toString()}` : ""}`;
    router.push(newUrl, { scroll: false });
  };

  // 핸들러
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
    updateUrl({ search: value, page: 1 });
  };

  const handleTypeChange = (type: SourceType) => {
    setSourceType(type);
    setCurrentPage(1);
    updateUrl({ type, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrl({ page });
  };

  // 파일 확장자 아이콘
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) {
      return "🖼️";
    } else if (["pdf"].includes(ext || "")) {
      return "📄";
    } else if (["doc", "docx"].includes(ext || "")) {
      return "📝";
    } else if (["xls", "xlsx"].includes(ext || "")) {
      return "📊";
    } else if (["ppt", "pptx"].includes(ext || "")) {
      return "📽️";
    } else if (["zip", "rar", "7z"].includes(ext || "")) {
      return "🗜️";
    }
    return "📎";
  };

  // 원본 링크 생성
  const getSourceLink = (file: MyFile) => {
    switch (file.source_type) {
      case "consultation":
        return `/consultations/${file.source_id}`;
      case "post":
      case "comment":
        return `/board/${file.source_id}`;
      default:
        return "#";
    }
  };

  // 파일 다운로드 핸들러
  const handleDownload = async (file: MyFile) => {
    try {
      const response = await fetch(file.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
      // 실패 시 새 탭에서 열기
      window.open(file.file_url, "_blank");
    }
  };

  // 로그인 필요
  if (!user?.id) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
        <div className="flex flex-col items-center justify-center text-slate-400">
          <Paperclip className="w-12 h-12 mb-4" />
          <p>로그인이 필요합니다.</p>
        </div>
      </div>
    );
  }

  const files = data?.files || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 0;

  return (
    <div className="text-sm">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">내 파일</h1>
            <p className="text-sm text-slate-500 mt-1">
              상담, 게시글, 댓글에서 업로드한 파일을 확인하세요.
            </p>
          </div>
          <div className="text-sm text-slate-600">
            총 <span className="font-bold text-amber-600">{total}</span>개
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4 pt-4 border-t border-slate-100">
          {/* 검색 */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="파일명으로 검색..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
            />
          </div>

          {/* 타입 필터 */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <div className="flex gap-1">
              {(Object.keys(sourceTypeLabels) as SourceType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleTypeChange(type)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    sourceType === type
                      ? "bg-amber-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {sourceTypeLabels[type]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* 파일 목록 */}
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 mt-3">파일을 불러오는 중...</p>
          </div>
        </div>
      ) : files.length > 0 ? (
        <div className="space-y-3">
          {files.map((file, index) => {
            const isHighlighted = highlightId === file.id;
            return (
            <motion.div
              key={`${file.source_type}-${file.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              ref={isHighlighted ? highlightRef : null}
              className={`bg-white border rounded-xl p-4 hover:border-amber-300 hover:shadow-md transition-all ${
                isHighlighted ? "bg-amber-50 border-amber-300 ring-2 ring-amber-200" : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                {/* 파일 정보 */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-2xl">{getFileIcon(file.file_name)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          sourceTypeColors[file.source_type]
                        }`}
                      >
                        {sourceTypeLabels[file.source_type as SourceType]}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-800 truncate">
                      {file.file_name}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-full">
                        <Calendar className="w-3 h-3" />
                        {dayjs(file.created_at).format("YYYY-MM-DD HH:mm")}
                      </span>
                      <Link
                        href={getSourceLink(file)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {file.source_type === "consultation" ? (
                          <MessageSquare className="w-3 h-3" />
                        ) : (
                          <FileText className="w-3 h-3" />
                        )}
                        {file.source_title}
                      </Link>
                    </div>
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex items-center gap-1">
                  <Link
                    href={getSourceLink(file)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="원본 보기"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDownload(file)}
                    className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    title="다운로드"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
          <div className="flex flex-col items-center justify-center text-slate-400">
            <Paperclip className="w-12 h-12 mb-4" />
            <p>업로드한 파일이 없습니다.</p>
          </div>
        </div>
      )}

      {/* 페이지네이션 */}
      {!isLoading && totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              이전
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }

                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? "bg-amber-600 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              다음
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
