"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  Package,
  RefreshCw,
  Truck,
  MapPin,
  Search,
  Plus,
  Trash2,
  X,
  Check,
  AlertCircle,
  Clock,
  ChevronRight,
  Info,
  Calendar,
} from "lucide-react";
import {
  useShippingTrackings,
  addShippingTracking,
  deleteShippingTracking,
} from "@/hooks/useShippingTracking";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import type { CarrierType, ShippingTrackingFormData, ShippingTracking } from "@/types/shipping";

// 국내 택배사 목록 (스마트택배 API 코드)
const DOMESTIC_CARRIERS = {
  "04": "CJ대한통운",
  "06": "로젠택배",
  "05": "한진택배",
  "08": "롯데택배",
  "01": "우체국택배",
  "23": "경동택배",
} as const;

type DomesticCarrierCode = keyof typeof DOMESTIC_CARRIERS;

// 배송 상태 색상
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "bg-gray-100", text: "text-gray-600" },
  picked_up: { bg: "bg-blue-100", text: "text-blue-600" },
  in_transit: { bg: "bg-indigo-100", text: "text-indigo-600" },
  out_for_delivery: { bg: "bg-orange-100", text: "text-orange-600" },
  delivered: { bg: "bg-green-100", text: "text-green-600" },
  exception: { bg: "bg-red-100", text: "text-red-600" },
};

const STATUS_TEXT: Record<string, string> = {
  pending: "접수",
  picked_up: "픽업완료",
  in_transit: "배송중",
  out_for_delivery: "배송출발",
  delivered: "배송완료",
  exception: "배송오류",
};

interface DomesticTrackingResult {
  success: boolean;
  trackingNumber: string;
  carrier: string;
  carrierName: string;
  status: string;
  statusText: string;
  isCompleted?: boolean;
  itemName?: string;
  receiverName?: string;
  estimate?: string | null;
  timeline: Array<{
    date: string;
    time: string;
    status: string;
    location: string;
    description: string;
    telno?: string;
  }>;
  error?: string;
}

// 날짜 유틸리티 함수
function getDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getDefaultDateRange() {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1); // 1달 전
  return {
    startDate: getDateString(startDate),
    endDate: getDateString(endDate),
  };
}

