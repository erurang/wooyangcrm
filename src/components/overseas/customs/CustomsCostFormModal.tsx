"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import {
  CustomsCostFormData,
  ShippingMethodType,
  SHIPPING_METHOD_LABELS,
  OverseasConsultation,
  ShippingCarrier,
} from "@/types/overseas";
import { useOverseasCompanies } from "@/hooks/overseas";

interface CustomsCostFormModalProps {
  mode: "add" | "edit";
  isOpen: boolean;
  formData: CustomsCostFormData;
  setFormData: (data: CustomsCostFormData) => void;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  saving: boolean;
}

const formatNumber = (value: number | "") => {
  if (value === "" || value === 0) return "";
  return new Intl.NumberFormat("ko-KR").format(value);
};

const parseNumber = (value: string): number | "" => {
  const cleaned = value.replace(/[^0-9]/g, "");
  if (cleaned === "") return "";
  return parseInt(cleaned, 10);
};

export default function CustomsCostFormModal({
  mode,
  isOpen,
  formData,
  setFormData,
  onClose,
  onSubmit,
  saving,
}: CustomsCostFormModalProps) {
  const title = mode === "add" ? "통관비용 추가" : "통관비용 수정";
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { companies } = useOverseasCompanies({ limit: 100 });
  const [consultations, setConsultations] = useState<OverseasConsultation[]>([]);
  const [loadingConsultations, setLoadingConsultations] = useState(false);
  const [shippingCarriers, setShippingCarriers] = useState<ShippingCarrier[]>([]);

  useEscapeKey(isOpen, onClose);

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

  // 거래처 선택 시 해당 거래처의 상담 목록 조회
  useEffect(() => {
    const fetchConsultations = async () => {
      if (!formData.company_id) {
        setConsultations([]);
        return;
      }

      setLoadingConsultations(true);
      try {
        const res = await fetch(
          `/api/overseas/consultations?company_id=${formData.company_id}&limit=100`
        );
        if (res.ok) {
          const data = await res.json();
          // oc_number가 있는 상담만 필터링
          const filtered = (data.consultations || []).filter(
            (c: OverseasConsultation) => c.oc_number
          );
          setConsultations(filtered);
        }
      } catch (error) {
        console.error("상담 목록 조회 실패:", error);
      } finally {
        setLoadingConsultations(false);
      }
    };

    fetchConsultations();
  }, [formData.company_id]);

  // 상담 선택 시 필드 자동 채우기
  const handleConsultationSelect = useCallback(
    (consultationId: string) => {
      const selected = consultations.find((c) => c.id === consultationId);
      if (selected) {
        setFormData({
          ...formData,
          consultation_id: consultationId,
          invoice_no: selected.oc_number || formData.invoice_no,
          shipping_method: selected.shipping_method || formData.shipping_method,
          shipping_carrier_id: selected.shipping_carrier_id || formData.shipping_carrier_id,
        });
      } else {
        setFormData({
          ...formData,
          consultation_id: consultationId,
        });
      }
    },
    [consultations, formData, setFormData]
  );

  // 소계 및 합계 자동 계산
  useEffect(() => {
    const airFreight = formData.air_freight === "" ? 0 : formData.air_freight;
    const seaFreight = formData.sea_freight === "" ? 0 : formData.sea_freight;
    const customsDuty = formData.customs_duty === "" ? 0 : formData.customs_duty;
    const portCharges = formData.port_charges === "" ? 0 : formData.port_charges;
    const domesticTransport = formData.domestic_transport === "" ? 0 : formData.domestic_transport;
    const expressFreight = formData.express_freight === "" ? 0 : formData.express_freight;
    const vat = formData.vat === "" ? 0 : formData.vat;

    const subtotal =
      airFreight +
      seaFreight +
      customsDuty +
      portCharges +
      domesticTransport +
      expressFreight;
    const total = subtotal + vat;

    // 이 값들은 표시 용도로만 사용 (formData에 포함되지 않음)
    document.getElementById("subtotal")?.setAttribute("data-value", subtotal.toString());
    document.getElementById("total")?.setAttribute("data-value", total.toString());
  }, [formData]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.company_id) {
      newErrors.company_id = "거래처를 선택해주세요.";
    }

    if (!formData.clearance_date) {
      newErrors.clearance_date = "통관일을 입력해주세요.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;
    await onSubmit();
  }, [validateForm, onSubmit]);

  const handleClose = useCallback(() => {
    setErrors({});
    onClose();
  }, [onClose]);

  const handleNumberChange = (field: keyof CustomsCostFormData, value: string) => {
    setFormData({ ...formData, [field]: parseNumber(value) });
  };

  // 계산된 값
  const airFreight = formData.air_freight === "" ? 0 : formData.air_freight;
  const seaFreight = formData.sea_freight === "" ? 0 : formData.sea_freight;
  const customsDuty = formData.customs_duty === "" ? 0 : formData.customs_duty;
  const portCharges = formData.port_charges === "" ? 0 : formData.port_charges;
  const domesticTransport = formData.domestic_transport === "" ? 0 : formData.domestic_transport;
  const expressFreight = formData.express_freight === "" ? 0 : formData.express_freight;
  const vat = formData.vat === "" ? 0 : formData.vat;
  const subtotal = airFreight + seaFreight + customsDuty + portCharges + domesticTransport + expressFreight;
  const total = subtotal + vat;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
          >
              <div className="bg-white px-4 pt-4 pb-4 sm:p-6 sm:pb-4 flex-1 overflow-y-auto">
                <h3 className="text-base sm:text-lg leading-6 font-medium text-slate-800 mb-4 sm:mb-6 sticky top-0 bg-white py-2 -mt-2 border-b sm:border-none">
                  {title}
                </h3>

                <div className="space-y-4">
                  {/* 기본 정보 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">
                        거래처 <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.company_id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            company_id: e.target.value,
                            consultation_id: "", // 거래처 변경 시 상담 선택 초기화
                          })
                        }
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                          errors.company_id ? "border-red-500" : "border-slate-300"
                        }`}
                      >
                        <option value="">거래처 선택</option>
                        {companies.map((company) => (
                          <option key={company.id} value={company.id}>
                            {company.name}
                          </option>
                        ))}
                      </select>
                      {errors.company_id && (
                        <p className="text-red-500 text-xs mt-1">{errors.company_id}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">
                        해외 상담 연결
                      </label>
                      <select
                        value={formData.consultation_id}
                        onChange={(e) => handleConsultationSelect(e.target.value)}
                        disabled={!formData.company_id || loadingConsultations}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {loadingConsultations
                            ? "로딩 중..."
                            : !formData.company_id
                            ? "거래처를 먼저 선택하세요"
                            : consultations.length === 0
                            ? "연결할 상담 없음"
                            : "상담 선택 (O/C No.)"}
                        </option>
                        {consultations.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.oc_number}
                            {c.product_name ? ` - ${c.product_name}` : ""}
                            {c.order_date ? ` (${c.order_date})` : ""}
                          </option>
                        ))}
                      </select>
                      {formData.consultation_id && (
                        <p className="text-xs text-green-600 mt-1">
                          상담 연결됨 - Invoice No.와 운송방법이 자동 입력됩니다.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">
                        통관일 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.clearance_date}
                        onChange={(e) =>
                          setFormData({ ...formData, clearance_date: e.target.value })
                        }
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                          errors.clearance_date ? "border-red-500" : "border-slate-300"
                        }`}
                      />
                      {errors.clearance_date && (
                        <p className="text-red-500 text-xs mt-1">{errors.clearance_date}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">
                        운송방법
                      </label>
                      <select
                        value={formData.shipping_method}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            shipping_method: e.target.value as ShippingMethodType,
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        {Object.entries(SHIPPING_METHOD_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">
                        Invoice No.
                      </label>
                      <input
                        type="text"
                        value={formData.invoice_no}
                        onChange={(e) =>
                          setFormData({ ...formData, invoice_no: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="Invoice Number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">
                        운송업체
                      </label>
                      <select
                        value={formData.shipping_carrier_id}
                        onChange={(e) =>
                          setFormData({ ...formData, shipping_carrier_id: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="">선택</option>
                        {shippingCarriers.map((carrier) => (
                          <option key={carrier.id} value={carrier.id}>
                            {carrier.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 비용 항목 */}
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-medium text-slate-600 mb-3">비용 항목</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">항공료</label>
                        <input
                          type="text"
                          value={formatNumber(formData.air_freight)}
                          onChange={(e) => handleNumberChange("air_freight", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-right"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">해상료</label>
                        <input
                          type="text"
                          value={formatNumber(formData.sea_freight)}
                          onChange={(e) => handleNumberChange("sea_freight", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-right"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">관세</label>
                        <input
                          type="text"
                          value={formatNumber(formData.customs_duty)}
                          onChange={(e) => handleNumberChange("customs_duty", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-right"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">포트/통관/창고/핸들링</label>
                        <input
                          type="text"
                          value={formatNumber(formData.port_charges)}
                          onChange={(e) => handleNumberChange("port_charges", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-right"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">내국운송료</label>
                        <input
                          type="text"
                          value={formatNumber(formData.domestic_transport)}
                          onChange={(e) => handleNumberChange("domestic_transport", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-right"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">특송운임</label>
                        <input
                          type="text"
                          value={formatNumber(formData.express_freight)}
                          onChange={(e) => handleNumberChange("express_freight", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-right"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 부가세 및 합계 */}
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">부가세 (VAT)</label>
                        <input
                          type="text"
                          value={formatNumber(formData.vat)}
                          onChange={(e) => handleNumberChange("vat", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-right"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">소계 (VAT 제외)</label>
                        <div
                          id="subtotal"
                          className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-right font-medium"
                        >
                          {formatNumber(subtotal) || "0"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">합계 (VAT 포함)</label>
                        <div
                          id="total"
                          className="w-full px-3 py-2 bg-sky-50 border border-sky-300 rounded-md text-right font-semibold text-sky-600"
                        >
                          {formatNumber(total) || "0"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 비고 */}
                  <div className="border-t pt-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">
                        비고
                      </label>
                      <input
                        type="text"
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="비고"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 px-4 py-3 sm:px-6 flex flex-row gap-2 sm:flex-row-reverse shrink-0 border-t">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 sm:flex-none inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2.5 sm:py-2 bg-sky-600 text-base font-medium text-white hover:bg-sky-700 active:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    "저장"
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={saving}
                  className="flex-1 sm:flex-none inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2.5 sm:py-2 bg-white text-base font-medium text-slate-600 hover:bg-slate-50 active:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  취소
                </button>
              </div>
            </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
