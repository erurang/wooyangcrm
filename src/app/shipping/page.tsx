"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Package,
  RefreshCw,
  Plane,
  MapPin,
  Calendar,
  ExternalLink,
  Search,
  Plus,
  Trash2,
  Ship,
  Truck,
  X,
  Check,
  AlertCircle,
  Clock,
  ChevronRight,
  ChevronDown,
  Info,
  User,
  Building,
  Phone,
  Box,
  Scale,
  Ruler,
  FileText,
  Signature,
} from "lucide-react";
import {
  useShippingTrackings,
  addShippingTracking,
  deleteShippingTracking,
  useFedExTrackingDetail,
} from "@/hooks/useShippingTracking";
import {
  getFedExStatusColor,
  getFedExStatusText,
  type FedExShipment,
} from "@/hooks/useFedExShipments";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import type { CarrierType, ShippingTrackingFormData } from "@/types/shipping";

type TabType = "fedex";

// 타임라인 이벤트 타입
interface TimelineEvent {
  date: string;
  time: string;
  status: string;
  location: string;
  description: string;
}

// 주소/연락처 정보 타입
interface AddressInfo {
  city?: string;
  stateOrProvince?: string;
  postalCode?: string;
  countryCode?: string;
  countryName?: string;
  streetLines?: string[];
}

interface ContactInfo {
  companyName?: string;
  personName?: string;
  phoneNumber?: string;
}

interface PartyInfo {
  contact?: ContactInfo;
  address?: AddressInfo;
}

interface PackageInfo {
  count?: number;
  weight?: string;
  dimensions?: string;
  packagingDescription?: string;
  sequenceNumber?: string;
}

interface ServiceInfo {
  type?: string;
  description?: string;
}

interface DateInfo {
  shipDate?: string;
  estimatedDelivery?: string;
  estimatedDeliveryTime?: string;
  estimatedDeliveryWindowStart?: string;
  estimatedDeliveryWindowEnd?: string;
  commitDate?: string;
  actualDelivery?: string;
  pickupDate?: string;
}

// 상세 조회 결과 타입
interface TrackingDetail {
  success: boolean;
  trackingNumber: string;
  carrier: string;
  carrierName: string;
  status: string;
  statusText: string;
  eta?: string;
  timeline: TimelineEvent[];
  error?: string;
  // 확장 정보
  shipper?: PartyInfo;
  recipient?: PartyInfo;
  packageInfo?: PackageInfo;
  serviceInfo?: ServiceInfo;
  dateInfo?: DateInfo;
  signedBy?: string;
  deliveryLocation?: string;
}

