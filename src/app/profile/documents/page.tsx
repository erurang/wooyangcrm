"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import HeadlessSelect from "@/components/ui/HeadlessSelect";
import dayjs from "dayjs";
import { useLoginUser } from "@/context/login";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useDebounce } from "@/hooks/useDebounce";
import { motion } from "framer-motion";

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
  consultation_id?: string;
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

export default function MyDocumentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useLoginUser();

  // URL 파라미터 값
  const urlPage = Number(searchParams.get("page") || "1");
  const urlSearch = searchParams.get("search") || "";
  const urlType = (searchParams.get("type") as DocType) || "all";
  const urlStatus = (searchParams.get("status") as DocStatus) || "all";
  const highlightId = searchParams.get("highlight");

  // 하이라이트 ref
  const highlightRef = useRef<HTMLAnchorElement>(null);

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
    user?.id
      ? `/api/my/documents?userId=${user.id}&page=${currentPage}&limit=${itemsPerPage}&type=${docType}&status=${docStatus}&search=${debouncedSearch}`
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

    const newUrl = `/profile/documents${urlParams.toString() ? `?${urlParams.toString()}` : ""}`;
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

  // 로그인 필요
  if (!user?.id) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
        <div className="flex flex-col items-center justify-center text-slate-400">
          <FileCheck className="w-12 h-12 mb-4" />
          <p>로그인이 필요합니다.</p>
        </div>
      </div>
    );
  }

  const documents = data?.documents || [];
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
            <h1 className="text-xl font-bold text-slate-800">내 문서</h1>
            <p className="text-sm text-slate-500 mt-1">
              내가 생성한 견적서와 발주서를 확인하세요.
            </p>
          </div>
          <div className="text-sm text-slate-600">
            총 <span className="font-bold text-purple-600">{total}</span>개
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-slate-100">
          {/* 검색 */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="회사명으로 검색..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            />
          </div>

          {/* 필터 */}
          <div className="flex flex-wrap gap-4">
            {/* 타입 필터 */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <div className="flex gap-1">
                {(Object.keys(docTypeLabels) as DocType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleTypeChange(type)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      docType === type
                        ? "bg-purple-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {docTypeLabels[type]}
                  </button>
                ))}
              </div>
            </div>

            {/* 상태 필터 */}
            <HeadlessSelect
              value={docStatus}
              onChange={(val) => handleStatusChange(val as DocStatus)}
              options={Object.entries(docStatusLabels).map(([value, label]) => ({
                value,
                label,
              }))}
              placeholder="전체"
              className="min-w-[100px] bg-slate-50"
              focusClass="focus:ring-purple-500"
            />
          </div>
        </div>
      </motion.div>

      {/* 문서 목록 */}
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 mt-3">문서를 불러오는 중...</p>
          </div>
        </div>
      ) : documents.length > 0 ? (
        <div className="space-y-3">
          {documents.map((doc, index) => {
            const isHighlighted = highlightId === doc.id;
            return (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Link
                ref={isHighlighted ? highlightRef : null}
                href={doc.consultation_id && doc.company_id ? `/documents/${doc.type}?consultId=${doc.consultation_id}&compId=${doc.company_id}` : "#"}
                className={`block bg-white border rounded-xl p-4 hover:border-purple-300 hover:shadow-md transition-all ${
                  isHighlighted ? "bg-purple-50 border-purple-300 ring-2 ring-purple-200" : "border-slate-200"
                }`}
              >
              <div className="flex items-center justify-between gap-4">
                {/* 문서 정보 */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {docTypeIcons[doc.type] || (
                    <FileCheck className="w-5 h-5 text-slate-400" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          docStatusColors[doc.status] || "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {docStatusLabels[doc.status] || doc.status}
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600">
                        {docTypeLabels[doc.type as DocType] || doc.type}
                      </span>
                      {doc.document_number && (
                        <span className="text-xs text-slate-400 font-mono">
                          #{doc.document_number}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-800 truncate flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-purple-500" />
                      {doc.company_name}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-full">
                        <Calendar className="w-3 h-3" />
                        {dayjs(doc.created_at).format("YYYY-MM-DD")}
                      </span>
                      {doc.total_amount > 0 && (
                        <span className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                          <DollarSign className="w-3 h-3" />
                          {formatAmount(doc.total_amount)}원
                        </span>
                      )}
                      {doc.valid_until && (
                        <span className="text-slate-400">
                          유효: {dayjs(doc.valid_until).format("YYYY-MM-DD")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
            </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
          <div className="flex flex-col items-center justify-center text-slate-400">
            <FileCheck className="w-12 h-12 mb-4" />
            <p>생성한 문서가 없습니다.</p>
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
                        ? "bg-purple-600 text-white"
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
