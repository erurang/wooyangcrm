"use client";

import { useState, useEffect } from "react";
import { Plus, Truck, Package, Plane, Ship, ChevronRight } from "lucide-react";
import {
  OverseasConsultation,
  ShippingMethodType,
  SHIPPING_METHOD_LABELS,
  TRADE_STATUS_LABELS,
  ShippingCarrier,
} from "@/types/overseas";

interface SplitShipmentSectionProps {
  parentConsultationId: string;
  parentOcNumber?: string;
  onCreateSplit: () => void;
  onSelectSplit: (split: OverseasConsultation) => void;
}

export default function SplitShipmentSection({
  parentConsultationId,
  parentOcNumber,
  onCreateSplit,
  onSelectSplit,
}: SplitShipmentSectionProps) {
  const [splits, setSplits] = useState<OverseasConsultation[]>([]);
  const [loading, setLoading] = useState(false);

  // 분할 배송 목록 조회
  useEffect(() => {
    const fetchSplits = async () => {
      if (!parentConsultationId) return;

      setLoading(true);
      try {
        const res = await fetch(
          `/api/overseas/consultations/${parentConsultationId}/split`
        );
        if (res.ok) {
          const data = await res.json();
          setSplits(data.splits || []);
        }
      } catch (error) {
        console.error("분할 배송 목록 조회 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSplits();
  }, [parentConsultationId]);

  const getShippingIcon = (method?: ShippingMethodType) => {
    switch (method) {
      case "air":
        return <Plane size={14} className="text-sky-500" />;
      case "sea":
        return <Ship size={14} className="text-teal-500" />;
      case "express":
        return <Truck size={14} className="text-orange-500" />;
      default:
        return <Package size={14} className="text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="border-t border-slate-200 pt-4 mt-4">
        <div className="text-sm text-slate-500">분할 배송 로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-200 pt-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
          <Package size={16} />
          분할 배송
          {splits.length > 0 && (
            <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
              {splits.length}건
            </span>
          )}
        </h4>
        <button
          type="button"
          onClick={onCreateSplit}
          className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 hover:bg-teal-50 px-2 py-1 rounded transition-colors"
        >
          <Plus size={14} />
          분할 추가
        </button>
      </div>

      {splits.length === 0 ? (
        <div className="text-xs text-slate-400 py-2">
          항공/해상 혼합 발주 시 분할 배송을 추가하세요.
          <br />
          예: {parentOcNumber || "AB2505345"}-1 (항공), {parentOcNumber || "AB2505345"}-2 (해상)
        </div>
      ) : (
        <div className="space-y-2">
          {splits.map((split) => (
            <div
              key={split.id}
              onClick={() => onSelectSplit(split)}
              className="flex items-center justify-between p-2 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                {getShippingIcon(split.shipping_method)}
                <div>
                  <div className="text-sm font-medium text-slate-700">
                    {parentOcNumber}-{split.split_number}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>{SHIPPING_METHOD_LABELS[split.shipping_method || "air"]}</span>
                    {split.trade_status && (
                      <>
                        <span className="text-slate-300">|</span>
                        <span>{TRADE_STATUS_LABELS[split.trade_status]}</span>
                      </>
                    )}
                    {split.shipping_carrier && (
                      <>
                        <span className="text-slate-300">|</span>
                        <span>{split.shipping_carrier.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
