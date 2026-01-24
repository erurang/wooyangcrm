"use client";

import { useState, useEffect } from "react";
import { MapPin, Phone, Printer, Truck, Mail } from "lucide-react";
import FormModal from "@/components/ui/FormModal";

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
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSubmit}
      isSaving={saving}
      title="거래처 정보 수정"
      size="sm"
      showCloseButton
    >
      <div className="space-y-4">
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
    </FormModal>
  );
}