export default function ShippingPage() {
  const [activeTab, setActiveTab] = useState<TabType>("fedex");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTracking, setSelectedTracking] = useState<string | null>(null);
  const [editingMemo, setEditingMemo] = useState<{ id: string; memo: string; companyId: string; companyName: string } | null>(null);

  // DB에서 등록된 송장번호 목록 조회
  const {
    trackings: fedexTrackings,
    isLoading: trackingsLoading,
    mutate: refreshTrackings,
  } = useShippingTrackings("fedex");

  // FedEx API 조회 결과
  const [fedexResults, setFedexResults] = useState<FedExShipment[]>([]);
  const [fedexError, setFedexError] = useState<string | null>(null);

  // FedEx API로 배송 상태 조회
  const fetchFedExStatus = useCallback(async () => {
    if (fedexTrackings.length === 0) {
      setFedexResults([]);
      return;
    }

    setIsRefreshing(true);
    setFedexError(null);

    try {
      const trackingNumbers = fedexTrackings.map((t) => t.tracking_number);

      const response = await fetch("/api/fedex/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingNumbers }),
      });

      const data = await response.json();

      if (data.error) {
        setFedexError(data.error);
      }

      setFedexResults(data.shipments || []);
    } catch (error) {
      console.error("FedEx API error:", error);
      setFedexError("배송 조회 중 오류가 발생했습니다.");
    } finally {
      setIsRefreshing(false);
    }
  }, [fedexTrackings]);

  // 트래킹 목록이 변경되면 FedEx API 조회
  useEffect(() => {
    if (activeTab === "fedex" && fedexTrackings.length > 0) {
      fetchFedExStatus();
    }
  }, [activeTab, fedexTrackings, fetchFedExStatus]);

  // 트래킹 정보와 API 결과 병합
  const mergedShipments = fedexTrackings.map((tracking) => {
    const apiResult = fedexResults.find(
      (r) => r.trackingNumber === tracking.tracking_number
    );
    return {
      ...tracking,
      apiResult,
    };
  });

  // 검색 필터 및 발송일 최신순 정렬
  const filteredShipments = mergedShipments
    .filter(
      (s) =>
        s.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.memo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.apiResult?.destination.city
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const dateA = a.apiResult?.shipDate || "";
      const dateB = b.apiResult?.shipDate || "";
      return dateB.localeCompare(dateA); // 최신순 정렬
    });

  // 상태별 그룹핑
  const inTransit = filteredShipments.filter((s) =>
    ["IT", "DP", "AR", "OD", "PU"].includes(s.apiResult?.status || "")
  );
  const delivered = filteredShipments.filter(
    (s) => s.apiResult?.status === "DL"
  );
  const pending = filteredShipments.filter(
    (s) =>
      !s.apiResult ||
      !["IT", "DP", "AR", "OD", "PU", "DL"].includes(s.apiResult?.status || "")
  );

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

  const tabs = [
    {
      id: "fedex" as TabType,
      label: "FedEx",
      icon: Plane,
      count: fedexTrackings.length,
      color: "purple",
    },
  ];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Package className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">FedEx 배송현황</h1>
            <p className="text-sm text-gray-500">
              FedEx 국제배송 추적 관리
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
            onClick={() => {
              if (activeTab === "fedex") {
                fetchFedExStatus();
              }
            }}
            disabled={isRefreshing || trackingsLoading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            새로고침
          </button>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 mb-6 border-b pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? `bg-${tab.color}-100 text-${tab.color}-700 shadow-sm`
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id
                  ? `bg-${tab.color}-200 text-${tab.color}-800`
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* 검색 */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="송장번호, 메모, 도시명으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* FedEx 탭 콘텐츠 */}
      {activeTab === "fedex" && (
        <>
          {/* 통계 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border p-4">
              <div className="text-sm text-gray-500 mb-1">전체</div>
              <div className="text-2xl font-bold text-gray-900">
                {fedexTrackings.length}
              </div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="text-sm text-gray-500 mb-1">운송 중</div>
              <div className="text-2xl font-bold text-indigo-600">
                {inTransit.length}
              </div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="text-sm text-gray-500 mb-1">배송 완료</div>
              <div className="text-2xl font-bold text-green-600">
                {delivered.length}
              </div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="text-sm text-gray-500 mb-1">조회 중/기타</div>
              <div className="text-2xl font-bold text-gray-600">
                {pending.length}
              </div>
            </div>
          </div>

          {/* 에러 표시 */}
          {fedexError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 text-sm">{fedexError}</p>
                <p className="text-red-500 text-xs mt-1">
                  환경변수 FEDEX_CLIENT_ID, FEDEX_CLIENT_SECRET를 확인하세요.
                </p>
              </div>
            </div>
          )}

          {/* 로딩 */}
          {(trackingsLoading || isRefreshing) && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 text-purple-600 animate-spin" />
              <span className="ml-3 text-gray-500">배송 정보 조회 중...</span>
            </div>
          )}

          {/* 테이블 */}
          {!trackingsLoading && !isRefreshing && (
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600 w-12">
                        #
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">
                        송장번호
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">
                        상태
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">
                        출발지
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">
                        도착지
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">
                        발송일
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">
                        예상 도착
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">
                        거래처
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">
                        메모
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600">
                        액션
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredShipments.length === 0 ? (
                      <tr>
                        <td
                          colSpan={10}
                          className="py-12 text-center text-gray-500"
                        >
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
                      filteredShipments.map((shipment, index) => {
                        const statusColor = shipment.apiResult
                          ? getFedExStatusColor(shipment.apiResult.status)
                          : { bg: "bg-gray-100", text: "text-gray-600" };
                        const statusText = shipment.apiResult
                          ? shipment.apiResult.statusDescription ||
                            getFedExStatusText(shipment.apiResult.status)
                          : "조회 중";
                        const isExpanded = selectedTracking === shipment.tracking_number;

                        return (
                          <React.Fragment key={shipment.id}>
                            <tr
                              onClick={() =>
                                setSelectedTracking(isExpanded ? null : shipment.tracking_number)
                              }
                              className={`hover:bg-gray-50 transition-colors cursor-pointer border-b ${isExpanded ? "bg-indigo-50" : ""}`}
                            >
                              <td className="py-3 px-3 text-center text-sm text-gray-500 font-medium">
                                {index + 1}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                                  >
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                  </div>
                                  <div>
                                    <div className="font-mono font-semibold text-gray-900">
                                      {shipment.tracking_number}
                                    </div>
                                    {shipment.apiResult?.service && (
                                      <div className="text-xs text-gray-500">
                                        {shipment.apiResult.service}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${statusColor.bg} ${statusColor.text}`}
                                >
                                  {shipment.apiResult?.status === "DL" ? (
                                    <Check className="w-3 h-3" />
                                  ) : (
                                    <RefreshCw className="w-3 h-3" />
                                  )}
                                  {statusText}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-700">
                                {shipment.apiResult ? (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-gray-400" />
                                    {shipment.apiResult.origin.city},{" "}
                                    {shipment.apiResult.origin.country}
                                  </div>
                                ) : (
                                  shipment.origin || "-"
                                )}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-700">
                                {shipment.apiResult ? (
                                  <div className="flex items-center gap-1 font-medium">
                                    <MapPin className="w-3 h-3 text-gray-400" />
                                    {shipment.apiResult.destination.city},{" "}
                                    {shipment.apiResult.destination.country}
                                  </div>
                                ) : (
                                  shipment.destination || "-"
                                )}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600">
                                {shipment.apiResult?.shipDate || "-"}
                              </td>
                              <td className="py-3 px-4 text-sm">
                                {shipment.apiResult?.status === "DL" ? (
                                  <span className="text-green-600">
                                    {shipment.apiResult.actualDelivery || "완료"}
                                  </span>
                                ) : shipment.apiResult?.estimatedDelivery ? (
                                  <span className="text-orange-600">
                                    {shipment.apiResult.estimatedDelivery}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td
                                className="py-3 px-4 text-sm text-gray-700 max-w-[120px] truncate cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingMemo({
                                    id: shipment.id,
                                    memo: shipment.memo || "",
                                    companyId: shipment.company_id || "",
                                    companyName: shipment.company?.name || "",
                                  });
                                }}
                                title="클릭하여 메모/거래처 수정"
                              >
                                {shipment.company?.name || <span className="text-gray-300">거래처 선택</span>}
                              </td>
                              <td
                                className="py-3 px-4 text-sm text-gray-500 max-w-[150px] truncate cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingMemo({
                                    id: shipment.id,
                                    memo: shipment.memo || "",
                                    companyId: shipment.company_id || "",
                                    companyName: shipment.company?.name || "",
                                  });
                                }}
                                title="클릭하여 메모/거래처 수정"
                              >
                                {shipment.memo || <span className="text-gray-300">메모 추가</span>}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center justify-center gap-1">
                                  <a
                                    href={`https://www.fedex.com/fedextrack/?trknbr=${shipment.tracking_number}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                    title="FedEx에서 보기"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                  <button
                                    onClick={(e) => handleDelete(shipment.id, e)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="삭제"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {/* 확장된 상세 정보 영역 */}
                            {isExpanded && (
                              <tr>
                                <td colSpan={10} className="p-0 bg-gray-50 border-b">
                                  <TrackingDetailDropdown
                                    trackingNumber={shipment.tracking_number}
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
        </>
      )}

      {/* 송장 등록 모달 */}
      {showAddModal && (
        <AddTrackingModal
          carrier={activeTab === "domestic" ? "logen" : activeTab}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            refreshTrackings();
          }}
        />
      )}

      {/* 메모/거래처 수정 모달 */}
      {editingMemo && (
        <EditMemoModal
          id={editingMemo.id}
          initialMemo={editingMemo.memo}
          initialCompanyId={editingMemo.companyId}
          initialCompanyName={editingMemo.companyName}
          onClose={() => setEditingMemo(null)}
          onSuccess={() => {
            setEditingMemo(null);
            refreshTrackings();
          }}
        />
      )}
    </div>
  );
}

// 해외거래처 타입
interface OverseasCompany {
  id: string;
  name: string;
}

// 송장 등록 모달
function AddTrackingModal({
  carrier,
  onClose,
  onSuccess,
}: {
  carrier: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [memo, setMemo] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 해외거래처 목록 조회
  const [companies, setCompanies] = useState<OverseasCompany[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch("/api/companies/overseas?limit=100");
        const data = await res.json();
        setCompanies(data.companies || []);
      } catch (err) {
        console.error("Error fetching companies:", err);
      } finally {
        setCompaniesLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  // ESC 키로 모달 닫기
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
      carrier: carrier as CarrierType,
      tracking_number: trackingNumber.trim(),
      memo: memo.trim() || undefined,
      company_id: companyId || undefined,
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            FedEx 송장 등록
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
              송장번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="예: 888143594286"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              해외거래처
            </label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={companiesLoading}
            >
              <option value="">선택 안함</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              연결할 해외거래처를 선택하세요 (선택사항)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              메모
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="품명, 거래 내용 등 메모"
              rows={2}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
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
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "등록 중..." : "등록"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 메모/거래처 수정 모달
function EditMemoModal({
  id,
  initialMemo,
  initialCompanyId,
  initialCompanyName,
  onClose,
  onSuccess,
}: {
  id: string;
  initialMemo: string;
  initialCompanyId: string;
  initialCompanyName: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [memo, setMemo] = useState(initialMemo);
  const [companyId, setCompanyId] = useState(initialCompanyId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 해외거래처 목록 조회
  const [companies, setCompanies] = useState<OverseasCompany[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch("/api/companies/overseas?limit=100");
        const data = await res.json();
        setCompanies(data.companies || []);
      } catch (err) {
        console.error("Error fetching companies:", err);
      } finally {
        setCompaniesLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  // ESC 키로 모달 닫기
  useEscapeKey(true, onClose);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/shipping/tracking/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memo: memo.trim() || null,
          company_id: companyId || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "수정 실패");
        return;
      }

      onSuccess();
    } catch (err) {
      console.error("Error updating memo:", err);
      setError("수정 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">메모/거래처 수정</h2>
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
              해외거래처
            </label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={companiesLoading}
            >
              <option value="">선택 안함</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            {initialCompanyName && !companyId && (
              <p className="mt-1 text-xs text-orange-600">
                기존: {initialCompanyName} (변경 시 선택)
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              메모
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="품명, 거래 내용 등 메모"
              rows={9}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
              autoFocus
            />
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
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 상세 타임라인 모달
function TrackingDetailModal({
  trackingNumber,
  onClose,
}: {
  trackingNumber: string;
  onClose: () => void;
}) {
  const [activeSection, setActiveSection] = useState<"timeline" | "info">("timeline");

  // SWR로 캐싱된 상세 조회 (5분간 캐시 유지)
  const { detail, error, isLoading } = useFedExTrackingDetail(trackingNumber);

  // ESC 키로 모달 닫기
  useEscapeKey(true, onClose);

  // 주소 포맷팅 헬퍼
  const formatAddress = (address?: AddressInfo) => {
    if (!address) return null;
    const parts = [];
    if (address.streetLines?.length) {
      parts.push(...address.streetLines);
    }
    const cityLine = [address.city, address.stateOrProvince, address.postalCode]
      .filter(Boolean)
      .join(", ");
    if (cityLine) parts.push(cityLine);
    if (address.countryName || address.countryCode) {
      parts.push(address.countryName || address.countryCode);
    }
    return parts.length > 0 ? parts : null;
  };

  // 배송 단계 정의
  const deliveryStages = [
    { key: "pending", label: "접수", icon: Package },
    { key: "picked_up", label: "픽업", icon: Box },
    { key: "in_transit", label: "운송중", icon: Truck },
    { key: "out_for_delivery", label: "배송출발", icon: MapPin },
    { key: "delivered", label: "배송완료", icon: Check },
  ];

  // 현재 단계 인덱스 계산
  const getCurrentStageIndex = (status: string) => {
    const statusMap: Record<string, number> = {
      pending: 0,
      picked_up: 1,
      in_transit: 2,
      out_for_delivery: 3,
      delivered: 4,
    };
    return statusMap[status] ?? 0;
  };

  const currentStageIndex = detail ? getCurrentStageIndex(detail.status) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">배송 상세</h2>
            <p className="text-sm text-gray-500 font-mono">{trackingNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="FedEx에서 보기"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 text-purple-600 animate-spin" />
              <span className="ml-3 text-gray-500">조회 중...</span>
            </div>
          )}

          {error && (
            <div className="m-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {detail && !isLoading && (
            <div>
              {/* 배송 진행 프로그레스 바 */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50">
                <div className="relative">
                  {/* 배경 라인 */}
                  <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 rounded-full mx-6" />
                  {/* 진행 라인 */}
                  <div
                    className="absolute top-4 left-0 h-1 bg-indigo-500 rounded-full mx-6 transition-all duration-500"
                    style={{
                      width: `calc(${(currentStageIndex / (deliveryStages.length - 1)) * 100}% - 48px)`,
                    }}
                  />

                  {/* 단계 아이콘들 */}
                  <div className="relative flex justify-between">
                    {deliveryStages.map((stage, idx) => {
                      const isCompleted = idx <= currentStageIndex;
                      const isCurrent = idx === currentStageIndex;
                      const StageIcon = stage.icon;

                      return (
                        <div key={stage.key} className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                              isCompleted
                                ? isCurrent
                                  ? "bg-indigo-600 text-white ring-4 ring-indigo-200"
                                  : "bg-indigo-500 text-white"
                                : "bg-gray-200 text-gray-400"
                            }`}
                          >
                            <StageIcon className="w-4 h-4" />
                          </div>
                          <span
                            className={`text-xs mt-2 font-medium ${
                              isCompleted ? "text-indigo-600" : "text-gray-400"
                            }`}
                          >
                            {stage.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 현재 상태 + 서비스 */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-indigo-100">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-full ${
                      detail.status === "delivered"
                        ? "bg-green-100 text-green-700"
                        : "bg-indigo-100 text-indigo-700"
                    }`}
                  >
                    {detail.status === "delivered" ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Truck className="w-4 h-4" />
                    )}
                    {detail.statusText}
                  </span>
                  {detail.serviceInfo?.description && (
                    <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
                      {detail.serviceInfo.description}
                    </span>
                  )}
                </div>

                {/* 날짜 정보 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mt-3">
                  {detail.dateInfo?.shipDate && (
                    <div>
                      <span className="text-gray-500 text-xs block">발송일</span>
                      <span className="font-medium text-gray-800">{detail.dateInfo.shipDate}</span>
                    </div>
                  )}
                  {detail.status === "delivered" && detail.dateInfo?.actualDelivery && (
                    <div>
                      <span className="text-gray-500 text-xs block">배송 완료</span>
                      <span className="font-medium text-green-600">{detail.dateInfo.actualDelivery}</span>
                    </div>
                  )}
                  {detail.status !== "delivered" && detail.eta && (
                    <div>
                      <span className="text-gray-500 text-xs block">예상 도착</span>
                      <span className="font-medium text-orange-600">{detail.eta}</span>
                    </div>
                  )}
                  {detail.status !== "delivered" && detail.dateInfo?.estimatedDeliveryTime && (
                    <div>
                      <span className="text-gray-500 text-xs block">배송 예상 시간</span>
                      <span className="font-medium text-orange-600">{detail.dateInfo.estimatedDeliveryTime}</span>
                    </div>
                  )}
                  {detail.signedBy && (
                    <div className="col-span-2">
                      <span className="text-gray-500 text-xs block">수령인</span>
                      <span className="font-medium text-gray-800 flex items-center gap-1">
                        <Signature className="w-3 h-3" />
                        {detail.signedBy}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 다음 단계 미리보기 (배송 미완료 시) */}
              {detail.status !== "delivered" && detail.recipient && (
                <div className="mx-4 mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                      <MapPin className="w-3 h-3 text-orange-600" />
                    </div>
                    <span className="text-sm font-semibold text-orange-800">
                      다음 단계: {
                        currentStageIndex === 2 ? "배송을 위해 출고 예정" :
                        currentStageIndex === 3 ? "배송 중" :
                        "도착지로 이동 중"
                      }
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {/* 도착지 정보 */}
                    <div className="bg-white/50 rounded-lg p-3">
                      <div className="text-xs text-orange-600 font-medium mb-2">도착지</div>
                      {detail.recipient.contact?.personName && (
                        <div className="font-medium text-gray-900">
                          {detail.recipient.contact.personName}
                        </div>
                      )}
                      {detail.recipient.contact?.companyName && (
                        <div className="text-gray-700">
                          {detail.recipient.contact.companyName}
                        </div>
                      )}
                      {detail.recipient.address && (
                        <div className="text-gray-600 text-xs mt-1">
                          {[
                            detail.recipient.address.streetLines?.join(", "),
                            detail.recipient.address.city,
                            detail.recipient.address.stateOrProvince,
                            detail.recipient.address.postalCode,
                            detail.recipient.address.countryCode
                          ].filter(Boolean).join(", ")}
                        </div>
                      )}
                      {detail.recipient.contact?.phoneNumber && (
                        <div className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {detail.recipient.contact.phoneNumber}
                        </div>
                      )}
                    </div>

                    {/* 배송 예정 정보 */}
                    <div className="bg-white/50 rounded-lg p-3">
                      <div className="text-xs text-orange-600 font-medium mb-2">배송 예정</div>
                      {detail.eta && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-orange-500" />
                          <span className="font-medium text-gray-900">{detail.eta}</span>
                        </div>
                      )}
                      {detail.dateInfo?.estimatedDeliveryTime && (
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-4 h-4 text-orange-500" />
                          <span className="text-gray-700">{detail.dateInfo.estimatedDeliveryTime}</span>
                        </div>
                      )}
                      {!detail.eta && !detail.dateInfo?.estimatedDeliveryTime && (
                        <span className="text-gray-500">예정 정보 없음</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 탭 메뉴 */}
              <div className="flex border-b">
                <button
                  onClick={() => setActiveSection("timeline")}
                  className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
                    activeSection === "timeline"
                      ? "text-indigo-600 border-b-2 border-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Clock className="w-4 h-4 inline mr-1" />
                  배송 이력
                </button>
                <button
                  onClick={() => setActiveSection("info")}
                  className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
                    activeSection === "info"
                      ? "text-indigo-600 border-b-2 border-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <FileText className="w-4 h-4 inline mr-1" />
                  상세 정보
                </button>
              </div>

              {/* 콘텐츠 영역 */}
              <div className="p-4">
                {/* 배송 이력 탭 */}
                {activeSection === "timeline" && (
                  <>
                    {detail.timeline && detail.timeline.length > 0 ? (
                      <div className="relative">
                        {/* 배경 라인 (회색) */}
                        <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gray-200 rounded-full"></div>
                        {/* 진행 라인 (파란색) - 모든 이벤트는 이미 완료된 것 */}
                        <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-indigo-500 rounded-full"></div>

                        <div className="space-y-4">
                          {[...detail.timeline].reverse().map((event, idx, arr) => {
                            const isLatest = idx === arr.length - 1;
                            const isDelivered = event.description?.toLowerCase().includes("deliver") ||
                                               event.description?.includes("배송완료") ||
                                               event.description?.includes("배달완료");

                            return (
                              <div key={idx} className="flex gap-4 relative">
                                {/* 원형 아이콘 */}
                                <div
                                  className={`w-5 h-5 rounded-full shrink-0 z-10 flex items-center justify-center transition-all ${
                                    isLatest
                                      ? isDelivered
                                        ? "bg-green-500 ring-4 ring-green-100"
                                        : "bg-indigo-600 ring-4 ring-indigo-100"
                                      : "bg-indigo-400"
                                  }`}
                                >
                                  {isLatest && (
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                  )}
                                </div>

                                {/* 내용 */}
                                <div className="flex-1 pb-2">
                                  <div className={`text-sm font-medium ${
                                    isLatest ? "text-gray-900" : "text-gray-700"
                                  }`}>
                                    {event.description}
                                  </div>
                                  {event.location && (
                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {event.location}
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-400 mt-0.5">
                                    {event.date} {event.time}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Info className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">배송 이력이 없습니다.</p>
                      </div>
                    )}
                  </>
                )}

                {/* 상세 정보 탭 */}
                {activeSection === "info" && (
                  <div className="space-y-6">
                    {/* 발송자/수취인 정보 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* 발송자 */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Building className="w-4 h-4 text-blue-500" />
                          발송자 (Shipper)
                        </h4>
                        {detail.shipper ? (
                          <div className="space-y-2 text-sm">
                            {detail.shipper.contact?.companyName && (
                              <div className="font-medium text-gray-900">
                                {detail.shipper.contact.companyName}
                              </div>
                            )}
                            {detail.shipper.contact?.personName && (
                              <div className="flex items-center gap-1 text-gray-600">
                                <User className="w-3 h-3" />
                                {detail.shipper.contact.personName}
                              </div>
                            )}
                            {detail.shipper.contact?.phoneNumber && (
                              <div className="flex items-center gap-1 text-gray-600">
                                <Phone className="w-3 h-3" />
                                {detail.shipper.contact.phoneNumber}
                              </div>
                            )}
                            {formatAddress(detail.shipper.address) && (
                              <div className="flex items-start gap-1 text-gray-600 mt-2">
                                <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                                <div>
                                  {formatAddress(detail.shipper.address)?.map((line, i) => (
                                    <div key={i}>{line}</div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">정보 없음</p>
                        )}
                      </div>

                      {/* 수취인 */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <User className="w-4 h-4 text-green-500" />
                          수취인 (Recipient)
                        </h4>
                        {detail.recipient ? (
                          <div className="space-y-2 text-sm">
                            {detail.recipient.contact?.companyName && (
                              <div className="font-medium text-gray-900">
                                {detail.recipient.contact.companyName}
                              </div>
                            )}
                            {detail.recipient.contact?.personName && (
                              <div className="flex items-center gap-1 text-gray-600">
                                <User className="w-3 h-3" />
                                {detail.recipient.contact.personName}
                              </div>
                            )}
                            {detail.recipient.contact?.phoneNumber && (
                              <div className="flex items-center gap-1 text-gray-600">
                                <Phone className="w-3 h-3" />
                                {detail.recipient.contact.phoneNumber}
                              </div>
                            )}
                            {formatAddress(detail.recipient.address) && (
                              <div className="flex items-start gap-1 text-gray-600 mt-2">
                                <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                                <div>
                                  {formatAddress(detail.recipient.address)?.map((line, i) => (
                                    <div key={i}>{line}</div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">정보 없음</p>
                        )}
                      </div>
                    </div>

                    {/* 패키지 정보 */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Box className="w-4 h-4 text-orange-500" />
                        패키지 정보
                      </h4>
                      {detail.packageInfo ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {detail.packageInfo.count && (
                            <div>
                              <span className="text-xs text-gray-500 block">수량</span>
                              <span className="text-sm font-medium text-gray-800">
                                {detail.packageInfo.count}개
                              </span>
                            </div>
                          )}
                          {detail.packageInfo.weight && (
                            <div>
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Scale className="w-3 h-3" />
                                무게
                              </span>
                              <span className="text-sm font-medium text-gray-800">
                                {detail.packageInfo.weight}
                              </span>
                            </div>
                          )}
                          {detail.packageInfo.dimensions && (
                            <div>
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Ruler className="w-3 h-3" />
                                크기
                              </span>
                              <span className="text-sm font-medium text-gray-800">
                                {detail.packageInfo.dimensions}
                              </span>
                            </div>
                          )}
                          {detail.packageInfo.packagingDescription && (
                            <div>
                              <span className="text-xs text-gray-500 block">포장 유형</span>
                              <span className="text-sm font-medium text-gray-800">
                                {detail.packageInfo.packagingDescription}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">패키지 정보가 없습니다.</p>
                      )}
                    </div>

                    {/* 서비스 정보 */}
                    {detail.serviceInfo && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Plane className="w-4 h-4 text-purple-500" />
                          서비스 정보
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          {detail.serviceInfo.type && (
                            <div>
                              <span className="text-xs text-gray-500 block">서비스 코드</span>
                              <span className="text-sm font-medium text-gray-800">
                                {detail.serviceInfo.type}
                              </span>
                            </div>
                          )}
                          {detail.serviceInfo.description && (
                            <div>
                              <span className="text-xs text-gray-500 block">서비스명</span>
                              <span className="text-sm font-medium text-gray-800">
                                {detail.serviceInfo.description}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 배송 완료 정보 */}
                    {detail.status === "delivered" && (detail.signedBy || detail.deliveryLocation) && (
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          배송 완료 정보
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          {detail.signedBy && (
                            <div>
                              <span className="text-xs text-green-600 flex items-center gap-1">
                                <Signature className="w-3 h-3" />
                                서명자
                              </span>
                              <span className="text-sm font-medium text-green-800">
                                {detail.signedBy}
                              </span>
                            </div>
                          )}
                          {detail.deliveryLocation && (
                            <div>
                              <span className="text-xs text-green-600 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                배송 위치
                              </span>
                              <span className="text-sm font-medium text-green-800">
                                {detail.deliveryLocation}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 테이블 드롭다운 상세 정보
function TrackingDetailDropdown({
  trackingNumber,
}: {
  trackingNumber: string;
}) {
  const [activeTab, setActiveTab] = useState<"timeline" | "info">("timeline");
  const { detail, error, isLoading } = useFedExTrackingDetail(trackingNumber);

  // 배송 단계 정의
  const deliveryStages = [
    { key: "pending", label: "접수", icon: Package },
    { key: "picked_up", label: "픽업", icon: Box },
    { key: "in_transit", label: "운송중", icon: Truck },
    { key: "out_for_delivery", label: "배송출발", icon: MapPin },
    { key: "delivered", label: "배송완료", icon: Check },
  ];

  const getCurrentStageIndex = (status: string) => {
    const statusMap: Record<string, number> = {
      pending: 0,
      picked_up: 1,
      in_transit: 2,
      out_for_delivery: 3,
      delivered: 4,
    };
    return statusMap[status] ?? 0;
  };

  const currentStageIndex = detail ? getCurrentStageIndex(detail.status) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-5 h-5 text-purple-600 animate-spin" />
        <span className="ml-2 text-gray-500 text-sm">조회 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 flex items-center gap-2 text-red-600 text-sm">
        <AlertCircle className="w-4 h-4" />
        {error}
      </div>
    );
  }

  if (!detail) return null;

  return (
    <div className="p-4">
      {/* 진행 상태 바 */}
      <div className="mb-4 pb-4 border-b">
        <div className="relative">
          <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-200 rounded-full mx-4" />
          <div
            className="absolute top-3 left-0 h-0.5 bg-indigo-500 rounded-full mx-4 transition-all duration-500"
            style={{
              width: `calc(${(currentStageIndex / (deliveryStages.length - 1)) * 100}% - 32px)`,
            }}
          />
          <div className="relative flex justify-between">
            {deliveryStages.map((stage, idx) => {
              const isCompleted = idx <= currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              const StageIcon = stage.icon;
              return (
                <div key={stage.key} className="flex flex-col items-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      isCompleted
                        ? isCurrent
                          ? "bg-indigo-600 text-white ring-2 ring-indigo-200"
                          : "bg-indigo-500 text-white"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    <StageIcon className="w-3 h-3" />
                  </div>
                  <span className={`text-xs mt-1 ${isCompleted ? "text-indigo-600" : "text-gray-400"}`}>
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 상태 및 날짜 정보 */}
        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
              detail.status === "delivered"
                ? "bg-green-100 text-green-700"
                : "bg-indigo-100 text-indigo-700"
            }`}
          >
            {detail.status === "delivered" ? <Check className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
            {detail.statusText}
          </span>
          {detail.dateInfo?.shipDate && (
            <span className="text-gray-600">
              <span className="text-gray-400">발송:</span> {detail.dateInfo.shipDate}
            </span>
          )}
          {detail.status === "delivered" && detail.dateInfo?.actualDelivery && (
            <span className="text-green-600">
              <span className="text-gray-400">완료:</span> {detail.dateInfo.actualDelivery}
            </span>
          )}
          {detail.status !== "delivered" && detail.eta && (
            <span className="text-orange-600">
              <span className="text-gray-400">예상:</span> {detail.eta}
              {detail.dateInfo?.estimatedDeliveryTime && ` (${detail.dateInfo.estimatedDeliveryTime})`}
            </span>
          )}
          {detail.signedBy && (
            <span className="text-gray-600 flex items-center gap-1">
              <Signature className="w-3 h-3" />
              {detail.signedBy}
            </span>
          )}
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setActiveTab("timeline")}
          className={`text-sm font-medium pb-1 border-b-2 transition-colors ${
            activeTab === "timeline"
              ? "text-indigo-600 border-indigo-600"
              : "text-gray-500 border-transparent hover:text-gray-700"
          }`}
        >
          <Clock className="w-3 h-3 inline mr-1" />
          배송 이력
        </button>
        <button
          onClick={() => setActiveTab("info")}
          className={`text-sm font-medium pb-1 border-b-2 transition-colors ${
            activeTab === "info"
              ? "text-indigo-600 border-indigo-600"
              : "text-gray-500 border-transparent hover:text-gray-700"
          }`}
        >
          <FileText className="w-3 h-3 inline mr-1" />
          상세 정보
        </button>
      </div>

      {/* 콘텐츠 */}
      {activeTab === "timeline" && (
        <div className="max-h-64 overflow-y-auto">
          {detail.timeline && detail.timeline.length > 0 ? (
            <div className="relative pl-4">
              <div className="absolute left-[23px] top-1 bottom-1 w-0.5 bg-indigo-400 rounded-full" />
              <div className="space-y-3">
                {[...detail.timeline].reverse().map((event, idx, arr) => {
                  const isLatest = idx === arr.length - 1;
                  return (
                    <div key={idx} className="flex gap-3 relative">
                      <div
                        className={`w-4 h-4 rounded-full shrink-0 z-10 ${
                          isLatest ? "bg-indigo-600 ring-2 ring-indigo-200" : "bg-indigo-400"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm ${isLatest ? "font-medium text-gray-900" : "text-gray-700"}`}>
                          {event.description}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </span>
                          )}
                          <span>{event.date} {event.time}</span>
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
      )}

      {activeTab === "info" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm max-h-64 overflow-y-auto">
          {/* 발송자 */}
          <div className="bg-white rounded-lg p-3 border">
            <div className="font-medium text-gray-700 mb-2 flex items-center gap-1">
              <Building className="w-3 h-3 text-blue-500" />
              발송자
            </div>
            {detail.shipper ? (
              <div className="text-xs text-gray-600 space-y-1">
                {detail.shipper.contact?.companyName && <div className="font-medium">{detail.shipper.contact.companyName}</div>}
                {detail.shipper.contact?.personName && <div>{detail.shipper.contact.personName}</div>}
                {detail.shipper.address && (
                  <div className="text-gray-500">
                    {[detail.shipper.address.city, detail.shipper.address.stateOrProvince, detail.shipper.address.countryCode].filter(Boolean).join(", ")}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-xs text-gray-400">정보 없음</span>
            )}
          </div>

          {/* 수취인 */}
          <div className="bg-white rounded-lg p-3 border">
            <div className="font-medium text-gray-700 mb-2 flex items-center gap-1">
              <User className="w-3 h-3 text-green-500" />
              수취인
            </div>
            {detail.recipient ? (
              <div className="text-xs text-gray-600 space-y-1">
                {detail.recipient.contact?.companyName && <div className="font-medium">{detail.recipient.contact.companyName}</div>}
                {detail.recipient.contact?.personName && <div>{detail.recipient.contact.personName}</div>}
                {detail.recipient.address && (
                  <div className="text-gray-500">
                    {[detail.recipient.address.city, detail.recipient.address.stateOrProvince, detail.recipient.address.countryCode].filter(Boolean).join(", ")}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-xs text-gray-400">정보 없음</span>
            )}
          </div>

          {/* 패키지 정보 */}
          <div className="bg-white rounded-lg p-3 border">
            <div className="font-medium text-gray-700 mb-2 flex items-center gap-1">
              <Box className="w-3 h-3 text-orange-500" />
              패키지
            </div>
            {detail.packageInfo ? (
              <div className="text-xs text-gray-600 space-y-1">
                {detail.packageInfo.weight && (
                  <div className="flex items-center gap-1">
                    <Scale className="w-3 h-3 text-gray-400" />
                    {detail.packageInfo.weight}
                  </div>
                )}
                {detail.packageInfo.dimensions && (
                  <div className="flex items-center gap-1">
                    <Ruler className="w-3 h-3 text-gray-400" />
                    {detail.packageInfo.dimensions}
                  </div>
                )}
                {detail.packageInfo.packagingDescription && (
                  <div className="text-gray-500">{detail.packageInfo.packagingDescription}</div>
                )}
                {!detail.packageInfo.weight && !detail.packageInfo.dimensions && !detail.packageInfo.packagingDescription && (
                  <span className="text-gray-400">상세 정보 없음</span>
                )}
              </div>
            ) : (
              <span className="text-xs text-gray-400">정보 없음</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
