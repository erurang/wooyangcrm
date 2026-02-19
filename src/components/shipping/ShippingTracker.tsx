"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck,
  Search,
  RefreshCw,
  Package,
  MapPin,
  Calendar,
  ExternalLink,
  Plus,
  X,
} from "lucide-react";
import {
  useShippingTrack,
  registerShipping,
  CARRIER_OPTIONS,
  DOMESTIC_CARRIER_OPTIONS,
  INTERNATIONAL_CARRIER_OPTIONS,
  getStatusText,
  getStatusColor,
} from "@/hooks/useShippingTrack";
import type { CarrierCode, TrackingEvent, TrackingResult } from "@/lib/carriers";
import ShippingTimeline from "./ShippingTimeline";

interface ShippingTrackerProps {
  // 초기값 (주문 상세에서 사용 시)
  initialCarrier?: CarrierCode;
  initialTrackingNumber?: string;
  // 연동 정보
  orderId?: string;
  orderType?: "outbound" | "overseas_order";
  // 모드
  mode?: "lookup" | "manage"; // lookup: 조회만, manage: 등록/수정 가능
  // 스타일
  compact?: boolean;
}

export default function ShippingTracker({
  initialCarrier,
  initialTrackingNumber,
  orderId,
  orderType,
  mode = "lookup",
  compact = false,
}: ShippingTrackerProps) {
  const [carrier, setCarrier] = useState<CarrierCode | "">(initialCarrier || "");
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber || "");
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const { tracking, isLoading, isError, mutate } = useShippingTrack(
    carrier || undefined,
    trackingNumber || undefined
  );

  const handleSearch = useCallback(() => {
    if (carrier && trackingNumber) {
      mutate();
    }
  }, [carrier, trackingNumber, mutate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className={`bg-white rounded-lg border ${compact ? "p-3" : "p-4"}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-slate-800 flex items-center gap-2">
          <Truck size={18} className="text-sky-500" />
          배송 추적
        </h3>
        {mode === "manage" && (
          <button
            onClick={() => setShowRegisterModal(true)}
            className="text-xs text-sky-600 hover:text-sky-800 flex items-center gap-1"
          >
            <Plus size={14} />
            수동 등록
          </button>
        )}
      </div>

      {/* 검색 폼 */}
      <div className="flex gap-2 mb-4">
        <select
          value={carrier}
          onChange={(e) => setCarrier(e.target.value as CarrierCode)}
          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
        >
          <option value="">택배사 선택</option>
          <optgroup label="국내">
            {DOMESTIC_CARRIER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="해외">
            {INTERNATIONAL_CARRIER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </optgroup>
        </select>

        <div className="flex-1 relative">
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="송장번호 입력"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
        </div>

        <button
          onClick={handleSearch}
          disabled={!carrier || !trackingNumber || isLoading}
          className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <Search size={16} />
          )}
          <span className="hidden sm:inline">조회</span>
        </button>
      </div>

      {/* 결과 */}
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-8"
          >
            <RefreshCw size={24} className="animate-spin text-sky-500" />
          </motion.div>
        )}

        {isError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-6 text-red-500"
          >
            <p className="text-sm">조회에 실패했습니다.</p>
            <button
              onClick={handleSearch}
              className="mt-2 text-xs text-sky-600 hover:underline"
            >
              다시 시도
            </button>
          </motion.div>
        )}

        {!isLoading && !isError && tracking && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {/* 요약 정보 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="text-xs text-slate-400">송장번호</p>
                <p className="font-medium text-sm">{tracking.trackingNumber}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">택배사</p>
                <p className="font-medium text-sm">{tracking.carrierName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">상태</p>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(tracking.status)}`}
                >
                  {getStatusText(tracking.status)}
                </span>
              </div>
              {tracking.eta && (
                <div>
                  <p className="text-xs text-slate-400">예상 도착</p>
                  <p className="font-medium text-sm flex items-center gap-1">
                    <Calendar size={12} />
                    {tracking.eta}
                  </p>
                </div>
              )}
            </div>

            {/* 출발지/도착지 */}
            {(tracking.origin || tracking.destination) && (
              <div className="flex items-center gap-2 mb-4 text-sm text-slate-500">
                {tracking.origin && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} className="text-green-500" />
                    {tracking.origin}
                  </span>
                )}
                {tracking.origin && tracking.destination && (
                  <span className="text-slate-400">→</span>
                )}
                {tracking.destination && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} className="text-red-500" />
                    {tracking.destination}
                  </span>
                )}
              </div>
            )}

            {/* 타임라인 */}
            <ShippingTimeline
              timeline={tracking.timeline}
              status={tracking.status}
            />

            {/* 외부 링크 */}
            <div className="mt-4 pt-3 border-t">
              <a
                href={getTrackingUrl(tracking.carrier, tracking.trackingNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-sky-600 hover:underline flex items-center gap-1"
              >
                <ExternalLink size={12} />
                택배사 사이트에서 확인
              </a>
            </div>
          </motion.div>
        )}

        {!isLoading && !isError && !tracking && carrier && trackingNumber && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-8 text-slate-400"
          >
            <Package size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">배송 정보가 없습니다.</p>
            <p className="text-xs mt-1">
              송장번호와 택배사가 맞는지 확인해주세요.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 수동 등록 모달 */}
      <AnimatePresence>
        {showRegisterModal && (
          <ManualRegisterModal
            orderId={orderId}
            orderType={orderType}
            onClose={() => setShowRegisterModal(false)}
            onSuccess={() => {
              setShowRegisterModal(false);
              mutate();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// 수동 등록 모달
function ManualRegisterModal({
  orderId,
  orderType,
  onClose,
  onSuccess,
}: {
  orderId?: string;
  orderType?: "outbound" | "overseas_order";
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    carrier: "" as CarrierCode | "",
    trackingNumber: "",
    origin: "",
    destination: "",
    eta: "",
    status: "pending" as TrackingResult["status"],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.carrier || !formData.trackingNumber) {
      setError("택배사와 송장번호는 필수입니다.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const result = await registerShipping({
      orderId,
      orderType,
      carrier: formData.carrier,
      trackingNumber: formData.trackingNumber,
      origin: formData.origin || undefined,
      destination: formData.destination || undefined,
      eta: formData.eta || undefined,
      status: formData.status,
    });

    setIsSubmitting(false);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || "등록에 실패했습니다.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">배송 정보 수동 등록</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                택배사 *
              </label>
              <select
                value={formData.carrier}
                onChange={(e) =>
                  setFormData({ ...formData, carrier: e.target.value as CarrierCode })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm"
                required
              >
                <option value="">선택</option>
                {CARRIER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                상태
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as TrackingResult["status"],
                  })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="pending">대기</option>
                <option value="picked_up">수거 완료</option>
                <option value="in_transit">운송 중</option>
                <option value="out_for_delivery">배송 중</option>
                <option value="delivered">배송 완료</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              송장번호 *
            </label>
            <input
              type="text"
              value={formData.trackingNumber}
              onChange={(e) =>
                setFormData({ ...formData, trackingNumber: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="예: 123456789012"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                출발지
              </label>
              <input
                type="text"
                value={formData.origin}
                onChange={(e) =>
                  setFormData({ ...formData, origin: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="예: 서울"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                도착지
              </label>
              <input
                type="text"
                value={formData.destination}
                onChange={(e) =>
                  setFormData({ ...formData, destination: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="예: 부산"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              예상 도착일
            </label>
            <input
              type="date"
              value={formData.eta}
              onChange={(e) =>
                setFormData({ ...formData, eta: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <RefreshCw size={14} className="animate-spin" />}
              등록
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// 택배사별 추적 URL
function getTrackingUrl(carrier: string, trackingNumber: string): string {
  switch (carrier) {
    case "logen":
      return `https://www.ilogen.com/web/personal/trace/${trackingNumber}`;
    case "kyungdong":
      return `https://kdexp.com/delivery/delivery_search.do?barcode=${trackingNumber}`;
    case "fedex":
      return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
    case "sne":
      return `https://www.sne.co.kr/tracking?awb=${trackingNumber}`;
    default:
      return "#";
  }
}
