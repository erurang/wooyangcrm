"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ShippingMethodType,
  SHIPPING_METHOD_LABELS,
  ShippingCarrier,
  TradeStatus,
  TRADE_STATUS_LABELS,
} from "@/types/overseas";

interface CreateSplitShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentConsultationId: string;
  parentOcNumber?: string;
  onSuccess: () => void;
  userId?: string;
}

export default function CreateSplitShipmentModal({
  isOpen,
  onClose,
  parentConsultationId,
  parentOcNumber,
  onSuccess,
  userId,
}: CreateSplitShipmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [shippingCarriers, setShippingCarriers] = useState<ShippingCarrier[]>([]);
  const [formData, setFormData] = useState({
    shipping_method: "air" as ShippingMethodType,
    shipping_carrier_id: "",
    trade_status: "ordered" as TradeStatus,
    quantity: "",
    remarks: "",
  });

  // 운송업체 목록 로드
  useEffect(() => {
    if (isOpen) {
      fetch("/api/shipping-carriers")
        .then((res) => res.json())
        .then((data) => {
          if (data.carriers) {
            setShippingCarriers(data.carriers);
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/overseas/consultations/${parentConsultationId}/split`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            user_id: userId,
          }),
        }
      );

      if (res.ok) {
        onSuccess();
        onClose();
        // 폼 초기화
        setFormData({
          shipping_method: "air",
          shipping_carrier_id: "",
          trade_status: "ordered",
          quantity: "",
          remarks: "",
        });
      } else {
        const data = await res.json();
        alert(data.error || "분할 배송 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("분할 배송 생성 오류:", error);
      alert("분할 배송 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-xl shadow-xl w-full max-w-md"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="text-lg font-semibold text-slate-800">
              분할 배송 추가
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X size={20} />
            </button>
          </div>

          {/* 내용 */}
          <div className="p-4 space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="text-xs text-slate-500 mb-1">원본 O/C No.</div>
              <div className="text-sm font-medium text-slate-700">
                {parentOcNumber || "-"}
              </div>
            </div>

            {/* 운송방법 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                운송방법 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.shipping_method}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shipping_method: e.target.value as ShippingMethodType,
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {Object.entries(SHIPPING_METHOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* 운송업체 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                운송업체
              </label>
              <select
                value={formData.shipping_carrier_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shipping_carrier_id: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">선택</option>
                {shippingCarriers.map((carrier) => (
                  <option key={carrier.id} value={carrier.id}>
                    {carrier.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 상태 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                상태
              </label>
              <select
                value={formData.trade_status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    trade_status: e.target.value as TradeStatus,
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {Object.entries(TRADE_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* 수량 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                수량
              </label>
              <input
                type="text"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                placeholder="이 분할에 포함된 수량"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* 비고 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                비고
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
                placeholder="추가 메모"
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>
          </div>

          {/* 푸터 */}
          <div className="flex justify-end gap-2 px-4 py-3 border-t bg-slate-50 rounded-b-xl">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              분할 추가
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
