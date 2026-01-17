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
  consultation: "bg-green-100 text-green-600",
  post: "bg-blue-100 text-blue-600",
  comment: "bg-purple-100 text-purple-600",
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
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
        <Paperclip className="w-12 h-12 mb-4 text-gray-300" />
        <p>로그인이 필요합니다.</p>
      </div>
    );
  }

  const files = data?.files || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 0;

  return (
    <div className="text-sm text-[#37352F]">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold">내 파일</h1>
        <p className="text-sm text-gray-500 mt-1">
          상담, 게시글, 댓글에서 업로드한 파일을 확인하세요.
        </p>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* 검색 */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="파일명으로 검색..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* 타입 필터 */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <div className="flex gap-1">
            {(Object.keys(sourceTypeLabels) as SourceType[]).map((type) => (
              <button
                key={type}
                onClick={() => handleTypeChange(type)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  sourceType === type
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {sourceTypeLabels[type]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 총 개수 */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          총 <span className="font-semibold">{total}</span>개
        </div>
      </div>

      {/* 파일 목록 */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : files.length > 0 ? (
        <div className="space-y-2">
          {files.map((file) => {
            const isHighlighted = highlightId === file.id;
            return (
            <div
              key={`${file.source_type}-${file.id}`}
              ref={isHighlighted ? highlightRef : null}
              className={`bg-white border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-sm transition-all ${
                isHighlighted ? "bg-indigo-50 ring-2 ring-indigo-200 ring-inset" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                {/* 파일 정보 */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-2xl">{getFileIcon(file.file_name)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          sourceTypeColors[file.source_type]
                        }`}
                      >
                        {sourceTypeLabels[file.source_type as SourceType]}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900 truncate">
                      {file.file_name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {dayjs(file.created_at).format("YYYY-MM-DD HH:mm")}
                      </span>
                      <Link
                        href={getSourceLink(file)}
                        className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700"
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
                <div className="flex items-center gap-2">
                  <Link
                    href={getSourceLink(file)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="원본 보기"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDownload(file)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="다운로드"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <Paperclip className="w-12 h-12 mb-4 text-gray-300" />
          <p>업로드한 파일이 없습니다.</p>
        </div>
      )}

      {/* 페이지네이션 */}
      {!isLoading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
                  className={`px-3 py-1.5 text-sm rounded-lg ${
                    currentPage === page
                      ? "bg-indigo-600 text-white"
                      : "border border-gray-300 hover:bg-gray-50"
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
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