export default function DomesticShippingPage() {
  const defaultRange = useMemo(() => getDefaultDateRange(), []);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTracking, setSelectedTracking] = useState<string | null>(null);
  const [trackingResults, setTrackingResults] = useState<Record<string, DomesticTrackingResult>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 날짜 필터 상태 (기본: 최근 1달)
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);

  // DB에서 등록된 국내택배 송장번호 목록 조회 (날짜 필터 적용)
  const {
    trackings,
    isLoading: trackingsLoading,
    mutate: refreshTrackings,
  } = useShippingTrackings({
    carrier: "domestic",
    startDate,
    endDate,
  });

  // 배송 상태 조회 (캐시된 결과가 있으면 API 호출 안함)
  const fetchTrackingStatus = useCallback(async (tracking: ShippingTracking) => {
    try {
      // 이미 배송완료된 건이고 캐시가 있으면 캐시 사용
      if (tracking.is_completed && tracking.cached_result) {
        const cachedResult = tracking.cached_result as DomesticTrackingResult;
        setTrackingResults((prev) => ({
          ...prev,
          [tracking.tracking_number]: cachedResult,
        }));
        return cachedResult;
      }

      const carrierCode = tracking.carrier_code || "04"; // CJ대한통운
      const response = await fetch(
        `/api/domestic/track/${tracking.tracking_number}?carrier=${carrierCode}`
      );
      const result = await response.json();

      setTrackingResults((prev) => ({
        ...prev,
        [tracking.tracking_number]: result,
      }));

      return result;
    } catch (error) {
      console.error("Tracking fetch error:", error);
      return null;
    }
  }, []);

  // 전체 새로고침
  const refreshAllTrackings = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all(trackings.map(fetchTrackingStatus));
    setIsRefreshing(false);
  }, [trackings, fetchTrackingStatus]);

  // 페이지 로드 시 자동으로 모든 송장 조회
  const fetchedCount = useRef(0);
  useEffect(() => {
    // 새로운 송장이 추가되었거나 처음 로드된 경우
    if (trackings.length > 0 && !trackingsLoading && trackings.length !== fetchedCount.current) {
      fetchedCount.current = trackings.length;
      refreshAllTrackings();
    }
  }, [trackings, trackingsLoading, refreshAllTrackings]);

  // 검색 필터
  const filteredTrackings = trackings.filter(
    (t) =>
      t.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.memo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 상태별 집계
  const statusCounts = {
    total: trackings.length,
    delivered: Object.values(trackingResults).filter((r) => r?.status === "delivered").length,
    inTransit: Object.values(trackingResults).filter(
      (r) => r?.status && !["delivered", "pending"].includes(r.status)
    ).length,
    pending: trackings.length - Object.keys(trackingResults).length,
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("이 송장번호를 삭제하시겠습니까?")) return;

    const result = await deleteShippingTracking(id);
    if (result.success) {
      refreshTrackings();
    } else {
      alert(result.error || "삭제 실패");
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <Truck className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">국내택배 배송현황</h1>
            <p className="text-sm text-gray-500">
              CJ대한통운, 로젠, 한진, 롯데 등 국내 택배 추적
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            송장 등록
          </button>
          <button
            onClick={refreshAllTrackings}
            disabled={isRefreshing || trackingsLoading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            새로고침
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500 mb-1">전체</div>
          <div className="text-2xl font-bold text-gray-900">{statusCounts.total}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500 mb-1">배송중</div>
          <div className="text-2xl font-bold text-indigo-600">{statusCounts.inTransit}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500 mb-1">배송완료</div>
          <div className="text-2xl font-bold text-green-600">{statusCounts.delivered}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500 mb-1">조회대기</div>
          <div className="text-2xl font-bold text-gray-600">{statusCounts.pending}</div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="mb-6 space-y-3">
        {/* 날짜 필터 */}
        <div className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-lg border">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>기간</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <span className="text-gray-400">~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => {
              const range = getDefaultDateRange();
              setStartDate(range.startDate);
              setEndDate(range.endDate);
            }}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            최근 1달
          </button>
          <button
            onClick={() => {
              const endDate = new Date();
              const startDate = new Date();
              startDate.setMonth(startDate.getMonth() - 3);
              setStartDate(getDateString(startDate));
              setEndDate(getDateString(endDate));
            }}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            최근 3달
          </button>
        </div>

        {/* 검색 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="송장번호, 메모로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 로딩 */}
      {trackingsLoading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-green-600 animate-spin" />
          <span className="ml-3 text-gray-500">목록 불러오는 중...</span>
        </div>
      )}

      {/* 테이블 */}
      {!trackingsLoading && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600 w-12">
                    #
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">
                    택배사
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">
                    송장번호
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">
                    상태
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">
                    최근 위치
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">
                    상품명
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTrackings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p>
                        {searchTerm
                          ? "검색 결과가 없습니다."
                          : "등록된 송장이 없습니다."}
                      </p>
                      {!searchTerm && (
                        <button
                          onClick={() => setShowAddModal(true)}
                          className="mt-3 text-teal-600 hover:text-teal-700 text-sm font-medium"
                        >
                          + 송장 등록하기
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredTrackings.map((tracking, index) => {
                    const result = trackingResults[tracking.tracking_number];
                    const status = result?.status || "pending";
                    const statusColor = STATUS_COLORS[status] || STATUS_COLORS.pending;
                    const lastEvent = result?.timeline?.[0];
                    const isExpanded = selectedTracking === tracking.tracking_number;

                    return (
                      <React.Fragment key={tracking.id}>
                        <tr
                          onClick={() => {
                            setSelectedTracking(isExpanded ? null : tracking.tracking_number);
                            if (!result) {
                              fetchTrackingStatus(tracking);
                            }
                          }}
                          className={`hover:bg-gray-50 transition-colors cursor-pointer border-b ${isExpanded ? "bg-green-50" : ""}`}
                        >
                          <td className="py-3 px-3 text-center text-sm text-gray-500 font-medium">
                            {index + 1}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm font-medium text-gray-700">
                              {DOMESTIC_CARRIERS[tracking.carrier_code as DomesticCarrierCode] || tracking.carrier_code || "CJ대한통운"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div
                                className={`transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                              >
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              </div>
                              <span className="font-mono font-semibold text-gray-900">
                                {tracking.tracking_number}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {!result && isRefreshing ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-500">
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                조회중
                              </span>
                            ) : (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${statusColor.bg} ${statusColor.text}`}
                              >
                                {status === "delivered" ? (
                                  <Check className="w-3 h-3" />
                                ) : (
                                  <Truck className="w-3 h-3" />
                                )}
                                {result?.statusText || STATUS_TEXT[status] || "조회중"}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {!result && isRefreshing ? (
                              <span className="text-gray-400">-</span>
                            ) : lastEvent ? (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-gray-400" />
                                {lastEvent.location || "-"}
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700 max-w-[180px] truncate">
                            {!result && isRefreshing ? (
                              <span className="text-gray-400">-</span>
                            ) : (
                              result?.itemName || "-"
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  fetchTrackingStatus(tracking);
                                }}
                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="새로고침"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleDelete(tracking.id, e)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="삭제"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {/* 확장된 상세 정보 */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={7} className="p-0 bg-gray-50 border-b">
                              <TrackingDetailPanel
                                trackingNumber={tracking.tracking_number}
                                result={result}
                                isLoading={!result}
                              />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 송장 등록 모달 */}
      {showAddModal && (
        <AddDomesticTrackingModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            refreshTrackings();
          }}
        />
      )}
    </div>
  );
}

// 상세 정보 패널
function TrackingDetailPanel({
  trackingNumber,
  result,
  isLoading,
}: {
  trackingNumber: string;
  result?: DomesticTrackingResult;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-5 h-5 text-green-600 animate-spin" />
        <span className="ml-2 text-gray-500 text-sm">배송 정보 조회 중...</span>
      </div>
    );
  }

  if (!result || !result.success) {
    return (
      <div className="p-4 flex items-center gap-2 text-red-600 text-sm">
        <AlertCircle className="w-4 h-4" />
        {result?.error || "배송 정보를 조회할 수 없습니다."}
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* 상태 정보 */}
      <div className="mb-4 pb-4 border-b">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-full ${
              result.status === "delivered"
                ? "bg-green-100 text-green-700"
                : "bg-indigo-100 text-indigo-700"
            }`}
          >
            {result.status === "delivered" ? <Check className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
            {result.statusText}
          </span>
          {result.isCompleted && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-50 text-green-600 border border-green-200">
              <Check className="w-3 h-3" />
              배송완료
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-gray-50 rounded-lg p-2">
            <span className="text-gray-400 text-xs block">택배사</span>
            <span className="font-medium text-gray-700">{result.carrierName}</span>
          </div>
          {result.itemName && (
            <div className="bg-gray-50 rounded-lg p-2">
              <span className="text-gray-400 text-xs block">상품명</span>
              <span className="font-medium text-gray-700">{result.itemName}</span>
            </div>
          )}
          {result.receiverName && (
            <div className="bg-gray-50 rounded-lg p-2">
              <span className="text-gray-400 text-xs block">수령인</span>
              <span className="font-medium text-gray-700">{result.receiverName}</span>
            </div>
          )}
          {result.estimate && (
            <div className="bg-gray-50 rounded-lg p-2">
              <span className="text-gray-400 text-xs block">예상 도착</span>
              <span className="font-medium text-gray-700">{result.estimate}</span>
            </div>
          )}
        </div>
      </div>

      {/* 타임라인 */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          배송 이력
        </h4>
        <div className="max-h-72 overflow-y-auto">
          {result.timeline && result.timeline.length > 0 ? (
            <div className="relative pl-4">
              <div className="absolute left-[23px] top-1 bottom-1 w-0.5 bg-green-400 rounded-full" />
              <div className="space-y-3">
                {[...result.timeline].reverse().map((event, idx, arr) => {
                  const isLatest = idx === arr.length - 1;
                  const isDelivered = event.status === "delivered";
                  return (
                    <div key={idx} className="flex gap-3 relative">
                      <div
                        className={`w-4 h-4 rounded-full shrink-0 z-10 ${
                          isLatest
                            ? isDelivered
                              ? "bg-green-600 ring-2 ring-green-200"
                              : "bg-teal-600 ring-2 ring-teal-200"
                            : "bg-green-400"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm ${isLatest ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                          {event.description}
                        </div>
                        <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {event.date} {event.time}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </span>
                          )}
                          {event.telno && (
                            <span className="flex items-center gap-1 text-teal-600">
                              📞 {event.telno}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-400 text-sm">
              <Info className="w-5 h-5 mx-auto mb-1" />
              배송 이력이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 송장 등록 모달
function AddDomesticTrackingModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrierCode, setCarrierCode] = useState<DomesticCarrierCode>("04"); // CJ대한통운
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEscapeKey(true, onClose);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!trackingNumber.trim()) {
      setError("송장번호를 입력하세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const data: ShippingTrackingFormData = {
      carrier: "domestic" as CarrierType,
      tracking_number: trackingNumber.trim(),
      carrier_code: carrierCode,
    };

    const result = await addShippingTracking(data);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || "등록 실패");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            국내택배 송장 등록
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              택배사 <span className="text-red-500">*</span>
            </label>
            <select
              value={carrierCode}
              onChange={(e) => setCarrierCode(e.target.value as DomesticCarrierCode)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {Object.entries(DOMESTIC_CARRIERS).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              송장번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="예: 123456789012"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
              autoFocus
            />
            <p className="mt-1 text-xs text-gray-500">
              송장번호를 입력하세요 (숫자만)
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "등록 중..." : "등록"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
