"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FileCheck,
  Search,
  Building2,
  Calendar,
  Filter,
  DollarSign,
  FileText,
  ShoppingCart,
} from "lucide-react";
import dayjs from "dayjs";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useDebounce } from "@/hooks/useDebounce";

type DocType = "all" | "quotation" | "order";
type DocStatus = "all" | "pending" | "approved" | "completed" | "cancelled" | "expired";

interface MyDocument {
  id: string;
  type: string;
  status: string;
  created_at: string;
  document_number?: string;
  total_amount: number;
  valid_until?: string;
  delivery_date?: string;
  company_name: string;
  company_id?: string;
}

interface DocumentsResponse {
  documents: MyDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const docTypeLabels: Record<DocType, string> = {
  all: "전체",
  quotation: "견적서",
  order: "발주서",
};

const docStatusLabels: Record<string, string> = {
  all: "전체",
  pending: "대기",
  approved: "승인",
  completed: "완료",
  cancelled: "취소",
  expired: "만료",
};

const docStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-600",
  approved: "bg-green-100 text-green-600",
  completed: "bg-blue-100 text-blue-600",
  cancelled: "bg-gray-100 text-gray-600",
  expired: "bg-red-100 text-red-600",
};

const docTypeIcons: Record<string, React.ReactNode> = {
  quotation: <FileText className="w-5 h-5 text-blue-500" />,
  order: <ShoppingCart className="w-5 h-5 text-purple-500" />,
};

export default function UserDocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUserId = typeof params.userId === "string" ? params.userId : params.userId?.[0] ?? "";
  const basePath = `/profile/${targetUserId}`;

  // URL 파라미터 값
  const urlPage = Number(searchParams.get("page") || "1");
  const urlSearch = searchParams.get("search") || "";
  const urlType = (searchParams.get("type") as DocType) || "all";
  const urlStatus = (searchParams.get("status") as DocStatus) || "all";

  // 상태
  const [currentPage, setCurrentPage] = useState(urlPage);
  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [docType, setDocType] = useState<DocType>(urlType);
  const [docStatus, setDocStatus] = useState<DocStatus>(urlStatus);
  const [itemsPerPage] = useState(20);

  // 디바운스
  const debouncedSearch = useDebounce(searchTerm, 300);

  // URL 파라미터 변경 시 상태 동기화
  useEffect(() => {
    setCurrentPage(urlPage);
    setSearchTerm(urlSearch);
    setDocType(urlType);
    setDocStatus(urlStatus);
  }, [urlPage, urlSearch, urlType, urlStatus]);

  // 문서 조회
  const { data, isLoading } = useSWR<DocumentsResponse>(
    targetUserId
      ? `/api/my/documents?userId=${targetUserId}&page=${currentPage}&limit=${itemsPerPage}&type=${docType}&status=${docStatus}&search=${debouncedSearch}`
      : null,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    { revalidateOnFocus: false }
  );

  // URL 업데이트
  const updateUrl = (params: {
    page?: number;
    search?: string;
    type?: DocType;
    status?: DocStatus;
  }) => {
    const urlParams = new URLSearchParams();
    const page = params.page ?? currentPage;
    const search = params.search ?? searchTerm;
    const type = params.type ?? docType;
    const status = params.status ?? docStatus;

    if (type !== "all") urlParams.set("type", type);
    if (status !== "all") urlParams.set("status", status);
    if (page > 1) urlParams.set("page", page.toString());
    if (search) urlParams.set("search", search);

    const newUrl = `${basePath}/documents${urlParams.toString() ? `?${urlParams.toString()}` : ""}`;
    router.push(newUrl, { scroll: false });
  };

  // 핸들러
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
    updateUrl({ search: value, page: 1 });
  };

  const handleTypeChange = (type: DocType) => {
    setDocType(type);
    setCurrentPage(1);
    updateUrl({ type, page: 1 });
  };

  const handleStatusChange = (status: DocStatus) => {
    setDocStatus(status);
    setCurrentPage(1);
    updateUrl({ status, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrl({ page });
  };

  // 금액 포맷
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(amount);
  };

  if (!targetUserId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
        <FileCheck className="w-12 h-12 mb-4 text-gray-300" />
        <p>유저를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const documents = data?.documents || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 0;

  return (
    <div className="text-sm text-[#37352F]">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold">문서</h1>
        <p className="text-sm text-gray-500 mt-1">
          이 사용자가 생성한 견적서와 발주서입니다.
        </p>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex flex-col gap-4 mb-6">
        {/* 검색 */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="회사명으로 검색..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* 필터 */}
        <div className="flex flex-wrap gap-4">
          {/* 타입 필터 */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <div className="flex gap-1">
              {(Object.keys(docTypeLabels) as DocType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleTypeChange(type)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    docType === type
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {docTypeLabels[type]}
                </button>
              ))}
            </div>
          </div>

          {/* 상태 필터 */}
          <select
            value={docStatus}
            onChange={(e) => handleStatusChange(e.target.value as DocStatus)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {Object.entries(docStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 총 개수 */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          총 <span className="font-semibold">{total}</span>개
        </div>
      </div>

      {/* 문서 목록 */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : documents.length > 0 ? (
        <div className="space-y-2">
          {documents.map((doc) => (
            <Link
              key={doc.id}
              href={`/documents/${doc.type}?docId=${doc.id}`}
              className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between gap-4">
                {/* 문서 정보 */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {docTypeIcons[doc.type] || (
                    <FileCheck className="w-5 h-5 text-gray-400" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          docStatusColors[doc.status] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {docStatusLabels[doc.status] || doc.status}
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                        {docTypeLabels[doc.type as DocType] || doc.type}
                      </span>
                      {doc.document_number && (
                        <span className="text-xs text-gray-400">
                          #{doc.document_number}
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-900 truncate flex items-center gap-1">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      {doc.company_name}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {dayjs(doc.created_at).format("YYYY-MM-DD")}
                      </span>
                      {doc.total_amount > 0 && (
                        <span className="flex items-center gap-1 font-medium text-gray-700">
                          <DollarSign className="w-3 h-3" />
                          {formatAmount(doc.total_amount)}원
                        </span>
                      )}
                      {doc.valid_until && (
                        <span className="text-gray-400">
                          유효: {dayjs(doc.valid_until).format("YYYY-MM-DD")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <FileCheck className="w-12 h-12 mb-4 text-gray-300" />
          <p>생성한 문서가 없습니다.</p>
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
