"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  MessageSquare,
  Search,
  Building2,
  User,
  Calendar,
  FileText,
} from "lucide-react";
import dayjs from "dayjs";
import { useLoginUser } from "@/context/login";
import { useConsultationsList } from "@/hooks/consultations/recent/useConsultationsList";
import { useDebounce } from "@/hooks/useDebounce";
import { motion } from "framer-motion";

export default function MyConsultationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useLoginUser();

  // URL 파라미터 값
  const urlPage = Number(searchParams.get("page") || "1");
  const urlSearch = searchParams.get("search") || "";
  const urlStartDate = searchParams.get("startDate") || "";
  const urlEndDate = searchParams.get("endDate") || "";
  const highlightId = searchParams.get("highlight");

  // 하이라이트 ref
  const highlightRef = useRef<HTMLAnchorElement>(null);

  // 상태
  const [currentPage, setCurrentPage] = useState(urlPage);
  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [startDate, setStartDate] = useState(urlStartDate);
  const [endDate, setEndDate] = useState(urlEndDate);
  const [itemsPerPage] = useState(20);

  // 디바운스 (300ms) - 입력 시 깜빡임 방지
  const debouncedSearch = useDebounce(searchTerm, 300);
  const debouncedStartDate = useDebounce(startDate, 300);
  const debouncedEndDate = useDebounce(endDate, 300);

  // URL 파라미터 변경 시 상태 동기화
  useEffect(() => {
    setCurrentPage(urlPage);
    setSearchTerm(urlSearch);
    setStartDate(urlStartDate);
    setEndDate(urlEndDate);
  }, [urlPage, urlSearch, urlStartDate, urlEndDate]);

  // 상담 조회
  const { consultations, totalPages, isLoading } = useConsultationsList({
    page: currentPage,
    limit: itemsPerPage,
    selectedUser: user ? { id: user.id } : null,
    startDate: debouncedStartDate,
    endDate: debouncedEndDate,
    companyIds: [],
    content: debouncedSearch,
  });

  // 하이라이트된 항목으로 스크롤
  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightId, consultations]);

  // URL 업데이트
  const updateUrl = (params: {
    page?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const urlParams = new URLSearchParams();
    const page = params.page ?? currentPage;
    const search = params.search ?? searchTerm;
    const start = params.startDate ?? startDate;
    const end = params.endDate ?? endDate;

    if (page > 1) urlParams.set("page", page.toString());
    if (search) urlParams.set("search", search);
    if (start) urlParams.set("startDate", start);
    if (end) urlParams.set("endDate", end);

    const newUrl = `/profile/consultations${urlParams.toString() ? `?${urlParams.toString()}` : ""}`;
    router.push(newUrl, { scroll: false });
  };

  // 핸들러
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
    updateUrl({ search: value, page: 1 });
  };

  const handleDateChange = (type: "start" | "end", value: string) => {
    if (type === "start") {
      setStartDate(value);
      updateUrl({ startDate: value, page: 1 });
    } else {
      setEndDate(value);
      updateUrl({ endDate: value, page: 1 });
    }
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrl({ page });
  };

  // 로그인 필요
  if (!user?.id) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
        <div className="flex flex-col items-center justify-center text-slate-400">
          <MessageSquare className="w-12 h-12 mb-4" />
          <p>로그인이 필요합니다.</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-xl font-bold text-slate-800">내 상담</h1>
            <p className="text-sm text-slate-500 mt-1">
              내가 등록한 상담 기록을 확인하세요.
            </p>
          </div>
          <div className="text-sm text-slate-600">
            총 <span className="font-bold text-emerald-600">{consultations.length}</span>개
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
              placeholder="상담 내용 검색..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* 날짜 필터 */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleDateChange("start", e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
            <span className="text-slate-400">~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleDateChange("end", e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>
      </motion.div>

      {/* 상담 목록 */}
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 mt-3">상담을 불러오는 중...</p>
          </div>
        </div>
      ) : consultations.length > 0 ? (
        <div className="space-y-3">
          {consultations.map((consultation: any, index: number) => {
            const companyId = consultation.companies?.id || consultation.company_id;
            const consultationUrl = companyId
              ? `/consultations/${companyId}?highlight=${consultation.id}`
              : "#";
            const isHighlighted = highlightId === consultation.id;

            return (
              <motion.div
                key={consultation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Link
                  ref={isHighlighted ? highlightRef : null}
                  href={consultationUrl}
                  className={`block bg-white border rounded-xl p-4 hover:border-emerald-300 hover:shadow-md transition-all ${
                    isHighlighted ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200" : "border-slate-200"
                  }`}
                >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* 회사/담당자 정보 */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                        <Building2 className="w-4 h-4 text-emerald-500" />
                        {consultation.companies?.name || "회사명 없음"}
                      </span>
                      {consultation.contacts && consultation.contacts.length > 0 && (
                        <span className="flex items-center gap-1 text-sm text-slate-500">
                          <User className="w-3 h-3" />
                          {consultation.contacts
                            .map((c: any) => c.contact_name)
                            .join(", ")}
                        </span>
                      )}
                    </div>

                    {/* 상담 내용 */}
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {consultation.content}
                    </p>

                    {/* 메타 정보 */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-full">
                        <Calendar className="w-3 h-3" />
                        {dayjs(consultation.consult_date).format("YYYY-MM-DD")}
                      </span>
                      {consultation.documents &&
                        consultation.documents.length > 0 && (
                          <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                            <FileText className="w-3 h-3" />
                            문서 {consultation.documents.length}개
                          </span>
                        )}
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
            <MessageSquare className="w-12 h-12 mb-4" />
            <p>등록한 상담이 없습니다.</p>
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
                        ? "bg-emerald-600 text-white"
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
