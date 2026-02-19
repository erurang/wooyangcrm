"use client";

import { AlertCircle, Building2, Phone, Mail, MapPin, Printer, Truck } from "lucide-react";

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

const getInputClass = (hasError: boolean) => {
  const base = "w-full pl-10 pr-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 placeholder:text-slate-300";
  if (hasError) return `${base} border-red-300 focus:ring-red-500/30 bg-red-50/50`;
  return `${base} border-slate-200 focus:ring-sky-500/30 focus:border-sky-400 bg-slate-50/50 hover:bg-white`;
};

const getPlainInputClass = (hasError: boolean) => {
  const base = "w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 placeholder:text-slate-300";
  if (hasError) return `${base} border-red-300 focus:ring-red-500/30 bg-red-50/50`;
  return `${base} border-slate-200 focus:ring-sky-500/30 focus:border-sky-400 bg-slate-50/50 hover:bg-white`;
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* 거래처명 */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          거래처명 <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={company.name || ""}
            onChange={(e) => handleChange("name", e.target.value)}
            className={getInputClass(!!errors.name)}
            placeholder="거래처명 입력"
          />
        </div>
        {errors.name && (
          <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium">
            <AlertCircle className="h-3 w-3" />
            {errors.name}
          </p>
        )}
      </div>

      {/* 사업자 번호 */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          사업자 번호
        </label>
        <input
          type="text"
          value={company.business_number || ""}
          onChange={(e) => handleChange("business_number", e.target.value)}
          className={getPlainInputClass(!!errors.business_number)}
          placeholder="000-00-00000"
        />
        {errors.business_number && (
          <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium">
            <AlertCircle className="h-3 w-3" />
            {errors.business_number}
          </p>
        )}
      </div>

      {/* 이메일 */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          이메일
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="email"
            value={company.email || ""}
            onChange={(e) => handleChange("email", e.target.value)}
            className={getInputClass(!!errors.email)}
            placeholder="company@example.com"
          />
        </div>
        {errors.email && (
          <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium">
            <AlertCircle className="h-3 w-3" />
            {errors.email}
          </p>
        )}
      </div>

      {/* 주소 */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          주소
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={company.address || ""}
            onChange={(e) => handleChange("address", e.target.value)}
            className={getInputClass(false)}
            placeholder="주소 입력"
          />
        </div>
      </div>

      {/* 전화번호 */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          전화번호
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={company.phone || ""}
            onChange={(e) => handleChange("phone", e.target.value)}
            className={getInputClass(!!errors.phone)}
            placeholder="02-1234-5678"
            maxLength={13}
          />
        </div>
        {errors.phone && (
          <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium">
            <AlertCircle className="h-3 w-3" />
            {errors.phone}
          </p>
        )}
      </div>

      {/* 팩스 */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          팩스
        </label>
        <div className="relative">
          <Printer className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={company.fax || ""}
            onChange={(e) => handleChange("fax", e.target.value)}
            className={getInputClass(false)}
            placeholder="02-1234-5678"
            maxLength={13}
          />
        </div>
      </div>

      {/* 택배/화물 */}
      <div className="md:col-span-2 lg:col-span-3">
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          택배/화물
        </label>
        <div className="relative">
          <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={company.parcel || ""}
            onChange={(e) => handleChange("parcel", e.target.value)}
            className={getInputClass(false)}
            placeholder="경동화물, 대신화물, 로젠택배, 직송 등"
          />
        </div>
      </div>
    </div>
  );
}
