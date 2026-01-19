"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CircularProgress } from "@mui/material";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import {
  CustomsCostFormData,
  ShippingMethodType,
  SHIPPING_METHOD_LABELS,
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

  useEscapeKey(isOpen, onClose);

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
          className="fixed inset-0 z-50 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-black/50"></div>
            </div>

            <motion.div
              className="fixed inset-0 bg-white flex flex-col sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:shadow-xl sm:max-w-3xl sm:w-[calc(100%-2rem)] sm:max-h-[90vh] z-50"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white px-4 pt-4 pb-4 sm:p-6 sm:pb-4 flex-1 overflow-y-auto">
                <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900 mb-4 sm:mb-6 sticky top-0 bg-white py-2 -mt-2 border-b sm:border-none">
                  {title}
                </h3>

                <div className="space-y-4">
                  {/* 기본 정보 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        거래처 <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.company_id}
                        onChange={(e) =>
                          setFormData({ ...formData, company_id: e.target.value })
                        }
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.company_id ? "border-red-500" : "border-gray-300"
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        통관일 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.clearance_date}
                        onChange={(e) =>
                          setFormData({ ...formData, clearance_date: e.target.value })
                        }
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.clearance_date ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.clearance_date && (
                        <p className="text-red-500 text-xs mt-1">{errors.clearance_date}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Invoice No.
                      </label>
                      <input
                        type="text"
                        value={formData.invoice_no}
                        onChange={(e) =>
                          setFormData({ ...formData, invoice_no: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Invoice Number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {Object.entries(SHIPPING_METHOD_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 비용 항목 */}
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">비용 항목</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">항공료</label>
                        <input
                          type="text"
                          value={formatNumber(formData.air_freight)}
                          onChange={(e) => handleNumberChange("air_freight", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">해상료</label>
                        <input
                          type="text"
                          value={formatNumber(formData.sea_freight)}
                          onChange={(e) => handleNumberChange("sea_freight", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">관세</label>
                        <input
                          type="text"
                          value={formatNumber(formData.customs_duty)}
                          onChange={(e) => handleNumberChange("customs_duty", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">포트/통관/창고/핸들링</label>
                        <input
                          type="text"
                          value={formatNumber(formData.port_charges)}
                          onChange={(e) => handleNumberChange("port_charges", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">내국운송료</label>
                        <input
                          type="text"
                          value={formatNumber(formData.domestic_transport)}
                          onChange={(e) => handleNumberChange("domestic_transport", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">특송운임</label>
                        <input
                          type="text"
                          value={formatNumber(formData.express_freight)}
                          onChange={(e) => handleNumberChange("express_freight", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 부가세 및 합계 */}
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">부가세 (VAT)</label>
                        <input
                          type="text"
                          value={formatNumber(formData.vat)}
                          onChange={(e) => handleNumberChange("vat", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">소계 (VAT 제외)</label>
                        <div
                          id="subtotal"
                          className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-right font-medium"
                        >
                          {formatNumber(subtotal) || "0"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">합계 (VAT 포함)</label>
                        <div
                          id="total"
                          className="w-full px-3 py-2 bg-blue-50 border border-blue-300 rounded-md text-right font-semibold text-blue-600"
                        >
                          {formatNumber(total) || "0"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 포워더/관세사 및 비고 */}
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          포워딩업체/관세사
                        </label>
                        <input
                          type="text"
                          value={formData.forwarder}
                          onChange={(e) =>
                            setFormData({ ...formData, forwarder: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="포워딩업체 또는 관세사명"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          비고
                        </label>
                        <input
                          type="text"
                          value={formData.notes}
                          onChange={(e) =>
                            setFormData({ ...formData, notes: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="비고"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-row gap-2 sm:flex-row-reverse shrink-0 border-t">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 sm:flex-none inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2.5 sm:py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {saving ? (
                    <>
                      <CircularProgress size={18} className="mr-2" />
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
                  className="flex-1 sm:flex-none inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2.5 sm:py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  취소
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
