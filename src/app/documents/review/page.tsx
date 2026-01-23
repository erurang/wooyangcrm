"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileText,
  AlertTriangle,
  XCircle,
  Clock,
  CheckCircle,
  User,
  Building,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  BarChart3,
  TrendingDown,
} from "lucide-react";
import HeadlessSelect from "@/components/ui/HeadlessSelect";
import { useLoginUser } from "@/context/login";
import { useDocumentsReview } from "@/hooks/documents/useDocumentsReview";
import { useUsersList } from "@/hooks/useUserList";
import { useUpdateDocumentStatus } from "@/hooks/documents/details/useUpdateDocumentStatus";
import DocumentModal from "@/components/documents/preview/DocumentModal";
import DocumentStatusChangeModal from "@/components/documents/details/DocumentStatusChangeModal";
import { numberToKorean } from "@/lib/numberToKorean";
import type { Document } from "@/types/document";

type ReviewStatus = "all" | "expired" | "canceled" | "stale" | "pending" | "completed";
type DocType = "all" | "estimate" | "order" | "requestQuote";

export default function DocumentsReviewPage() {
  const loginUser = useLoginUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL 파라미터에서 초기값 설정
  const initialUserId = searchParams.get("userId") || "";
  const initialType = searchParams.get("type") as DocType || "all";
  const initialReviewStatus = searchParams.get("reviewStatus") as ReviewStatus || "all";
  const highlightId = searchParams.get("highlight") || searchParams.get("documentId") || "";

  // 필터 상태
  const [docType, setDocType] = useState<DocType>(initialType);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>(initialReviewStatus);
  const [selectedUserId, setSelectedUserId] = useState<string>(initialUserId || "");
  const [companySearch, setCompanySearch] = useState("");
  const [debouncedCompanySearch, setDebouncedCompanySearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // 문서 모달
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  // 하이라이트 문서 (별도 조회)
  const [highlightedDoc, setHighlightedDoc] = useState<Document | null>(null);
  const [highlightFetched, setHighlightFetched] = useState(false);

  // 상태 변경 모달
  const [statusChangeDoc, setStatusChangeDoc] = useState<Document | null>(null);
  const [changedStatus, setChangedStatus] = useState("");
  const [statusReason, setStatusReason] = useState({
    canceled: { reason: "", amount: 0 },
    completed: { reason: "", amount: 0 },
  });

  // 상태 업데이트 hook
  const { trigger: updateStatus, isMutating } = useUpdateDocumentStatus();

  // URL 파라미터 변경 시 필터 상태 동기화
  useEffect(() => {
    setDocType(initialType);
  }, [initialType]);

  useEffect(() => {
    setReviewStatus(initialReviewStatus);
  }, [initialReviewStatus]);

  useEffect(() => {
    if (initialUserId) {
      setSelectedUserId(initialUserId);
    }
  }, [initialUserId]);

  // 필터 변경 시 페이지 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [docType, reviewStatus, selectedUserId]);

  // 디바운스
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCompanySearch(companySearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [companySearch]);

  // 사용자 목록
  const { users } = useUsersList();
  const allUsers = useMemo(() => {
    return (users as { id: string; name: string }[]) || [];
  }, [users]);

  // 문서 데이터
  const { documents, stats, total, isLoading, refresh } = useDocumentsReview({
    type: docType,
    reviewStatus,
    userId: selectedUserId || undefined,
    companySearch: debouncedCompanySearch || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page: currentPage,
    limit: 30,
  });

  const totalPages = Math.ceil(total / 30);

  // highlight 파라미터 변경 시 초기화
  useEffect(() => {
    setHighlightedDoc(null);
    setHighlightFetched(false);
  }, [highlightId]);

  // highlight 파라미터가 있을 때 해당 문서 직접 조회
  useEffect(() => {
    if (highlightId && !highlightFetched) {
      setHighlightFetched(true);
      fetch(`/api/documents/status/list?documentId=${highlightId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.documents && data.documents.length > 0) {
            setHighlightedDoc(data.documents[0]);
          }
        })
        .catch((err) => {
          console.error("하이라이트 문서 조회 실패:", err);
        });
    }
  }, [highlightId, highlightFetched]);

  // 하이라이트 문서로 스크롤
  useEffect(() => {
    if (highlightedDoc) {
      setTimeout(() => {
        const element = document.getElementById(`doc-row-${highlightedDoc.id}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 200);
    }
  }, [highlightedDoc]);

  // 표시할 문서 목록 (하이라이트 문서가 목록에 없으면 맨 위에 추가)
  const displayDocuments = useMemo(() => {
    if (!highlightedDoc) return documents;
    const exists = documents.some((doc: Document) => doc.id === highlightedDoc.id);
    if (exists) return documents;
    return [highlightedDoc, ...documents];
  }, [documents, highlightedDoc]);

  // 필터 초기화
  const resetFilters = () => {
    setDocType("all");
    setReviewStatus("all");
    setSelectedUserId("");
    setCompanySearch("");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  // 문서 유형 텍스트
  const getDocTypeText = (type: string) => {
    switch (type) {
      case "estimate": return "견적";
      case "order": return "발주";
      case "requestQuote": return "의뢰";
      default: return type;
    }
  };

  // 상태 배지
  const getStatusBadge = (status: string, reviewReason: string) => {
    if (status === "completed") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          완료
        </span>
      );
    }
    if (status === "canceled") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          취소
        </span>
      );
    }
    if (reviewReason?.includes("만료")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-orange-100 text-orange-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          만료
        </span>
      );
    }
    if (reviewReason?.includes("경과")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-amber-100 text-amber-800">
          <Clock className="w-3 h-3 mr-1" />
          장기
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-blue-100 text-blue-800">
        <Clock className="w-3 h-3 mr-1" />
        진행중
      </span>
    );
  };

  // 문서 모달 열기
  const openDocumentModal = (doc: Document) => {
    setSelectedDocument(doc);
  };

  // 상담 페이지로 이동
  const goToConsultation = (doc: Document) => {
    router.push(
      `/documents/${doc.type}?consultId=${doc.consultation_id}&compId=${doc.company_id}&highlight=${doc.id}`
    );
  };

  // 거래처 상담 페이지로 이동
  const goToCompany = (companyId: string) => {
    router.push(`/consultations/${companyId}`);
  };

  // 내 문서만 보기
  const showMyDocuments = () => {
    if (loginUser?.id) {
      setSelectedUserId(loginUser.id);
      setCurrentPage(1);
    }
  };

  // 상태 변경 모달 열기
  const openStatusChangeModal = (doc: any, status: string) => {
    setChangedStatus(status);
    setStatusChangeDoc(doc);
  };

  // 상태 변경 처리
  const handleStatusChange = async () => {
    if (!statusChangeDoc || !changedStatus) return;
    if (isMutating) return;

    const reason = statusReason[changedStatus as "canceled" | "completed"]?.reason;
    if (!reason?.trim()) return;

    const confirmChange = window.confirm("상태 변경은 되돌릴 수 없습니다. 변경할까요?");
    if (!confirmChange) return;

    try {
      await updateStatus({
        id: statusChangeDoc.id,
        status: changedStatus,
        status_reason: { [changedStatus]: { reason } },
        updated_by: loginUser?.id,
      });

      setStatusChangeDoc(null);
      setStatusReason({
        canceled: { reason: "", amount: 0 },
        completed: { reason: "", amount: 0 },
      });
      refresh();
    } catch (error) {
      console.error("문서 상태 업데이트 실패:", error);
    }
  };

  // 상태 사유 변경
  const handleStatusReasonChange = (status: "canceled" | "completed", reason: string) => {
    setStatusReason((prev) => ({
      ...prev,
      [status]: { ...prev[status], reason },
    }));
  };

  if (!loginUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-2 md:px-4 py-4">
      <div className="max-w-full mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 rounded-xl">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">문서 현황 분석</h1>
              <p className="text-sm text-slate-500">전체 문서 조회 및 분석</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={showMyDocuments}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
            >
              <User className="w-4 h-4" />
              내 문서
            </button>
            <button
              onClick={() => refresh()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 px-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-lg p-3 shadow-sm border cursor-pointer transition-all ${
              reviewStatus === "all" ? "border-indigo-400 ring-1 ring-indigo-200" : "border-slate-200 hover:border-slate-300"
            }`}
            onClick={() => { setReviewStatus("all"); setCurrentPage(1); }}
          >
            <p className="text-lg font-bold text-slate-800">{total}</p>
            <p className="text-xs text-slate-500">전체</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={`bg-white rounded-lg p-3 shadow-sm border cursor-pointer transition-all ${
              reviewStatus === "pending" ? "border-blue-400 ring-1 ring-blue-200" : "border-slate-200 hover:border-slate-300"
            }`}
            onClick={() => { setReviewStatus("pending"); setCurrentPage(1); }}
          >
            <p className="text-lg font-bold text-blue-600">{stats.pending || 0}</p>
            <p className="text-xs text-slate-500">진행중</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`bg-white rounded-lg p-3 shadow-sm border cursor-pointer transition-all ${
              reviewStatus === "completed" ? "border-emerald-400 ring-1 ring-emerald-200" : "border-slate-200 hover:border-slate-300"
            }`}
            onClick={() => { setReviewStatus("completed"); setCurrentPage(1); }}
          >
            <p className="text-lg font-bold text-emerald-600">{stats.completed || 0}</p>
            <p className="text-xs text-slate-500">완료</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={`bg-white rounded-lg p-3 shadow-sm border cursor-pointer transition-all ${
              reviewStatus === "expired" ? "border-orange-400 ring-1 ring-orange-200" : "border-slate-200 hover:border-slate-300"
            }`}
            onClick={() => { setReviewStatus("expired"); setCurrentPage(1); }}
          >
            <p className="text-lg font-bold text-orange-600">{stats.expired || 0}</p>
            <p className="text-xs text-slate-500">만료</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`bg-white rounded-lg p-3 shadow-sm border cursor-pointer transition-all ${
              reviewStatus === "canceled" ? "border-red-400 ring-1 ring-red-200" : "border-slate-200 hover:border-slate-300"
            }`}
            onClick={() => { setReviewStatus("canceled"); setCurrentPage(1); }}
          >
            <p className="text-lg font-bold text-red-600">{stats.canceled || 0}</p>
            <p className="text-xs text-slate-500">취소</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className={`bg-white rounded-lg p-3 shadow-sm border cursor-pointer transition-all ${
              reviewStatus === "stale" ? "border-amber-400 ring-1 ring-amber-200" : "border-slate-200 hover:border-slate-300"
            }`}
            onClick={() => { setReviewStatus("stale"); setCurrentPage(1); }}
          >
            <p className="text-lg font-bold text-amber-600">{stats.stale || 0}</p>
            <p className="text-xs text-slate-500">7일+</p>
          </motion.div>
        </div>

        {/* 담당자별 미완료 현황 - 필터 위에 배치 */}
        {selectedUserId === "" && documents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="bg-white rounded-lg p-3 shadow-sm border border-slate-200 mx-2"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-medium text-slate-800">담당자별 미완료 현황</h3>
              <span className="text-xs text-slate-400">(현재 필터 기준)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(() => {
                const userStats: Record<string, { name: string; count: number; amount: number }> = {};
                documents.forEach((doc: Document) => {
                  if (doc.status !== "completed") {
                    const key = doc.user_id || "unknown";
                    if (!userStats[key]) {
                      userStats[key] = { name: doc.user_name || "퇴사", count: 0, amount: 0 };
                    }
                    userStats[key].count++;
                    userStats[key].amount += doc.total_amount || 0;
                  }
                });

                const sorted = Object.entries(userStats)
                  .sort((a, b) => b[1].count - a[1].count)
                  .slice(0, 10);

                if (sorted.length === 0) return <span className="text-xs text-slate-400">미완료 문서 없음</span>;

                return sorted.map(([userId, data]) => (
                  <button
                    key={userId}
                    onClick={() => { setSelectedUserId(userId); setCurrentPage(1); }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm transition-colors"
                  >
                    <span className="font-medium text-slate-700">{data.name}</span>
                    <span className="text-xs text-red-600">{data.count}건</span>
                    <span className="text-xs text-slate-400">
                      ({(data.amount / 10000).toFixed(0)}만)
                    </span>
                  </button>
                ));
              })()}
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg px-3 py-2.5 shadow-sm border border-slate-200 mx-2"
        >
          <div className="flex flex-wrap items-center gap-2">
            <HeadlessSelect
              value={docType}
              onChange={(val) => { setDocType(val as DocType); setCurrentPage(1); }}
              options={[
                { value: "all", label: "전체 유형" },
                { value: "estimate", label: "견적서" },
                { value: "order", label: "발주서" },
                { value: "requestQuote", label: "의뢰서" },
              ]}
              placeholder="전체 유형"
              className="min-w-[120px]"
              focusClass="focus:ring-indigo-500"
            />

            <HeadlessSelect
              value={selectedUserId}
              onChange={(val) => { setSelectedUserId(val); setCurrentPage(1); }}
              options={[
                { value: "", label: "전체 담당자" },
                ...allUsers.map((user) => ({ value: user.id, label: user.name })),
              ]}
              placeholder="전체 담당자"
              icon={<User className="w-3.5 h-3.5" />}
              className="min-w-[130px]"
              focusClass="focus:ring-indigo-500"
            />

            <div className="relative">
              <Building className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="거래처..."
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 w-32"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm border rounded-lg transition-colors ${
                showFilters ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "border-slate-300 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              필터
            </button>

            {(docType !== "all" || reviewStatus !== "all" || selectedUserId || companySearch || dateFrom || dateTo) && (
              <button onClick={resetFilters} className="text-xs text-slate-500 hover:text-slate-700 px-2">
                초기화
              </button>
            )}

            <div className="flex-1" />
            <span className="text-xs text-slate-500">{total.toLocaleString()}건</span>
          </div>

          {showFilters && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-200 flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-slate-400 text-sm">~</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Documents Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mx-2"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : displayDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="p-3 bg-slate-100 rounded-full mb-3">
                <FileText className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium text-sm">문서가 없습니다</p>
              <p className="text-slate-400 text-xs mt-1">필터를 변경해보세요</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500">문서번호</th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 w-14">유형</th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500">거래처</th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 hidden md:table-cell">담당자</th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 hidden lg:table-cell">금액</th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 w-24">작성일</th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 hidden lg:table-cell w-24">유효기간</th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 w-16">상태</th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500">비고</th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 w-16">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayDocuments.map((doc: Document) => (
                    <tr
                      key={doc.id}
                      id={`doc-row-${doc.id}`}
                      className={`transition-colors ${
                        highlightedDoc?.id === doc.id
                          ? "bg-amber-50 ring-2 ring-amber-300 ring-inset"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-3 py-2 whitespace-nowrap">
                        <button
                          onClick={() => openDocumentModal(doc)}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          {doc.document_number}
                        </button>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          doc.type === "estimate" ? "bg-blue-50 text-blue-700" :
                          doc.type === "order" ? "bg-purple-50 text-purple-700" :
                          "bg-teal-50 text-teal-700"
                        }`}>
                          {getDocTypeText(doc.type)}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <button
                          onClick={() => goToCompany(doc.company_id)}
                          className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline truncate max-w-[100px] block"
                          title={doc.company_name}
                        >
                          {doc.company_name}
                        </button>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap hidden md:table-cell">
                        <div className="text-sm text-slate-700">{doc.user_name}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap hidden lg:table-cell">
                        <div className="text-sm text-slate-800 font-medium">
                          {doc.total_amount?.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-sm text-slate-600">{doc.date}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap hidden lg:table-cell">
                        <div className="text-sm text-slate-600">
                          {doc.valid_until ? new Date(doc.valid_until).toLocaleDateString() : "-"}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {getStatusBadge(doc.status, doc.review_reason)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-xs text-slate-500 max-w-[120px] truncate" title={doc.review_reason || doc.status_reason?.canceled?.reason || doc.status_reason?.completed?.reason}>
                          {doc.review_reason || doc.status_reason?.canceled?.reason || doc.status_reason?.completed?.reason || "-"}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {doc.status === "pending" && (
                            <>
                              <button
                                onClick={() => openStatusChangeModal(doc, "completed")}
                                className="px-1.5 py-0.5 text-xs text-emerald-600 bg-emerald-50 rounded hover:bg-emerald-100 transition-colors"
                              >
                                완료
                              </button>
                              <button
                                onClick={() => openStatusChangeModal(doc, "canceled")}
                                className="px-1.5 py-0.5 text-xs text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                              >
                                취소
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => goToConsultation(doc)}
                            className="px-1.5 py-0.5 text-xs text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-100 transition-colors"
                          >
                            수정
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-3 py-2 border-t border-slate-200 bg-slate-50">
              <div className="text-xs text-slate-500">
                {(currentPage - 1) * 30 + 1}-{Math.min(currentPage * 30, total)} / {total}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-slate-600 px-2">{currentPage} / {totalPages}</span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Document Modal */}
      {selectedDocument && (
        <DocumentModal
          document={{
            ...selectedDocument,
            content: {
              items: selectedDocument.content?.items || [],
              company_name: selectedDocument.company_name,
              notes: selectedDocument.notes,
              total_amount: selectedDocument.total_amount,
              valid_until: selectedDocument.valid_until,
              delivery_term: selectedDocument.delivery_term,
              delivery_place: selectedDocument.delivery_place,
              delivery_date: selectedDocument.delivery_date,
              payment_method: selectedDocument.payment_method,
            },
          }}
          onClose={() => setSelectedDocument(null)}
          company_fax={selectedDocument.company_fax || ""}
          company_phone={selectedDocument.company_phone || ""}
          type={selectedDocument.type}
          koreanAmount={numberToKorean}
        />
      )}

      {/* 상태 변경 모달 */}
      <DocumentStatusChangeModal
        isOpen={!!statusChangeDoc}
        document={statusChangeDoc}
        changedStatus={changedStatus}
        statusReason={statusReason}
        isMutating={isMutating}
        onStatusReasonChange={handleStatusReasonChange}
        onConfirm={handleStatusChange}
        onClose={() => setStatusChangeDoc(null)}
      />
    </div>
  );
}
