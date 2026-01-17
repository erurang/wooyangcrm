"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Building2, MapPin, Phone, Printer, Truck, Mail } from "lucide-react";

interface CompanyData {
  id: string;
  name: string;
  address: string;
  phone: string;
  fax: string;
  parcel?: string;
  email?: string;
}

interface CompanyEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyData: CompanyData | null;
  onSave: (data: CompanyData) => Promise<void>;
  saving: boolean;
}

export default function CompanyEditModal({
  isOpen,
  onClose,
  companyData,
  onSave,
  saving,
}: CompanyEditModalProps) {
  const [formData, setFormData] = useState<CompanyData>({
    id: "",
    name: "",
    address: "",
    phone: "",
    fax: "",
    parcel: "",
    email: "",
  });

  // 모달이 열릴 때 기존 데이터로 초기화
  useEffect(() => {
    if (isOpen && companyData) {
      setFormData({
        id: companyData.id,
        name: companyData.name || "",
        address: companyData.address || "",
        phone: companyData.phone || "",
        fax: companyData.fax || "",
        parcel: companyData.parcel || "",
        email: companyData.email || "",
      });
    }
  }, [isOpen, companyData]);

  const handleSubmit = async () => {
    await onSave(formData);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Building2 size={20} className="text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  거래처 정보 수정
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* 회사명 (읽기 전용) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  회사명
                </label>
                <input
                  type="text"
                  value={formData.name}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  회사명은 거래처 관리에서 변경 가능합니다.
                </p>
              </div>

              {/* 주소 */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                  <MapPin size={14} className="text-gray-400" />
                  주소
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, address: e.target.value }))
                  }
                  placeholder="주소를 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 배송 */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                  <Truck size={14} className="text-gray-400" />
                  배송
                </label>
                <input
                  type="text"
                  value={formData.parcel || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, parcel: e.target.value }))
                  }
                  placeholder="배송 정보를 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 전화 / 팩스 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                    <Phone size={14} className="text-gray-400" />
                    전화
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="전화번호"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                    <Printer size={14} className="text-gray-400" />
                    팩스
                  </label>
                  <input
                    type="text"
                    value={formData.fax}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, fax: e.target.value }))
                    }
                    placeholder="팩스번호"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* 대표메일 */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                  <Mail size={14} className="text-gray-400" />
                  대표메일
                </label>
                <input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="email@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end items-center gap-3 px-4 py-3 bg-gray-50 border-t">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={saving}
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    저장 중...
                  </>
                ) : (
                  "저장"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
