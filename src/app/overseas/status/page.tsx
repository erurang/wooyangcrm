"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useLoginUser } from "@/context/login";
import { ArrowLeft, RefreshCw, Building2, Calendar } from "lucide-react";
import {
  OverseasConsultation,
  TradeStatus,
  TRADE_STATUS_LABELS,
  TRADE_STATUS_COLORS,
  TRADE_STATUS_ORDER,
  ORDER_TYPE_LABELS,
} from "@/types/overseas";

// 칸반 카드 컴포넌트
function KanbanCard({
  consultation,
  onClick,
}: {
  consultation: OverseasConsultation;
  onClick: () => void;
}) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      {/* 거래처명 */}
      <div className="flex items-center gap-1.5 mb-2">
        <Building2 size={14} className="text-slate-400" />
        <span className="text-sm font-medium text-slate-800 truncate">
          {consultation.company_name || "거래처 미지정"}
        </span>
      </div>

      {/* 수입/수출 + O/C No. */}
      <div className="flex items-center gap-2 mb-2">
        {consultation.order_type && (
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
              consultation.order_type === "import"
                ? "bg-sky-50 text-sky-600"
                : "bg-emerald-50 text-emerald-600"
            }`}
          >
            {ORDER_TYPE_LABELS[consultation.order_type]}
          </span>
        )}
        {consultation.oc_number && (
          <span className="text-xs font-mono text-slate-500">
            {consultation.oc_number}
          </span>
        )}
      </div>

      {/* 제목 or 내용 미리보기 */}
      {consultation.title ? (
        <p className="text-sm text-slate-700 mb-2 line-clamp-1">
          {consultation.title}
        </p>
      ) : (
        <p className="text-xs text-slate-500 mb-2 line-clamp-2">
          {consultation.content}
        </p>
      )}

      {/* 날짜 정보 */}
      <div className="flex items-center gap-3 text-[10px] text-slate-400">
        {consultation.order_date && (
          <span className="flex items-center gap-0.5">
            <Calendar size={10} />
            발주 {formatDate(consultation.order_date)}
          </span>
        )}
        {consultation.expected_completion_date && (
          <span>완료예정 {formatDate(consultation.expected_completion_date)}</span>
        )}
      </div>
    </div>
  );
}

// 칸반 컬럼 컴포넌트
function KanbanColumn({
  status,
  consultations,
  onCardClick,
  onStatusChange,
}: {
  status: TradeStatus;
  consultations: OverseasConsultation[];
  onCardClick: (consultation: OverseasConsultation) => void;
  onStatusChange: (consultationId: string, newStatus: TradeStatus) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const consultationId = e.dataTransfer.getData("consultationId");
    if (consultationId) {
      onStatusChange(consultationId, status);
    }
  };

  const handleDragStart = (e: React.DragEvent, consultationId: string) => {
    e.dataTransfer.setData("consultationId", consultationId);
  };

  return (
    <div
      className={`flex-1 min-w-[280px] max-w-[320px] flex flex-col rounded-xl border ${
        isDragOver ? "border-teal-400 bg-teal-50/50" : "border-slate-200 bg-slate-50"
      } transition-colors`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 컬럼 헤더 */}
      <div className={`px-3 py-2.5 rounded-t-xl border-b ${TRADE_STATUS_COLORS[status]}`}>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">{TRADE_STATUS_LABELS[status]}</span>
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/50">
            {consultations.length}
          </span>
        </div>
      </div>

      {/* 카드 목록 */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
        {consultations.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-400">
            항목 없음
          </div>
        ) : (
          consultations.map((consultation) => (
            <div
              key={consultation.id}
              draggable
              onDragStart={(e) => handleDragStart(e, consultation.id)}
            >
              <KanbanCard
                consultation={consultation}
                onClick={() => onCardClick(consultation)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function OverseasStatusPage() {
  const loginUser = useLoginUser();
  const [isUpdating, setIsUpdating] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | "import" | "export">("all");

  // 모든 해외 상담 조회 (상태별로 그룹화하기 위해)
  const {
    data: consultationsData,
    isLoading,
    mutate: refreshConsultations,
  } = useSWR<{ consultations: OverseasConsultation[]; total: number }>(
    "/api/overseas/consultations?limit=200",
    (url) => fetcher(url, { arg: { method: "GET" } }),
    { revalidateOnFocus: false }
  );

  const allConsultations = consultationsData?.consultations || [];

  // 타입별 필터링
  const consultations = allConsultations.filter((c) => {
    if (typeFilter === "all") return true;
    return c.order_type === typeFilter;
  });

  // 타입별 카운트
  const importCount = allConsultations.filter((c) => c.order_type === "import").length;
  const exportCount = allConsultations.filter((c) => c.order_type === "export").length;

  // 상태별로 상담 그룹화
  const groupedConsultations: Record<TradeStatus, OverseasConsultation[]> = {
    ordered: [],
    production_complete: [],
    shipped: [],
    in_transit: [],
    arrived: [],
  };

  consultations.forEach((consultation) => {
    if (consultation.trade_status && groupedConsultations[consultation.trade_status]) {
      groupedConsultations[consultation.trade_status].push(consultation);
    }
  });

  // 상태 없는 항목 수 (필터링된 항목 기준)
  const unassignedCount = consultations.filter((c) => !c.trade_status).length;

  // 상태 변경 핸들러
  const handleStatusChange = useCallback(
    async (consultationId: string, newStatus: TradeStatus) => {
      setIsUpdating(true);
      try {
        await fetcher(`/api/consultations/${consultationId}`, {
          arg: {
            method: "PATCH",
            body: { trade_status: newStatus },
          },
        });
        refreshConsultations();
      } catch (error) {
        console.error("상태 변경 실패:", error);
      } finally {
        setIsUpdating(false);
      }
    },
    [refreshConsultations]
  );

  // 카드 클릭 (해당 거래처 페이지로 이동)
  const handleCardClick = useCallback((consultation: OverseasConsultation) => {
    if (consultation.company_id) {
      window.location.href = `/overseas/${consultation.company_id}`;
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-slate-500">상담 내역을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-sm text-slate-800">
      {/* 헤더 */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* 좌측 */}
            <div className="flex items-center gap-3">
              <Link
                href="/overseas"
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={18} />
              </Link>
              <h1 className="text-lg font-bold text-slate-800">거래 현황 보드</h1>
              {unassignedCount > 0 && (
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  미지정 {unassignedCount}건
                </span>
              )}
            </div>

            {/* 우측 */}
            <button
              onClick={() => refreshConsultations()}
              disabled={isUpdating}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={isUpdating ? "animate-spin" : ""} />
              새로고침
            </button>
          </div>

          {/* 수입/수출 필터 탭 */}
          <div className="flex gap-1 mt-3">
            <button
              onClick={() => setTypeFilter("all")}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                typeFilter === "all"
                  ? "bg-slate-700 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              전체 ({allConsultations.length})
            </button>
            <button
              onClick={() => setTypeFilter("import")}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                typeFilter === "import"
                  ? "bg-sky-600 text-white"
                  : "text-sky-600 hover:bg-sky-50"
              }`}
            >
              수입 ({importCount})
            </button>
            <button
              onClick={() => setTypeFilter("export")}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                typeFilter === "export"
                  ? "bg-emerald-600 text-white"
                  : "text-emerald-600 hover:bg-emerald-50"
              }`}
            >
              수출 ({exportCount})
            </button>
          </div>
        </div>
      </div>

      {/* 칸반 보드 */}
      <div className="p-4 overflow-x-auto">
        <div className="flex gap-4 min-w-max">
          {TRADE_STATUS_ORDER
            .filter((status) => {
              // 수출일 때는 운송중, 입고완료 제외 (출고완료로 끝)
              if (typeFilter === "export") {
                return !["in_transit", "arrived"].includes(status);
              }
              return true;
            })
            .map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              consultations={groupedConsultations[status]}
              onCardClick={handleCardClick}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      </div>

      {/* 안내 */}
      <div className="px-4 pb-4">
        <p className="text-xs text-slate-400">
          * 카드를 드래그하여 상태를 변경할 수 있습니다. 상태가 지정되지 않은 항목은 각 거래처 페이지에서 설정해주세요.
        </p>
      </div>
    </div>
  );
}
