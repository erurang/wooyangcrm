"use client";

import { AlertCircle } from "lucide-react";
import { formatPhoneNumber } from "@/lib/formatPhoneNumber";

interface Company {
  name: string;
  business_number: string;
  address: string;
  phone: string;
  fax: string;
  email: string;
  parcel: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  business_number?: string;
}

interface CompanyBasicInfoFormProps {
  company: Company;
  onChange: (field: keyof Company, value: string) => void;
  errors?: FormErrors;
  onClearError?: (field: keyof FormErrors) => void;
}

// 입력 필드 스타일
const getInputClass = (hasError: boolean) => {
  const base = "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition-colors";
  if (hasError) return `${base} border-red-500 focus:ring-red-500 bg-red-50`;
  return `${base} border-gray-300 focus:ring-blue-500`;
};

export default function CompanyBasicInfoForm({
  company,
  onChange,
  errors = {},
  onClearError,
}: CompanyBasicInfoFormProps) {
  const handleChange = (field: keyof Company, value: string) => {
    onChange(field, value);
    if (onClearError && errors[field as keyof FormErrors]) {
      onClearError(field as keyof FormErrors);
    }
  };

  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          거래처명 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={company.name || ""}
          onChange={(e) => handleChange("name", e.target.value)}
          className={getInputClass(!!errors.name)}
          placeholder="거래처명 입력"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          사업자 번호
        </label>
        <input
          type="text"
          value={company.business_number || ""}
          onChange={(e) => handleChange("business_number", e.target.value)}
          className={getInputClass(!!errors.business_number)}
          placeholder="000-00-00000"
        />
        {errors.business_number && (
          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.business_number}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          이메일
        </label>
        <input
          type="email"
          value={company.email || ""}
          onChange={(e) => handleChange("email", e.target.value)}
          className={getInputClass(!!errors.email)}
          placeholder="company@example.com"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          주소
        </label>
        <input
          type="text"
          value={company.address || ""}
          onChange={(e) => handleChange("address", e.target.value)}
          className={getInputClass(false)}
          placeholder="주소 입력"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          전화번호
        </label>
        <input
          type="text"
          value={company.phone || ""}
          onChange={(e) => handleChange("phone", formatPhoneNumber(e.target.value))}
          className={getInputClass(!!errors.phone)}
          placeholder="02-1234-5678"
          maxLength={13}
        />
        {errors.phone && (
          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.phone}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          팩스
        </label>
        <input
          type="text"
          value={company.fax || ""}
          onChange={(e) => handleChange("fax", formatPhoneNumber(e.target.value))}
          className={getInputClass(false)}
          placeholder="02-1234-5678"
          maxLength={13}
        />
      </div>

      <div className="md:col-span-2 lg:col-span-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          택배/화물
        </label>
        <input
          type="text"
          value={company.parcel || ""}
          onChange={(e) => handleChange("parcel", e.target.value)}
          className={getInputClass(false)}
          placeholder="경동화물, 대신화물, 로젠택배, 직송 등"
        />
      </div>
    </div>
  );
}
